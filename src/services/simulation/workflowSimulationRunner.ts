import type { Dispatch, SetStateAction } from 'react';
import { executeNode } from './simulationService';
import { buildEditorCodeByNodeId } from '../../lib/project/nodeCodePaths';
import {
  beginSimulationRun,
  markSimulationRunComplete,
  archiveReportArtifact,
  getArchivedReports,
  type ArchivedReport,
} from '../../lib/report/reportArchive';
import { syncReportToServer } from '../../lib/report/reportServerSync';
import type { Node, WorkflowGraph } from '../../types';
import type {
  AgentFlowGlobalDb,
  AgentFlowNodeOutputs,
  AgentFlowNodeOutputEntry,
  SimulationResultsSummary,
} from '../../types/simulation';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type RunWorkflowSimulationParams = {
  graph: WorkflowGraph;
  fileContents: Record<string, string>;
  chatMessages: ChatTurn[];
  selectedNode: Node | null;
  globalDB: AgentFlowGlobalDb;
  logs: string[];
  setIsSimulating: (v: boolean) => void;
  setIsSimPanelOpen: Dispatch<SetStateAction<boolean>>;
  setLogs: Dispatch<SetStateAction<string[]>>;
  setGraph: Dispatch<SetStateAction<WorkflowGraph>>;
  setGlobalDB: Dispatch<SetStateAction<AgentFlowGlobalDb>>;
  setNodeOutputs: Dispatch<SetStateAction<AgentFlowNodeOutputs>>;
  setActiveNodeId: Dispatch<SetStateAction<string | null>>;
  setSimulationResults: Dispatch<SetStateAction<SimulationResultsSummary | null>>;
  setArchivedReports: Dispatch<SetStateAction<ArchivedReport[]>>;
};

const normalizePathLabel = (s: string) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
//수정된부분
export const runWorkflowSimulation = async (p: RunWorkflowSimulationParams) => {
  const {
    graph,
    fileContents,
    chatMessages,
    selectedNode,
    globalDB,
    logs,
    setIsSimulating,
    setIsSimPanelOpen,
    setLogs,
    setGraph,
    setGlobalDB,
    setNodeOutputs,
    setActiveNodeId,
    setSimulationResults,
    setArchivedReports,
  } = p;

  setIsSimulating(true);
  setIsSimPanelOpen(true);

  const nodes = [...graph.nodes];
  const startNode = nodes.find((n) => n.type === 'start');

  const basePrompt = (startNode?.config?.initialPrompt ?? '').trim();
  const selectedId = selectedNode?.id;
  const userFromNodeDescription = selectedId
    ? (nodes.find((n) => n.id === selectedId)?.description ?? '').trim()
    : '';
  const lastChatUser = chatMessages.filter((m) => m.role === 'user').pop()?.content?.trim() ?? '';
  const userQuery = userFromNodeDescription || lastChatUser;

  const combinedInitialText =
    basePrompt && userQuery
      ? `${basePrompt}\n\n--- 사용자 요청 ---\n\n${userQuery}`
      : userQuery || basePrompt || '';

  if (userQuery) {
    setLogs((prev) => [...prev, `[USER] ${userQuery}`]);
  }
  if (basePrompt && userQuery) {
    setLogs((prev) => [
      ...prev,
      `[SYSTEM] 시작 노드 기본 프롬프트와 사용자 입력(노드 설명 또는 채팅)을 결합했습니다.`,
    ]);
  } else if (basePrompt && !userQuery) {
    setLogs((prev) => [...prev, `[SYSTEM] 시작 노드 기본 프롬프트만 사용합니다.`]);
  }

  setLogs((prev) => [...prev, `[SYSTEM] 시뮬레이션 시작: ${new Date().toLocaleTimeString()}`]);

  if (!startNode) {
    setLogs((prev) => [...prev, '[ERROR] 시작 노드를 찾을 수 없습니다.']);
    setIsSimulating(false);
    return;
  }

  const simulationRunId = beginSimulationRun((userQuery || combinedInitialText || '').slice(0, 200));

  try {
    const editorCodeByNodeId = buildEditorCodeByNodeId(nodes, fileContents);

    let currentNodeId = startNode.id;
    const visited = new Set<string>();
    const results: SimulationResultsSummary = { steps: [] };

    let lastSubstantiveOutput = combinedInitialText;

    // 이전 노드 결과를 다음 노드 input으로 넘기기 위한 로컬 저장소
    const nodeOutputsRef: AgentFlowNodeOutputs = {};

    while (currentNodeId && !visited.has(currentNodeId)) {
      const node = nodes.find((n) => n.id === currentNodeId);
      console.log('Executing node:', node?.label, 'ID:', currentNodeId);
      if (!node) break;

      visited.add(currentNodeId);
      setActiveNodeId(currentNodeId);

      if (node.parentId) {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (parent) {
          setLogs((prev) => [...prev, `[TEAM] ${parent.label} 내에서 실행 중...`]);
        }
      }

      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === node.id ? { ...n, metrics: { ...n.metrics, status: 'running' } } : n,
        ),
      }));

      setLogs((prev) => [...prev, `[SIM] ${node.label} 실행 중...`]);

      // 직전 노드 결과를 찾아서 text + 구조화 데이터 전체를 함께 넘김
      const incomingEdges = graph.edges.filter((e) => e.target === node.id);
      const previousNodeId = incomingEdges.length > 0 ? incomingEdges[0].source : null;

      const previousEntry = previousNodeId ? nodeOutputsRef[previousNodeId] : undefined;

      const previousResult: Record<string, unknown> =
        previousEntry?.data && typeof previousEntry.data === 'object'
          ? previousEntry.data
          : {};

      const responseText =
        typeof previousResult.response === 'string' && previousResult.response.trim()
          ? previousResult.response
          : typeof previousResult.content === 'string' && previousResult.content.trim()
          ? previousResult.content
          : typeof previousResult.message === 'string' && previousResult.message.trim()
          ? previousResult.message
          : lastSubstantiveOutput;

      const inputData = {
        text: responseText,
        ...previousResult,
      };

      console.log('[SIM DEBUG] current node =', node.label, node.id);
      console.log('[SIM DEBUG] previous node =', previousNodeId);
      console.log('[SIM DEBUG] inputData keys =', Object.keys(inputData));

      const result = await executeNode(
        node,
        inputData,
        logs,
        globalDB,
        setGlobalDB,
        graph,
        { sessionId: simulationRunId, editorCodeByNodeId },
      );

      if (node.type !== 'router' && node.type !== 'end') {
        if (node.type === 'report') {
          const c = result.content || result.response;
          if (typeof c === 'string' && c.trim()) lastSubstantiveOutput = c;
        } else if (node.type === 'start' && result.initial_input != null) {
          lastSubstantiveOutput = String(result.initial_input);
        } else if (typeof result.response === 'string' && result.response.trim()) {
          lastSubstantiveOutput = result.response;
        } else if (result.content != null && String(result.content).trim()) {
          lastSubstantiveOutput = String(result.content);
        } else if (typeof result.message === 'string' && result.message.trim()) {
          lastSubstantiveOutput = result.message;
        }
      }

      const logMessage =
        result.response && typeof result.response === 'string'
          ? `[RESULT] ${node.label} 응답: ${result.response.substring(0, 100)}${result.response.length > 100 ? '...' : ''}`
          : `[RESULT] ${typeof result === 'string' ? result : result.message}`;
      setLogs((prev) => [...prev, logMessage]);

      setNodeOutputs((prev) => ({
        ...prev,
        [node.id]: {
          timestamp: new Date().toLocaleTimeString(),
          data: result,
          status: 'success',
        },
      }));

      nodeOutputsRef[node.id] = {
        timestamp: new Date().toLocaleTimeString(),
        data: result,
        status: 'success',
      };

      if (node.type === 'report' && result.status !== 'error') {
        const body = String(result.content ?? result.response ?? '').trim();
        if (body) {
          const saved = archiveReportArtifact({
            runId: simulationRunId,
            nodeId: node.id,
            nodeLabel: node.label,
            format: String(node.config?.reportFormat ?? 'markdown'),
            content: body,
            message: typeof result.message === 'string' ? result.message : undefined,
          });
          if (saved) {
            setArchivedReports(getArchivedReports());
            setLogs((prev) => [
              ...prev,
              `[SYSTEM] 보고서 보관함에 저장됨 · 실행 ${simulationRunId} · ${saved.createdAt}`,
            ]);
            void syncReportToServer(saved).then((sr) => {
              if (sr.ok === false) {
                setLogs((prev) => [
                  ...prev,
                  `[WARN] 서버 저장 실패(로컬 보관함은 유지): ${sr.error}`,
                ]);
                return;
              }
              setLogs((prev) => [...prev, `[SYSTEM] 서버 디스크 저장 · ${sr.relativePath}`]);
            });
          }
        }
      }

      const latency = `${(Math.random() * 500 + 100).toFixed(0)}ms`;
      const tokens = Math.floor(Math.random() * 1000 + 100);

      results.steps.push({
        nodeId: node.id,
        label: node.label,
        latency,
        tokens,
      });

      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === node.id
            ? {
                ...n,
                metrics: {
                  ...n.metrics,
                  status: 'success',
                  latency,
                  tokens,
                },
              }
            : n,
        ),
      }));

      if (node.type === 'end') {
        setLogs((prev) => [...prev, `[SYSTEM] 시뮬레이션 완료: 종료 노드 도달`]);
        break;
      }

      const outgoingEdges = graph.edges.filter((e) => e.source === node.id);
      console.log('Outgoing edges for', node.id, ':', outgoingEdges);
      if (outgoingEdges.length === 0) {
        setLogs((prev) => [...prev, `[WARNING] ${node.label}에서 나가는 연결이 없습니다.`]);
        break;
      }

      if (node.type === 'router') {
        const decision = String(result.decision ?? '').trim();
        const dn = normalizePathLabel(decision);
        console.log('Router decision:', decision);
        const nextEdge =
          outgoingEdges.find((e) => normalizePathLabel(e.label || '') === dn) ||
          outgoingEdges.find(
            (e) =>
              dn.length > 0 &&
              (dn.includes(normalizePathLabel(e.label || '')) ||
                normalizePathLabel(e.label || '').includes(dn)),
          ) ||
          outgoingEdges.find(
            (e) => e.label && (decision.includes(e.label) || e.label.includes(decision)),
          ) ||
          outgoingEdges[0];
        if (!nextEdge) {
          setLogs((prev) => [...prev, `[WARNING] 라우터 출구 엣지를 찾지 못했습니다.`]);
          break;
        }
        console.log('Next edge:', nextEdge);
        setLogs((prev) => [
          ...prev,
          `[SIM] 라우터 결정: "${decision}" → ${nextEdge.label ? `분기「${nextEdge.label}」` : nextEdge.target}`,
        ]);
        currentNodeId = nextEdge.target;
      } else {
        currentNodeId = outgoingEdges[0].target;
        console.log('Next node ID:', currentNodeId);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setSimulationResults(results);
  } finally {
    markSimulationRunComplete(simulationRunId);
    setIsSimulating(false);
    setActiveNodeId(null);
  }
};