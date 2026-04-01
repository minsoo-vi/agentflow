import React from 'react';
import { motion } from 'framer-motion';
import { Database, Play, X } from 'lucide-react';
import { cn } from '../../lib/ui/utils';

type DbBrowserModalProps = {
  openNodeId: string | null;
  collectionLabel: string;
  nodeOutput: Record<string, unknown> | null | undefined;
  onClose: () => void;
  onCsvExport: () => void;
};

const DEFAULT_ROWS: Array<Record<string, unknown>> = [
  { id: '1', name: 'User A', status: 'active', last_login: '2024-03-28' },
  { id: '2', name: 'User B', status: 'pending', last_login: '2024-03-27' },
  { id: '3', name: 'User C', status: 'active', last_login: '2024-03-26' },
];

export const DbBrowserModal = ({
  openNodeId,
  collectionLabel,
  nodeOutput,
  onClose,
  onCsvExport,
}: DbBrowserModalProps) => {
  if (!openNodeId) return null;

  const dataNested = nodeOutput?.data as { data?: unknown[] } | undefined;
  const rawRows = dataNested?.data;
  const rows: Array<Record<string, unknown>> = Array.isArray(rawRows) ? rawRows : DEFAULT_ROWS;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">DB 저장소 브라우저</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                {collectionLabel} 컬렉션
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          {nodeOutput ? (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase mb-1">총 레코드</p>
                  <p className="text-2xl font-bold text-white">1,248</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase mb-1">오늘 생성</p>
                  <p className="text-2xl font-bold text-emerald-400">+42</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase mb-1">상태</p>
                  <p className="text-2xl font-bold text-indigo-400">Healthy</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Last Login</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((row) => {
                      const id = String(row.id ?? '');
                      const name = String(row.name ?? '');
                      const status = String(row.status ?? '');
                      const lastLogin = String(row.last_login ?? '');
                      return (
                        <tr key={id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-mono text-indigo-400">{id}</td>
                          <td className="px-4 py-3 text-gray-300">{name}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400',
                              )}
                            >
                              {status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{lastLogin}</td>
                          <td className="px-4 py-3">
                            <button type="button" className="text-indigo-400 hover:text-indigo-300">
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Play size={48} className="text-gray-700 mb-4" />
              <p className="text-gray-500">시뮬레이션을 실행하여 실시간 데이터를 조회하세요.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={onCsvExport}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
          >
            CSV 내보내기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
