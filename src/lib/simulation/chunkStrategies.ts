import {
  CharacterTextSplitter,
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
  TokenTextSplitter,
} from '@langchain/textsplitters';

/** 노드 config.chunkStrategy 와 동기화 */
export type ChunkStrategyId =
  | 'fixed'
  | 'recursive'
  | 'semantic'
  | 'hybrid'
  | 'markdown'
  | 'token';

export type ChunkSplitOptions = {
  strategy: ChunkStrategyId;
  chunkSize: number;
  chunkOverlap: number;
};

export const DEFAULT_CHUNK_SIZE = 1000;
export const DEFAULT_CHUNK_OVERLAP = 200;

export const CHUNK_STRATEGY_OPTIONS: {
  id: ChunkStrategyId;
  label: string;
  hint: string;
}[] = [
  { id: 'recursive', label: 'Recursive', hint: '구분자 계층(문단→문장→…)으로 분할 — LangChain 기본' },
  { id: 'fixed', label: 'Fixed (문자)', hint: '고정 길이·구분자 기준 — CharacterTextSplitter' },
  { id: 'markdown', label: 'Markdown', hint: '헤딩·코드블록 등 MD 구조 반영' },
  { id: 'semantic', label: 'Semantic (lite)', hint: '빈 줄 단락 단위로 묶은 뒤 길이 맞춤(임베딩 없음)' },
  { id: 'hybrid', label: 'Hybrid', hint: 'Recursive 후 작은 청크 병합' },
  { id: 'token', label: 'Token', hint: 'tiktoken 기준 토큰 길이(영어·코드에 유리)' },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** 작은 청크를 인접 병합 (hybrid 2단계) */
const mergeSmallChunks = (chunks: string[], targetMinChars: number): string[] => {
  if (chunks.length <= 1) return chunks;
  const out: string[] = [];
  let buf = chunks[0];
  for (let i = 1; i < chunks.length; i++) {
    const next = chunks[i];
    if (buf.length < targetMinChars) {
      buf = `${buf}\n\n${next}`;
    } else {
      out.push(buf);
      buf = next;
    }
  }
  out.push(buf);
  return out;
};

/** 임베딩 없이 단락 경계를 존중하는 경량 시맨틱 분할 */
const semanticLiteSplit = (text: string, chunkSize: number, overlap: number): string[] => {
  const size = clamp(chunkSize, 200, 16000);
  const ov = clamp(overlap, 0, Math.floor(size / 2));
  const paras = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (paras.length === 0) return [text.slice(0, size) || '(빈 입력)'];

  const chunks: string[] = [];
  let buf = '';
  for (const p of paras) {
    if (buf.length + p.length + 2 > size && buf) {
      chunks.push(buf);
      const tail = buf.slice(Math.max(0, buf.length - ov));
      buf = tail ? `${tail}\n\n${p}` : p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length ? chunks : [text.slice(0, size)];
};

/**
 * LangChain Text Splitters로 텍스트 분할.
 * @see https://js.langchain.com/docs/how_to/recursive_text_splitter
 */
export const splitTextWithLangChain = async (
  text: string,
  options: ChunkSplitOptions
): Promise<{ chunks: string[]; strategyLabel: string }> => {
  const chunkSize = clamp(options.chunkSize || DEFAULT_CHUNK_SIZE, 50, 32000);
  const chunkOverlap = clamp(
    options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP,
    0,
    Math.floor(chunkSize / 2)
  );
  const strategy = options.strategy ?? 'recursive';

  if (!text.trim()) {
    return { chunks: [], strategyLabel: strategy };
  }

  switch (strategy) {
    case 'fixed': {
      const splitter = new CharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        separator: '\n\n',
      });
      const chunks = await splitter.splitText(text);
      return { chunks, strategyLabel: 'fixed (CharacterTextSplitter)' };
    }
    case 'markdown': {
      const splitter = new MarkdownTextSplitter({ chunkSize, chunkOverlap });
      const chunks = await splitter.splitText(text);
      return { chunks, strategyLabel: 'markdown (MarkdownTextSplitter)' };
    }
    case 'recursive': {
      const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap });
      const chunks = await splitter.splitText(text);
      return { chunks, strategyLabel: 'recursive (RecursiveCharacterTextSplitter)' };
    }
    case 'semantic': {
      const chunks = semanticLiteSplit(text, chunkSize, chunkOverlap);
      return { chunks, strategyLabel: 'semantic-lite (paragraph merge)' };
    }
    case 'hybrid': {
      const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap });
      const raw = await splitter.splitText(text);
      const merged = mergeSmallChunks(raw, Math.floor(chunkSize * 0.35));
      return { chunks: merged, strategyLabel: 'hybrid (recursive + merge)' };
    }
    case 'token': {
      const splitter = new TokenTextSplitter({
        chunkSize: Math.max(50, Math.floor(chunkSize / 2)),
        chunkOverlap: Math.floor(chunkOverlap / 2),
        encodingName: 'cl100k_base',
      });
      const chunks = await splitter.splitText(text);
      return { chunks, strategyLabel: 'token (TokenTextSplitter cl100k_base)' };
    }
    default: {
      const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap });
      const chunks = await splitter.splitText(text);
      return { chunks, strategyLabel: 'recursive (fallback)' };
    }
  }
};
