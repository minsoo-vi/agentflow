import type { ArchivedReport } from './reportArchive';

export type ServerSaveResult =
  | { ok: true; relativePath: string; fileName: string }
  | { ok: false; error: string };

/**
 * 로컬 보관함에 넣은 보고서를 동일 출처의 /api/reports 로 전송해 서버 디스크에 저장합니다.
 * (Vite 개발 서버 미들웨어 또는 npm run start 의 Express)
 */
export const syncReportToServer = async (
  r: ArchivedReport
): Promise<ServerSaveResult> => {
  const key =
    (import.meta.env.VITE_AF_REPORT_API_SECRET as string | undefined)?.trim() ??
    '';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key) {
      headers['x-agentflow-report-key'] = key;
    }

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        runId: r.runId,
        nodeId: r.nodeId,
        nodeLabel: r.nodeLabel,
        format: r.format,
        content: r.content,
        message: r.message,
        id: r.id,
        createdAt: r.createdAt,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      relativePath?: string;
      fileName?: string;
      error?: string;
    };

    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: String(data.error ?? res.statusText ?? 'HTTP error'),
      };
    }

    return {
      ok: true,
      relativePath: String(data.relativePath ?? ''),
      fileName: String(data.fileName ?? ''),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'network error',
    };
  }
};
