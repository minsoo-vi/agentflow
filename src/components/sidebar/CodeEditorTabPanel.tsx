import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Save,
  X,
  Check,
  Copy,
  Download,
  FolderPlus,
  Folder,
  FileCode,
  ChevronRight,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/ui/utils';
import { CODE_SNIPPETS, INITIAL_GRAPH } from '../../constants';
import type { WorkflowGraph } from '../../types';
import type { SidebarTab } from './NodesTabPanel';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

const WORKFLOW_GRAPH_FILE = 'Project/graph.py';

export type CodeEditorTabPanelProps = {
  fileTree: unknown[];
  currentFilePath: string;
  setCurrentFilePath: (path: string) => void;
  fileContents: Record<string, string>;
  setFileContents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  generatedCode: string;
  expandedFolders: Set<string>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  isAddingFile: boolean;
  setIsAddingFile: (v: boolean) => void;
  isAddingFolder: boolean;
  setIsAddingFolder: (v: boolean) => void;
  targetFolderPath: string | null;
  setTargetFolderPath: (v: string | null) => void;
  newFileName: string;
  setNewFileName: (v: string) => void;
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  addFile: () => void;
  addFolder: () => void;
  saveCode: () => void;
  deleteFile: (path: string) => void;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setGraph: React.Dispatch<React.SetStateAction<WorkflowGraph>>;
  setActiveTab: (tab: SidebarTab) => void;
};

export const CodeEditorTabPanel = ({
  fileTree,
  currentFilePath,
  setCurrentFilePath,
  fileContents,
  setFileContents,
  generatedCode,
  expandedFolders,
  setExpandedFolders,
  isAddingFile,
  setIsAddingFile,
  isAddingFolder,
  setIsAddingFolder,
  targetFolderPath,
  setTargetFolderPath,
  newFileName,
  setNewFileName,
  newFolderName,
  setNewFolderName,
  addFile,
  addFolder,
  saveCode,
  deleteFile,
  setLogs,
  setChatMessages,
  setGraph,
  setActiveTab,
}: CodeEditorTabPanelProps) => {
  const handleToggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderFileTree = (items: any[], path = '') => {
    return items.map((item) => {
      const currentPath = path ? `${path}/${item.name}` : item.name;
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders.has(currentPath);

      return (
        <div key={currentPath} className="ml-4">
          <div
            className={cn(
              'flex items-center justify-between py-1 px-2 rounded hover:bg-white/5 group cursor-pointer text-sm transition-colors',
              !isFolder && currentFilePath === currentPath
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-gray-400 hover:text-white',
            )}
          >
            <div
              className="flex items-center gap-2 flex-1"
              onClick={() => {
                if (isFolder) {
                  handleToggleFolder(currentPath);
                } else {
                  setCurrentFilePath(currentPath);
                  if (!fileContents[currentPath]) {
                    const fileName = item.name.replace('.py', '');
                    const snippet = Object.entries(CODE_SNIPPETS).find(([id]) =>
                      fileName.includes(id),
                    )?.[1];
                    const content =
                      snippet ||
                      `# File: ${currentPath}\n# Implementation for ${item.name} goes here.\n\nprint("Executing ${item.name}...")`;
                    setFileContents((prev) => ({ ...prev, [currentPath]: content }));
                  }
                }
              }}
            >
              {isFolder ? (
                <>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Folder size={14} className={isExpanded ? 'text-indigo-400' : 'text-gray-500'} />
                </>
              ) : (
                <>
                  <div className="w-[14px]" />
                  <FileCode
                    size={14}
                    className={currentFilePath === currentPath ? 'text-indigo-400' : 'text-gray-600'}
                  />
                </>
              )}
              <span className={cn(isFolder ? 'font-medium' : 'font-mono text-xs')}>{item.name}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isFolder ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetFolderPath(currentPath);
                      setIsAddingFile(true);
                      setNewFileName('');
                    }}
                    className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-indigo-400"
                    title="파일 추가"
                  >
                    <Plus size={10} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetFolderPath(currentPath);
                      setIsAddingFolder(true);
                      setNewFolderName('');
                    }}
                    className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-indigo-400"
                    title="폴더 추가"
                  >
                    <FolderPlus size={10} />
                  </button>
                  {currentPath !== 'Project' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(currentPath);
                      }}
                      className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400"
                      title="폴더 삭제"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(currentPath);
                  }}
                  className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400"
                  title="삭제"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </div>
          {isFolder && isExpanded && item.children && (
            <div>{renderFileTree(item.children, currentPath)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <motion.div
      key="code"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col gap-4"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">코드 에디터</h3>
        <button
          type="button"
          onClick={saveCode}
          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded transition-all"
          title="Project 폴더 전체를 ZIP으로 내보내기 (README·requirements 포함)"
        >
          <Save size={12} /> 내보내기(ZIP)
        </button>
      </div>
      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Project{' '}
            {targetFolderPath && (
              <span className="text-indigo-400 lowercase font-normal ml-1">in {targetFolderPath}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetFolderPath('Project');
                setIsAddingFile(true);
              }}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus size={10} /> 파일
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetFolderPath('Project');
                setIsAddingFolder(true);
              }}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <FolderPlus size={10} /> 폴더
            </button>
          </div>
        </div>

        {isAddingFile && (
          <div className="px-2 mb-2 flex gap-1">
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFile()}
              placeholder="file_name.py"
              className="flex-1 bg-black/60 border border-indigo-500/30 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={addFile}
              className="bg-indigo-500 hover:bg-indigo-600 text-white p-1 rounded"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingFile(false);
                setTargetFolderPath(null);
              }}
              className="bg-white/10 hover:bg-white/20 text-white p-1 rounded"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {isAddingFolder && (
          <div className="px-2 mb-2 flex gap-1">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFolder()}
              placeholder="folder_name"
              className="flex-1 bg-black/60 border border-indigo-500/30 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={addFolder}
              className="bg-indigo-500 hover:bg-indigo-600 text-white p-1 rounded"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingFolder(false);
                setTargetFolderPath(null);
              }}
              className="bg-white/10 hover:bg-white/20 text-white p-1 rounded"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="max-h-48 overflow-y-auto custom-scrollbar">{renderFileTree(fileTree as any[])}</div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-indigo-400">{currentFilePath}</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold uppercase tracking-tighter">
              Editable
            </span>
            <button
              type="button"
              id="save-btn"
              onClick={saveCode}
              className="p-1 hover:bg-white/10 rounded text-indigo-400"
              title="프로젝트 전체 ZIP 내보내기"
            >
              <Save size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                const code = fileContents[currentFilePath] || '';
                void navigator.clipboard.writeText(code);
                setLogs((prev) => [...prev, `[SYSTEM] ${currentFilePath} 코드가 복사되었습니다.`]);
              }}
              className="p-1 hover:bg-white/10 rounded text-indigo-400"
              title="코드 복사"
            >
              <Copy size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                const code = fileContents[currentFilePath] || generatedCode;
                const blob = new Blob([code], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = currentFilePath.split('/').pop() || 'file.py';
                a.click();
              }}
              className="p-1 hover:bg-white/10 rounded text-indigo-400"
              title="다운로드"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 rounded-lg overflow-hidden border border-white/10 bg-black flex flex-col relative">
          <textarea
            value={
              fileContents[currentFilePath] ??
              (currentFilePath === WORKFLOW_GRAPH_FILE ? generatedCode : '')
            }
            onChange={(e) => {
              const newCode = e.target.value;
              setFileContents((prev) => ({
                ...prev,
                [currentFilePath]: newCode,
              }));
            }}
            spellCheck={false}
            className="flex-1 w-full h-full bg-transparent p-4 text-[12px] font-mono text-gray-300 focus:outline-none resize-none custom-scrollbar"
          />

          <button
            type="button"
            onClick={() => {
              if (confirm('새로운 워크플로우 생성을 위해 AI 빌더로 이동하시겠습니까?')) {
                setChatMessages([]);
                setGraph(INITIAL_GRAPH);
                setActiveTab('chat');
              }
            }}
            className="absolute bottom-4 right-4 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
            title="새 워크플로우 생성"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
