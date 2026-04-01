import React from 'react';
import { 
  X, 
  Settings, 
  Cpu, 
  Wrench, 
  GitBranch, 
  Database, 
  HardDrive, 
  Zap, 
  Layout, 
  Search, 
  Server, 
  FileText, 
  PlusCircle,
  ArrowRight,
  Trash2,
  Save,
  Check,
  Copy,
  FileSpreadsheet
} from 'lucide-react';
import { DatasourceFileDropzone, type ImportedFileRef } from '../shared/DatasourceFileDropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/ui/utils';
import {
  getDatasourceFilePathPlaceholder,
  mergeImportedFilesIntoDatasourceConfig,
} from '../../lib/project/datasourcePaths';
import {
  CHUNK_STRATEGY_OPTIONS,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_OVERLAP,
  type ChunkStrategyId,
} from '../../lib/simulation/chunkStrategies';
import { 
  MODEL_REGISTRY, 
  TOOL_REGISTRY, 
  DATABASE_REGISTRY, 
  VECTOR_REGISTRY, 
  STORAGE_REGISTRY, 
  MCP_REGISTRY 
} from '../../constants';
import { Node, WorkflowGraph } from '../../types';

interface NodeConfigPanelProps {
  node: Node | null;
  graph: WorkflowGraph;
  onClose: () => void;
  onUpdateNode: (id: string, updates: Partial<Node>) => void;
  onDeleteNode: (id: string) => void;
  onUngroupNode: (id: string) => void;
  nodeOutputs: Record<string, any>;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  graph,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onUngroupNode,
  nodeOutputs
}) => {
  if (!node) return null;

  const output = nodeOutputs[node.id];
  const groupedNodes = graph.nodes.filter(n => n.parentId === node.id);

  return (
    <motion.div 
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      className="w-96 border-l border-white/10 bg-[#0a0a0a] flex flex-col h-full z-50 shadow-2xl"
    >
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Settings size={16} className="text-gray-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {node.type === 'database' ? 'Database' : 'Node Configuration'}
            </h2>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
              {node.type === 'database' ? 'database settings' : `${node.type} settings`}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-black/40">
        <section className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block px-1">Basic Info</label>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block ml-1">Label</label>
              <input 
                type="text" 
                value={node.label}
                onChange={(e) => onUpdateNode(node.id, { label: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block ml-1">Description</label>
              <textarea 
                value={node.description || ''}
                onChange={(e) => onUpdateNode(node.id, { description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="Describe what this node does..."
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block px-1">설정</label>
          <div className="space-y-4">
            {node.type === 'agent' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Model Selection</label>
                  <div className="grid grid-cols-1 gap-2">
                    {MODEL_REGISTRY.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => onUpdateNode(node.id, { config: { ...node.config, model: m.id } })}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                          node.config?.model === m.id ? "bg-indigo-500/10 border-indigo-500/50 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        <div>
                          <p className="text-xs font-bold">{m.name}</p>
                          <p className="text-[10px] opacity-60">{m.desc}</p>
                        </div>
                        {node.config?.model === m.id && <Check size={14} className="text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">System Instruction</label>
                  <textarea 
                    value={node.config?.systemInstruction || ''}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, systemInstruction: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="Set the persona and behavior of this agent..."
                  />
                </div>
              </>
            )}

            {node.type === 'team' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Grouped Nodes ({groupedNodes.length})</label>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    {groupedNodes.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No nodes in this group</p>
                    ) : (
                      <ul className="space-y-1">
                        {groupedNodes.map(n => (
                          <li key={n.id} className="text-xs text-gray-300 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {n.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => onUngroupNode(node.id)}
                  className="w-full py-2 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold transition-all"
                >
                  Ungroup Team
                </button>
              </div>
            )}

            {node.type === 'tool' && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block ml-1">Tool Selection</label>
                <div className="grid grid-cols-1 gap-2">
                  {TOOL_REGISTRY.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => onUpdateNode(node.id, { config: { ...node.config, toolId: t.id } })}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        node.config?.toolId === t.id ? "bg-amber-500/10 border-amber-500/50 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      <t.icon size={16} className={cn(t.color)} />
                      <div className="flex-1">
                        <p className="text-xs font-bold">{t.name}</p>
                        <p className="text-[10px] opacity-60">{t.desc}</p>
                      </div>
                      {node.config?.toolId === t.id && <Check size={14} className="text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {node.type === 'router' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Routing Strategy</label>
                  <select 
                    value={node.config?.routingStrategy || 'llm_decider'}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, routingStrategy: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  >
                    <option value="llm_decider">LLM Decider (Dynamic)</option>
                    <option value="conditional">Conditional (Rule-based)</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                </div>
              </div>
            )}

            {node.type === 'vector' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Vector DB Selection</label>
                  <div className="grid grid-cols-1 gap-2">
                    {VECTOR_REGISTRY.map(v => (
                      <button 
                        key={v.id}
                        onClick={() => onUpdateNode(node.id, { config: { ...node.config, storageType: v.id } })}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                          node.config?.storageType === v.id ? "bg-emerald-500/10 border-emerald-500/50 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        <v.icon size={16} className={cn(v.color)} />
                        <div className="flex-1">
                          <p className="text-xs font-bold">{v.name}</p>
                        </div>
                        {node.config?.storageType === v.id && <Check size={14} className="text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Search Query (Optional)</label>
                  <input 
                    type="text" 
                    value={node.config?.query || ''}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, query: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="Leave empty to use previous node output"
                  />
                </div>
              </div>
            )}

            {node.type === 'mcp' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">MCP Server Selection</label>
                  <div className="grid grid-cols-1 gap-2">
                    {MCP_REGISTRY.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => onUpdateNode(node.id, { config: { ...node.config, mcpId: m.id, mcpServerUrl: m.url } })}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                          node.config?.mcpId === m.id ? "bg-purple-500/10 border-purple-500/50 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        <Server size={16} className="text-purple-400" />
                        <div className="flex-1">
                          <p className="text-xs font-bold">{m.name}</p>
                          <p className="text-[10px] opacity-60">{m.url}</p>
                        </div>
                        {node.config?.mcpId === m.id && <Check size={14} className="text-purple-400" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Method Call</label>
                  <input 
                    type="text" 
                    value={node.config?.mcpMethod || 'get_context'}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, mcpMethod: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            {node.type === 'report' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Report Format</label>
                  <select 
                    value={node.config?.reportFormat || 'markdown'}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, reportFormat: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  >
                    <option value="markdown">Markdown (.md)</option>
                    <option value="pdf">PDF Document</option>
                    <option value="html">HTML Page</option>
                    <option value="json">JSON Data</option>
                  </select>
                </div>
              </div>
            )}

            {node.type === 'datasource' && (
              <div className="space-y-4">
                <DatasourceFileDropzone
                  importedFiles={(node.config?.importedFiles as ImportedFileRef[] | undefined) ?? []}
                  onImportedFilesChange={(files) =>
                    onUpdateNode(node.id, {
                      config: mergeImportedFilesIntoDatasourceConfig(
                        files,
                        (node.config ?? {}) as Record<string, unknown>
                      ),
                    })
                  }
                />
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">데이터 형식</label>
                  <select
                    value={node.config?.dataFormat || 'csv'}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, dataFormat: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  >
                    <option value="csv">CSV</option>
                    <option value="text">Plain Text (.txt 등)</option>
                    <option value="json">JSON</option>
                    <option value="pdf">PDF (규정집·문서, 텍스트 추출)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">파일 경로 (또는 식별자)</label>
                  <input
                    type="text"
                    value={node.config?.filePath || ''}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, filePath: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                    placeholder={getDatasourceFilePathPlaceholder(node.config?.dataFormat as string | undefined)}
                  />
                </div>
                {node.config?.dataFormat === 'csv' && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block ml-1">구분자</label>
                    <input
                      type="text"
                      value={node.config?.delimiter ?? ','}
                      onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, delimiter: e.target.value } })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                      placeholder=","
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1 flex items-center gap-2">
                    <FileSpreadsheet size={14} className="text-teal-400" />
                    시뮬레이션용 샘플 내용 (비어 있으면 기본 샘플 사용)
                  </label>
                  <textarea
                    value={node.config?.inlineSample || ''}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, inlineSample: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white h-28 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-mono text-xs"
                    placeholder="위에서 파일을 드롭하면 그 내용이 우선됩니다. 없을 때만 이 샘플로 시뮬레이션합니다."
                  />
                </div>
              </div>
            )}

            {node.type === 'storage' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Storage Destination</label>
                  <div className="grid grid-cols-1 gap-2">
                    {STORAGE_REGISTRY.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => onUpdateNode(node.id, { config: { ...node.config, storageType: s.id } })}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                          node.config?.storageType === s.id ? "bg-gray-500/10 border-gray-500/50 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        <s.icon size={16} className={cn(s.color)} />
                        <div className="flex-1">
                          <p className="text-xs font-bold">{s.name}</p>
                        </div>
                        {node.config?.storageType === s.id && <Check size={14} className="text-gray-400" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Storage Path</label>
                  <input 
                    type="text" 
                    value={node.config?.storagePath || '/data/results'}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, storagePath: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            {node.type === 'start' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Initial Prompt</label>
                  <textarea 
                    value={node.config?.initialPrompt || ''}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, initialPrompt: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="Enter the starting prompt for this workflow..."
                  />
                </div>
              </div>
            )}

            {node.type === 'end' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Output Format</label>
                  <select 
                    value={node.config?.outputFormat || 'markdown'}
                    onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, outputFormat: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                    <option value="text">Plain Text</option>
                  </select>
                </div>
              </div>
            )}

            {node.type === 'chunk' && (
              <div className="space-y-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">LangChain 청킹</p>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">전략 (chunkStrategy)</label>
                  <select
                    value={(node.config?.chunkStrategy as ChunkStrategyId) || 'recursive'}
                    onChange={(e) =>
                      onUpdateNode(node.id, {
                        config: { ...node.config, chunkStrategy: e.target.value as ChunkStrategyId },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  >
                    {CHUNK_STRATEGY_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id} title={o.hint}>
                        {o.label} — {o.hint}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block ml-1">chunkSize</label>
                    <input
                      type="number"
                      min={50}
                      max={32000}
                      value={node.config?.chunkSize ?? DEFAULT_CHUNK_SIZE}
                      onChange={(e) =>
                        onUpdateNode(node.id, {
                          config: { ...node.config, chunkSize: Number(e.target.value) || DEFAULT_CHUNK_SIZE },
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block ml-1">chunkOverlap</label>
                    <input
                      type="number"
                      min={0}
                      max={8000}
                      value={node.config?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP}
                      onChange={(e) =>
                        onUpdateNode(node.id, {
                          config: { ...node.config, chunkOverlap: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {(node.type === 'ingest' || node.type === 'chunk' || node.type === 'embed' || node.type === 'retrieve') && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block ml-1">Prompt / Input</label>
                <textarea 
                  value={node.config?.prompt || ''}
                  onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, prompt: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="Enter prompt or input text..."
                />
              </div>
            )}
            {node.type === 'database' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Storage Type</label>
                  <div className="grid grid-cols-1 gap-2">
                    {DATABASE_REGISTRY.map(d => (
                      <button 
                        key={d.id}
                        onClick={() => onUpdateNode(node.id, { 
                          config: { 
                            ...node.config, 
                            storageType: d.id 
                          } 
                        })}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                          node.config?.storageType === d.id
                            ? "bg-blue-500/10 border-blue-500/50 text-white"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        <d.icon size={16} className={cn(d.color)} />
                        <div className="flex-1">
                          <p className="text-xs font-bold">{d.name}</p>
                          {d.desc && <p className="text-[10px] opacity-60">{d.desc}</p>}
                        </div>
                        {node.config?.storageType === d.id && <Check size={14} className="text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">Operation</label>
                  <select 
                    value={node.config?.operation || 'read'}
                    onChange={(e) =>
                      onUpdateNode(node.id, {
                        config: {
                          ...node.config,
                          operation: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  >
                    <option value="read">Read (Query)</option>
                    <option value="write">Write (Insert/Update)</option>
                    <option value="delete">Delete</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block ml-1">
                    {node.config?.storageType === 'postgresql' ? 'Table Name' : 'Collection'}
                  </label>
                  <input
                    type="text"
                    value={node.config?.collection || ''}
                    onChange={(e) =>
                      onUpdateNode(node.id, {
                        config: {
                          ...node.config,
                          collection: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder={node.config?.storageType === 'postgresql' ? 'csv_table' : 'default'}
                  />
                </div>

                {node.config?.storageType === 'postgresql' && (
                  <>
                    {node.config?.operation === 'read' && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block ml-1">SQL Query</label>
                        <textarea
                          value={node.config?.query || ''}
                          onChange={(e) =>
                            onUpdateNode(node.id, {
                              config: {
                                ...node.config,
                                query: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white h-28 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-xs"
                          placeholder="SELECT * FROM csv_table LIMIT 10"
                        />
                      </div>
                    )}

                    {node.config?.operation === 'write' && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <p className="text-[11px] text-emerald-300 leading-relaxed">
                          Write 모드에서는 이전 datasource 노드에서 전달된
                          <span className="font-mono"> headers / rows </span>
                          데이터를 사용해 PostgreSQL에 적재합니다.
                        </p>
                      </div>
                    )}
                  </>
                )}            
              </>
            )}

          </div>
        </section>

        {output && (
          <section className="space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block px-1">Last Output</label>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Success</span>
                <span className="text-[10px] text-gray-600 font-mono">{output.timestamp}</span>
              </div>
              <pre className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                {JSON.stringify(output.data, null, 2)}
              </pre>
            </div>
          </section>
        )}
      </div>

      <div className="p-6 border-t border-white/10 bg-black/20">
        <button 
          onClick={() => onDeleteNode(node.id)}
          className="w-full py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-bold transition-all flex items-center justify-center gap-2"
        >
          <Trash2 size={16} /> Delete Node
        </button>
      </div>
    </motion.div>
  );
};
