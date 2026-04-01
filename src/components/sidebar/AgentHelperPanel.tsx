import React from 'react';
import { HelpCircle, Send, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/ui/utils';

export type AgentHelperMessage = { role: 'user' | 'assistant'; content: string };

interface AgentHelperPanelProps {
  messages: AgentHelperMessage[];
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onNewChat: () => void;
}

const SUGGESTIONS: string[] = [
  '역할 하나로 agent를 쪼개는 기준을 정리해줘',
  'agent 노드의 systemInstruction을 잘 쓰는 팁 알려줘',
  '내 목적에 맞는 skills 조합은 어떻게 고르면 돼?',
  'RAG용 agent를 만들 때 retrieve 뒤에 뭘 신경 써야 해?',
  '비평가 agent를 잘 붙이려면 흐름·라벨을 어떻게 잡아?',
];

export const AgentHelperPanel: React.FC<AgentHelperPanelProps> = ({
  messages,
  input,
  setInput,
  onSend,
  isLoading,
  onNewChat,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  return (
    <motion.div
      key="helper"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col"
    >
      <div className="mb-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 flex gap-3">
        <div
          className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/30 flex-shrink-0"
          aria-hidden
        >
          <HelpCircle className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-teal-200">에이전트 헬퍼</h3>
          <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">
            AgentFlow에서 <span className="text-gray-300">에이전트를 잘 만드는 방법</span>을 돕습니다. 역할
            설계, 프롬프트(systemInstruction), 스킬·흐름 선택, RAG·멀티 에이전트 구성까지 질문해 보세요.
            그래프 자동 생성은 AI 빌더 탭을 쓰면 됩니다.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 mb-4 min-h-[120px]">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-[11px] text-gray-500">
              에이전트 설계·튜닝에 쓸 만한 예시입니다. 눌러서 수정해 보내도 됩니다.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSuggestionClick(s);
                    }
                  }}
                  className="text-left p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all text-[11px] text-gray-400"
                  aria-label={`예시 질문 넣기: ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[90%] p-3 rounded-2xl text-xs shadow-sm whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-teal-700 text-white rounded-tr-none'
                      : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                  <span
                    className="w-1.5 h-1.5 bg-teal-500/80 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-teal-500/80 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-teal-500/80 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="agent-helper-input" className="sr-only">
            에이전트 만들기 도움말 질문 입력
          </label>
          <textarea
            id="agent-helper-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 요약 전용 agent의 systemInstruction 초안을 짜줘"
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-12 text-xs focus:outline-none focus:border-teal-500/60 resize-none custom-scrollbar"
            aria-label="에이전트 설계·튜닝 질문"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            className="absolute bottom-3 right-3 p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
            aria-label="질문 보내기"
          >
            <Send size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={onNewChat}
            className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1.5 transition-colors"
            aria-label="헬퍼 대화 초기화"
          >
            <PlusCircle size={12} /> 새 대화
          </button>
        </div>
      </div>
    </motion.div>
  );
};
