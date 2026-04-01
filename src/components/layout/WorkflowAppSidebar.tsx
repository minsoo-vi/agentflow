import React from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  Cpu,
  Download,
  HelpCircle,
  Layers,
  Minimize2,
  Play,
  Send,
  Trash2,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/ui/utils';

export type SidebarTab = 'chat' | 'helper' | 'nodes' | 'code';

export type WorkflowAppSidebarProps = {
  sidebarOpen: boolean;
  activeTab: SidebarTab;
  onActiveTabChange: (tab: SidebarTab) => void;
  onRequestClearGraph: () => void;
  onExportGraphJson: () => void;
  onCloseSidebar: () => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  children: React.ReactNode;
};

export const WorkflowAppSidebar = ({
  sidebarOpen,
  activeTab,
  onActiveTabChange,
  onRequestClearGraph,
  onExportGraphJson,
  onCloseSidebar,
  onRunSimulation,
  isSimulating,
  children,
}: WorkflowAppSidebarProps) => (
  <motion.div
    initial={false}
    animate={{ width: sidebarOpen ? 400 : 0 }}
    className="border-r border-white/10 bg-[#111] flex flex-col relative z-20"
  >
    <div className="p-4 border-b border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Cpu className="text-indigo-500" />
        <span className="font-bold tracking-tight text-lg">AgentFlow</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onRequestClearGraph}
          className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded transition-colors"
          title="그래프 초기화"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          onClick={onExportGraphJson}
          className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded transition-colors"
          title="JSON 내보내기"
        >
          <Download size={16} />
        </button>
        <button
          type="button"
          onClick={onCloseSidebar}
          className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white"
          aria-label="사이드바 접기"
        >
          <Minimize2 size={18} />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-4 border-b border-white/10">
      <button
        type="button"
        onClick={() => onActiveTabChange('chat')}
        className={cn(
          'p-2.5 text-[11px] font-medium transition-colors',
          activeTab === 'chat'
            ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
            : 'text-gray-400 hover:text-white',
        )}
        aria-pressed={activeTab === 'chat'}
        aria-label="AI 빌더 탭"
      >
        <div className="flex flex-col items-center justify-center gap-0.5">
          <Send size={14} /> <span className="leading-tight text-center">AI 빌더</span>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onActiveTabChange('helper')}
        className={cn(
          'p-2.5 text-[11px] font-medium transition-colors',
          activeTab === 'helper'
            ? 'bg-teal-500/10 text-teal-400 border-b-2 border-teal-500'
            : 'text-gray-400 hover:text-white',
        )}
        aria-pressed={activeTab === 'helper'}
        aria-label="에이전트 만들기 도움말 탭"
      >
        <div className="flex flex-col items-center justify-center gap-0.5">
          <HelpCircle size={14} /> <span className="leading-tight text-center">헬퍼</span>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onActiveTabChange('nodes')}
        className={cn(
          'p-2.5 text-[11px] font-medium transition-colors',
          activeTab === 'nodes'
            ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
            : 'text-gray-400 hover:text-white',
        )}
        aria-pressed={activeTab === 'nodes'}
        aria-label="노드 편집 탭"
      >
        <div className="flex flex-col items-center justify-center gap-0.5">
          <Layers size={14} /> <span className="leading-tight text-center">노드</span>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onActiveTabChange('code')}
        className={cn(
          'p-2.5 text-[11px] font-medium transition-colors',
          activeTab === 'code'
            ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
            : 'text-gray-400 hover:text-white',
        )}
        aria-pressed={activeTab === 'code'}
        aria-label="코드 탭"
      >
        <div className="flex flex-col items-center justify-center gap-0.5">
          <Code size={14} /> <span className="leading-tight text-center">코드</span>
        </div>
      </button>
    </div>

    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">{children}</div>

    <div className="p-4 border-t border-white/10 bg-[#151515]">
      <button
        type="button"
        onClick={onRunSimulation}
        disabled={isSimulating}
        className={cn(
          'w-full py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all',
          isSimulating
            ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20',
        )}
      >
        {isSimulating ? (
          <>
            <Zap className="animate-pulse" size={18} />
            시뮬레이션 중...
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" />
            워크플로우 시뮬레이션
          </>
        )}
      </button>
    </div>
  </motion.div>
);
