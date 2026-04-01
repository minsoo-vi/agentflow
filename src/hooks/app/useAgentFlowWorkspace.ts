import { useState, useMemo } from 'react';
import { INITIAL_GRAPH } from '../../constants';
import type { WorkflowGraph, Node } from '../../types';
import { useAgentFlowPersistence, type AgentFlowHistoryItem } from './useAgentFlowPersistence';
import { useSimulationStorageState } from '../simulation/useSimulationStorageState';
import { useCodeProjectState } from '../project/useCodeProjectState';
import { useGeminiChatHandlers } from '../gemini/useGeminiChatHandlers';
import { useLogsScrollToEnd } from '../ui/useLogsScrollToEnd';
import { useWorkflowGraphDerivedViews } from '../graph/useWorkflowGraphDerivedViews';
import { useWorkflowGraphMutations } from '../graph/useWorkflowGraphMutations';
import { useWorkflowSimulationRun } from '../simulation/useWorkflowSimulationRun';
import { useAppWorkflowActions } from './useAppWorkflowActions';
import type { UseAppWorkflowLayoutParams } from './appWorkflowLayoutProps';

export type AgentFlowWorkspace = UseAppWorkflowLayoutParams;

/**
 * 그래프·코드·시뮬·Gemini·캔버스·액션을 묶은 워크스페이스 상태 (`buildAppWorkflowLayoutProps` 인자로 그대로 사용).
 */
export const useAgentFlowWorkspace = (): AgentFlowWorkspace => {
  const [graph, setGraph] = useState<WorkflowGraph>(INITIAL_GRAPH);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'helper' | 'nodes' | 'code'>('chat');
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const activeNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNode?.id) || null,
    [graph.nodes, selectedNode],
  );
  const selectedNodeId = selectedNode?.id;

  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] AgentFlow initialized.',
    '[INFO] Graph structure loaded.',
  ]);

  const sim = useSimulationStorageState(setLogs);
  const {
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
  } = sim;

  const code = useCodeProjectState({
    graph,
    selectedNodeId,
    setLogs,
  });

  const canvas = useWorkflowGraphMutations({
    graph,
    setGraph,
    setSelectedNode,
    setLogs,
    editorSync: {
      setFileContents: code.setFileContents,
      setGeneratedCode: code.setGeneratedCode,
      setCurrentFilePath: code.setCurrentFilePath,
    },
  });

  const {
    fileContents,
    setFileContents,
    generatedCode,
    fileTree,
    setFileTree,
    currentFilePath,
    setCurrentFilePath,
    expandedFolders,
    setExpandedFolders,
    isAddingFile,
    setIsAddingFile,
    isAddingFolder,
    setIsAddingFolder,
    targetFolderPath,
    setTargetFolderPath,
    newFileName,
    setNewFileName,
    newFolderName,
    setNewFolderName,
    addFile,
    addFolder,
    deleteFile,
    saveCode,
  } = code;

  const {
    selectedNodes,
    selectedEdges,
    calculateLayout,
    onNodesChange,
    onNodeDragStop,
    onEdgesChange,
    onSelectionChange,
    groupAsTeam,
    ungroupTeam,
    deleteNode,
    deleteEdge,
    updateNodeLabel,
    updateNodeDescription,
    updateNodeConfig,
    onConnect,
    onDragStart,
    onDragOver,
    onDrop,
  } = canvas;

  const [history, setHistory] = useState<AgentFlowHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useAgentFlowPersistence({
    graph,
    setGraph,
    history,
    setHistory,
    fileTree,
    setFileTree,
    fileContents,
    setFileContents,
  });

  const {
    prompt,
    setPrompt,
    chatMessages,
    setChatMessages,
    helperMessages,
    setHelperMessages,
    helperPrompt,
    setHelperPrompt,
    isHelperGenerating,
    isGenerating,
    handleGenerateFromNL,
    handleAgentHelperSend,
  } = useGeminiChatHandlers({
    graph,
    setGraph,
    setLogs,
    calculateLayout,
    setHistory,
  });

  const [showDbBrowser, setShowDbBrowser] = useState<string | null>(null);

  const { runSimulation } = useWorkflowSimulationRun({
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
  });

  const { rfNodes, rfEdges, forceData } = useWorkflowGraphDerivedViews({
    graph,
    selectedNodes,
    activeNodeId,
    isSimulating,
    nodeOutputs,
    selectedEdges,
  });

  useLogsScrollToEnd(logs);

  const appActions = useAppWorkflowActions({
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
  });

  return {
    appActions,
    runSimulation,
    isSimulating,
    sidebarOpen,
    activeTab,
    setActiveTab,
    chatMessages,
    prompt,
    setPrompt,
    isGenerating,
    handleGenerateFromNL,
    history,
    isHistoryOpen,
    helperMessages,
    helperPrompt,
    setHelperPrompt,
    handleAgentHelperSend,
    isHelperGenerating,
    activeNode,
    graph,
    setSelectedNode,
    setGraph,
    updateNodeLabel,
    updateNodeDescription,
    updateNodeConfig,
    ungroupTeam,
    deleteNode,
    deleteEdge,
    setLogs,
    globalDB,
    setGlobalDB,
    nodeOutputs,
    setNodeOutputs,
    fileContents,
    setIsStorageOpen,
    setShowDbBrowser,
    onDragStart,
    fileTree,
    currentFilePath,
    setCurrentFilePath,
    setFileContents,
    generatedCode,
    expandedFolders,
    setExpandedFolders,
    isAddingFile,
    setIsAddingFile,
    isAddingFolder,
    setIsAddingFolder,
    targetFolderPath,
    setTargetFolderPath,
    newFileName,
    setNewFileName,
    newFolderName,
    setNewFolderName,
    addFile,
    addFolder,
    saveCode,
    deleteFile,
    setChatMessages,
    viewMode,
    setViewMode,
    isSimPanelOpen,
    isStorageOpen,
    activeNodeId,
    selectedNodes,
    groupAsTeam,
    storageTab,
    exportResults,
    handleGlobalStorageTrash,
    archivedReports,
    logs,
    simulationResults,
    forceData,
    rfNodes,
    rfEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
    onSelectionChange,
    onDragOver,
    onDrop,
    showDbBrowser,
  };
};
