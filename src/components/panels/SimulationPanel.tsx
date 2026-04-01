import React from 'react';
import { 
  Terminal, 
  X, 
  Trash2, 
  Download, 
  Check, 
  Cpu, 
  Zap, 
  History, 
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/ui/utils';

interface SimulationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  simulationResults: any;
  isSimulating: boolean;
  onExportResults: () => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onRunSimulation: () => void;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({ 
  isOpen, 
  onClose, 
  logs, 
  setLogs, 
  simulationResults, 
  isSimulating,
  onExportResults,
  prompt,
  setPrompt,
  onRunSimulation
}) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      className="w-[450px] border-l border-white/10 bg-[#0a0a0a] flex flex-col h-full z-50 shadow-2xl"
    >
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Terminal size={16} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Execution Engine</h2>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Real-time Simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLogs([])}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
            title="Clear Logs"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-black/40">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Zap size={32} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400">Ready to Simulate</p>
              <p className="text-xs text-gray-600 mt-1">Configure your workflow and click 'Run' to start the execution engine.</p>
            </div>
          </div>
        ) : (
          logs.map((log, i) => (
            <div 
              key={i} 
              className={cn(
                "p-3 rounded-xl border text-xs font-mono leading-relaxed transition-all animate-in fade-in slide-in-from-right-2",
                log.includes('[ERROR]') ? "bg-red-500/10 border-red-500/20 text-red-400" :
                log.includes('[SYSTEM]') ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                log.includes('[RESULT]') ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                log.includes('[SIM]') ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                "bg-white/5 border-white/10 text-gray-300"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-gray-600 mt-0.5 select-none">{i + 1}</span>
                <span className="flex-1 whitespace-pre-wrap">{log}</span>
              </div>
            </div>
          ))
        )}
        <div id="logs-end" />
      </div>

      {simulationResults && (
        <div className="p-5 border-t border-white/10 bg-black/40">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={14} className="text-indigo-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Tokens</span>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">
                {simulationResults.steps.reduce((acc: number, s: any) => acc + s.tokens, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <History size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Latency</span>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">
                {(simulationResults.steps.reduce((acc: number, s: any) => acc + parseFloat(s.latency), 0) / simulationResults.steps.length).toFixed(0)}ms
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 border-t border-white/10 bg-[#0a0a0a]">
        <div className="relative group">
          <input 
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onRunSimulation()}
            placeholder="Initial prompt for simulation..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-4 pr-12 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all group-hover:border-white/20"
          />
          <button 
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
