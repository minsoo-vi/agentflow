import type { Dispatch, SetStateAction, DragEvent, MouseEvent } from 'react';
import type {
  NodeChange,
  EdgeChange,
  Connection,
  Edge as RFEdge,
  Node as RFNode,
} from 'reactflow';
import type { SidebarTab } from '../../components/sidebar/NodesTabPanel';
import type { WorkflowAppSidebarContentProps } from '../../components/layout/WorkflowAppSidebarContent';
import type { WorkflowAppMainColumnProps } from '../../components/layout/WorkflowAppMainColumn';
import type { ArchivedReport } from '../../lib/report/reportArchive';
import type {
  AgentFlowGlobalDb,
  AgentFlowNodeOutputs,
  SimulationResultsSummary,
} from '../../types/simulation';
import type { WorkflowGraph, Node } from '../../types';
import type { ChatTurn } from '../../services/gemini/geminiAppServices';
import type { HelperChatMessage } from '../gemini/useGeminiChatHandlers';
import type { AgentFlowHistoryItem } from './useAgentFlowPersistence';
import type { AppWorkflowActionGroups } from './useAppWorkflowActions';

export type DbBrowserModalBindProps = {
  openNodeId: string | null;
  collectionLabel: string;
  nodeOutput: Record<string, unknown> | undefined;
  onClose: () => void;
  onCsvExport: () => void;
};

export type UseAppWorkflowLayoutParams = {
  appActions: AppWorkflowActionGroups;
  runSimulation: () => void;
  isSimulating: boolean;
  sidebarOpen: boolean;
  activeTab: SidebarTab;
  setActiveTab: Dispatch<SetStateAction<SidebarTab>>;
  chatMessages: ChatTurn[];
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  isGenerating: boolean;
  handleGenerateFromNL: () => void | Promise<void>;
  history: AgentFlowHistoryItem[];
  isHistoryOpen: boolean;
  helperMessages: HelperChatMessage[];
  helperPrompt: string;
  setHelperPrompt: Dispatch<SetStateAction<string>>;
  handleAgentHelperSend: () => void | Promise<void>;
  isHelperGenerating: boolean;
  activeNode: Node | null;
  graph: WorkflowGraph;
  setSelectedNode: Dispatch<SetStateAction<Node | null>>;
  setGraph: Dispatch<SetStateAction<WorkflowGraph>>;
  updateNodeLabel: (id: string, label: string) => void;
  updateNodeDescription: (id: string, description: string) => void;
  updateNodeConfig: (id: string, config: Record<string, unknown>) => void;
  ungroupTeam: (teamId: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setLogs: Dispatch<SetStateAction<string[]>>;
  globalDB: AgentFlowGlobalDb;
  setGlobalDB: Dispatch<SetStateAction<AgentFlowGlobalDb>>;
  nodeOutputs: AgentFlowNodeOutputs;
  setNodeOutputs: Dispatch<SetStateAction<AgentFlowNodeOutputs>>;
  fileContents: Record<string, string>;
  setIsStorageOpen: Dispatch<SetStateAction<boolean>>;
  setShowDbBrowser: Dispatch<SetStateAction<string | null>>;
  onDragStart: (e: DragEvent, nodeType: string) => void;
  fileTree: unknown;
  currentFilePath: string;
  setCurrentFilePath: (v: string) => void;
  setFileContents: Dispatch<SetStateAction<Record<string, string>>>;
  generatedCode: string;
  expandedFolders: Set<string>;
  setExpandedFolders: Dispatch<SetStateAction<Set<string>>>;
  isAddingFile: boolean;
  setIsAddingFile: (v: boolean) => void;
  isAddingFolder: boolean;
  setIsAddingFolder: (v: boolean) => void;
  targetFolderPath: string | null;
  setTargetFolderPath: (v: string | null) => void;
  newFileName: string;
  setNewFileName: (v: string) => void;
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  addFile: () => void;
  addFolder: () => void;
  saveCode: () => void;
  deleteFile: (path: string) => void;
  setChatMessages: Dispatch<SetStateAction<ChatTurn[]>>;
  viewMode: '2d' | '3d';
  setViewMode: Dispatch<SetStateAction<'2d' | '3d'>>;
  isSimPanelOpen: boolean;
  isStorageOpen: boolean;
  activeNodeId: string | null;
  selectedNodes: string[];
  groupAsTeam: () => void;
  storageTab: 'results' | 'db' | 'reports';
  exportResults: () => void;
  handleGlobalStorageTrash: () => void;
  archivedReports: ArchivedReport[];
  logs: string[];
  simulationResults: SimulationResultsSummary | null;
  forceData: { nodes: object[]; links: object[] };
  rfNodes: RFNode[];
  rfEdges: RFEdge[];
  onNodesChange: (c: NodeChange[]) => void;
  onEdgesChange: (c: EdgeChange[]) => void;
  onConnect: (p: Connection) => void;
  onNodeDragStop: (e: MouseEvent, node: RFNode) => void;
  onSelectionChange: (sel: { nodes: RFNode[]; edges: RFEdge[] }) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  showDbBrowser: string | null;
};

/** 사이드바·메인 컬럼·DB 모달에 넘길 props를 한곳에서 조립합니다. */
export const buildAppWorkflowLayoutProps = (
  p: UseAppWorkflowLayoutParams,
): {
  sidebarContentProps: WorkflowAppSidebarContentProps;
  mainColumnProps: WorkflowAppMainColumnProps;
  dbBrowserModalProps: DbBrowserModalBindProps;
} => {
  const sidebarContentProps: WorkflowAppSidebarContentProps = {
    frame: {
      sidebarOpen: p.sidebarOpen,
      activeTab: p.activeTab,
      onActiveTabChange: p.setActiveTab,
      ...p.appActions.sidebarFrame,
      onRunSimulation: p.runSimulation,
      isSimulating: p.isSimulating,
    },
    aiBuilder: {
      chatMessages: p.chatMessages,
      prompt: p.prompt,
      onPromptChange: p.setPrompt,
      isGenerating: p.isGenerating,
      onGenerateFromNl: p.handleGenerateFromNL,
      ...p.appActions.aiBuilder,
      history: p.history,
      isHistoryOpen: p.isHistoryOpen,
    },
    agentHelper: {
      helperMessages: p.helperMessages,
      helperPrompt: p.helperPrompt,
      setHelperPrompt: p.setHelperPrompt,
      onAgentHelperSend: p.handleAgentHelperSend,
      isHelperGenerating: p.isHelperGenerating,
      ...p.appActions.agentHelper,
    },
    nodes: {
      activeNode: p.activeNode,
      graph: p.graph,
      setSelectedNode: p.setSelectedNode,
      setGraph: p.setGraph,
      updateNodeLabel: p.updateNodeLabel,
      updateNodeDescription: p.updateNodeDescription,
      updateNodeConfig: p.updateNodeConfig,
      ungroupTeam: p.ungroupTeam,
      deleteNode: p.deleteNode,
      deleteEdge: p.deleteEdge,
      setLogs: p.setLogs,
      globalDB: p.globalDB,
      setGlobalDB: p.setGlobalDB,
      nodeOutputs: p.nodeOutputs,
      setNodeOutputs: p.setNodeOutputs,
      fileContents: p.fileContents,
      setIsStorageOpen: p.setIsStorageOpen,
      setShowDbBrowser: p.setShowDbBrowser,
      onDragStart: p.onDragStart,
    },
    code: {
      fileTree: p.fileTree,
      currentFilePath: p.currentFilePath,
      setCurrentFilePath: p.setCurrentFilePath,
      fileContents: p.fileContents,
      setFileContents: p.setFileContents,
      generatedCode: p.generatedCode,
      expandedFolders: p.expandedFolders,
      setExpandedFolders: p.setExpandedFolders,
      isAddingFile: p.isAddingFile,
      setIsAddingFile: p.setIsAddingFile,
      isAddingFolder: p.isAddingFolder,
      setIsAddingFolder: p.setIsAddingFolder,
      targetFolderPath: p.targetFolderPath,
      setTargetFolderPath: p.setTargetFolderPath,
      newFileName: p.newFileName,
      setNewFileName: p.setNewFileName,
      newFolderName: p.newFolderName,
      setNewFolderName: p.setNewFolderName,
      addFile: p.addFile,
      addFolder: p.addFolder,
      saveCode: p.saveCode,
      deleteFile: p.deleteFile,
      setLogs: p.setLogs,
      setChatMessages: p.setChatMessages,
      setGraph: p.setGraph,
    },
  };

  const mainColumnProps: WorkflowAppMainColumnProps = {
    header: {
      viewMode: p.viewMode,
      onViewModeChange: p.setViewMode,
      isSimPanelOpen: p.isSimPanelOpen,
      isStorageOpen: p.isStorageOpen,
      onRunSimulation: p.runSimulation,
      simulationRunEnabled: p.activeNodeId === null,
      ...p.appActions.mainHeader,
    },
    canvasToolbar: {
      sidebarOpen: p.sidebarOpen,
      viewMode: p.viewMode,
      selectedNodeCount: p.selectedNodes.length,
      onGroupAsTeam: p.groupAsTeam,
      ...p.appActions.canvasToolbar,
    },
    storage: {
      isOpen: p.isStorageOpen,
      storageTab: p.storageTab,
      onExportResults: p.exportResults,
      onTrash: p.handleGlobalStorageTrash,
      nodeOutputs: p.nodeOutputs,
      graph: p.graph,
      archivedReports: p.archivedReports,
      globalDB: p.globalDB,
      ...p.appActions.storage,
    },
    simDashboard: {
      isOpen: p.isSimPanelOpen,
      logs: p.logs,
      isSimulating: p.isSimulating,
      simulationResults: p.simulationResults,
      ...p.appActions.simDashboard,
    },
    graphViewport: {
      viewMode: p.viewMode,
      forceData: p.forceData,
      rfNodes: p.rfNodes,
      rfEdges: p.rfEdges,
      onNodesChange: p.onNodesChange,
      onEdgesChange: p.onEdgesChange,
      onConnect: p.onConnect,
      onNodeDragStop: p.onNodeDragStop,
      onSelectionChange: p.onSelectionChange,
      onDragOver: p.onDragOver,
      onDrop: p.onDrop,
      ...p.appActions.graphViewport,
    },
    executionLogs: { logs: p.logs },
  };

  const dbBrowserModalProps: DbBrowserModalBindProps = {
    openNodeId: p.showDbBrowser,
    collectionLabel:
      p.graph.nodes.find((n) => n.id === p.showDbBrowser)?.config?.collection || 'default',
    nodeOutput: p.showDbBrowser
      ? (p.nodeOutputs[p.showDbBrowser] as Record<string, unknown> | undefined)
      : undefined,
    onClose: p.appActions.dbBrowser.onClose,
    onCsvExport: p.appActions.dbBrowser.onCsvExport,
  };

  return { sidebarContentProps, mainColumnProps, dbBrowserModalProps };
};
