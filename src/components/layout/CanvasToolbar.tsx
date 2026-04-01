import React from 'react';
import { Layers, Layout, Maximize2, Zap } from 'lucide-react';

export type CanvasToolbarProps = {
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  viewMode: '2d' | '3d';
  selectedNodeCount: number;
  onGroupAsTeam: () => void;
  onAutoLayout: () => void;
  onRequestResetGraph: () => void;
};

export const CanvasToolbar = ({
  sidebarOpen,
  onOpenSidebar,
  viewMode,
  selectedNodeCount,
  onGroupAsTeam,
  onAutoLayout,
  onRequestResetGraph,
}: CanvasToolbarProps) => (
  <div className="absolute top-20 left-6 z-10 flex items-center gap-2">
    {!sidebarOpen && (
      <button
        type="button"
        onClick={onOpenSidebar}
        className="p-2 bg-[#111] border border-white/10 rounded-lg hover:bg-white/5 transition-colors shadow-xl"
        aria-label="사이드바 열기"
      >
        <Maximize2 size={18} />
      </button>
    )}
    {viewMode === '2d' && (
      <div className="flex items-center gap-2">
        {selectedNodeCount > 1 && (
          <button
            type="button"
            onClick={onGroupAsTeam}
            className="p-2 bg-pink-600 border border-pink-500/50 rounded-lg hover:bg-pink-700 transition-colors text-white flex items-center gap-2 px-3 animate-in fade-in slide-in-from-left-2 shadow-xl"
            title="선택한 노드를 팀으로 그룹화"
          >
            <Layers size={18} />
            <span className="text-xs font-bold">팀 그룹화</span>
          </button>
        )}
        <button
          type="button"
          onClick={onAutoLayout}
          className="p-2 bg-[#111] border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white flex items-center gap-2 px-3 shadow-xl"
          title="자동 레이아웃"
        >
          <Layout size={18} />
          <span className="text-xs font-bold">자동 정렬</span>
        </button>
        <button
          type="button"
          onClick={onRequestResetGraph}
          className="p-2 bg-[#111] border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-red-400 hover:text-red-300 flex items-center gap-2 px-3 shadow-xl"
          title="초기화"
        >
          <Zap size={18} />
          <span className="text-xs font-bold">초기화</span>
        </button>
      </div>
    )}
  </div>
);
