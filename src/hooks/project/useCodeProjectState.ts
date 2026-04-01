import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { CODE_SNIPPETS, FILE_TREE } from '../../constants';
import { generatePythonCode } from '../../lib/project/codeGenerator';
import {
  EXPORT_DEFAULT_README,
  EXPORT_DEFAULT_REQUIREMENTS,
  downloadProjectZip,
} from '../../lib/project/exportAgentflowProjectZip';
import {
  buildSyncedFileTreeWithExtras,
  computeNodeFilePaths,
  getDefaultNodeFileStub,
} from '../../lib/project/nodeCodePaths';
import type { WorkflowGraph } from '../../types';

const DEFAULT_FILE_CONTENTS: Record<string, string> = {
  'Project/graph.py':
    '# Workflow Graph Definition\n# This file contains the LangGraph workflow structure.\n\nfrom langgraph.graph import StateGraph, END\n\n# Define the graph...\nworkflow = StateGraph(AgentState)\n',
  /** graph.py가 갱신되면 에디터·내보내기와 동일 소스로 실행됩니다. */
  'Project/main.py': `"""Project 폴더에서: python main.py 또는 python graph.py"""
import asyncio
import graph

if __name__ == "__main__":
    asyncio.run(graph.main())
`,
  'Project/requirements.txt': EXPORT_DEFAULT_REQUIREMENTS,
  'Project/README.md': EXPORT_DEFAULT_README,
};

export const WORKFLOW_GRAPH_FILE = 'Project/graph.py';

type UseCodeProjectStateArgs = {
  graph: WorkflowGraph;
  selectedNodeId: string | undefined;
  setLogs: Dispatch<SetStateAction<string[]>>;
};

/** 코드 탭·파일 트리·그래프 동기화 및 파일 추가/삭제 */
export const useCodeProjectState = ({
  graph,
  selectedNodeId,
  setLogs,
}: UseCodeProjectStateArgs) => {
  const [fileContents, setFileContents] = useState<Record<string, string>>(DEFAULT_FILE_CONTENTS);
  const [generatedCode, setGeneratedCode] = useState('');
  const [fileTree, setFileTree] = useState(FILE_TREE);
  const [currentFilePath, setCurrentFilePath] = useState('Project/graph.py');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['Project', 'Project/agents', 'Project/tools', 'Project/mcp', 'Project/storage']),
  );
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [targetFolderPath, setTargetFolderPath] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  const nodePathByIdRef = useRef<Map<string, string>>(new Map());
  const userExtraFilePathsRef = useRef<Set<string>>(new Set());
  const prevSelectedForSnippetRef = useRef<string | undefined>(undefined);

  /** 캔버스/AI 빌더 그래프 변경 시 트리·노드 스텁·graph.py를 한 번에 맞춥니다. */
  useEffect(() => {
    const graphCode = generatePythonCode(graph);
    const paths = computeNodeFilePaths(graph.nodes);
    const prevMap = nodePathByIdRef.current;

    setGeneratedCode(graphCode);
    setFileTree(buildSyncedFileTreeWithExtras(graph.nodes, userExtraFilePathsRef.current));

    setFileContents((prev) => {
      let next = { ...prev };
      for (const [id, newPath] of paths) {
        const oldPath = prevMap.get(id);
        if (
          oldPath &&
          oldPath !== newPath &&
          next[oldPath] !== undefined &&
          next[newPath] === undefined
        ) {
          next[newPath] = next[oldPath];
          delete next[oldPath];
        }
      }
      for (const node of graph.nodes) {
        const p = paths.get(node.id);
        if (!p) continue;
        if (next[p] === undefined) {
          next[p] = getDefaultNodeFileStub(node);
        }
      }
      next[WORKFLOW_GRAPH_FILE] = graphCode;
      return next;
    });

    setCurrentFilePath((cur) => {
      for (const [id, newPath] of paths) {
        const oldPath = prevMap.get(id);
        if (oldPath && cur === oldPath && newPath !== oldPath) return newPath;
      }
      const staticOk =
        cur === WORKFLOW_GRAPH_FILE ||
        cur === 'Project/main.py' ||
        cur === 'Project/requirements.txt' ||
        cur === 'Project/README.md';
      if (staticOk) return cur;
      if ([...paths.values()].includes(cur)) return cur;
      if (userExtraFilePathsRef.current.has(cur)) return cur;
      return WORKFLOW_GRAPH_FILE;
    });

    nodePathByIdRef.current = new Map(paths);
  }, [graph]);

  /** 노드 **선택이 바뀔 때만** 해당 스니펫 파일로 이동 (그래프만 바뀌면 graph.py 포커스 유지). */
  useEffect(() => {
    if (!selectedNodeId) {
      prevSelectedForSnippetRef.current = undefined;
      return;
    }
    const node = graph.nodes.find((n) => n.id === selectedNodeId);
    if (!node?.config) return;
    const functionId =
      node.config.model || node.config.toolId || node.config.storageType || node.config.mcpId;
    if (!functionId || !CODE_SNIPPETS[functionId]) return;

    const code = CODE_SNIPPETS[functionId];
    const pathMap = computeNodeFilePaths(graph.nodes);
    const fullPath = pathMap.get(node.id);
    if (!fullPath) return;

    const selectionChanged = prevSelectedForSnippetRef.current !== selectedNodeId;
    prevSelectedForSnippetRef.current = selectedNodeId;
    if (selectionChanged) {
      setCurrentFilePath(fullPath);
    }

    setFileContents((prev) => {
      if (prev[fullPath]) return prev;
      return { ...prev, [fullPath]: code };
    });
  }, [selectedNodeId, graph.nodes]);

  const addFile = useCallback(() => {
    if (!newFileName) return;

    const fileName = newFileName.endsWith('.py') ? newFileName : `${newFileName}.py`;
    const folderPath = targetFolderPath || 'Project';
    const fullPath = `${folderPath}/${fileName}`;

    setFileTree((prev) => {
      const newTree = JSON.parse(JSON.stringify(prev));

      const findAndAdd = (items: any[], currentPath: string): boolean => {
        for (const item of items) {
          const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          if (itemPath === folderPath && item.type === 'folder') {
            if (!item.children.find((f: any) => f.name === fileName)) {
              item.children.push({ name: fileName, type: 'file' });
            }
            return true;
          }
          if (item.children && findAndAdd(item.children, itemPath)) return true;
        }
        return false;
      };

      findAndAdd(newTree, '');
      return newTree;
    });

    setFileContents((prev) => ({
      ...prev,
      [fullPath]: `# File: ${fullPath}\n# New implementation goes here.\n`,
    }));

    if (/^Project\/(agents|tools|mcp|storage)\//.test(fullPath)) {
      userExtraFilePathsRef.current.add(fullPath);
    }

    setCurrentFilePath(fullPath);
    setNewFileName('');
    setIsAddingFile(false);
    setTargetFolderPath(null);
    setLogs((prev) => [...prev, `[SYSTEM] 새 파일이 생성되었습니다: ${fullPath}`]);
  }, [newFileName, targetFolderPath, setLogs]);

  const addFolder = useCallback(() => {
    if (!newFolderName) return;

    const folderPath = targetFolderPath || 'Project';
    const fullPath = `${folderPath}/${newFolderName}`;

    setFileTree((prev) => {
      const newTree = JSON.parse(JSON.stringify(prev));

      const findAndAdd = (items: any[], currentPath: string): boolean => {
        for (const item of items) {
          const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          if (itemPath === folderPath && item.type === 'folder') {
            if (!item.children.find((f: any) => f.name === newFolderName)) {
              item.children.push({ name: newFolderName, type: 'folder', children: [] });
            }
            return true;
          }
          if (item.children && findAndAdd(item.children, itemPath)) return true;
        }
        return false;
      };

      findAndAdd(newTree, '');
      return newTree;
    });

    setNewFolderName('');
    setIsAddingFolder(false);
    setTargetFolderPath(null);
    setLogs((prev) => [...prev, `[SYSTEM] 새 폴더가 생성되었습니다: ${fullPath}`]);
  }, [newFolderName, targetFolderPath, setLogs]);

  const deleteFile = useCallback(
    (path: string) => {
      if (confirm(`${path}을(를) 삭제하시겠습니까?`)) {
        setFileTree((prev) => {
          const newTree = JSON.parse(JSON.stringify(prev));

          const findAndDelete = (items: any[], currentPath: string): boolean => {
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

              if (itemPath === path) {
                items.splice(i, 1);
                return true;
              }
              if (item.children && findAndDelete(item.children, itemPath)) return true;
            }
            return false;
          };

          findAndDelete(newTree, '');
          return newTree;
        });

        userExtraFilePathsRef.current.delete(path);

        setFileContents((prev) => {
          if (!prev[path]) return prev;
          const next = { ...prev };
          delete next[path];
          return next;
        });

        setCurrentFilePath((cur) => {
          if (cur === path || cur.startsWith(path + '/')) {
            return 'Project/graph.py';
          }
          return cur;
        });
        setLogs((prev) => [...prev, `[SYSTEM] 삭제되었습니다: ${path}`]);
      }
    },
    [setLogs],
  );

  const saveCode = useCallback(() => {
    try {
      downloadProjectZip(fileContents);
      setLogs((prev) => [
        ...prev,
        '[SYSTEM] Project 폴더 전체가 ZIP으로 내보내졌습니다. 압축 해제 후 README.md를 참고해 로컬에서 실행하세요.',
      ]);
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        `[ERROR] ZIP 내보내기 실패: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    }
  }, [fileContents, setLogs]);

  return {
    fileContents,
    setFileContents,
    generatedCode,
    setGeneratedCode,
    fileTree,
    setFileTree,
    currentFilePath,
    setCurrentFilePath,
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
    deleteFile,
    saveCode,
  };
};
