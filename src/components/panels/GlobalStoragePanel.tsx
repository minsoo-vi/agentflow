import React from 'react';
import { motion } from 'framer-motion';
import { Database, Download, FileText, HardDrive, Trash2, X, Zap } from 'lucide-react';
import { cn } from '../../lib/ui/utils';
import type { WorkflowGraph } from '../../types';
import type { ArchivedReport } from '../../lib/report/reportArchive';
import { downloadReportFile } from '../../lib/report/reportArchive';

export type StorageTab = 'results' | 'db' | 'reports';

export type GlobalStoragePanelProps = {
  onClose: () => void;
  storageTab: StorageTab;
  onTabResults: () => void;
  onTabReports: () => void;
  onTabDb: () => void;
  onExportResults: () => void;
  onTrash: () => void;
  nodeOutputs: Record<string, unknown>;
  graph: WorkflowGraph;
  archivedReports: ArchivedReport[];
  globalDB: Record<string, unknown[]>;
};

export const GlobalStoragePanel = ({
  onClose,
  storageTab,
  onTabResults,
  onTabReports,
  onTabDb,
  onExportResults,
  onTrash,
  nodeOutputs,
  graph,
  archivedReports,
  globalDB,
}: GlobalStoragePanelProps) => {
  const trashTitle =
    storageTab === 'reports'
      ? '보관함 비우기 (localStorage)'
      : storageTab === 'results'
        ? '실행 결과 초기화'
        : '글로벌 DB 초기화';

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="absolute top-20 right-6 bottom-6 w-96 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden"
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <HardDrive size={16} className="text-indigo-400" />
          <span className="text-sm font-bold uppercase tracking-widest">글로벌 저장소</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportResults}
            className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"
            title="결과 내보내기 (JSON)"
          >
            <Download size={14} />
          </button>
          <button
            type="button"
            onClick={onTrash}
            className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded transition-colors"
            title={trashTitle}
          >
            <Trash2 size={14} />
          </button>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10 bg-black/20">
        <button
          type="button"
          onClick={onTabResults}
          className={cn(
            'flex-1 p-2.5 text-[9px] font-bold uppercase tracking-wider transition-colors',
            storageTab === 'results'
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
              : 'text-gray-500 hover:text-gray-300',
          )}
        >
          실행 결과
        </button>
        <button
          type="button"
          onClick={onTabReports}
          className={cn(
            'flex-1 p-2.5 text-[9px] font-bold uppercase tracking-wider transition-colors',
            storageTab === 'reports'
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
              : 'text-gray-500 hover:text-gray-300',
          )}
        >
          보고서 보관함
        </button>
        <button
          type="button"
          onClick={onTabDb}
          className={cn(
            'flex-1 p-2.5 text-[9px] font-bold uppercase tracking-wider transition-colors',
            storageTab === 'db'
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
              : 'text-gray-500 hover:text-gray-300',
          )}
        >
          글로벌 DB
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {storageTab === 'results' ? (
          <div className="space-y-4">
            {Object.keys(nodeOutputs).length === 0 ? (
              <div className="bg-white/5 p-8 rounded-xl border border-white/10 text-center">
                <Zap size={32} className="mx-auto text-gray-700 mb-3" />
                <p className="text-xs text-gray-500">
                  실행 결과가 없습니다.
                  <br />
                  시뮬레이션을 실행하세요.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(nodeOutputs).map(([id, output]) => {
                  const node = graph.nodes.find((n) => n.id === id);
                  const out = output as { timestamp?: string; data?: unknown };
                  return (
                    <div key={id} className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                      <div className="bg-white/5 px-3 py-2 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-bold">{node?.label || id}</span>
                        </div>
                        <span className="text-[9px] text-gray-500">{out.timestamp}</span>
                      </div>
                      <div className="p-3">
                        <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                          {JSON.stringify(out.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : storageTab === 'reports' ? (
          <div className="space-y-4">
            <p className="text-[10px] text-gray-500 leading-relaxed px-1">
              시뮬레이션마다 <span className="text-gray-400">실행 ID(run_…)</span>로 묶습니다. 브라우저{' '}
              <span className="text-indigo-400">localStorage</span>에도 쌓이고,{' '}
              <span className="text-emerald-400/90">npm run dev</span> 또는{' '}
              <span className="text-emerald-400/90">npm run start</span>로 띄운 서버가 있으면 프로젝트{' '}
              <span className="text-gray-400">data/reports</span>(또는{' '}
              <span className="font-mono text-[9px]">AF_REPORTS_DIR</span>)에도 파일로 저장됩니다. 로그에{' '}
              <span className="text-gray-400">서버 디스크 저장</span> 줄을 확인하세요.
            </p>
            {archivedReports.length === 0 ? (
              <div className="bg-white/5 p-8 rounded-xl border border-white/10 text-center">
                <FileText size={32} className="mx-auto text-gray-700 mb-3" />
                <p className="text-xs text-gray-500">
                  저장된 보고서가 없습니다.
                  <br />
                  report 노드가 끝난 시뮬레이션을 실행하세요.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedReports.map((r) => (
                  <div key={r.id} className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                    <div className="bg-white/5 px-3 py-2 flex items-center justify-between gap-2 border-b border-white/5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText size={12} className="text-lime-400 shrink-0" />
                          <span className="text-[11px] font-bold truncate">{r.nodeLabel}</span>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono truncate mt-0.5" title={r.runId}>
                          실행 {r.runId} · {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadReportFile(r)}
                        className="shrink-0 px-2 py-1 text-[9px] font-bold uppercase bg-indigo-600 hover:bg-indigo-500 rounded text-white"
                      >
                        다운로드
                      </button>
                    </div>
                    <div className="p-3">
                      <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                        {r.content.slice(0, 4000)}
                        {r.content.length > 4000 ? '\n…' : ''}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(globalDB).map(([collName, items]) => (
              <div key={collName} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Database size={12} className="text-indigo-400" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      {collName}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-600">{items.length} records</span>
                </div>
                <div className="bg-black/40 rounded-lg border border-white/5 overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-white/5 text-gray-500 uppercase font-bold">
                      <tr>
                        <th className="p-2 border-b border-white/5">ID</th>
                        <th className="p-2 border-b border-white/5">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="p-4 text-center text-gray-600 italic">
                            No data in this collection
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => {
                          const row = item as Record<string, unknown>;
                          return (
                            <tr key={String(row.id ?? idx)} className="hover:bg-white/5 transition-colors">
                              <td className="p-2 text-indigo-400 font-mono">{String(row.id)}</td>
                              <td className="p-2 text-gray-400">
                                {Object.entries(row)
                                  .filter(([k]) => k !== 'id')
                                  .map(([k, v]) => (
                                    <div key={k} className="flex gap-1">
                                      <span className="text-gray-600">{k}:</span>
                                      <span>
                                        {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                                      </span>
                                    </div>
                                  ))}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
              <p className="text-[10px] text-indigo-300/70 leading-relaxed italic text-center">
                "이곳은 시뮬레이션 외부에서도 유지되는 영구 데이터 공간입니다. 노드들은 이 DB를 읽고 쓰며 상태를
                공유합니다."
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
