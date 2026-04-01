import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  FileSpreadsheet,
  FileText,
  GitBranch,
  HardDrive,
  Layers,
  Play,
  Search,
  Server,
  Settings,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import { getNodeColor } from '../../lib/ui/utils';
import {
  MODEL_REGISTRY,
  TOOL_REGISTRY,
  MCP_REGISTRY,
  DATABASE_REGISTRY,
  VECTOR_REGISTRY,
} from '../../constants';
import type { Node, WorkflowGraph } from '../../types';
import type { AgentFlowNodeOutputs } from '../../types/simulation';
import { executeNode } from '../../services/simulation/simulationService';
import { buildEditorCodeByNodeId } from '../../lib/project/nodeCodePaths';
import {
  mergeImportedFilesIntoDatasourceConfig,
  getDatasourceFilePathPlaceholder,
} from '../../lib/project/datasourcePaths';
import { DatasourceFileDropzone, type ImportedFileRef } from '../shared/DatasourceFileDropzone';

const formatNodeOutputData = (data: unknown): string =>
  typeof data === 'string' ? data : JSON.stringify(data, null, 2);

export type SidebarTab = 'chat' | 'helper' | 'nodes' | 'code';

export type NodesTabPanelProps = {
  activeNode: Node | null;
  graph: WorkflowGraph;
  setSelectedNode: (node: Node | null) => void;
  setGraph: React.Dispatch<React.SetStateAction<WorkflowGraph>>;
  updateNodeLabel: (id: string, label: string) => void;
  updateNodeDescription: (id: string, description: string) => void;
  updateNodeConfig: (id: string, config: Record<string, unknown>) => void;
  ungroupTeam: (teamId: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveTab: (tab: SidebarTab) => void;
  globalDB: Record<string, unknown[]>;
  setGlobalDB: React.Dispatch<React.SetStateAction<Record<string, unknown[]>>>;
  nodeOutputs: AgentFlowNodeOutputs;
  setNodeOutputs: React.Dispatch<React.SetStateAction<AgentFlowNodeOutputs>>;
  fileContents: Record<string, string>;
  setIsStorageOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDbBrowser: React.Dispatch<React.SetStateAction<string | null>>;
  onDragStart: (e: React.DragEvent, nodeType: string) => void;
};

export const NodesTabPanel = ({
  activeNode,
  graph,
  setSelectedNode,
  setGraph,
  updateNodeLabel,
  updateNodeDescription,
  updateNodeConfig,
  ungroupTeam,
  deleteNode,
  deleteEdge,
  setLogs,
  setActiveTab,
  globalDB,
  setGlobalDB,
  nodeOutputs,
  setNodeOutputs,
  fileContents,
  setIsStorageOpen,
  setShowDbBrowser,
  onDragStart,
}: NodesTabPanelProps) => (
<motion.div 
                key="nodes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col"
              >
                {activeNode ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-4">
                      <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">노드 상세 정보</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl" style={{ backgroundColor: getNodeColor(activeNode.type) + '20' }}>
                            {activeNode.type === 'agent' && <Cpu size={24} className="text-indigo-400" />}
                            {activeNode.type === 'tool' && <Wrench size={24} className="text-amber-400" />}
                            {activeNode.type === 'router' && <GitBranch size={24} className="text-purple-400" />}
                            {activeNode.type === 'database' && <Database size={24} className="text-blue-400" />}
                            {activeNode.type === 'vector' && <Search size={24} className="text-cyan-400" />}
                            {activeNode.type === 'mcp' && <Server size={24} className="text-rose-400" />}
                            {activeNode.type === 'report' && <FileText size={24} className="text-lime-400" />}
                            {activeNode.type === 'storage' && <HardDrive size={24} className="text-zinc-400" />}
                            {activeNode.type === 'datasource' && <FileSpreadsheet size={24} className="text-teal-400" />}
                            {activeNode.type === 'team' && <Layers size={24} className="text-pink-400" />}
                            {activeNode.type === 'start' && <Play size={24} className="text-emerald-400" />}
                            {activeNode.type === 'end' && <Box size={24} className="text-red-400" />}
                          </div>
                          <div className="flex-1">
                            <input 
                              value={activeNode.label}
                              onChange={(e) => updateNodeLabel(activeNode.id, e.target.value)}
                              className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full"
                            />
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">{activeNode.type} ID: {activeNode.id}</div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">설명</label>
                          <textarea 
                            value={activeNode.description || ''}
                            onChange={(e) => updateNodeDescription(activeNode.id, e.target.value)}
                            placeholder="이 노드의 역할에 대해 설명해주세요..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-500 h-20 resize-none"
                          />
                        </div>

                        {/* Node Configuration */}
                        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={12} /> 노드 설정
                          </h4>

                          {activeNode.type === 'router' && (
                            <div className="space-y-3">
                              <label className="text-[9px] text-gray-500 uppercase">라우팅 전략</label>
                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  { id: 'llm_decider', name: 'LLM Decider', desc: 'LLM이 상황에 맞춰 경로 결정' },
                                  { id: 'round_robin', name: 'Round Robin', desc: '순차적으로 경로 배분' },
                                  { id: 'least_busy', name: 'Least Busy', desc: '가장 한가한 에이전트에게 할당' }
                                ].map(strategy => (
                                  <button
                                    key={strategy.id}
                                    onClick={() => updateNodeConfig(activeNode.id, { routingStrategy: strategy.id })}
                                    className={`p-3 rounded-lg border transition-all text-left ${
                                      activeNode.config?.routingStrategy === strategy.id 
                                        ? 'bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500/30' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="text-xs font-bold text-purple-400 mb-1">{strategy.name}</div>
                                    <p className="text-[10px] text-gray-400 leading-tight">{strategy.desc}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeNode.type === 'team' && (
                            <div className="space-y-4">
                              <div className="space-y-3">
                                <label className="text-[9px] text-gray-500 uppercase">팀 협업 전략</label>
                                <div className="grid grid-cols-1 gap-2">
                                  {[
                                    { id: 'collaborative', name: 'Collaborative', desc: '에이전트들이 서로 협력하여 해결' },
                                    { id: 'competitive', name: 'Competitive', desc: '가장 좋은 결과물을 낸 에이전트 선택' },
                                    { id: 'hierarchical', name: 'Hierarchical', desc: '관리자 에이전트가 하위 에이전트 지휘' }
                                  ].map(strategy => (
                                    <button
                                      key={strategy.id}
                                      onClick={() => updateNodeConfig(activeNode.id, { teamStrategy: strategy.id })}
                                      className={`p-3 rounded-lg border transition-all text-left ${
                                        activeNode.config?.teamStrategy === strategy.id 
                                          ? 'bg-pink-500/20 border-pink-500/50 ring-1 ring-pink-500/30' 
                                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                                      }`}
                                    >
                                      <div className="text-xs font-bold text-pink-400 mb-1">{strategy.name}</div>
                                      <p className="text-[10px] text-gray-400 leading-tight">{strategy.desc}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <label className="text-[9px] text-gray-500 uppercase">그룹화된 노드</label>
                                <div className="bg-white/5 rounded-lg p-2 space-y-1">
                                  {graph.nodes.filter(n => n.parentId === activeNode.id).map(node => (
                                    <div key={node.id} className="text-xs text-gray-300 p-1.5 bg-white/5 rounded">
                                      {node.label}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => ungroupTeam(activeNode.id)}
                                  className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                                >
                                  그룹 해제 (Ungroup)
                                </button>
                              </div>
                            </div>
                          )}

                          {activeNode.type === 'start' && (
                            <div className="space-y-3">
                              <label className="text-[9px] text-gray-500 uppercase">초기 입력 프롬프트</label>
                              <textarea 
                                value={activeNode.config?.initialPrompt || ''}
                                onChange={(e) => updateNodeConfig(activeNode.id, { initialPrompt: e.target.value })}
                                placeholder="워크플로우 시작 시 사용할 초기 데이터를 입력하세요..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500 h-24 resize-none"
                              />
                            </div>
                          )}

                          {activeNode.type === 'end' && (
                            <div className="space-y-3">
                              <label className="text-[9px] text-gray-500 uppercase">최종 출력 형식</label>
                              <div className="grid grid-cols-3 gap-2">
                                {['markdown', 'json', 'raw'].map(format => (
                                  <button
                                    key={format}
                                    onClick={() => updateNodeConfig(activeNode.id, { outputFormat: format })}
                                    className={`py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                                      activeNode.config?.outputFormat === format 
                                        ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                                        : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                    }`}
                                  >
                                    {format}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeNode.type === 'agent' && (
                            <div className="grid grid-cols-1 gap-2">
                              {MODEL_REGISTRY.map(model => (
                                <button
                                  key={model.id}
                                  onClick={() => updateNodeConfig(activeNode.id, { model: model.id })}
                                  className={`p-3 rounded-lg border transition-all text-left group ${
                                    activeNode.config?.model === model.id 
                                      ? 'bg-indigo-500/20 border-indigo-500/50 ring-1 ring-indigo-500/30' 
                                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-bold ${model.color}`}>{model.name}</span>
                                    {activeNode.config?.model === model.id && <Zap size={12} className="text-indigo-400 fill-indigo-400" />}
                                  </div>
                                  <p className="text-[10px] text-gray-400 leading-tight">{model.desc}</p>
                                </button>
                              ))}
                            </div>
                          )}

                          {activeNode.type === 'tool' && (
                            <div className="grid grid-cols-1 gap-2">
                              {TOOL_REGISTRY.map(tool => (
                                <button
                                  key={tool.id}
                                  onClick={() => updateNodeConfig(activeNode.id, { toolId: tool.id })}
                                  className={`p-3 rounded-lg border transition-all text-left group ${
                                    activeNode.config?.toolId === tool.id 
                                      ? 'bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/30' 
                                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <tool.icon size={14} className={tool.color} />
                                    <span className={`text-xs font-bold ${tool.color}`}>{tool.name}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 leading-tight">{tool.desc}</p>
                                </button>
                              ))}
                            </div>
                          )}

                          {activeNode.type === 'mcp' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 gap-2">
                                {MCP_REGISTRY.map(mcp => (
                                  <button
                                    key={mcp.id}
                                    onClick={() => updateNodeConfig(activeNode.id, { mcpId: mcp.id })}
                                    className={`p-3 rounded-lg border transition-all text-left group ${
                                      activeNode.config?.mcpId === mcp.id 
                                        ? 'bg-rose-500/20 border-rose-500/50 ring-1 ring-rose-500/30' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <mcp.icon size={14} className={mcp.color} />
                                      <span className={`text-xs font-bold ${mcp.color}`}>{mcp.name}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-tight">{mcp.desc}</p>
                                  </button>
                                ))}
                              </div>
                              <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-[9px] text-gray-500 uppercase">환경 변수 (JSON)</label>
                                <textarea 
                                  value={activeNode.config?.env || '{\n  "API_KEY": "..."\n}'}
                                  onChange={(e) => updateNodeConfig(activeNode.id, { env: e.target.value })}
                                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-[10px] font-mono focus:outline-none focus:border-rose-500 h-24 resize-none"
                                />
                                <button 
                                  onClick={() => {
                                    setLogs(prev => [...prev, `[SYSTEM] MCP 서버(${activeNode.label}) 빌드 환경을 구성합니다...`]);
                                    setActiveTab('code');
                                  }}
                                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition-all flex items-center justify-center gap-2"
                                >
                                  <Cpu size={14} /> 서버 구축 코드 생성
                                </button>
                              </div>
                            </div>
                          )}

                          {activeNode.type === 'datasource' && (
                            <div className="space-y-3">
                              <DatasourceFileDropzone
                                importedFiles={(activeNode.config?.importedFiles as ImportedFileRef[] | undefined) ?? []}
                                onImportedFilesChange={(files) =>
                                  updateNodeConfig(
                                    activeNode.id,
                                    mergeImportedFilesIntoDatasourceConfig(
                                      files,
                                      (activeNode.config ?? {}) as Record<string, unknown>
                                    )
                                  )
                                }
                              />
                              <div>
                                <label className="text-[9px] text-gray-500 uppercase">데이터 형식</label>
                                <select
                                  value={activeNode.config?.dataFormat || 'csv'}
                                  onChange={(e) => updateNodeConfig(activeNode.id, { dataFormat: e.target.value })}
                                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-teal-500 mt-1"
                                >
                                  <option value="csv">CSV</option>
                                  <option value="text">텍스트</option>
                                  <option value="json">JSON</option>
                                  <option value="pdf">PDF</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-500 uppercase">파일 경로</label>
                                <input
                                  value={activeNode.config?.filePath || ''}
                                  onChange={(e) => updateNodeConfig(activeNode.id, { filePath: e.target.value })}
                                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-teal-500 mt-1 font-mono"
                                  placeholder={getDatasourceFilePathPlaceholder(
                                    activeNode.config?.dataFormat as string | undefined
                                  )}
                                />
                              </div>
                              {activeNode.config?.dataFormat === 'csv' && (
                                <div>
                                  <label className="text-[9px] text-gray-500 uppercase">구분자</label>
                                  <input
                                    value={activeNode.config?.delimiter ?? ','}
                                    onChange={(e) => updateNodeConfig(activeNode.id, { delimiter: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-teal-500 mt-1 font-mono"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="text-[9px] text-gray-500 uppercase">시뮬 샘플 (선택)</label>
                                <textarea
                                  value={activeNode.config?.inlineSample || ''}
                                  onChange={(e) => updateNodeConfig(activeNode.id, { inlineSample: e.target.value })}
                                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-[10px] font-mono focus:outline-none focus:border-teal-500 h-24 resize-none mt-1"
                                  placeholder="파일 드롭이 없을 때만 사용. 비우면 기본 샘플"
                                />
                              </div>
                            </div>
                          )}

                          {activeNode.type === 'database' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 gap-2">
                                {DATABASE_REGISTRY.map(db => (
                                  <button
                                    key={db.id}
                                    onClick={() => updateNodeConfig(activeNode.id, { storageType: db.id })}
                                    className={`p-3 rounded-lg border transition-all text-left group ${
                                      activeNode.config?.storageType === db.id 
                                        ? 'bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/30' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <db.icon size={14} className={db.color} />
                                      <span className={`text-xs font-bold ${db.color}`}>{db.name}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-tight">{db.desc}</p>
                                  </button>
                                ))}
                              </div>
                              <div className="space-y-3 pt-2 border-t border-white/5">
                                <div>
                                  <label className="text-[9px] text-gray-500 uppercase">
                                    테이블 / 컬렉션 이름
                                  </label>
                                  <input 
                                    value={activeNode.config?.collection || ''}
                                    onChange={(e) => updateNodeConfig(activeNode.id, { collection: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-gray-500 uppercase">작업</label>
                                  <select 
                                    value={activeNode.config?.operation || 'read'}
                                    onChange={(e) => updateNodeConfig(activeNode.id, { operation: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                                  >
                                    <option value="read">조회 (Read)</option>
                                    <option value="write">저장 (Write)</option>
                                  </select>
                                </div>
                                {activeNode.config?.storageType === 'postgresql' &&
                                  activeNode.config?.operation === 'read' && (
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase">SQL (SELECT만)</label>
                                      <textarea
                                        value={activeNode.config?.query || ''}
                                        onChange={(e) =>
                                          updateNodeConfig(activeNode.id, { query: e.target.value })
                                        }
                                        placeholder="SELECT * FROM table LIMIT 10"
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-[11px] font-mono focus:outline-none focus:border-indigo-500 h-20 resize-none"
                                      />
                                    </div>
                                  )}
                                {activeNode.config?.storageType === 'mongodb' &&
                                  activeNode.config?.operation === 'read' && (
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase">
                                        MongoDB 필터 (JSON 객체)
                                      </label>
                                      <textarea
                                        value={activeNode.config?.mongoFilter ?? '{}'}
                                        onChange={(e) =>
                                          updateNodeConfig(activeNode.id, { mongoFilter: e.target.value })
                                        }
                                        placeholder='{} 또는 {"field":"value"}'
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-[11px] font-mono focus:outline-none focus:border-indigo-500 h-20 resize-none"
                                      />
                                    </div>
                                  )}
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-gray-500 uppercase">호스트</label>
                                    <input
                                      value={activeNode.config?.dbHost || ''}
                                      onChange={(e) =>
                                        updateNodeConfig(activeNode.id, { dbHost: e.target.value })
                                      }
                                      placeholder="localhost"
                                      className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-gray-500 uppercase">포트</label>
                                    <input
                                      type="number"
                                      value={
                                        activeNode.config?.dbPort != null
                                          ? String(activeNode.config.dbPort)
                                          : ''
                                      }
                                      onChange={(e) =>
                                        updateNodeConfig(activeNode.id, {
                                          dbPort: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                      }
                                      placeholder={activeNode.config?.storageType === 'mongodb' ? '27017' : '5433'}
                                      className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] text-gray-500 uppercase">DB 이름</label>
                                  <input
                                    value={activeNode.config?.dbName || ''}
                                    onChange={(e) =>
                                      updateNodeConfig(activeNode.id, { dbName: e.target.value })
                                    }
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-gray-500 uppercase">사용자</label>
                                    <input
                                      value={activeNode.config?.dbUser || ''}
                                      onChange={(e) =>
                                        updateNodeConfig(activeNode.id, { dbUser: e.target.value })
                                      }
                                      className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-gray-500 uppercase">비밀번호</label>
                                    <input
                                      type="password"
                                      value={activeNode.config?.dbPassword || ''}
                                      onChange={(e) =>
                                        updateNodeConfig(activeNode.id, { dbPassword: e.target.value })
                                      }
                                      className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                </div>
                                {activeNode.config?.storageType === 'mongodb' && (
                                  <p className="text-[9px] text-gray-500 leading-snug">
                                    MongoDB 미인증 로컬은 사용자·비밀번호를 비워 두세요. URI 연결이 필요하면 코드에서
                                    connectionUri를 확장할 수 있습니다.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {activeNode.type === 'vector' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 gap-2">
                                {VECTOR_REGISTRY.map(vdb => (
                                  <button
                                    key={vdb.id}
                                    onClick={() => updateNodeConfig(activeNode.id, { storageType: vdb.id })}
                                    className={`p-3 rounded-lg border transition-all text-left group ${
                                      activeNode.config?.storageType === vdb.id 
                                        ? 'bg-cyan-500/20 border-cyan-500/50 ring-1 ring-cyan-500/30' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <vdb.icon size={14} className={vdb.color} />
                                      <span className={`text-xs font-bold ${vdb.color}`}>{vdb.name}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-tight">{vdb.desc}</p>
                                  </button>
                                ))}
                              </div>
                              <div className="space-y-3 pt-2 border-t border-white/5">
                                <div>
                                  <label className="text-[9px] text-gray-500 uppercase">검색 쿼리</label>
                                  <div className="flex gap-2">
                                    <input 
                                      value={activeNode.config?.query || ''}
                                      onChange={(e) => updateNodeConfig(activeNode.id, { query: e.target.value })}
                                      placeholder="검색어를 입력하세요..."
                                      className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                                    />
                                    <button 
                                      onClick={async () => {
                                        setLogs(prev => [...prev, `[USER] VectorDB 검색 요청: "${activeNode.config?.query}"`]);
                                        const result = await executeNode(activeNode, { text: activeNode.config?.query }, [], globalDB, setGlobalDB, graph, { sessionId: `manual-${activeNode.id}-${Date.now()}`, editorCodeByNodeId: buildEditorCodeByNodeId(graph.nodes, fileContents) });
                                        setNodeOutputs(prev => ({
                                          ...prev,
                                          [activeNode.id]: {
                                            timestamp: new Date().toLocaleTimeString(),
                                            data: result,
                                            status: 'success'
                                          }
                                        }));
                                        setLogs(prev => [...prev, `[RESULT] VectorDB 검색 완료`]);
                                        setIsStorageOpen(true);
                                      }}
                                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                                    >
                                      <Search size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeNode.type === 'report' && (
                            <div>
                              <label className="text-[9px] text-gray-500 uppercase">형식</label>
                              <select 
                                value={activeNode.config?.reportFormat || 'markdown'}
                                onChange={(e) => updateNodeConfig(activeNode.id, { reportFormat: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                              >
                                <option value="markdown">Markdown</option>
                                <option value="pdf">PDF</option>
                                <option value="json">JSON</option>
                              </select>
                            </div>
                          )}

                          {activeNode.type === 'storage' && (
                            <div>
                              <label className="text-[9px] text-gray-500 uppercase">저장 경로</label>
                              <input 
                                value={activeNode.config?.storagePath || ''}
                                onChange={(e) => updateNodeConfig(activeNode.id, { storagePath: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* Data Explorer */}
                        <div className="space-y-3 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                              <Database size={12} /> 데이터 익스플로러
                            </h4>
                            <button 
                              onClick={async () => {
                                setLogs(prev => [...prev, `[USER] ${activeNode.label} 노드 수동 실행 요청`]);
                                const result = await executeNode(activeNode, { text: activeNode.config?.query || activeNode.config?.initialPrompt }, [], globalDB, setGlobalDB, graph, { sessionId: `manual-${activeNode.id}-${Date.now()}`, editorCodeByNodeId: buildEditorCodeByNodeId(graph.nodes, fileContents) });
                                setNodeOutputs(prev => ({
                                  ...prev,
                                  [activeNode.id]: {
                                    timestamp: new Date().toLocaleTimeString(),
                                    data: result,
                                    status: 'success'
                                  }
                                }));
                                setLogs(prev => [...prev, `[RESULT] ${activeNode.label} 실행 완료`]);
                              }}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold rounded flex items-center gap-1 transition-all"
                            >
                              <Play size={10} fill="currentColor" /> 실행
                            </button>
                          </div>
                          
                          {nodeOutputs[activeNode.id] ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-500">마지막 실행: {nodeOutputs[activeNode.id].timestamp}</span>
                                <span className="text-emerald-400 font-bold">SUCCESS</span>
                              </div>
                              <div className="bg-black/60 rounded-lg p-3 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar">
                                <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap">
                                  {formatNodeOutputData(nodeOutputs[activeNode.id].data)}
                                </pre>
                              </div>
                              <button 
                                onClick={() => {
                                  if (activeNode.type === 'database') {
                                    setShowDbBrowser(activeNode.id);
                                  }
                                }}
                                className="w-full py-2 text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-indigo-500/20"
                              >
                                {activeNode.type === 'database' ? 'DB 저장소 열기' : '전체 데이터 보기'}
                              </button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-600 italic">시뮬레이션을 실행하면 데이터가 여기에 표시됩니다.</p>
                          )}
                        </div>

                        {/* Edges */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">나가는 연결 (Edges)</h4>
                          {graph.edges.filter(e => e.source === activeNode.id).length > 0 ? (
                            graph.edges.filter(e => e.source === activeNode.id).map(edge => (
                              <div key={edge.id} className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400 flex items-center gap-2">
                                    대상: <span className="text-white font-bold">{graph.nodes.find(n => n.id === edge.target)?.label}</span>
                                  </span>
                                  <button 
                                    onClick={() => deleteEdge(edge.id)}
                                    className="p-1.5 hover:bg-red-500/20 text-gray-600 hover:text-red-400 rounded transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-gray-500 uppercase tracking-wider">연결 라벨 (라우터 분기명·작업 지시)</label>
                                  <input
                                    type="text"
                                    value={edge.label ?? ''}
                                    onChange={(e) => {
                                      const newLabel = e.target.value;
                                      setGraph(prev => ({
                                        ...prev,
                                        edges: prev.edges.map(ed => (ed.id === edge.id ? { ...ed, label: newLabel } : ed)),
                                      }));
                                    }}
                                    placeholder="예: 통과, 실패, 저장 완료 시"
                                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                  />
                                  <p className="text-[9px] text-gray-600 leading-snug">
                                    라우터는 LLM 결정 문자열과 이 라벨을 매칭합니다. 비워 두면 그래프에는 표시되지 않을 수 있습니다.
                                  </p>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-gray-500 uppercase tracking-wider">조건부 로직 (Python/JS)</label>
                                  <textarea 
                                    value={edge.logic || ''}
                                    onChange={(e) => {
                                      const newLogic = e.target.value;
                                      setGraph(prev => ({
                                        ...prev,
                                        edges: prev.edges.map(ed => ed.id === edge.id ? { ...ed, logic: newLogic } : ed)
                                      }));
                                    }}
                                    placeholder="예: return state['score'] > 0.8"
                                    className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-[11px] font-mono focus:outline-none focus:border-indigo-500 h-20 resize-none"
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-gray-600 italic">연결된 나가는 엣지가 없습니다.</p>
                          )}
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-6 border-t border-white/5">
                          <button 
                            onClick={() => {
                              console.log("Delete button clicked for:", activeNode?.id);
                              deleteNode(activeNode.id);
                            }}
                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/20"
                          >
                            <Trash2 size={14} /> 노드 삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">드래그하여 노드 추가</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { type: 'agent', label: '에이전트', icon: Cpu, color: 'text-indigo-400' },
                          { type: 'tool', label: '도구', icon: Wrench, color: 'text-amber-400' },
                          { type: 'router', label: '라우터', icon: GitBranch, color: 'text-purple-400' },
                          { type: 'database', label: '데이터베이스', icon: Database, color: 'text-blue-400' },
                          { type: 'datasource', label: '데이터 가져오기', icon: FileSpreadsheet, color: 'text-teal-400' },
                          { type: 'vector', label: '벡터DB', icon: Search, color: 'text-cyan-400' },
                          { type: 'mcp', label: 'MCP 서버', icon: Server, color: 'text-rose-400' },
                          { type: 'report', label: '보고서', icon: FileText, color: 'text-lime-400' },
                          { type: 'storage', label: '저장소', icon: HardDrive, color: 'text-zinc-400' },
                          { type: 'start', label: '시작', icon: Play, color: 'text-emerald-400' },
                          { type: 'end', label: '종료', icon: Box, color: 'text-red-400' },
                        ].map(n => (
                          <div 
                            key={n.type}
                            draggable
                            onDragStart={(e) => onDragStart(e, n.type)}
                            className="p-3 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-all"
                          >
                            <n.icon size={20} className={n.color} />
                            <span className="text-[10px] font-medium">{n.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">활성 노드 리스트</h3>
                      <div className="space-y-2">
                        {graph.nodes.map(node => (
                          <div 
                            key={node.id}
                            onClick={() => setSelectedNode(node)}
                            className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all group"
                          >
                            <div className="p-2 rounded" style={{ backgroundColor: getNodeColor(node.type) + '20' }}>
                              {node.type === 'agent' && <Cpu size={16} className="text-indigo-400" />}
                              {node.type === 'tool' && <Wrench size={16} className="text-amber-400" />}
                              {node.type === 'router' && <GitBranch size={16} className="text-purple-400" />}
                              {node.type === 'database' && <Database size={16} className="text-blue-400" />}
                              {node.type === 'datasource' && <FileSpreadsheet size={16} className="text-teal-400" />}
                              {node.type === 'vector' && <Search size={16} className="text-cyan-400" />}
                              {node.type === 'mcp' && <Server size={16} className="text-rose-400" />}
                              {node.type === 'report' && <FileText size={16} className="text-lime-400" />}
                              {node.type === 'storage' && <HardDrive size={16} className="text-zinc-400" />}
                              {node.type === 'team' && <Layers size={16} className="text-pink-400" />}
                              {node.type === 'start' && <Play size={16} className="text-emerald-400" />}
                              {node.type === 'end' && <Box size={16} className="text-red-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold truncate">{node.label}</div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{node.type}</div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log("Delete button clicked for node list item:", node.id);
                                  deleteNode(node.id);
                                }}
                                className="p-1.5 hover:bg-red-500/20 text-gray-600 hover:text-red-400 rounded transition-colors"
                                title="노드 삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                              <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
);
