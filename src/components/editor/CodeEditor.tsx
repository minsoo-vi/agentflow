import React from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Check, 
  Copy, 
  FolderPlus, 
  Folder, 
  FileCode, 
  ChevronRight, 
  ChevronDown,
  Terminal
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../../lib/ui/utils';
import { FILE_TREE, CODE_SNIPPETS } from '../../constants';

interface CodeEditorProps {
  currentFilePath: string;
  setCurrentFilePath: (path: string) => void;
  fileContents: Record<string, string>;
  setFileContents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  expandedFolders: Set<string>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  isAddingFile: boolean;
  setIsAddingFile: (adding: boolean) => void;
  isAddingFolder: boolean;
  setIsAddingFolder: (adding: boolean) => void;
  newFileName: string;
  setNewFileName: (name: string) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  targetFolderPath: string;
  setTargetFolderPath: (path: string) => void;
  deleteFile: (path: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  currentFilePath,
  setCurrentFilePath,
  fileContents,
  setFileContents,
  expandedFolders,
  setExpandedFolders,
  isAddingFile,
  setIsAddingFile,
  isAddingFolder,
  setIsAddingFolder,
  newFileName,
  setNewFileName,
  newFolderName,
  setNewFolderName,
  targetFolderPath,
  setTargetFolderPath,
  deleteFile
}) => {
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderFileTree = (items: any[], path = '') => {
    return items.map(item => {
      const currentPath = path ? `${path}/${item.name}` : item.name;
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders.has(currentPath);

      return (
        <div key={currentPath} className="ml-4">
          <div 
            className={cn(
              "flex items-center justify-between py-1 px-2 rounded hover:bg-white/5 group cursor-pointer text-sm transition-colors",
              !isFolder && currentFilePath === currentPath ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white"
            )}
          >
            <div 
              className="flex items-center gap-2 flex-1"
              onClick={() => {
                if (isFolder) {
                  toggleFolder(currentPath);
                } else {
                  setCurrentFilePath(currentPath);
                  if (!fileContents[currentPath]) {
                    const fileName = item.name.replace('.py', '');
                    const snippet = Object.entries(CODE_SNIPPETS).find(([id]) => fileName.includes(id))?.[1];
                    const content = snippet || `# File: ${currentPath}\n# Implementation for ${item.name} goes here.\n\nprint("Executing ${item.name}...")`;
                    setFileContents(prev => ({ ...prev, [currentPath]: content }));
                  }
                }
              }}
            >
              {isFolder ? (
                <>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Folder size={14} className={isExpanded ? "text-indigo-400" : "text-gray-500"} />
                </>
              ) : (
                <>
                  <div className="w-[14px]" />
                  <FileCode size={14} className={currentFilePath === currentPath ? "text-indigo-400" : "text-gray-600"} />
                </>
              )}
              <span className={cn(isFolder ? "font-medium" : "font-mono text-xs")}>{item.name}</span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isFolder ? (
                <>
                  <button 
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
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(currentPath);
                  }}
                  className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400"
                  title="파일 삭제"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </div>
          {isFolder && isExpanded && item.children && (
            <div className="border-l border-white/5 ml-2">
              {renderFileTree(item.children, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#0a0a0a]">
      <div className="w-64 border-r border-white/10 flex flex-col bg-black/20">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Project Files</h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                setTargetFolderPath('Project');
                setIsAddingFile(true);
              }}
              className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {renderFileTree(FILE_TREE)}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-black/40">
        <div className="h-10 border-b border-white/10 flex items-center px-4 justify-between bg-black/20">
          <div className="flex items-center gap-2">
            <FileCode size={14} className="text-indigo-400" />
            <span className="text-xs font-mono text-gray-400">{currentFilePath}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-all">
              <Save size={14} />
            </button>
            <button className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-all">
              <Copy size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative group">
          <SyntaxHighlighter 
            language="python" 
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '24px',
              fontSize: '13px',
              lineHeight: '1.6',
              height: '100%',
              background: 'transparent',
              fontFamily: '"JetBrains Mono", monospace'
            }}
            showLineNumbers={true}
            lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#333', textAlign: 'right' }}
          >
            {fileContents[currentFilePath] || '# No file selected'}
          </SyntaxHighlighter>
          
          <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
              <Terminal size={12} />
              Python 3.11
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
