import type { Edge, Node } from '../../types';

export type LevelMaps = {
  levels: Record<string, number>;
  nodesPerLevel: Record<number, string[]>;
};

/** start 기준 BFS로 노드 레벨·레벨별 ID 목록을 계산 (React Flow 표시·자동 정렬 공통). */
export const computeLevelMaps = (nodes: Node[], edges: Edge[]): LevelMaps => {
  const levels: Record<string, number> = {};
  const visited = new Set<string>();

  const queue: [string, number][] = [];
  const startNode = nodes.find((n) => n.type === 'start') || nodes[0];
  if (startNode) queue.push([startNode.id, 0]);

  while (queue.length > 0) {
    const [id, level] = queue.shift()!;
    if (visited.has(id)) {
      levels[id] = Math.max(levels[id] || 0, level);
      continue;
    }
    visited.add(id);
    levels[id] = level;

    const outgoing = edges.filter((e) => e.source === id);
    outgoing.forEach((e) => {
      queue.push([e.target, level + 1]);
    });
  }

  nodes.forEach((n) => {
    if (!(n.id in levels)) levels[n.id] = 0;
  });

  const nodesPerLevel: Record<number, string[]> = {};
  Object.entries(levels).forEach(([id, level]) => {
    if (!nodesPerLevel[level]) nodesPerLevel[level] = [];
    nodesPerLevel[level].push(id);
  });

  return { levels, nodesPerLevel };
};

/** 레벨 기반 그리드 좌표 (App·calculateLayout와 동일 공식). */
export const defaultPositionForNode = (
  nodeId: string,
  levels: Record<string, number>,
  nodesPerLevel: Record<number, string[]>,
): { x: number; y: number } => {
  const level = levels[nodeId] || 0;
  const indexInLevel = nodesPerLevel[level].indexOf(nodeId);
  const totalInLevel = nodesPerLevel[level].length;
  const defaultX = level * 300;
  const defaultY = (indexInLevel - (totalInLevel - 1) / 2) * 200 + 300;
  return { x: defaultX, y: defaultY };
};
