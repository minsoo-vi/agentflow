import React from 'react';
import { motion } from 'framer-motion';
import { Play, Terminal, X, Zap } from 'lucide-react';
import { cn } from '../../lib/ui/utils';
import type { SimulationResultsSummary } from '../../types/simulation';

export type { SimulationStepRow, SimulationResultsSummary } from '../../types/simulation';

export type SimulationDashboardPanelProps = {
  logs: string[];
  isSimulating: boolean;
  simulationResults: SimulationResultsSummary | null;
  onClose: () => void;
  onClearLogs: () => void;
};

export const SimulationDashboardPanel = ({
  logs,
  isSimulating,
  simulationResults,
  onClose,
  onClearLogs,
}: SimulationDashboardPanelProps) => (
  <motion.div
    initial={{ opacity: 0, x: 300 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 300 }}
    className="absolute top-20 right-6 bottom-6 w-96 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden"
  >
    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-indigo-600/10">
      <div className="flex items-center gap-2">
        <Play size={16} className="text-indigo-400" fill="currentColor" />
        <span className="text-sm font-bold uppercase tracking-widest text-white">시뮬레이션 대시보드</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-500 hover:text-white transition-colors"
        aria-label="닫기"
      >
        <X size={18} />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
      <div className="bg-black/40 rounded-xl border border-white/10 flex flex-col min-h-[300px]">
        <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-gray-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">실행 로그</span>
          </div>
          <button
            type="button"
            onClick={onClearLogs}
            className="text-[9px] text-gray-600 hover:text-gray-400"
          >
            지우기
          </button>
        </div>
        <div className="p-3 font-mono text-[11px] space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {logs.map((log, i) => (
            <div
              key={i}
              className={cn(
                log.includes('[SYSTEM]') && 'text-emerald-500',
                log.includes('[INFO]') && 'text-gray-400',
                log.includes('[SIM]') && 'text-indigo-400',
                log.includes('[ERROR]') && 'text-red-500',
                log.includes('[USER]') && 'text-blue-400',
                log.includes('[RESULT]') && 'text-amber-400',
                i === logs.length - 1 && isSimulating && 'animate-pulse',
              )}
            >
              {log}
            </div>
          ))}
          <div id="logs-end-panel" />
        </div>
      </div>

      {simulationResults && simulationResults.steps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">실행 요약</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-[9px] text-emerald-400/60 uppercase mb-1">총 실행 단계</p>
              <p className="text-xl font-bold text-emerald-400">{simulationResults.steps.length}</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-[9px] text-emerald-400/60 uppercase mb-1">평균 지연시간</p>
              <p className="text-xl font-bold text-emerald-400">
                {(
                  simulationResults.steps.reduce(
                    (acc, s) => acc + parseInt(String(s.latency), 10),
                    0,
                  ) / simulationResults.steps.length
                ).toFixed(0)}
                ms
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {simulationResults.steps.map((step, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-[11px] bg-white/5 p-2.5 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                    {i + 1}
                  </div>
                  <span className="text-gray-200 font-medium">{step.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-mono">{step.tokens ?? 0} tok</span>
                  <span className="text-emerald-400 font-mono font-bold">{step.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>

    <div className="p-4 bg-white/5 border-t border-white/10">
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all uppercase tracking-widest"
      >
        대시보드 닫기
      </button>
    </div>
  </motion.div>
);
