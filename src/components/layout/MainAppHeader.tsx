import React from 'react';
import { HardDrive, Play, Terminal, Zap } from 'lucide-react';
import { cn } from '../../lib/ui/utils';

export type MainAppHeaderProps = {
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  isSimPanelOpen: boolean;
  onToggleSimPanel: () => void;
  isStorageOpen: boolean;
  onToggleStorage: () => void;
  onRunSimulation: () => void;
  simulationRunEnabled: boolean;
};

export const MainAppHeader = ({
  viewMode,
  onViewModeChange,
  isSimPanelOpen,
  onToggleSimPanel,
  isStorageOpen,
  onToggleStorage,
  onRunSimulation,
  simulationRunEnabled,
}: MainAppHeaderProps) => (
  <div className="h-14 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 z-20">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">
            AgentFlow <span className="text-indigo-500 font-normal">v2.0</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">AI Workflow Builder</p>
        </div>
      </div>
      <div className="h-6 w-[1px] bg-white/10 mx-2" />
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
        <button
          type="button"
          onClick={() => onViewModeChange('2d')}
          className={cn(
            'px-3 py-1 rounded-md text-[11px] font-bold transition-all',
            viewMode === '2d'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-gray-400 hover:text-white',
          )}
        >
          2D 에디터
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('3d')}
          className={cn(
            'px-3 py-1 rounded-md text-[11px] font-bold transition-all',
            viewMode === '3d'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-gray-400 hover:text-white',
          )}
        >
          3D 그래프
        </button>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToggleSimPanel}
        className={cn(
          'flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-[11px] transition-all border uppercase tracking-wider',
          isSimPanelOpen
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10',
        )}
      >
        <Terminal size={14} />
        시뮬레이션
      </button>
      <button
        type="button"
        onClick={onToggleStorage}
        className={cn(
          'flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-[11px] transition-all border uppercase tracking-wider',
          isStorageOpen
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10',
        )}
      >
        <HardDrive size={14} />
        글로벌 저장소
      </button>
      <div className="h-6 w-[1px] bg-white/10 mx-1" />
      <button
        type="button"
        onClick={onRunSimulation}
        disabled={!simulationRunEnabled}
        className="flex items-center gap-2 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-[11px] transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-wider"
      >
        <Play size={14} fill="currentColor" />
        실행하기
      </button>
    </div>
  </div>
);
