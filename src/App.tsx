import React from 'react';
import { AppGlobalStyles } from './components/app/AppGlobalStyles';
import { DbBrowserModal } from './components/modals/DbBrowserModal';
import { WorkflowAppSidebarContent } from './components/layout/WorkflowAppSidebarContent';
import { WorkflowAppMainColumn } from './components/layout/WorkflowAppMainColumn';
import { useAgentFlowApp } from './hooks/app/useAgentFlowApp';

export default function App() {
  const { sidebarContentProps, mainColumnProps, dbBrowserModalProps } = useAgentFlowApp();

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <WorkflowAppSidebarContent {...sidebarContentProps} />

      <WorkflowAppMainColumn {...mainColumnProps} />

      <AppGlobalStyles />
      <DbBrowserModal {...dbBrowserModalProps} />
    </div>
  );
}
