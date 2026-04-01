import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { Dispatch, SetStateAction } from 'react';
import { Node, type Edge } from '../../types';
import type { AgentFlowGlobalDb, ExecuteNodeInput, ExecuteNodeResult } from '../../types/simulation';
import { evaluateSafeArithmeticExpression } from '../../lib/simulation/safeArithmetic';
import { tryGetChildProcess, tryGetFs } from '../../lib/simulation/nodeRuntimeShim';
import { MODEL_REGISTRY, TOOL_REGISTRY, DATABASE_REGISTRY, VECTOR_REGISTRY, STORAGE_REGISTRY } from '../../constants';
import { Agent } from '../agent/agentService';
import {
  TAVILY_MAX_QUERY_CHARS,
  TAVILY_SUMMARIZE_INPUT_CHARS,
  REPORT_CONTEXT_CHARS,
} from '../../config/simulationLimits';
import { simulateRagWithGemini, type RagMode, type RagSimOptions } from '../../lib/simulation/ragSimulation';
import {
  splitTextWithLangChain,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_OVERLAP,
  type ChunkStrategyId,
} from '../../lib/simulation/chunkStrategies';
import { withLangfuseSpan } from '../../lib/simulation/langfuseTrace';
import { runDatabaseNode } from '../../lib/db/runDatabaseNode';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/** 로컬 rag_op.py 우선, 실패 시(브라우저 등) Gemini 시뮬레이션 */
const runRagStep = async (
  mode: RagMode,
  prompt: string,
  ragExtras?: RagSimOptions
): Promise<Record<string, unknown>> => {
  try {
    const cp = tryGetChildProcess();
    if (!cp) throw new Error('child_process unavailable');
    const raw = cp.execSync(`python3 /tools/rag_op.py ${mode} "${prompt}"`).toString();
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return (await simulateRagWithGemini(ai, mode, prompt, ragExtras)) as Record<string, unknown>;
  }
};

/** 다음 노드(agent 등)로 넘길 텍스트 — App.tsx가 result.response로 lastSubstantiveOutput 갱신 */
const ragDownstreamText = (mode: RagMode, r: Record<string, unknown>): string => {
  if (mode === 'retrieve') return String(r.context ?? r.explanation ?? '');
  if (mode === 'chunk' && Array.isArray(r.chunks)) {
    return (r.chunks as string[]).filter(Boolean).join('\n\n---\n\n');
  }
  if (mode === 'ingest') {
    const docs = r.documents as { snippet?: string; title?: string }[] | undefined;
    if (Array.isArray(docs) && docs.length > 0) {
      return docs.map((d) => `[${d.title ?? 'doc'}]\n${d.snippet ?? ''}`).join('\n\n');
    }
    return String(r.explanation ?? '');
  }
  if (mode === 'embed') {
    const dim = Array.isArray(r.embedding) ? (r.embedding as number[]).length : 0;
    return `${String(r.explanation ?? '임베딩 완료')} (벡터 차원 ${dim})`;
  }
  return String(r.explanation ?? '');
};

/** 셸 인자용: 줄바꿈·따옴표로 인한 exec 깨짐 완화 */
const toShellSingleLine = (s: string): string =>
  String(s).replace(/\r\n|\r|\n/g, ' ').replace(/"/g, "'").trim();

/** Tavily Search API 쿼리 상한(`.env` `AF_TAVILY_MAX_QUERY_CHARS`, 최대 400). 요약 실패 시 단어 경계 절단 */
const toTavilyQueryHardLimit = (raw: string): string => {
  const one = toShellSingleLine(raw);
  if (one.length <= TAVILY_MAX_QUERY_CHARS) return one;
  const cut = one.slice(0, TAVILY_MAX_QUERY_CHARS);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trim();
};

/** 긴 맥락 → Tavily용 짧은 검색 쿼리(Gemini). API 키 없거나 실패 시 하드 리밋 절단 */
const summarizeQueryForTavily = async (raw: string): Promise<string> => {
  const one = toShellSingleLine(raw);
  if (one.length <= TAVILY_MAX_QUERY_CHARS) return one;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return toTavilyQueryHardLimit(one);
  }

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              text: `다음은 워크플로우에서 넘어온 긴 텍스트입니다. Tavily 웹 검색 API에 넣을 **검색 쿼리 한 줄**만 작성하세요.

규칙:
- 공백 포함 반드시 ${TAVILY_MAX_QUERY_CHARS}자 이하.
- 검색에 필요한 핵심 키워드·주제·고유명사를 살리고, 장황한 설명·목록·따옴표는 제거.
- 출력은 검색어 텍스트만(접두어·따옴표·"검색어:" 같은 금지).

--- 텍스트 ---
${one.slice(0, TAVILY_SUMMARIZE_INPUT_CHARS)}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: `You reply with only the search query string, under ${TAVILY_MAX_QUERY_CHARS} characters, no quotes or labels.`,
      },
    });
    const line = String(result.text ?? '')
      .trim()
      .replace(/\r\n|\r|\n/g, ' ');
    return toTavilyQueryHardLimit(line || one);
  } catch {
    return toTavilyQueryHardLimit(one);
  }
};

/** 이전 노드/시작 입력에 노드 패널「설명」을 붙임 */
const mergeWithNodeDescription = (text: string, roleDesc: string): string => {
  const base = String(text ?? '').trim();
  if (!roleDesc) return base || '입력 데이터 없음';
  if (!base || base === '입력 데이터 없음') return `[노드 역할 설명]\n${roleDesc}`;
  return `${base}\n\n[노드 역할 설명]\n${roleDesc}`;
};

export type SimulationTraceContext = {
  /** Langfuse 세션 — 시뮬레이션 실행 단위로 묶음 */
  sessionId: string;
  /** 노드 id → 코드 탭에서 해당 노드와 매칭된 경로에 저장된 전체 텍스트 */
  editorCodeByNodeId?: Map<string, string>;
};

const EDITOR_CODE_IN_PROMPT_MAX = 12000;

/** 코드 탭에서 노드와 매칭된 경로에 저장된 스크립트 (시뮬 맥락 주입) */
const getEditorCodeForNode = (
  node: Node,
  traceContext?: SimulationTraceContext
): string => {
  const raw = traceContext?.editorCodeByNodeId?.get(node.id);
  if (!raw || !String(raw).trim()) return '';
  return String(raw).slice(0, EDITOR_CODE_IN_PROMPT_MAX);
};

const mergeEditorIntoSystem = (
  base: string,
  node: Node,
  traceContext?: SimulationTraceContext
): string => {
  const code = getEditorCodeForNode(node, traceContext);
  if (!code) return base;
  return `${base}\n\n[코드 에디터에 저장된 이 노드의 스크립트 — 워크플로에서 의도·제약으로 반영하세요]\n\`\`\`python\n${code}\n\`\`\``;
};

const mergePromptWithEditor = (
  text: string,
  node: Node,
  traceContext?: SimulationTraceContext
): string => {
  const code = getEditorCodeForNode(node, traceContext);
  if (!code) return text;
  return `${text}\n\n[코드 에디터 스크립트]\n${code.slice(0, 8000)}`;
};

/** 브라우저에서 Tavily 검색 — Python/execSync 대신 REST. 개발 시 Vite proxy로 CORS 우회 */
const tavilySearchViaHttp = async (query: string, apiKey: string): Promise<string> => {
  const q = await summarizeQueryForTavily(query);
  const url = import.meta.env.DEV
    ? '/tavily-api/search'
    : 'https://api.tavily.com/search';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: q,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 8,
    }),
  });
  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`Tavily ${res.status}: ${rawText.slice(0, 300)}`);
  }
  const data = JSON.parse(rawText) as {
    answer?: string;
    results?: { title?: string; url?: string; content?: string }[];
  };
  const parts: string[] = [];
  if (data.answer) parts.push(`요약:\n${data.answer}`);
  if (data.results?.length) {
    parts.push(
      '검색 결과:\n' +
        data.results
          .map(
            (r, i) =>
              `${i + 1}. ${r.title ?? '(제목 없음)'}\n   ${(r.content ?? '').slice(0, 400)}…\n   ${r.url ?? ''}`
          )
          .join('\n')
    );
  }
  return parts.length > 0 ? parts.join('\n\n') : rawText.slice(0, 4000);
};

export const executeNode = async (
  node: Node,
  input: ExecuteNodeInput,
  logs: string[],
  globalDB: AgentFlowGlobalDb,
  setGlobalDB: Dispatch<SetStateAction<AgentFlowGlobalDb>>,
  graph: { edges: Edge[] },
  traceContext?: SimulationTraceContext,
): Promise<ExecuteNodeResult> => {
  const { type, config, label } = node;
  const roleDesc = (node.description ?? '').trim();
  const inputText = input?.text || (logs.length > 0 ? logs[logs.length - 1] : '입력 데이터 없음');
  /** agent는 systemInstruction에 설명을 넣고, 사용자 메시지는 원본 입력만 사용 */
  const contextualInputText = mergeWithNodeDescription(inputText, roleDesc);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  try {
    switch (type) {
      case 'database': {
        const op = config?.operation || 'read';
        const dbType = config?.storageType || 'postgresql';
        const tableName = config?.collection || 'csv_table';

        if (dbType !== 'postgresql') {
          return {
            message: `[Database] 아직 PostgreSQL만 지원합니다.`,
            status: 'error',
          };
        }

        const db = {
          host: 'localhost',
          port: 5433,
          database: 'testdb',
          user: 'postgres',
          password: '1234',
        };

        if (op === 'write') {
          const inputObj = (input || {}) as Record<string, unknown>;
          const headers = Array.isArray(inputObj.headers) ? inputObj.headers : [];
          const rows = Array.isArray(inputObj.rows) ? inputObj.rows : [];

          if (!headers.length || !rows.length) {
            return {
              message: '[Database] write에 필요한 headers/rows가 없습니다.',
              status: 'error',
            };
          }

          const res = await fetch('/api/postgres/insert-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table_name: tableName,
              if_exists: 'replace',
              db,
              headers,
              rows,
            }),
          });

          const data = await res.json();

          return {
            message: res.ok
              ? `[Postgres] ${tableName} 적재 완료`
              : `[ERROR] ${data?.error || '적재 실패'}`,
            data,
            status: res.ok ? 'success' : 'error',
          };
        }

        if (op === 'read') {
          const query = String(config?.query || '').trim();

          if (!query) {
            return {
              message: '[Database] read를 위해 SQL query가 필요합니다.',
              status: 'error',
            };
          }

          const res = await fetch('/api/postgres/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sql: query,
              db,
            }),
          });

          const data = await res.json();

          return {
            message: res.ok
              ? `[Postgres] 조회 완료`
              : `[ERROR] ${data?.error || '조회 실패'}`,
            data,
            status: res.ok ? 'success' : 'error',
          };
        }

        return {
          message: `[Database] 지원하지 않는 operation: ${op}`,
          status: 'error',
        };
      }
      case 'vector': {
        const vBase = config?.query || inputText || 'search query';
        const vQuery = toShellSingleLine(
          mergePromptWithEditor(mergeWithNodeDescription(vBase, roleDesc), node, traceContext)
        );
        const editorVec = getEditorCodeForNode(node, traceContext);
        
        try {
          const cp = tryGetChildProcess();
          if (!cp) throw new Error('child_process unavailable');
          const result = cp.execSync(`python3 /tools/vector_op.py "${vQuery}"`).toString();
          const matches = JSON.parse(result);
          return {
            message: `[Python Vector] "${vQuery.slice(0, 120)}..."와 유사한 문서 ${matches.length}개를 검색했습니다.${editorVec ? ' (코드 에디터 맥락)' : ''}`,
            results: matches.length > 0 ? matches : ['검색 결과가 없습니다.'],
            status: 'success'
          };
        } catch (error) {
          if (process.env.GEMINI_API_KEY && editorVec) {
            try {
              const gen = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                  {
                    parts: [
                      {
                        text: `벡터 검색 시뮬: 쿼리 맥락:\n${vQuery.slice(0, 4000)}\n\n에디터 스크립트:\n${editorVec.slice(0, 4000)}\n\n유사 문서 제목 3개만 한 줄에 쉼표로.`,
                      },
                    ],
                  },
                ],
              });
              const line = gen.text?.trim() || 'doc1, doc2, doc3';
              return {
                message: `[Vector] 로컬 미실행 — 에디터 스크립트 기반 시뮬`,
                results: line.split(',').map((s) => s.trim()),
                status: 'success',
              };
            } catch {
              /* fall through */
            }
          }
          return { message: `[ERROR] Python Vector 실행 중 오류: ${error}`, status: 'error' };
        }
      }
      
      case 'mcp': {
        const mMethod = config?.mcpMethod || 'get_context';
        const serverUrl = config?.mcpServerUrl || 'http://localhost:8080';
        const editorMcp = getEditorCodeForNode(node, traceContext);
        const urlRaw = String(serverUrl).trim();
        const url = /^https?:\/\//i.test(urlRaw) ? urlRaw : `http://${urlRaw.replace(/^\/+/, '')}`;

        const simulatedPayload = () => ({
          context_id: `ctx_${Math.floor(Math.random() * 1000)}`,
          values: [Math.random() * 10, Math.random() * 10],
          timestamp: new Date().toISOString(),
          ...(roleDesc ? { node_context: roleDesc } : {}),
          upstream_hint: toShellSingleLine(contextualInputText).slice(0, 500),
          ...(editorMcp ? { editor_script: editorMcp.slice(0, 6000) } : {}),
          simulated: true as const,
        });

        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 12000);
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json, text/plain,*/*',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: mMethod,
              params: {
                input: toShellSingleLine(contextualInputText).slice(0, 8000),
                node_description: roleDesc || undefined,
              },
            }),
            signal: controller.signal,
          });
          clearTimeout(tid);
          const text = await res.text();
          let payload: unknown;
          try {
            payload = JSON.parse(text) as unknown;
          } catch {
            payload = { raw: text.slice(0, 8000) };
          }
          return {
            message: `[MCP] ${url} HTTP ${res.status} · ${mMethod}${editorMcp ? ' (에디터 맥락)' : ''}`,
            status: res.ok ? 'success' : 'error',
            payload,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            message: `[MCP] HTTP 호출 실패 (${msg}) — 시뮬 payload로 대체. URL·CORS·서버 가동을 확인하세요.`,
            status: 'success',
            payload: { ...simulatedPayload(), http_error: msg },
          };
        }
      }
      
      case 'report': {
        const rFormat = config?.reportFormat || 'markdown';
        const upstream = toShellSingleLine(contextualInputText).slice(0, REPORT_CONTEXT_CHARS);
        const geminiContextCap = Math.min(8000, REPORT_CONTEXT_CHARS);
        const fallbackBodyCap = Math.min(6000, REPORT_CONTEXT_CHARS);
        const editorReport = getEditorCodeForNode(node, traceContext);
        const summary = [
          upstream,
          ...logs.slice(-5),
          ...(roleDesc ? [`[노드 역할 설명] ${roleDesc}`] : []),
          ...(editorReport ? [`[코드 에디터 스크립트]\n${editorReport.slice(0, 4000)}`] : []),
        ];

        try {
          const cp = tryGetChildProcess();
          if (!cp) throw new Error('child_process unavailable');
          const result = cp.execSync(`python3 /tools/report_op.py "${rFormat}" '${JSON.stringify(summary)}'`).toString();
          return {
            message: `[Python Report] ${rFormat} 형식 리포트 생성 완료.`,
            content: result,
            response: result,
            status: 'success',
          };
        } catch {
          try {
            const gen = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [
                {
                  parts: [
                    {
                      text: `다음 워크플로우 맥락을 바탕으로 ${rFormat === 'markdown' ? 'Markdown' : rFormat} 형식의 최종 보고서 본문만 작성하세요. 제목·섹션·요약·결론을 포함하세요.\n\n--- 맥락 ---\n${upstream.slice(0, geminiContextCap)}${editorReport ? `\n\n--- 코드 에디터 스크립트(반영) ---\n${editorReport.slice(0, 3000)}` : ''}`,
                    },
                  ],
                },
              ],
            });
            const body = gen.text?.trim() || `# 보고서\n\n${upstream.slice(0, Math.min(4000, REPORT_CONTEXT_CHARS))}`;
            return {
              message: `[Report] ${rFormat} 보고서 생성(시뮬레이션).`,
              content: body,
              response: body,
              status: 'success',
            };
          } catch {
            const body = `# 워크플로우 보고서\n\n## 요약\n\n${upstream.slice(0, fallbackBodyCap)}\n\n---\n*(시뮬레이션 폴백)*`;
            return {
              message: `[Report] ${rFormat} 보고서(폴백).`,
              content: body,
              response: body,
              status: 'success',
            };
          }
        }
      }
      
      case 'storage': {
        const sPath = config?.storagePath || '/data/results';
        const editorSt = getEditorCodeForNode(node, traceContext);
        
        try {
          const cp = tryGetChildProcess();
          if (!cp) throw new Error('child_process unavailable');
          const payload = toShellSingleLine(contextualInputText);
          const fileName = cp.execSync(`python3 /tools/storage_op.py "${sPath}" '${payload}'`).toString().trim();
          return {
            message: `[Python Storage] 데이터를 ${sPath}/${fileName}에 저장했습니다.${editorSt ? ' (코드 에디터 맥락)' : ''}`,
            file_name: fileName,
            status: 'success'
          };
        } catch (error) {
          if (process.env.GEMINI_API_KEY && editorSt) {
            try {
              const gen = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                  {
                    parts: [
                      {
                        text: `스토리지 시뮬: path=${sPath}. 에디터 스크립트에 맞춰 저장된 파일명 한 단어만 출력.\n${editorSt.slice(0, 4000)}`,
                      },
                    ],
                  },
                ],
              });
              const fn = (gen.text ?? 'simulated.bin').trim().split(/\s+/)[0] || 'simulated.bin';
              return {
                message: `[Storage] 로컬 미실행 — 에디터 스크립트 기반 시뮬 저장`,
                file_name: fn,
                status: 'success',
              };
            } catch {
              /* fall through */
            }
          }
          return { message: `[ERROR] Python Storage 실행 중 오류: ${error}`, status: 'error' };
        }
      }
      
      case 'agent': {
        const modelId = config?.model || 'gemini-3-flash-preview';
        const modelInfo = MODEL_REGISTRY.find(m => m.id === modelId) || MODEL_REGISTRY[0];
        const baseSystem = config?.systemInstruction || "You are a helpful AI agent in a workflow.";
        const roleDescription = (node.description ?? "").trim();
        const systemInstruction = mergeEditorIntoSystem(
          roleDescription
            ? `${baseSystem}\n\n[노드 역할 설명]\n${roleDescription}`
            : baseSystem,
          node,
          traceContext
        );

        const skillIds = [...new Set([...(config?.skills ?? []), ...(node.skills ?? [])])];
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
          return {
            message: '[ERROR] GEMINI_API_KEY가 설정되지 않아 에이전트를 실행할 수 없습니다.',
            status: 'error',
          };
        }

        const agent = new Agent(geminiKey, {
          model: modelId,
          systemInstruction: systemInstruction,
          skills: skillIds,
        });

        const responseText = await withLangfuseSpan(
          'sim-agent',
          {
            sessionId: traceContext?.sessionId,
            metadata: {
              nodeId: node.id,
              label,
              model: modelId,
              skills: skillIds,
            },
            input: { textPreview: String(inputText).slice(0, 800) },
          },
          () => agent.execute(inputText)
        );
        
        return {
          message: `[Agent] ${modelInfo.name}가 응답했습니다.`,
          model: modelInfo.name,
          response: responseText,
          confidence: 0.95,
          action: 'next_step',
          status: 'success'
        };
      }
      
      case 'router': {
        const rStrategy = config?.routingStrategy || 'llm_decider';
        const outgoing = graph.edges.filter(e => e.source === node.id);

        if (rStrategy === 'llm_decider' && outgoing.length > 0) {
          const labelList = outgoing
            .map((e, i) => `${i + 1}. "${e.label || e.target}" (→ ${e.target})`)
            .join('\n');
          const routerSystem = roleDesc
            ? `You are a workflow router. You MUST respond with EXACTLY one label from the allowed list below — copy the label text exactly (same spelling, same language). No explanations.\n\n[노드 역할 설명]\n${roleDesc}`
            : `You are a workflow router. You MUST respond with EXACTLY one label from the allowed list — copy it exactly. No explanations.`;
          const editorRouter = getEditorCodeForNode(node, traceContext);
          const upstreamCtx = toShellSingleLine(inputText).slice(0, Math.min(6000, REPORT_CONTEXT_CHARS));
          const editorCtx = editorRouter
            ? `\n\n--- 코드 에디터 스크립트 ---\n${toShellSingleLine(editorRouter).slice(0, 4000)}`
            : '';
          const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
              {
                parts: [
                  {
                    text: `Allowed path labels (choose exactly one by copying its label text):\n${labelList}\n\n--- Upstream context ---\n${upstreamCtx}${editorCtx}\n\nReply with ONLY the chosen label text, nothing else.`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction: routerSystem,
            },
          });

          return {
            message: `[ROUTER] LLM이 경로를 결정했습니다.`,
            decision: result.text.trim(),
            confidence: 0.92,
            reasoning: '입력 텍스트의 의도를 분석하여 최적의 경로 선택',
            status: 'success'
          };
        }
        
        // Default or fallback routing
        const fallbackDecision = outgoing.length > 0 ? (outgoing[0].label || outgoing[0].target) : 'default';
        return {
          message: `[ROUTER] ${rStrategy} 전략을 사용하여 다음 노드를 결정합니다.${roleDesc ? ' (노드 설명 반영)' : ''}`,
          decision: fallbackDecision,
          confidence: 0.89,
          reasoning: roleDesc
            ? `기본 라우팅. 입력·노드 설명: ${toShellSingleLine(contextualInputText).slice(0, 120)}`
            : '기본 라우팅 규칙 적용',
          status: 'success'
        };
      }
      
      case 'team': {
        const teamStrategy = config?.teamStrategy || 'collaborative';
        const agents = ['researcher', 'critic', 'writer', 'coder'];
        const active = agents.sort(() => 0.5 - Math.random()).slice(0, 3);
        const editorTeam = getEditorCodeForNode(node, traceContext);
        const upstream = toShellSingleLine(contextualInputText).slice(0, 6000);
        const geminiKey = process.env.GEMINI_API_KEY;

        if (geminiKey && upstream.length > 0) {
          try {
            const teamSystem = `팀 협업 시뮬레이터. 전략: ${teamStrategy}. 연구·비판·작성·코드 관점을 순서대로 짧게 거친 뒤, 최종 통합 답변만 한국어로 작성하세요. 메타 설명("팀입니다" 등)은 생략하세요.${roleDesc ? `\n\n팀 노드 설명: ${roleDesc}` : ''}`;
            const userPart = `[상류 맥락]\n${upstream}${editorTeam ? `\n\n[코드 에디터 참고]\n${editorTeam.slice(0, 3000)}` : ''}`;
            const gen = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [{ parts: [{ text: userPart }] }],
              config: { systemInstruction: teamSystem },
            });
            const teamOut = (gen.text ?? '').trim() || upstream;
            return {
              message: `[TEAM] ${teamStrategy} — 다관점 요약(Gemini)`,
              active_agents: active,
              status: 'success',
              coordination_log: teamOut,
              response: teamOut,
            };
          } catch (e) {
            console.warn('[team] Gemini 실패, 폴백', e);
          }
        }

        const logBase = `${active.join(', ')} 에이전트 협업(폴백).`;
        const logExtra = editorTeam ? ` [에디터]\n${editorTeam.slice(0, 1500)}` : '';
        return {
          message: `[TEAM] ${teamStrategy} 전략(경량 폴백).${roleDesc ? ' 노드 설명 반영.' : ''}`,
          active_agents: active,
          status: 'success',
          coordination_log: roleDesc ? `${logBase} [맥락] ${roleDesc}${logExtra}` : `${logBase}${logExtra}`,
          response: contextualInputText,
        };
      }
      
      case 'start': {
        const fromInput = (inputText && String(inputText).trim()) ? String(inputText).trim() : "";
        let startPrompt = fromInput || (config?.initialPrompt || "");
        if (roleDesc) {
          startPrompt = startPrompt
            ? `${startPrompt}\n\n[노드 역할 설명]\n${roleDesc}`
            : `[노드 역할 설명]\n${roleDesc}`;
        }
        const preview = startPrompt.length > 40 ? `${startPrompt.substring(0, 40)}...` : startPrompt;
        return {
          message: `[START] 워크플로우를 시작합니다. 입력: "${preview}"`,
          initial_input: startPrompt,
          session_id: `sess_${uuidv4().split('-')[0]}`,
          timestamp: new Date().toISOString(),
          status: 'success'
        };
      }
      
      case 'end': {
        const outFormat = config?.outputFormat || 'markdown';
        const summaryBase = '모든 태스크가 성공적으로 완료되었습니다.';
        return {
          message: `[END] 워크플로우가 종료되었습니다. 최종 결과가 ${outFormat}으로 준비되었습니다.${roleDesc ? ' 노드 설명 맥락 반영.' : ''}`,
          final_output_format: outFormat,
          summary: roleDesc ? `${summaryBase} [종료 노드 설명] ${roleDesc}` : summaryBase,
          duration: '2.4s',
          status: 'success',
          response: contextualInputText,
        };
      }
      
      case 'datasource': {
        const fmt = (config?.dataFormat as string) || 'text';
        const filePath = (config?.filePath as string) || '(경로 미지정)';
        const delimiter = (config?.delimiter as string) || ',';
        const inlineSample = String(config?.inlineSample ?? '').trim();
        const importedRaw = Array.isArray(config?.importedFiles) ? config.importedFiles : [];
        const imported = importedRaw
          .filter(
            (f: { content?: string; loadError?: string }) =>
              String(f?.content ?? '').trim().length > 0 || Boolean(f?.loadError)
          )
          .map((f: { name?: string; content?: string; loadError?: string }) => ({
            ...f,
            content:
              String(f.content ?? '').trim() ||
              (f.loadError ? `[로드 오류] ${f.loadError}` : ''),
          })) as { name?: string; content: string }[];
        const editorDs = getEditorCodeForNode(node, traceContext);
        const roleNote = [
          roleDesc ? ` [노드 설명: ${toShellSingleLine(roleDesc).slice(0, 120)}]` : '',
          editorDs ? ` [에디터:${toShellSingleLine(editorDs).slice(0, 80)}…]` : '',
        ].join('');

        const sourceLabel =
          imported.length > 0
            ? imported.map((f) => f.name || 'unnamed').join(', ')
            : filePath;

        //수정된부분
        if (fmt === 'csv') {
          const parseOneCsv = (raw: string) => {
            const lines = raw.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
            const headerLine = lines[0] ?? '';
            const headers = headerLine.split(delimiter).map((s: string) => s.trim());

            const allRows = lines.slice(1).map((line: string) => {
              const cells = line.split(delimiter).map((s: string) => s.trim());
              return Object.fromEntries(headers.map((h: string, i: number) => [h, cells[i] ?? '']));
            });

            const previewRows = allRows.slice(0, 5);
            const rowCount = allRows.length;

            return {
              headers,
              rows: allRows,
              preview_rows: previewRows,
              row_count: rowCount,
            };
          };

          if (imported.length > 1) {
            const files = imported.map((f) => ({
              file_name: f.name || 'file.csv',
              content: f.content,
              ...parseOneCsv(String(f.content).trim()),
            }));

            const totalRows = files.reduce((s, x) => s + x.row_count, 0);

            const responsePayload = JSON.stringify(
              {
                files: files.map((f) => ({
                  file_name: f.file_name,
                  headers: f.headers,
                  preview_rows: f.preview_rows,
                  row_count: f.row_count,
                })),
                total_rows: totalRows,
              },
              null,
              0
            );

            return {
              message: `[DataSource] CSV ${imported.length}개 파일 로드 (${totalRows}행 합계).${roleNote}`,
              status: 'success',
              format: 'csv',
              filePath: sourceLabel,
              multi_file: true,
              files,
              total_rows: totalRows,
              importedFiles: importedRaw,
              response: responsePayload,
            };
          }

          const raw =
            imported.length === 1
              ? String(imported[0].content).trim()
              : inlineSample || 'name,score\nAlice,10\nBob,20';

          const { headers, rows, preview_rows, row_count: rowCount } = parseOneCsv(raw);

          const responsePayload = JSON.stringify(
            {
              headers,
              preview_rows,
              row_count: rowCount,
            },
            null,
            0
          );

          return {
            message: `[DataSource] CSV를 로드했습니다. (${rowCount}행, 출처: ${sourceLabel})${roleNote}`,
            status: 'success',
            format: 'csv',
            filePath: sourceLabel,
            headers,
            rows,
            preview_rows,
            row_count: rowCount,
            importedFiles: importedRaw,
            response: responsePayload,
          };
        }
        //수정된부분

        if (fmt === 'json') {
          if (imported.length > 1) {
            const parsedList: { file_name: string; data: unknown }[] = [];
            for (const f of imported) {
              const raw = String(f.content).trim();
              try {
                parsedList.push({ file_name: f.name || 'file.json', data: JSON.parse(raw) });
              } catch {
                return {
                  message: `[DataSource] JSON 파싱 실패: ${f.name || '파일'}${roleNote}`,
                  status: 'error',
                  format: 'json',
                  filePath: sourceLabel,
                  raw_preview: raw.slice(0, 400),
                };
              }
            }
            const responsePayload = JSON.stringify(parsedList, null, 0);
            return {
              message: `[DataSource] JSON ${imported.length}개 파일 로드.${roleNote}`,
              status: 'success',
              format: 'json',
              filePath: sourceLabel,
              parsed_files: parsedList,
              response: responsePayload,
            };
          }

          const raw =
            imported.length === 1
              ? String(imported[0].content).trim()
              : inlineSample || '{"items":[{"id":1,"value":"sample"}]}';
          try {
            const parsed = JSON.parse(raw);
            const responsePayload = JSON.stringify(parsed, null, 0);
            return {
              message: `[DataSource] JSON을 로드했습니다. (출처: ${sourceLabel})${roleNote}`,
              status: 'success',
              format: 'json',
              filePath: sourceLabel,
              parsed,
              response: responsePayload,
            };
          } catch {
            return {
              message: `[DataSource] JSON 파싱 실패. 파일 내용 또는 샘플을 확인하세요.${roleNote}`,
              status: 'error',
              format: 'json',
              filePath: sourceLabel,
              raw_preview: raw.slice(0, 400),
            };
          }
        }

        if (fmt === 'pdf') {
          if (imported.length === 0) {
            const fallback =
              inlineSample.trim() ||
              'PDF 파일을 드롭존에 추가하거나, 이 샘플 영역에 텍스트를 붙여 넣으세요.';
            return {
              message: `[DataSource] PDF(규정집) 모드 — 업로드된 파일이 없어 샘플/안내만 사용합니다.${roleNote}`,
              status: 'success',
              format: 'pdf',
              filePath: sourceLabel,
              char_count: fallback.length,
              text_preview: fallback.slice(0, 800),
              response: fallback.slice(0, 2000),
            };
          }
          let totalPages = 0;
          const blocks = imported.map((f) => {
            const pages = (f as { pdfPages?: number }).pdfPages ?? 0;
            totalPages += pages;
            return `=== ${f.name || 'document.pdf'}${pages ? ` (${pages}페이지)` : ''} ===\n${String(f.content).trim()}`;
          });
          const text = blocks.join('\n\n');
          return {
            message: `[DataSource] PDF에서 텍스트 추출 (${imported.length}개 파일${totalPages ? `, 합계 약 ${totalPages}페이지` : ''}).${roleNote}`,
            status: 'success',
            format: 'pdf',
            filePath: sourceLabel,
            file_count: imported.length,
            pdf_total_pages: totalPages || undefined,
            char_count: text.length,
            text_preview: text.slice(0, 800),
            response: text.slice(0, 2000),
          };
        }

        const text =
          imported.length > 0
            ? imported
                .map((f) => `=== ${f.name || 'file'} ===\n${String(f.content).trim()}`)
                .join('\n\n')
            : inlineSample || 'sample plain text line 1\nline 2';
        return {
          message: `[DataSource] 텍스트를 로드했습니다. (${text.length}자, ${imported.length > 0 ? `파일 ${imported.length}개` : '기본 샘플'}, 출처: ${sourceLabel})${roleNote}`,
          status: 'success',
          format: 'text',
          filePath: sourceLabel,
          file_count: Math.max(imported.length, 1),
          char_count: text.length,
          text_preview: text.slice(0, 800),
          response: text.slice(0, 2000),
        };
      }

      case 'ingest': {
        const prompt = toShellSingleLine(
          mergePromptWithEditor(
            mergeWithNodeDescription(config?.prompt || inputText, roleDesc),
            node,
            traceContext
          )
        );
        return withLangfuseSpan(
          'sim-ingest',
          {
            sessionId: traceContext?.sessionId,
            metadata: { nodeId: node.id, label, type: 'ingest' },
            input: { preview: prompt.slice(0, 400) },
          },
          async () => {
            try {
              const result = await runRagStep('ingest', prompt);
              const response = ragDownstreamText('ingest', result);
              return {
                message: `[RAG] ${String(result.explanation ?? 'ingest')}`,
                data: result,
                response,
                status: 'success',
              };
            } catch (error) {
              return { message: `[ERROR] RAG Ingest 실행 중 오류: ${error}`, status: 'error' };
            }
          }
        );
      }

      case 'chunk': {
        const prompt = toShellSingleLine(
          mergePromptWithEditor(
            mergeWithNodeDescription(config?.prompt || inputText, roleDesc),
            node,
            traceContext
          )
        );
        const strategy = (config?.chunkStrategy as ChunkStrategyId) || 'recursive';
        const chunkSize =
          Number(config?.chunkSize) > 0 ? Number(config?.chunkSize) : DEFAULT_CHUNK_SIZE;
        const chunkOverlap =
          Number(config?.chunkOverlap) >= 0 ? Number(config?.chunkOverlap) : DEFAULT_CHUNK_OVERLAP;

        return withLangfuseSpan(
          'sim-chunk',
          {
            sessionId: traceContext?.sessionId,
            metadata: {
              nodeId: node.id,
              label,
              chunkStrategy: strategy,
              chunkSize,
              chunkOverlap,
            },
            input: { textPreview: prompt.slice(0, 500) },
          },
          async () => {
            if (prompt.trim()) {
              try {
                const { chunks, strategyLabel } = await splitTextWithLangChain(prompt, {
                  strategy,
                  chunkSize,
                  chunkOverlap,
                });
                if (chunks.length > 0) {
                  const result = {
                    explanation: `LangChain ${strategyLabel}`,
                    chunks,
                    chunkStrategy: strategy,
                    chunkSize,
                    chunkOverlap,
                  };
                  const response = ragDownstreamText('chunk', result);
                  return {
                    message: `[RAG·LangChain] ${result.explanation} (${chunks.length}청크)`,
                    chunks,
                    response,
                    status: 'success',
                    langchain: true,
                  };
                }
              } catch (e) {
                console.warn('[chunk] LangChain 실패, 폴백', e);
              }
            }
            try {
              const result = await runRagStep('chunk', prompt, {
                chunkStrategyHint: strategy,
              });
              const response = ragDownstreamText('chunk', result);
              return {
                message: `[RAG] ${String(result.explanation ?? 'chunk')}`,
                chunks: result.chunks as string[] | undefined,
                response,
                status: 'success',
              };
            } catch (error) {
              return { message: `[ERROR] RAG Chunk 실행 중 오류: ${error}`, status: 'error' };
            }
          }
        );
      }

      case 'embed': {
        const prompt = toShellSingleLine(
          mergePromptWithEditor(
            mergeWithNodeDescription(config?.prompt || inputText, roleDesc),
            node,
            traceContext
          )
        );
        return withLangfuseSpan(
          'sim-embed',
          {
            sessionId: traceContext?.sessionId,
            metadata: { nodeId: node.id, label, type: 'embed' },
            input: { preview: prompt.slice(0, 400) },
          },
          async () => {
            try {
              const result = await runRagStep('embed', prompt);
              const response = ragDownstreamText('embed', result);
              return {
                message: `[RAG] ${String(result.explanation ?? 'embed')}`,
                embedding: result.embedding as number[] | undefined,
                response,
                status: 'success',
              };
            } catch (error) {
              return { message: `[ERROR] RAG Embed 실행 중 오류: ${error}`, status: 'error' };
            }
          }
        );
      }

      case 'retrieve': {
        const prompt = toShellSingleLine(
          mergePromptWithEditor(
            mergeWithNodeDescription(config?.prompt || inputText, roleDesc),
            node,
            traceContext
          )
        );
        return withLangfuseSpan(
          'sim-retrieve',
          {
            sessionId: traceContext?.sessionId,
            metadata: { nodeId: node.id, label, type: 'retrieve' },
            input: { preview: prompt.slice(0, 400) },
          },
          async () => {
            try {
              const result = await runRagStep('retrieve', prompt);
              const response = ragDownstreamText('retrieve', result);
              return {
                message: `[RAG] ${String(result.explanation ?? 'retrieve')}`,
                context: result.context as string | undefined,
                response,
                status: 'success',
              };
            } catch (error) {
              return { message: `[ERROR] RAG Retrieve 실행 중 오류: ${error}`, status: 'error' };
            }
          }
        );
      }
      
      case 'python': {
        const editorPy = getEditorCodeForNode(node, traceContext);
        const pythonCode =
          (editorPy && editorPy.trim()) ||
          (config?.pythonCode as string) ||
          'print("Hello from Python!")';
        const scriptPath = '/tmp/user_script.py';
        const header = roleDesc
          ? `# Node context (from description)\n# ${toShellSingleLine(roleDesc)}\n\n`
          : '';
        
        try {
          const fs = tryGetFs();
          const cp = tryGetChildProcess();
          if (!fs || !cp) throw new Error('fs or child_process unavailable');
          fs.writeFileSync(scriptPath, header + pythonCode);
          const result = cp.execSync(`python3 ${scriptPath}`).toString();
          return {
            message: `[Python] 스크립트 실행 결과입니다.${editorPy ? ' (코드 에디터 본문 우선)' : ''}`,
            response: result,
            status: 'success'
          };
        } catch (error) {
          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey) {
            try {
              const gen = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                  {
                    parts: [
                      {
                        text: `다음은 워크플로우 Python 노드 스크립트입니다. 브라우저에서는 실행할 수 없어 시뮬 결과만 작성하세요. 스크립트가 하려는 일을 1~3문단으로 요약하고, 예상 stdout 형태의 짧은 예시를 출력 형식으로만 제시하세요.\n\n--- 스크립트 ---\n${pythonCode.slice(0, 12000)}`,
                      },
                    ],
                  },
                ],
              });
              const textOut = gen.text?.trim() || String(error);
              return {
                message: `[Python] 코드 에디터 스크립트 기반 시뮬(로컬 미실행).`,
                response: textOut,
                status: 'success',
              };
            } catch {
              /* fall through */
            }
          }
          return {
            message: `[Python] 로컬 실행 불가 환경. 에디터 코드가 시뮬 맥락에만 사용됩니다.`,
            response: `[시뮬]\n${pythonCode.slice(0, 2000)}`,
            status: 'success',
          };
        }
      }
      //수정된부분
      case 'tool': {
        const tId = config?.toolId || 'google_search';
        const tInfo = TOOL_REGISTRY.find(t => t.id === tId) || TOOL_REGISTRY[0];
        const toolContextual = mergePromptWithEditor(contextualInputText, node, traceContext);

        if (tId === 'tavily_search') {
          if (!process.env.TAVILY_API_KEY) {
            return { message: "[ERROR] TAVILY_API_KEY가 설정되지 않았습니다.", status: 'error' };
          }
          const q = toShellSingleLine(toolContextual);
          try {
            const textOut = await tavilySearchViaHttp(q, process.env.TAVILY_API_KEY);
            return {
              message: `[Tool] Tavily Search 결과입니다.`,
              tool: tInfo.name,
              response: textOut,
              status: 'success',
            };
          } catch (error) {
            return {
              message: `[ERROR] Tavily API: ${error instanceof Error ? error.message : String(error)}`,
              status: 'error',
            };
          }
        } else if (tId === 'calculator') {
          const raw = toShellSingleLine(toolContextual).trim();
          let result = evaluateSafeArithmeticExpression(raw.replace(/\s/g, ''));
          if (result === null && raw.length > 0) {
            const candidates = raw.match(/[0-9+\-*/().\s]+/g) ?? [];
            const sorted = [...candidates].sort((a, b) => b.replace(/\s/g, '').length - a.replace(/\s/g, '').length);
            for (const c of sorted) {
              result = evaluateSafeArithmeticExpression(c.replace(/\s/g, ''));
              if (result !== null) break;
            }
          }
          if (result !== null) {
            return {
              message: `[Tool] 계산 완료: ${raw.slice(0, 120)} → ${result}`,
              tool: tInfo.name,
              result,
              response: String(result),
              status: 'success',
            };
          }
          return {
            message:
              '[ERROR] Calculator: 안전한 산술식(+ - * / 괄호·숫자)을 찾지 못했습니다.',
            tool: tInfo.name,
            status: 'error',
          };
        } else if (tId === 'google_search') {
          const q = toShellSingleLine(toolContextual);
          if (process.env.TAVILY_API_KEY) {
            try {
              const textOut = await tavilySearchViaHttp(q, process.env.TAVILY_API_KEY);
              return {
                message: `[Tool] 웹 검색 결과 (Tavily 백엔드)`,
                tool: tInfo.name,
                response: textOut,
                status: 'success',
              };
            } catch (error) {
              return {
                message: `[ERROR] Google Search(Tavily): ${error instanceof Error ? error.message : String(error)}`,
                tool: tInfo.name,
                status: 'error',
              };
            }
          }
          const expression = q.match(/[0-9+\-*/().\s]+/g)?.sort((a, b) => b.length - a.length)[0];
          if (expression) {
            const calcResult = evaluateSafeArithmeticExpression(expression.replace(/\s/g, ''));
            if (calcResult !== null) {
              return {
                message: `[Tool] 산술 식만 인식: ${expression.trim()} = ${calcResult} (실시간 웹 검색은 TAVILY_API_KEY 설정 필요)`,
                tool: tInfo.name,
                result: calcResult,
                response: String(calcResult),
                status: 'success',
              };
            }
          }
          const gKey = process.env.GEMINI_API_KEY;
          if (gKey) {
            try {
              const gen = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                  {
                    parts: [
                      {
                        text: `다음은 워크플로 사용자 질의입니다. 실시간 웹 검색 API는 연결되어 있지 않습니다. 학습 데이터 범위에서 간결히 답하고, 최신 뉴스·가격 등 불확실하면 모른다고 하세요.\n\n질의:\n${q.slice(0, 4000)}`,
                      },
                    ],
                  },
                ],
                config: {
                  systemInstruction:
                    '한국어. 출처 없는 사실 단정 금지. 짧은 단락으로.',
                },
              });
              const textOut = gen.text?.trim() || '';
              return {
                message: `[Tool] Google Search (오프라인·모델 폴백 — TAVILY_API_KEY로 실검색 가능)`,
                tool: tInfo.name,
                response: textOut,
                status: 'success',
              };
            } catch (e) {
              return {
                message: `[ERROR] Google Search 폴백 실패: ${e instanceof Error ? e.message : String(e)}`,
                tool: tInfo.name,
                status: 'error',
              };
            }
          }
          return {
            message:
              '[ERROR] Google Search: TAVILY_API_KEY 또는 GEMINI_API_KEY 중 하나가 필요합니다.',
            tool: tInfo.name,
            status: 'error',
          };
        } else if (tId === 'csv_to_postgres_load') {
          const inputObj = (input ?? {}) as Record<string, unknown>;

          const upstreamHeaders = Array.isArray(inputObj.headers)
            ? (inputObj.headers as string[])
            : [];

          const upstreamRows = Array.isArray(inputObj.rows)
            ? (inputObj.rows as Record<string, unknown>[])
            : [];

          const upstreamImported = Array.isArray(inputObj.importedFiles)
            ? (inputObj.importedFiles as { name?: string; content?: string; mimeType?: string }[])
            : [];

          const delimiter = String(config?.delimiter ?? ',');
          const tableName = String(config?.tableName ?? 'csv_table').trim() || 'csv_table';
          const dbHost = String(config?.dbHost ?? 'localhost');
          const dbPort = Number(config?.dbPort ?? 5433);
          const dbName = String(config?.dbName ?? 'testdb');
          const dbUser = String(config?.dbUser ?? 'postgres');
          const dbPassword = String(config?.dbPassword ?? '1234');
          const ifExists = String(config?.ifExists ?? 'fail'); // fail | replace | append

          let headers = upstreamHeaders;
          let rows = upstreamRows;

          // upstream rows가 없으면 importedFiles로 폴백
          if (rows.length === 0) {
            const imported = upstreamImported.filter(
              (f) => String(f?.content ?? '').trim().length > 0
            );

            if (imported.length === 0) {
              return {
                message: '[ERROR] datasource에서 전달된 CSV 데이터가 없습니다. upstream input.rows 또는 input.importedFiles를 확인하세요.',
                tool: tInfo.name,
                status: 'error',
              };
            }

            const csvFile =
              imported.find((f) => (f.name ?? '').toLowerCase().endsWith('.csv')) ?? imported[0];

            const raw = String(csvFile.content ?? '').trim();
            if (!raw) {
              return {
                message: '[ERROR] CSV 내용이 비어 있습니다.',
                tool: tInfo.name,
                status: 'error',
              };
            }

            const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
            if (lines.length < 2) {
              return {
                message: '[ERROR] CSV는 헤더와 최소 1개 이상의 데이터 행이 필요합니다.',
                tool: tInfo.name,
                status: 'error',
              };
            }

            headers = lines[0].split(delimiter).map((s) => s.trim());
            rows = lines.slice(1).map((line) => {
              const values = line.split(delimiter).map((s) => s.trim());
              const row: Record<string, string | null> = {};
              headers.forEach((h, i) => {
                row[h] = values[i] ?? null;
              });
              return row;
            });
          }

          if (headers.length === 0 || rows.length === 0) {
            return {
              message: '[ERROR] 적재할 headers 또는 rows가 비어 있습니다.',
              tool: tInfo.name,
              status: 'error',
            };
          }

          const payload = {
            table_name: tableName,
            if_exists: ifExists,
            db: {
              host: dbHost,
              port: dbPort,
              database: dbName,
              user: dbUser,
              password: dbPassword,
            },
            headers,
            rows,
          };

          try {
            const res = await fetch('/api/postgres/insert-csv', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            const rawText = await res.text();

            if (!res.ok) {
              return {
                message: `[ERROR] CSV→PostgreSQL 적재 실패: ${rawText}`,
                tool: tInfo.name,
                status: 'error',
              };
            }

            let parsed: unknown = rawText;
            try {
              parsed = JSON.parse(rawText);
            } catch {
              // plain text fallback
            }

            return {
              message: `[CSV→PostgreSQL] 적재 완료`,
              tool: tInfo.name,
              status: 'success',
              table_name: tableName,
              inserted_rows: rows.length,
              headers,
              response: typeof parsed === 'string' ? parsed : JSON.stringify(parsed),
              data: parsed,
            };
          } catch (error) {
            return {
              message: `[ERROR] CSV→PostgreSQL 적재 실패: ${error instanceof Error ? error.message : String(error)}`,
              tool: tInfo.name,
              status: 'error',
              table_name: tableName,
              attempted_rows: rows.length,
            };
          }
        }

        return {
          message: `[Tool] ${tInfo.name} 도구를 사용하여 작업을 수행했습니다.${roleDesc ? ' 노드 설명 반영.' : ''}`,
          tool: tInfo.name,
          execution_id: uuidv4().split('-')[0],
          result: `Executed ${tId} successfully.`,
          status: 'success',
          response: toolContextual,
        };
      }
      //수정된부분
      default: {
        const editorDef = getEditorCodeForNode(node, traceContext);
        return {
          message: `[Node] ${label} 작업을 완료했습니다.${roleDesc ? ` [설명] ${toShellSingleLine(roleDesc).slice(0, 200)}` : ''}${editorDef ? ' (코드 에디터 스크립트 참고)' : ''}`,
          status: 'success',
          response: editorDef ? `${contextualInputText}\n\n[코드 에디터]\n${editorDef.slice(0, 4000)}` : contextualInputText,
        };
      }
    }
  } catch (err) {
    console.error(`Error executing node ${label}:`, err);
    return {
      message: `[ERROR] ${label} 실행 중 오류가 발생했습니다.`,
      error: err instanceof Error ? err.message : String(err),
      status: 'error'
    };
  }
};