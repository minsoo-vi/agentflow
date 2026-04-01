import { Langfuse } from 'langfuse';

let client: Langfuse | null | undefined;

const summarizeOutput = (out: unknown): unknown => {
  if (out === null || out === undefined) return out;
  if (typeof out === 'string') return out.length > 2000 ? `${out.slice(0, 2000)}…` : out;
  if (typeof out !== 'object') return out;
  const o = out as Record<string, unknown>;
  const keys = Object.keys(o);
  const slim: Record<string, unknown> = {};
  for (const k of keys.slice(0, 12)) {
    const v = o[k];
    if (k === 'embedding' && Array.isArray(v)) {
      slim[k] = `[array len=${v.length}]`;
    } else if (typeof v === 'string' && v.length > 1500) {
      slim[k] = `${v.slice(0, 1500)}…`;
    } else {
      slim[k] = v;
    }
  }
  return slim;
};

/**
 * Langfuse 클라이언트 (선택). `trace()`는 전체 SDK에만 있어 **공개+시크릿 키가 모두** 있을 때만 활성화합니다.
 * 프로덕션에서는 시크릿을 브라우저에 넣지 말고 [백엔드 프록시](https://langfuse.com/docs/deployment/self-host) 권장.
 */
export const getLangfuse = (): Langfuse | null => {
  if (client !== undefined) return client;
  const pk = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY as string | undefined;
  const sk = import.meta.env.VITE_LANGFUSE_SECRET_KEY as string | undefined;
  const host =
    (import.meta.env.VITE_LANGFUSE_BASE_URL as string | undefined) || 'https://cloud.langfuse.com';
  if (!pk?.trim() || !sk?.trim()) {
    client = null;
    return null;
  }
  try {
    client = new Langfuse({ publicKey: pk.trim(), secretKey: sk.trim(), baseUrl: host });
  } catch {
    client = null;
  }
  return client;
};

export type TraceOpts = {
  sessionId?: string;
  metadata?: Record<string, unknown>;
  input?: unknown;
};

/**
 * 시뮬레이션 단계를 Langfuse 스팬으로 기록합니다. 키가 없으면 fn만 실행.
 */
export const withLangfuseSpan = async <T>(
  name: string,
  opts: TraceOpts,
  fn: () => Promise<T>
): Promise<T> => {
  const lf = getLangfuse();
  if (!lf) return fn();

  const trace = lf.trace({
    name,
    sessionId: opts.sessionId,
    metadata: opts.metadata,
    input: opts.input,
  });
  const span = trace.span({ name: `${name}.run`, metadata: opts.metadata, input: opts.input });
  try {
    const out = await fn();
    span.end({ output: summarizeOutput(out) as Record<string, unknown> | string });
    await lf.flushAsync();
    return out;
  } catch (e) {
    span.end({
      level: 'ERROR',
      statusMessage: e instanceof Error ? e.message : String(e),
    });
    await lf.flushAsync();
    throw e;
  }
};
