import type { GoogleGenAI } from '@google/genai';

export type RagMode = 'ingest' | 'chunk' | 'embed' | 'retrieve';

/** Python rag_op.py와 유사한 형태 — 브라우저·Python 실패 시 시뮬레이션 */
export type RagIngestResult = {
  explanation: string;
  documents?: { title: string; snippet: string }[];
  char_count?: number;
};

export type RagChunkResult = {
  explanation: string;
  chunks: string[];
};

export type RagEmbedResult = {
  explanation: string;
  embedding: number[];
};

export type RagRetrieveResult = {
  explanation: string;
  context: string;
};

/** Gemini 폴백 시 추가 힌트 (청킹 전략 등) */
export type RagSimOptions = {
  chunkStrategyHint?: string;
};

const parseJsonFromModel = (raw: string): unknown => {
  const t = raw.trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(t.slice(start, end + 1));
  }
  return JSON.parse(t);
};

/**
 * 브라우저 등에서 `rag_op.py`를 쓸 수 없을 때 Gemini로 RAG 단계를 시뮬레이션합니다.
 * 응답은 JSON 한 덩어리로 받아 파싱합니다.
 */
export const simulateRagWithGemini = async (
  ai: GoogleGenAI,
  mode: RagMode,
  prompt: string,
  options?: RagSimOptions
): Promise<RagIngestResult | RagChunkResult | RagEmbedResult | RagRetrieveResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackStatic(mode, prompt, options);
  }

  const chunkHint = options?.chunkStrategyHint
    ? ` 청킹 힌트(사용자 설정): ${options.chunkStrategyHint}.`
    : '';
  const systemByMode: Record<RagMode, string> = {
    ingest:
      'You simulate document ingestion for RAG. Reply with JSON only: {"explanation":"한 줄 요약","documents":[{"title":"...","snippet":"..."}],"char_count":number}',
    chunk:
      `You simulate text chunking.${chunkHint} Reply with JSON only: {"explanation":"한 줄 요약","chunks":["문단1","문단2",...]} — chunks 3~8개, Korean if input is Korean.`,
    embed:
      'You simulate embedding. Reply with JSON only: {"explanation":"한 줄 요약","embedding":[0.1,0.2,...]} — use exactly 8 dimensions, values between -1 and 1.',
    retrieve:
      'You simulate retrieval from a vector store. Reply with JSON only: {"explanation":"한 줄 요약","context":"검색된 문맥을 한글로 2~4문단으로 합성"}',
  };

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `입력:\n${prompt.slice(0, 12000)}` }] }],
      config: {
        systemInstruction: systemByMode[mode],
        responseMimeType: 'application/json',
      },
    });
    const text = result.text?.trim() ?? '';
    const parsed = parseJsonFromModel(text) as Record<string, unknown>;
    return normalizeParsed(mode, parsed, prompt);
  } catch {
    return fallbackStatic(mode, prompt, options);
  }
};

const normalizeParsed = (
  mode: RagMode,
  parsed: Record<string, unknown>,
  prompt: string
): RagIngestResult | RagChunkResult | RagEmbedResult | RagRetrieveResult => {
  const explanation = String(parsed.explanation ?? '시뮬레이션 완료');
  switch (mode) {
    case 'ingest': {
      const docs = Array.isArray(parsed.documents)
        ? (parsed.documents as { title?: string; snippet?: string }[]).map((d) => ({
            title: String(d.title ?? '문서'),
            snippet: String(d.snippet ?? '').slice(0, 500),
          }))
        : [{ title: '인제스트', snippet: prompt.slice(0, 400) }];
      return {
        explanation,
        documents: docs,
        char_count: typeof parsed.char_count === 'number' ? parsed.char_count : prompt.length,
      };
    }
    case 'chunk': {
      const chunks = Array.isArray(parsed.chunks)
        ? (parsed.chunks as unknown[]).map((c) => String(c))
        : [prompt.slice(0, 200), prompt.slice(200, 400)].filter(Boolean);
      return { explanation, chunks: chunks.length ? chunks : ['(청크 없음)'] };
    }
    case 'embed': {
      const emb = Array.isArray(parsed.embedding)
        ? (parsed.embedding as unknown[]).map((n) => Number(n))
        : [0, 0, 0, 0, 0, 0, 0, 0];
      const fixed = emb.slice(0, 8);
      while (fixed.length < 8) fixed.push(0);
      return { explanation, embedding: fixed };
    }
    case 'retrieve':
    default:
      return {
        explanation,
        context: String(parsed.context ?? `관련 문맥(시뮬): ${prompt.slice(0, 800)}`),
      };
  }
};

const fallbackStatic = (
  mode: RagMode,
  prompt: string,
  _options?: RagSimOptions
): RagIngestResult | RagChunkResult | RagEmbedResult | RagRetrieveResult => {
  switch (mode) {
    case 'ingest':
      return {
        explanation: 'GEMINI_API_KEY 없음: 로컬 인제스트 시뮬레이션',
        documents: [{ title: '로컬', snippet: prompt.slice(0, 400) }],
        char_count: prompt.length,
      };
    case 'chunk':
      return {
        explanation: 'GEMINI_API_KEY 없음: 고정 청크 분할',
        chunks:
          prompt.length > 120
            ? [prompt.slice(0, 120), prompt.slice(120, 240), prompt.slice(240, 360)]
            : [prompt || '(빈 입력)'],
      };
    case 'embed':
      return {
        explanation: 'GEMINI_API_KEY 없음: 더미 임베딩 벡터',
        embedding: [0.12, -0.34, 0.56, -0.11, 0.9, -0.45, 0.23, 0.67],
      };
    case 'retrieve':
    default:
      return {
        explanation: 'GEMINI_API_KEY 없음: 입력을 그대로 컨텍스트로 사용',
        context: prompt.slice(0, 1500) || '(검색 쿼리 없음)',
      };
  }
};
