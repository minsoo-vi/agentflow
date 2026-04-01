import { useCallback, useMemo, type Dispatch, type SetStateAction, type MouseEvent } from 'react';
import { INITIAL_GRAPH } from '../../constants';
import { getArchivedReports, type ArchivedReport } from '../../lib/report/reportArchive';
import type { WorkflowGraph, Node } from '../../types';
import type { Node as RFNode } from 'reactflow';
import type { HelperChatMessage } from '../gemini/useGeminiChatHandlers';

type UseAppWorkflowActionsArgs = {
  graph: WorkflowGraph;
  setGraph: Dispatch<SetStateAction<WorkflowGraph>>;
  setLogs: Dispatch<SetStateAction<string[]>>;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  setActiveTab: Dispatch<SetStateAction<'chat' | 'helper' | 'nodes' | 'code'>>;
  setChatMessages: Dispatch<SetStateAction<{ role: 'user' | 'assistant'; content: string }[]>>;
  helperMessages: HelperChatMessage[];
  setHelperMessages: Dispatch<SetStateAction<HelperChatMessage[]>>;
  setIsHistoryOpen: Dispatch<SetStateAction<boolean>>;
  calculateLayout: (nextGraph: WorkflowGraph, force?: boolean) => void;
  setIsSimPanelOpen: Dispatch<SetStateAction<boolean>>;
  setIsStorageOpen: Dispatch<SetStateAction<boolean>>;
  setStorageTab: Dispatch<SetStateAction<'results' | 'db' | 'reports'>>;
  setArchivedReports: Dispatch<SetStateAction<ArchivedReport[]>>;
  setSelectedNode: Dispatch<SetStateAction<Node | null>>;
  setShowDbBrowser: Dispatch<SetStateAction<string | null>>;
};

export const useAppWorkflowActions = ({
  graph,
  setGraph,
  setLogs,
  setSidebarOpen,
  setActiveTab,
  setChatMessages,
  helperMessages,
  setHelperMessages,
  setIsHistoryOpen,
  calculateLayout,
  setIsSimPanelOpen,
  setIsStorageOpen,
  setStorageTab,
  setArchivedReports,
  setSelectedNode,
  setShowDbBrowser,
}: UseAppWorkflowActionsArgs) => {
  const handleClearGraphCompletely = useCallback(() => {
    if (confirm('모든 노드와 엣지를 삭제하시겠습니까?')) {
      setGraph({ nodes: [], edges: [] });
      setLogs((prev) => [...prev, '[SYSTEM] 그래프가 초기화되었습니다.']);
    }
  }, [setGraph, setLogs]);

  const handleExportGraphJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agentflow_graph.json';
    a.click();
  }, [graph]);

  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), [setSidebarOpen]);

  const handleRequestNewAiChat = useCallback(() => {
    if (
      confirm(
        '새로운 대화를 시작하시겠습니까? 현재 그래프는 유지되지만 대화 기록은 초기화됩니다.',
      )
    ) {
      setChatMessages([]);
    }
  }, [setChatMessages]);

  const handleToggleHistoryOpen = useCallback(
    () => setIsHistoryOpen((o) => !o),
    [setIsHistoryOpen],
  );

  const handleRestoreGraphFromHistory = useCallback(
    (g: WorkflowGraph) => {
      setGraph(g);
      setIsHistoryOpen(false);
    },
    [setGraph, setIsHistoryOpen],
  );

  const handleHelperNewChat = useCallback(() => {
    if (helperMessages.length === 0 || confirm('에이전트 헬퍼 대화를 초기화할까요?')) {
      setHelperMessages([]);
    }
  }, [helperMessages, setHelperMessages]);

  const handleToggleSimPanel = useCallback(
    () => setIsSimPanelOpen((o) => !o),
    [setIsSimPanelOpen],
  );

  const handleToggleStorage = useCallback(
    () => setIsStorageOpen((o) => !o),
    [setIsStorageOpen],
  );

  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), [setSidebarOpen]);

  const handleAutoLayout = useCallback(() => {
    calculateLayout(graph, true);
  }, [calculateLayout, graph]);

  const handleRequestResetGraph = useCallback(() => {
    if (confirm('그래프를 초기화하시겠습니까?')) {
      setGraph(INITIAL_GRAPH);
      calculateLayout(INITIAL_GRAPH, true);
    }
  }, [calculateLayout, setGraph]);

  const handleCloseStoragePanel = useCallback(() => setIsStorageOpen(false), [setIsStorageOpen]);

  const handleTabResults = useCallback(() => setStorageTab('results'), [setStorageTab]);

  const handleTabReports = useCallback(() => {
    setStorageTab('reports');
    setArchivedReports(getArchivedReports());
  }, [setArchivedReports, setStorageTab]);

  const handleTabDb = useCallback(() => setStorageTab('db'), [setStorageTab]);

  const handleCloseSimDashboard = useCallback(() => setIsSimPanelOpen(false), [setIsSimPanelOpen]);

  const handleClearLogs = useCallback(() => setLogs(['[SYSTEM] Logs cleared.']), [setLogs]);

  const handleForceGraphNodeClick = useCallback(
    (node: object) => {
      setSelectedNode(node as Node);
      setActiveTab('nodes');
      setSidebarOpen(true);
    },
    [setActiveTab, setSelectedNode, setSidebarOpen],
  );

  const handlePaneClick = useCallback(() => setSelectedNode(null), [setSelectedNode]);

  const handleReactFlowNodeClick = useCallback(
    (_: MouseEvent, node: RFNode) => {
      const fullNode = graph.nodes.find((n) => n.id === node.id);
      if (fullNode) {
        setSelectedNode(fullNode);
        setActiveTab('nodes');
        setSidebarOpen(true);
      }
    },
    [graph.nodes, setActiveTab, setSelectedNode, setSidebarOpen],
  );

  const handleCloseDbBrowser = useCallback(() => setShowDbBrowser(null), [setShowDbBrowser]);

  const handleDbBrowserCsvExportLog = useCallback(() => {
    setLogs((prev) => [...prev, '[INFO] DB 스냅샷을 내보냅니다...']);
  }, [setLogs]);

  return useMemo(
    () => ({
      sidebarFrame: {
        onClearGraph: handleClearGraphCompletely,
        onExportGraphJson: handleExportGraphJson,
        onCloseSidebar: handleCloseSidebar,
      },
      aiBuilder: {
        onRequestNewChat: handleRequestNewAiChat,
        onToggleHistory: handleToggleHistoryOpen,
        onRestoreGraphFromHistory: handleRestoreGraphFromHistory,
      },
      agentHelper: {
        onHelperNewChat: handleHelperNewChat,
      },
      mainHeader: {
        onToggleSimPanel: handleToggleSimPanel,
        onToggleStorage: handleToggleStorage,
      },
      canvasToolbar: {
        onOpenSidebar: handleOpenSidebar,
        onAutoLayout: handleAutoLayout,
        onRequestResetGraph: handleRequestResetGraph,
      },
      storage: {
        onClose: handleCloseStoragePanel,
        onTabResults: handleTabResults,
        onTabReports: handleTabReports,
        onTabDb: handleTabDb,
      },
      simDashboard: {
        onClose: handleCloseSimDashboard,
        onClearLogs: handleClearLogs,
      },
      graphViewport: {
        onForceGraphNodeClick: handleForceGraphNodeClick,
        onPaneClick: handlePaneClick,
        onReactFlowNodeClick: handleReactFlowNodeClick,
      },
      dbBrowser: {
        onClose: handleCloseDbBrowser,
        onCsvExport: handleDbBrowserCsvExportLog,
      },
    }),
    [
      handleClearGraphCompletely,
      handleExportGraphJson,
      handleCloseSidebar,
      handleRequestNewAiChat,
      handleToggleHistoryOpen,
      handleRestoreGraphFromHistory,
      handleHelperNewChat,
      handleToggleSimPanel,
      handleToggleStorage,
      handleOpenSidebar,
      handleAutoLayout,
      handleRequestResetGraph,
      handleCloseStoragePanel,
      handleTabResults,
      handleTabReports,
      handleTabDb,
      handleCloseSimDashboard,
      handleClearLogs,
      handleForceGraphNodeClick,
      handlePaneClick,
      handleReactFlowNodeClick,
      handleCloseDbBrowser,
      handleDbBrowserCsvExportLog,
    ],
  );
};

export type AppWorkflowActionGroups = ReturnType<typeof useAppWorkflowActions>;
