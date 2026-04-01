import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import {
  getArchivedReports,
  clearReportArchive,
  type ArchivedReport,
} from '../../lib/report/reportArchive';
import type {
  AgentFlowGlobalDb,
  AgentFlowNodeOutputs,
  SimulationResultsSummary,
} from '../../types/simulation';

const DEFAULT_GLOBAL_DB: AgentFlowGlobalDb = {
  users: [
    { id: '1', name: 'User A', status: 'active', last_login: '2024-03-28' },
    { id: '2', name: 'User B', status: 'pending', last_login: '2024-03-27' },
    { id: '3', name: 'User C', status: 'active', last_login: '2024-03-26' },
  ],
  logs: [],
  settings: [{ id: '1', theme: 'dark', notifications: true }],
};

/** 시뮬레이션 실행 UI, 노드 출력, 글로벌 DB, 스토리지 탭·보관 보고서 */
export const useSimulationStorageState = (
  setLogs: Dispatch<SetStateAction<string[]>>,
) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSimPanelOpen, setIsSimPanelOpen] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResultsSummary | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [nodeOutputs, setNodeOutputs] = useState<AgentFlowNodeOutputs>({});
  const [globalDB, setGlobalDB] = useState<AgentFlowGlobalDb>(DEFAULT_GLOBAL_DB);
  const [storageTab, setStorageTab] = useState<'results' | 'db' | 'reports'>('results');
  const [archivedReports, setArchivedReports] = useState<ArchivedReport[]>(() =>
    getArchivedReports(),
  );

  const handleGlobalStorageTrash = useCallback(() => {
    if (storageTab === 'results') setNodeOutputs({});
    else if (storageTab === 'reports') {
      clearReportArchive();
      setArchivedReports([]);
    } else setGlobalDB({ users: [], logs: [], settings: [] });
  }, [storageTab]);

  const exportResults = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(nodeOutputs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `simulation_results_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setLogs((prev) => [...prev, `[SYSTEM] 실행 결과가 JSON 파일로 내보내졌습니다.`]);
  }, [nodeOutputs, setLogs]);

  return {
    isSimulating,
    setIsSimulating,
    isSimPanelOpen,
    setIsSimPanelOpen,
    simulationResults,
    setSimulationResults,
    activeNodeId,
    setActiveNodeId,
    nodeOutputs,
    setNodeOutputs,
    globalDB,
    setGlobalDB,
    storageTab,
    setStorageTab,
    archivedReports,
    setArchivedReports,
    handleGlobalStorageTrash,
    exportResults,
  };
};
