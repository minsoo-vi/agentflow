import React from 'react';
import { Terminal } from 'lucide-react';
import { cn } from '../../lib/ui/utils';

type ExecutionLogsPanelProps = {
  logs: string[];
};

export const ExecutionLogsPanel = ({ logs }: ExecutionLogsPanelProps) => (
  <div className="h-48 border-t border-white/10 bg-[#0a0a0a] p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
    <div className="flex items-center gap-2 text-gray-500 mb-2 sticky top-0 bg-[#0a0a0a] pb-2">
      <Terminal size={14} />
      <span className="uppercase tracking-widest">Execution Logs</span>
    </div>
    <div className="space-y-1">
      {logs.map((log, i) => (
        <div
          key={i}
          className={cn(
            log.includes('[SYSTEM]') && 'text-emerald-500',
            log.includes('[INFO]') && 'text-gray-400',
            log.includes('[SIM]') && 'text-indigo-400',
            i === logs.length - 1 && 'animate-pulse',
          )}
        >
          {log}
        </div>
      ))}
      <div id="logs-end" />
    </div>
  </div>
);
