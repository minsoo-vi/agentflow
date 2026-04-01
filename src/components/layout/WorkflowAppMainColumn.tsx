import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { ArchivedReport } from '../../lib/report/reportArchive';
import type { AgentFlowGlobalDb, AgentFlowNodeOutputs, SimulationResultsSummary } from '../../types/simulation';
import type { WorkflowGraph } from '../../types';
import { MainAppHeader } from './MainAppHeader';
import { CanvasToolbar } from './CanvasToolbar';
import { GlobalStoragePanel } from '../panels/GlobalStoragePanel';
import { SimulationDashboardPanel } from '../panels/SimulationDashboardPanel';
import { WorkflowGraphViewport } from '../graph/WorkflowGraphViewport';
import { ExecutionLogsPanel } from '../panels/ExecutionLogsPanel';
import type {
  Node as RFNode,
  Edge as RFEdge,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow';

export type WorkflowMainHeaderSlice = {
  viewMode: '2d' | '3d';
  onViewModeChange: (m: '2d' | '3d') => void;
  isSimPanelOpen: boolean;
  onToggleSimPanel: () => void;
  isStorageOpen: boolean;
  onToggleStorage: () => void;
  onRunSimulation: () => void;
  simulationRunEnabled: boolean;
};

export type WorkflowMainToolbarSlice = {
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  viewMode: '2d' | '3d';
  selectedNodeCount: number;
  onGroupAsTeam: () => void;
  onAutoLayout: () => void;
  onRequestResetGraph: () => void;
};

export type WorkflowGlobalStorageSlice = {
  isOpen: boolean;
  onClose: () => void;
  storageTab: 'results' | 'db' | 'reports';
  onTabResults: () => void;
  onTabReports: () => void;
  onTabDb: () => void;
  onExportResults: () => void;
  onTrash: () => void;
  nodeOutputs: Record<string, any>;
  graph: WorkflowGraph;
  archivedReports: ArchivedReport[];
  globalDB: Record<string, any[]>;
};

export type WorkflowSimDashboardSlice = {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
  isSimulating: boolean;
  simulationResults: SimulationResultsSummary | null;
  onClearLogs: () => void;
};

export type WorkflowGraphViewportSlice = {
  viewMode: '2d' | '3d';
  forceData: { nodes: object[]; links: object[] };
  onForceGraphNodeClick: (node: object) => void;
  rfNodes: RFNode[];
  rfEdges: RFEdge[];
  onNodesChange: (c: NodeChange[]) => void;
  onEdgesChange: (c: EdgeChange[]) => void;
  onConnect: (p: Connection) => void;
  onNodeDragStop: (e: React.MouseEvent, node: RFNode) => void;
  onPaneClick: () => void;
  onReactFlowNodeClick: (_: React.MouseEvent, node: RFNode) => void;
  onSelectionChange: (sel: { nodes: RFNode[]; edges: RFEdge[] }) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
};

export type WorkflowExecutionLogsSlice = {
  logs: string[];
};

export type WorkflowAppMainColumnProps = {
  header: WorkflowMainHeaderSlice;
  canvasToolbar: WorkflowMainToolbarSlice;
  storage: WorkflowGlobalStorageSlice;
  simDashboard: WorkflowSimDashboardSlice;
  graphViewport: WorkflowGraphViewportSlice;
  executionLogs: WorkflowExecutionLogsSlice;
};

export const WorkflowAppMainColumn = ({
  header,
  canvasToolbar,
  storage,
  simDashboard,
  graphViewport,
  executionLogs,
}: WorkflowAppMainColumnProps) => {
  return (
    <div className="flex-1 relative flex flex-col overflow-hidden">
      <MainAppHeader {...header} />

      <CanvasToolbar {...canvasToolbar} />

      <AnimatePresence>
        {storage.isOpen && (
          <GlobalStoragePanel
            key="global-storage"
            onClose={storage.onClose}
            storageTab={storage.storageTab}
            onTabResults={storage.onTabResults}
            onTabReports={storage.onTabReports}
            onTabDb={storage.onTabDb}
            onExportResults={storage.onExportResults}
            onTrash={storage.onTrash}
            nodeOutputs={storage.nodeOutputs}
            graph={storage.graph}
            archivedReports={storage.archivedReports}
            globalDB={storage.globalDB}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {simDashboard.isOpen && (
          <SimulationDashboardPanel
            key="sim-dashboard"
            logs={simDashboard.logs}
            isSimulating={simDashboard.isSimulating}
            simulationResults={simDashboard.simulationResults}
            onClose={simDashboard.onClose}
            onClearLogs={simDashboard.onClearLogs}
          />
        )}
      </AnimatePresence>

      <WorkflowGraphViewport {...graphViewport} />

      <ExecutionLogsPanel logs={executionLogs.logs} />
    </div>
  );
};
