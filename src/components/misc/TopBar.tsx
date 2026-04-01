import React from 'react';
import { 
  Play, 
  Code, 
  Layers, 
  Settings, 
  Download, 
  Maximize2, 
  Minimize2, 
  Terminal,
  Zap,
  Layout,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/ui/utils';

interface TopBarProps {
  viewMode: '2d' | '3d' | 'code';
  setViewMode: (mode: '2d' | '3d' | 'code') => void;
  isSimulating: boolean;
  onRunSimulation: () => void;
  onExportResults: () => void;
  isSimPanelOpen: boolean;
  setIsSimPanelOpen: (open: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  viewMode, 
  setViewMode, 
  isSimulating, 
  onRunSimulation, 
  onExportResults,
  isSimPanelOpen,
  setIsSimPanelOpen
}) => {
  return (
    <header className="h-16 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-6 z-50 sticky top-0">
      <div className="flex items-center gap-6">
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 shadow-inner">
          <ViewButton 
            active={viewMode === '2d'} 
            onClick={() => setViewMode('2d')} 
            icon={<Layout size={16} />} 
            label="2D Graph" 
          />
          <ViewButton 
            active={viewMode === '3d'} 
            onClick={() => setViewMode('3d')} 
            icon={<Layers size={16} />} 
            label="3D Force" 
          />
          <ViewButton 
            active={viewMode === 'code'} 
            onClick={() => setViewMode('code')} 
            icon={<Code size={16} />} 
            label="Python Code" 
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 mr-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Engine</span>
        </div>

        <button 
          onClick={onExportResults}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-sm"
          title="Export Results"
        >
          <Download size={18} />
        </button>
        
        <button 
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-sm"
          title="Settings"
        >
          <Settings size={18} />
        </button>

        <div className="w-px h-6 bg-white/10 mx-2" />

        <button 
          onClick={() => setIsSimPanelOpen(!isSimPanelOpen)}
          className={cn(
            "p-2.5 rounded-xl border transition-all shadow-sm",
            isSimPanelOpen ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
          )}
          title="Toggle Simulation Panel"
        >
          <Terminal size={18} />
        </button>

        <button 
          onClick={onRunSimulation}
          disabled={isSimulating}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg",
            isSimulating 
              ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5" 
              : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20 border border-indigo-400/20"
          )}
        >
          {isSimulating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              Run Simulation
            </>
          )}
        </button>
      </div>
    </header>
  );
};

interface ViewButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const ViewButton: React.FC<ViewButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
      active ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
    )}
  >
    {icon}
    {label}
  </button>
);
