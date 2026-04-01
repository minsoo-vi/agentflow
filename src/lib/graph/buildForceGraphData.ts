import { getNodeColor } from '../ui/utils';
import type { WorkflowGraph } from '../../types';

export type ForceGraphLink = {
  source: string;
  target: string;
  label?: string;
  isParentLink?: boolean;
};

/** 3D ForceGraph용 노드·링크 데이터 (팀 parent 링크 포함) */
export const buildForceGraphData = (graph: WorkflowGraph, activeNodeId: string | null) => {
  const nodes = graph.nodes.map((n) => ({
    ...n,
    color: activeNodeId === n.id ? '#fff' : getNodeColor(n.type),
    val: activeNodeId === n.id ? 20 : n.type === 'team' ? 30 : 10,
  }));

  const links: ForceGraphLink[] = [
    ...graph.edges.map((e) => ({ source: e.source, target: e.target, label: e.label })),
    ...graph.nodes
      .filter((n) => n.parentId)
      .map((n) => ({
        source: n.parentId!,
        target: n.id,
        label: 'contains',
        isParentLink: true,
      })),
  ];

  return { nodes, links };
};
