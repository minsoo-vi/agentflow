import type { Node } from '../../types';
import { FILE_TREE } from '../../constants';

/** 캔버스 노드 타입 → Project 하위 폴더 (시작/종료/라우터는 그래프 정의에만 존재) */
export const getFolderForNodeType = (type: Node['type']): string | null => {
  if (type === 'start' || type === 'end' || type === 'router') return null;
  if (type === 'tool') return 'tools';
  if (type === 'mcp') return 'mcp';
  if (type === 'database' || type === 'vector' || type === 'storage' || type === 'datasource') {
    return 'storage';
  }
  return 'agents';
};

export const labelToFileBase = (label: string): string => {
  const t = String(label ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  const safe = t.replace(/[^\w\uAC00-\uD7A3._-]/g, '');
  return safe || 'node';
};

/**
 * 노드마다 고유한 `Project/{folder}/{name}.py` 경로.
 * 동일 폴더·동일 라벨이면 두 번째부터 id 접미사로 구분합니다.
 */
export const computeNodeFilePaths = (nodes: Node[]): Map<string, string> => {
  const byFolder = new Map<string, Node[]>();
  for (const n of nodes) {
    const folder = getFolderForNodeType(n.type);
    if (!folder) continue;
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder)!.push(n);
  }

  const result = new Map<string, string>();

  for (const [folder, list] of byFolder) {
    const byBase = new Map<string, Node[]>();
    for (const n of list) {
      const b = labelToFileBase(n.label);
      if (!byBase.has(b)) byBase.set(b, []);
      byBase.get(b)!.push(n);
    }

    for (const [, group] of byBase) {
      group.sort((a, b) => a.id.localeCompare(b.id));
      group.forEach((n, idx) => {
        const base = labelToFileBase(n.label);
        const fileName =
          idx === 0 ? `${base}.py` : `${base}_${n.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}.py`;
        result.set(n.id, `Project/${folder}/${fileName}`);
      });
    }
  }

  return result;
};

const STATIC_PROJECT_FILES = [
  { name: 'main.py', type: 'file' as const },
  { name: 'graph.py', type: 'file' as const },
  { name: 'requirements.txt', type: 'file' as const },
  { name: 'README.md', type: 'file' as const },
];

export const buildSyncedFileTree = (nodes: Node[]): typeof FILE_TREE => {
  const paths = computeNodeFilePaths(nodes);
  const byFolder: Record<string, string[]> = {
    agents: [],
    tools: [],
    mcp: [],
    storage: [],
  };

  for (const p of paths.values()) {
    const segs = p.split('/');
    if (segs.length < 4 || segs[0] !== 'Project') continue;
    const folder = segs[1];
    const file = segs[2];
    if (folder in byFolder) byFolder[folder as keyof typeof byFolder].push(file);
  }

  (Object.keys(byFolder) as (keyof typeof byFolder)[]).forEach((k) => {
    byFolder[k].sort((a, b) => a.localeCompare(b));
  });

  return [
    {
      name: 'Project',
      type: 'folder',
      children: [
        {
          name: 'agents',
          type: 'folder',
          children: byFolder.agents.map((name) => ({ name, type: 'file' as const })),
        },
        {
          name: 'tools',
          type: 'folder',
          children: byFolder.tools.map((name) => ({ name, type: 'file' as const })),
        },
        {
          name: 'mcp',
          type: 'folder',
          children: byFolder.mcp.map((name) => ({ name, type: 'file' as const })),
        },
        {
          name: 'storage',
          type: 'folder',
          children: byFolder.storage.map((name) => ({ name, type: 'file' as const })),
        },
        ...STATIC_PROJECT_FILES,
      ],
    },
  ];
};

/** 노드 기반 트리에 사용자가 추가한 파일 경로(동기 폴더 하위)를 병합합니다. */
export const buildSyncedFileTreeWithExtras = (
  nodes: Node[],
  extraPaths: Set<string>
): typeof FILE_TREE => {
  const base = buildSyncedFileTree(nodes);
  const proj = base[0];
  if (!proj?.children) return base;

  const folderDirs = ['agents', 'tools', 'mcp', 'storage'] as const;
  for (const folder of folderDirs) {
    const folderNode = proj.children.find((c: { name: string }) => c.name === folder);
    if (!folderNode?.children) continue;
    const existing = new Set(folderNode.children.map((c: { name: string }) => c.name));
    for (const p of extraPaths) {
      if (!p.startsWith(`Project/${folder}/`)) continue;
      const fname = p.split('/').pop();
      if (!fname || existing.has(fname)) continue;
      folderNode.children.push({ name: fname, type: 'file' as const });
      existing.add(fname);
    }
    folderNode.children.sort((a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name)
    );
  }
  return base;
};

/** 코드 탭 `fileContents`에서 노드별 매칭 파일 본문을 모아 시뮬레이션에 넘깁니다. */
export const buildEditorCodeByNodeId = (
  nodes: Node[],
  fileContents: Record<string, string>
): Map<string, string> => {
  const pathMap = computeNodeFilePaths(nodes);
  const m = new Map<string, string>();
  for (const n of nodes) {
    const p = pathMap.get(n.id);
    const text = p ? fileContents[p] : undefined;
    if (text && String(text).trim().length > 0) {
      m.set(n.id, text);
    }
  }
  return m;
};

export const getDefaultNodeFileStub = (node: Node): string => {
  return `# ${node.label} (${node.type})
# 워크플로 노드 id: ${node.id}
# config: ${JSON.stringify(node.config ?? {})}

def run(state):
    """노드 구현 스텁 — 시뮬레이션은 simulationService를 따릅니다."""
    return state
`;

};
