/**
 * 시뮬레이션에서 생성된 report 노드 산출물을 브라우저 localStorage에 누적 저장합니다.
 * (파일 시스템 경로 없음 — 내보내기는 다운로드 버튼 사용)
 */

const STORAGE_KEY = 'agentflow_report_archive_v1';

export type SimulationRunMeta = {
  runId: string;
  startedAt: string;
  completedAt?: string;
  /** 사용자 요청·채팅 등 짧은 메모 */
  labelHint?: string;
};

export type ArchivedReport = {
  id: string;
  runId: string;
  nodeId: string;
  nodeLabel: string;
  format: string;
  content: string;
  message?: string;
  createdAt: string;
};

type ArchiveState = {
  runs: SimulationRunMeta[];
  reports: ArchivedReport[];
};

const loadState = (): ArchiveState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { runs: [], reports: [] };
    const p = JSON.parse(raw) as ArchiveState;
    return {
      runs: Array.isArray(p.runs) ? p.runs : [],
      reports: Array.isArray(p.reports) ? p.reports : [],
    };
  } catch {
    return { runs: [], reports: [] };
  }
};

const saveState = (s: ArchiveState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // 저장 공간 부족 등
  }
};

export const beginSimulationRun = (labelHint?: string): string => {
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const state = loadState();
  state.runs.unshift({
    runId,
    startedAt: new Date().toISOString(),
    labelHint: labelHint?.slice(0, 200),
  });
  state.runs = state.runs.slice(0, 150);
  saveState(state);
  return runId;
};

export const markSimulationRunComplete = (runId: string) => {
  const state = loadState();
  const run = state.runs.find((r) => r.runId === runId);
  if (run) run.completedAt = new Date().toISOString();
  saveState(state);
};

export const archiveReportArtifact = (params: {
  runId: string;
  nodeId: string;
  nodeLabel: string;
  format: string;
  content: string;
  message?: string;
}): ArchivedReport | null => {
  const text = String(params.content ?? '').trim();
  if (!text) return null;

  const state = loadState();
  const item: ArchivedReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    runId: params.runId,
    nodeId: params.nodeId,
    nodeLabel: params.nodeLabel,
    format: params.format || 'markdown',
    content: text,
    message: params.message,
    createdAt: new Date().toISOString(),
  };
  state.reports.unshift(item);
  state.reports = state.reports.slice(0, 300);
  saveState(state);
  return item;
};

export const getArchivedReports = (): ArchivedReport[] => loadState().reports;

export const getSimulationRuns = (): SimulationRunMeta[] => loadState().runs;

export const clearReportArchive = () => {
  saveState({ runs: [], reports: [] });
};

export const downloadReportFile = (r: ArchivedReport) => {
  const ext = r.format === 'markdown' || r.format === 'md' ? 'md' : 'txt';
  const safe = r.nodeLabel.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 60);
  const blob = new Blob([r.content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${safe}_${r.id.slice(-8)}.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
};
