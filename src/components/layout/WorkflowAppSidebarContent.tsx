import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { WorkflowGraph, Node } from '../../types';
import type { AgentFlowHistoryItem } from '../../hooks/app/useAgentFlowPersistence';
import type { HelperChatMessage } from '../../hooks/gemini/useGeminiChatHandlers';
import type { SidebarTab } from '../sidebar/NodesTabPanel';
import { WorkflowAppSidebar } from './WorkflowAppSidebar';
import { AiBuilderTabPanel } from '../sidebar/AiBuilderTabPanel';
import { AgentHelperPanel } from '../sidebar/AgentHelperPanel';
import { NodesTabPanel } from '../sidebar/NodesTabPanel';
import { CodeEditorTabPanel } from '../sidebar/CodeEditorTabPanel';
import type { ChatTurn } from '../../services/gemini/geminiAppServices';
import type { AgentFlowGlobalDb, AgentFlowNodeOutputs } from '../../types/simulation';

export type WorkflowSidebarFrameSlice = {
  sidebarOpen: boolean;
  activeTab: SidebarTab;
  onActiveTabChange: (t: SidebarTab) => void;
  onClearGraph: () => void;
  onExportGraphJson: () => void;
  onCloseSidebar: () => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
};

export type WorkflowAiBuilderSidebarSlice = {
  chatMessages: ChatTurn[];
  prompt: string;
  onPromptChange: (v: string) => void;
  isGenerating: boolean;
  onGenerateFromNl: () => void | Promise<void>;
  onRequestNewChat: () => void;
  history: AgentFlowHistoryItem[];
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  onRestoreGraphFromHistory: (g: WorkflowGraph) => void;
};

export type WorkflowAgentHelperSidebarSlice = {
  helperMessages: HelperChatMessage[];
  helperPrompt: string;
  setHelperPrompt: (v: string) => void;
  onAgentHelperSend: () => void | Promise<void>;
  isHelperGenerating: boolean;
  onHelperNewChat: () => void;
};

export type WorkflowNodesSidebarSlice = {
  activeNode: Node | null;
  graph: WorkflowGraph;
  setSelectedNode: (n: Node | null) => void;
  setGraph: React.Dispatch<React.SetStateAction<WorkflowGraph>>;
  updateNodeLabel: (id: string, label: string) => void;
  updateNodeDescription: (id: string, description: string) => void;
  updateNodeConfig: (id: string, config: Record<string, unknown>) => void;
  ungroupTeam: (teamId: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  globalDB: AgentFlowGlobalDb;
  setGlobalDB: React.Dispatch<React.SetStateAction<AgentFlowGlobalDb>>;
  nodeOutputs: AgentFlowNodeOutputs;
  setNodeOutputs: React.Dispatch<React.SetStateAction<AgentFlowNodeOutputs>>;
  fileContents: Record<string, string>;
  setIsStorageOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDbBrowser: React.Dispatch<React.SetStateAction<string | null>>;
  onDragStart: (e: React.DragEvent, nodeType: string) => void;
};

export type WorkflowCodeSidebarSlice = {
  fileTree: unknown;
  currentFilePath: string;
  setCurrentFilePath: (v: string) => void;
  fileContents: Record<string, string>;
  setFileContents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  generatedCode: string;
  expandedFolders: Set<string>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
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
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatTurn[]>>;
  setGraph: React.Dispatch<React.SetStateAction<WorkflowGraph>>;
};

export type WorkflowAppSidebarContentProps = {
  frame: WorkflowSidebarFrameSlice;
  aiBuilder: WorkflowAiBuilderSidebarSlice;
  agentHelper: WorkflowAgentHelperSidebarSlice;
  nodes: WorkflowNodesSidebarSlice;
  code: WorkflowCodeSidebarSlice;
};

export const WorkflowAppSidebarContent = ({
  frame,
  aiBuilder,
  agentHelper,
  nodes,
  code,
}: WorkflowAppSidebarContentProps) => {
  const {
    sidebarOpen,
    activeTab,
    onActiveTabChange,
    onClearGraph,
    onExportGraphJson,
    onCloseSidebar,
    onRunSimulation,
    isSimulating,
  } = frame;

  return (
    <WorkflowAppSidebar
      sidebarOpen={sidebarOpen}
      activeTab={activeTab}
      onActiveTabChange={onActiveTabChange}
      onRequestClearGraph={onClearGraph}
      onExportGraphJson={onExportGraphJson}
      onCloseSidebar={onCloseSidebar}
      onRunSimulation={onRunSimulation}
      isSimulating={isSimulating}
    >
      <AnimatePresence mode="wait">
        {activeTab === 'chat' && (
          <AiBuilderTabPanel
            chatMessages={aiBuilder.chatMessages}
            prompt={aiBuilder.prompt}
            onPromptChange={aiBuilder.onPromptChange}
            isGenerating={aiBuilder.isGenerating}
            onGenerate={aiBuilder.onGenerateFromNl}
            onRequestNewChat={aiBuilder.onRequestNewChat}
            history={aiBuilder.history}
            isHistoryOpen={aiBuilder.isHistoryOpen}
            onToggleHistory={aiBuilder.onToggleHistory}
            onRestoreGraphFromHistory={aiBuilder.onRestoreGraphFromHistory}
          />
        )}

        {activeTab === 'helper' && (
          <AgentHelperPanel
            key="helper"
            messages={agentHelper.helperMessages}
            input={agentHelper.helperPrompt}
            setInput={agentHelper.setHelperPrompt}
            onSend={agentHelper.onAgentHelperSend}
            isLoading={agentHelper.isHelperGenerating}
            onNewChat={agentHelper.onHelperNewChat}
          />
        )}

        {activeTab === 'nodes' && (
          <NodesTabPanel
            activeNode={nodes.activeNode}
            graph={nodes.graph}
            setSelectedNode={nodes.setSelectedNode}
            setGraph={nodes.setGraph}
            updateNodeLabel={nodes.updateNodeLabel}
            updateNodeDescription={nodes.updateNodeDescription}
            updateNodeConfig={nodes.updateNodeConfig}
            ungroupTeam={nodes.ungroupTeam}
            deleteNode={nodes.deleteNode}
            deleteEdge={nodes.deleteEdge}
            setLogs={nodes.setLogs}
            setActiveTab={onActiveTabChange}
            globalDB={nodes.globalDB}
            setGlobalDB={nodes.setGlobalDB}
            nodeOutputs={nodes.nodeOutputs}
            setNodeOutputs={nodes.setNodeOutputs}
            fileContents={nodes.fileContents}
            setIsStorageOpen={nodes.setIsStorageOpen}
            setShowDbBrowser={nodes.setShowDbBrowser}
            onDragStart={nodes.onDragStart}
          />
        )}

        {activeTab === 'code' && (
          <CodeEditorTabPanel
            fileTree={code.fileTree}
            currentFilePath={code.currentFilePath}
            setCurrentFilePath={code.setCurrentFilePath}
            fileContents={code.fileContents}
            setFileContents={code.setFileContents}
            generatedCode={code.generatedCode}
            expandedFolders={code.expandedFolders}
            setExpandedFolders={code.setExpandedFolders}
            isAddingFile={code.isAddingFile}
            setIsAddingFile={code.setIsAddingFile}
            isAddingFolder={code.isAddingFolder}
            setIsAddingFolder={code.setIsAddingFolder}
            targetFolderPath={code.targetFolderPath}
            setTargetFolderPath={code.setTargetFolderPath}
            newFileName={code.newFileName}
            setNewFileName={code.setNewFileName}
            newFolderName={code.newFolderName}
            setNewFolderName={code.setNewFolderName}
            addFile={code.addFile}
            addFolder={code.addFolder}
            saveCode={code.saveCode}
            deleteFile={code.deleteFile}
            setLogs={code.setLogs}
            setChatMessages={code.setChatMessages}
            setGraph={code.setGraph}
            setActiveTab={onActiveTabChange}
          />
        )}
      </AnimatePresence>
    </WorkflowAppSidebar>
  );
};
