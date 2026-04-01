import { validateWorkflow } from '../../lib/graph/validation';
import { insertReportBetweenRouterAndEnd } from '../../lib/graph/graphPostprocess';
import { buildAgentHelperPrompt, buildNlWorkflowGenerationPrompt } from '../../lib/prompts/geminiPrompts';
import type { WorkflowGraph } from '../../types';
import { gemini } from './geminiClient';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

const MODEL_ID = 'gemini-3.1-pro-preview';

export type GenerateWorkflowFromNlArgs = {
  userMessage: string;
  /** `setChatMessages` 직전 스냅샷(기존 App 동작과 동일하게 API 맥락 유지) */
  priorChatMessages: ChatTurn[];
  graph: WorkflowGraph;
};

export type GenerateWorkflowFromNlOk = {
  withReport: WorkflowGraph;
  parsed: WorkflowGraph;
};

/** NL로 워크플로 JSON 생성 → 후처리·검증까지. 실패 시 throw */
export const generateWorkflowFromNl = async (
  args: GenerateWorkflowFromNlArgs,
): Promise<GenerateWorkflowFromNlOk> => {
  const { userMessage, priorChatMessages, graph } = args;
  const isRefinement = priorChatMessages.length > 0;
  const currentGraphContext = isRefinement ? `현재 워크플로우 상태: ${JSON.stringify(graph)}` : '';
  const conversationHistory = priorChatMessages.map((m) => `${m.role}: ${m.content}`).join('\n');

  const response = await gemini.models.generateContent({
    model: MODEL_ID,
    contents: buildNlWorkflowGenerationPrompt({
      isRefinement,
      userMessage,
      conversationHistory,
      currentGraphContext,
    }),
    config: {
      responseMimeType: 'application/json',
    },
  });

  const parsed = JSON.parse(response.text ?? '{}') as WorkflowGraph;
  const withReport = insertReportBetweenRouterAndEnd(parsed);

  const validation = validateWorkflow(withReport);
  if (!validation.valid) {
    throw new Error(validation.error || '워크플로우가 올바르지 않습니다.');
  }

  return { withReport, parsed };
};

export type AgentHelperReplyResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'missing_api_key' };

export const generateAgentHelperReply = async (args: {
  priorMessages: ChatTurn[];
  userMessage: string;
}): Promise<AgentHelperReplyResult> => {
  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, reason: 'missing_api_key' };
  }

  const historyForApi = [...args.priorMessages, { role: 'user' as const, content: args.userMessage }]
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await gemini.models.generateContent({
    model: MODEL_ID,
    contents: buildAgentHelperPrompt(historyForApi),
  });

  const text = response.text?.trim() ?? '답변을 생성하지 못했습니다.';
  return { ok: true, text };
};
