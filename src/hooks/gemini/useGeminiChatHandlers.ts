import { useState, type Dispatch, type SetStateAction } from 'react';
import type { WorkflowGraph } from '../../types';
import {
  generateWorkflowFromNl,
  generateAgentHelperReply,
  type ChatTurn,
} from '../../services/gemini/geminiAppServices';
import type { AgentFlowHistoryItem } from '../app/useAgentFlowPersistence';

export type HelperChatMessage = { role: 'user' | 'assistant'; content: string };

type UseGeminiChatHandlersArgs = {
  graph: WorkflowGraph;
  setGraph: Dispatch<SetStateAction<WorkflowGraph>>;
  setLogs: Dispatch<SetStateAction<string[]>>;
  calculateLayout: (nextGraph: WorkflowGraph, force?: boolean) => void;
  setHistory: Dispatch<SetStateAction<AgentFlowHistoryItem[]>>;
};

export const useGeminiChatHandlers = ({
  graph,
  setGraph,
  setLogs,
  calculateLayout,
  setHistory,
}: UseGeminiChatHandlersArgs) => {
  const [prompt, setPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatTurn[]>([]);
  const [helperMessages, setHelperMessages] = useState<HelperChatMessage[]>([]);
  const [helperPrompt, setHelperPrompt] = useState('');
  const [isHelperGenerating, setIsHelperGenerating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateFromNL = async () => {
    if (!prompt.trim()) return;

    const userMessage = prompt.trim();
    const priorChatMessages = chatMessages;
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setPrompt('');
    setIsGenerating(true);
    setLogs((prev) => [...prev, `[AI] 워크플로우 생성/수정 중: "${userMessage}"`]);

    try {
      const { withReport, parsed } = await generateWorkflowFromNl({
        userMessage,
        priorChatMessages,
        graph,
      });

      setGraph(withReport);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '워크플로우를 업데이트했습니다. 그래프를 확인해주세요.' },
      ]);

      const newHistoryItem = {
        timestamp: new Date().toISOString(),
        prompt: userMessage,
        graph: withReport,
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
      setLogs((prev) => {
        const next = [...prev, '[SYSTEM] 워크플로우가 성공적으로 업데이트되었습니다.'];
        if (withReport.nodes.length !== parsed.nodes.length) {
          next.push(
            '[SYSTEM] 라우터→종료 직결을 보완하기 위해 「최종 보고서」 노드를 자동 삽입했습니다.',
          );
        }
        return next;
      });

      setTimeout(() => {
        calculateLayout(withReport, true);
      }, 100);
    } catch (error) {
      console.error('Generation error:', error);
      setLogs((prev) => [
        ...prev,
        `[ERROR] 생성 실패: ${error instanceof Error ? error.message : String(error)}`,
      ]);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '죄송합니다. 워크플로우 생성 중 오류가 발생했습니다.',
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAgentHelperSend = async () => {
    if (!helperPrompt.trim()) return;
    const userMessage = helperPrompt.trim();
    const priorMessages = helperMessages;
    setHelperMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setHelperPrompt('');
    setIsHelperGenerating(true);
    try {
      const result = await generateAgentHelperReply({ priorMessages, userMessage });
      if (!result.ok) {
        setHelperMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'GEMINI_API_KEY가 없어 답변을 생성할 수 없습니다. 프로젝트 루트의 .env에 키를 설정한 뒤 다시 시도해 주세요.',
          },
        ]);
        return;
      }
      setHelperMessages((prev) => [...prev, { role: 'assistant', content: result.text }]);
    } catch (error) {
      console.error('Agent helper error:', error);
      setHelperMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        },
      ]);
    } finally {
      setIsHelperGenerating(false);
    }
  };

  return {
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
  };
};
