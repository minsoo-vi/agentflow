/**
 * 시뮬레이션·외부 API 제한값. `.env` + `vite.config.ts` define으로 주입 (클라이언트 번들).
 *
 * - `AF_TAVILY_MAX_QUERY_CHARS`: Tavily 검색 쿼리 최대 길이(API 일반적 상한 400).
 * - `AF_TAVILY_SUMMARIZE_INPUT_CHARS`: 긴 맥락을 검색어로 요약할 때 모델에 넣는 입력 상한.
 * - `AF_REPORT_CONTEXT_CHARS`: report 노드·라우터 등에 넘기는 상류 텍스트 상한(가공 전).
 */

const parseBoundedInt = (
  raw: string | undefined,
  defaultValue: number,
  min: number,
  max: number
): number => {
  const n = parseInt(String(raw ?? '').trim(), 10);
  if (Number.isNaN(n)) return defaultValue;
  return Math.min(max, Math.max(min, n));
};

export const TAVILY_MAX_QUERY_CHARS = parseBoundedInt(
  process.env.AF_TAVILY_MAX_QUERY_CHARS,
  400,
  1,
  400
);

export const TAVILY_SUMMARIZE_INPUT_CHARS = parseBoundedInt(
  process.env.AF_TAVILY_SUMMARIZE_INPUT_CHARS,
  14000,
  500,
  200_000
);

export const REPORT_CONTEXT_CHARS = parseBoundedInt(
  process.env.AF_REPORT_CONTEXT_CHARS,
  12_000,
  1000,
  200_000
);
