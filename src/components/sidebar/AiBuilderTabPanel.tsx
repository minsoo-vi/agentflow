import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  History,
  PlusCircle,
  Send,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/ui/utils';
import type { WorkflowGraph } from '../../types';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type GraphHistoryItem = {
  timestamp: string;
  prompt: string;
  graph: WorkflowGraph;
};

export type AiBuilderTabPanelProps = {
  chatMessages: ChatMessage[];
  prompt: string;
  onPromptChange: (value: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onRequestNewChat: () => void;
  history: GraphHistoryItem[];
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  onRestoreGraphFromHistory: (graph: WorkflowGraph) => void;
};

export const AiBuilderTabPanel = ({
  chatMessages,
  prompt,
  onPromptChange,
  isGenerating,
  onGenerate,
  onRequestNewChat,
  history,
  isHistoryOpen,
  onToggleHistory,
  onRestoreGraphFromHistory,
}: AiBuilderTabPanelProps) => (
  <motion.div
    key="chat"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="h-full flex flex-col"
  >
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 mb-4">
      {chatMessages.length === 0 ? (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center space-y-4">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto">
            <Zap size={24} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">AI 워크플로우 빌더</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              구축하고 싶은 에이전트 워크플로우를 설명해주세요. 그래프와 LangGraph 코드를 생성해 드립니다.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-2">
            {[
              '검색 도구를 사용하는 리서치 에이전트 만들어줘',
              '비평가가 있는 멀티 에이전트 팀 구성해줘',
              '데이터베이스에 결과를 저장하는 워크플로우',
            ].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onPromptChange(t)}
                className="text-left p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-[11px] text-gray-400"
              >
                &quot;{t}&quot;
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] p-3 rounded-2xl text-xs shadow-sm',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5',
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
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
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onGenerate();
            }
          }}
          placeholder="워크플로우를 설명하거나 수정을 요청하세요..."
          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-12 text-xs focus:outline-none focus:border-indigo-500 h-20 resize-none custom-scrollbar"
        />
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
          aria-label="생성"
        >
          <Send size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onRequestNewChat}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <PlusCircle size={12} /> 새 대화
        </button>
        <button
          type="button"
          onClick={onToggleHistory}
          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
        >
          <History size={12} /> 히스토리 ({history.length})
        </button>
      </div>
    </div>

    {isHistoryOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="mt-4 pt-4 border-t border-white/5 space-y-2 overflow-hidden"
      >
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">생성 히스토리</h3>
        <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2">
          {history.map((item, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => onRestoreGraphFromHistory(item.graph)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRestoreGraphFromHistory(item.graph);
                }
              }}
              className="bg-white/5 p-2.5 rounded-lg border border-white/5 hover:border-indigo-500/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-indigo-400 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-gray-300 line-clamp-1">{item.prompt}</p>
            </div>
          ))}
        </div>
      </motion.div>
    )}
  </motion.div>
);
