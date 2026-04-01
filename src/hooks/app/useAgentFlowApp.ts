import { buildAppWorkflowLayoutProps } from './appWorkflowLayoutProps';
import { useAgentFlowWorkspace } from './useAgentFlowWorkspace';

export type AgentFlowAppLayout = ReturnType<typeof buildAppWorkflowLayoutProps>;

/** 워크스페이스 상태 → 사이드바·메인·DB 모달 props. */
export const useAgentFlowApp = (): AgentFlowAppLayout =>
  buildAppWorkflowLayoutProps(useAgentFlowWorkspace());
