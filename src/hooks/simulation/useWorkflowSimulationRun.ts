import { useCallback } from 'react';
import {
  runWorkflowSimulation,
  type RunWorkflowSimulationParams,
} from '../../services/simulation/workflowSimulationRunner';

export const useWorkflowSimulationRun = ({
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
}: RunWorkflowSimulationParams) => {
  const runSimulation = useCallback(() => {
    void runWorkflowSimulation({
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
  }, [
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
  ]);

  return { runSimulation };
};
