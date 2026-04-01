import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { WorkflowGraph } from '../../types';

const STORAGE_KEYS = {
  graph: 'agentflow_graph',
  history: 'agentflow_history',
  fileTree: 'agentflow_filetree',
  fileContents: 'agentflow_filecontents',
} as const;

export type AgentFlowHistoryItem = {
  timestamp: string;
  graph: WorkflowGraph;
  prompt: string;
};

type UseAgentFlowPersistenceArgs = {
  graph: WorkflowGraph;
  setGraph: Dispatch<SetStateAction<WorkflowGraph>>;
  history: AgentFlowHistoryItem[];
  setHistory: Dispatch<SetStateAction<AgentFlowHistoryItem[]>>;
  fileTree: unknown;
  setFileTree: Dispatch<SetStateAction<unknown>>;
  fileContents: Record<string, string>;
  setFileContents: Dispatch<SetStateAction<Record<string, string>>>;
};

/** 마운트 시 localStorage에서 복원하고, 변경 시 다시 저장합니다. */
export const useAgentFlowPersistence = ({
  graph,
  setGraph,
  history,
  setHistory,
  fileTree,
  setFileTree,
  fileContents,
  setFileContents,
}: UseAgentFlowPersistenceArgs) => {
  useEffect(() => {
    const savedGraph = localStorage.getItem(STORAGE_KEYS.graph);
    const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
    const savedFileTree = localStorage.getItem(STORAGE_KEYS.fileTree);
    const savedFileContents = localStorage.getItem(STORAGE_KEYS.fileContents);

    if (savedGraph) {
      try {
        setGraph(JSON.parse(savedGraph) as WorkflowGraph);
      } catch (e) {
        console.error('Failed to load graph', e);
      }
    }
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory) as AgentFlowHistoryItem[]);
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
    if (savedFileTree) {
      try {
        setFileTree(JSON.parse(savedFileTree));
      } catch (e) {
        console.error('Failed to load file tree', e);
      }
    }
    if (savedFileContents) {
      try {
        setFileContents(JSON.parse(savedFileContents) as Record<string, string>);
      } catch (e) {
        console.error('Failed to load file contents', e);
      }
    }
  }, [setGraph, setHistory, setFileTree, setFileContents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.graph, JSON.stringify(graph));
  }, [graph]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fileTree, JSON.stringify(fileTree));
  }, [fileTree]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fileContents, JSON.stringify(fileContents));
  }, [fileContents]);
};
