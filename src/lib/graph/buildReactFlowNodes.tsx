import React from 'react';
import type { Node as RFNode } from 'reactflow';
import { getNodeColor } from '../ui/utils';
import { getNodeSubLabel } from './nodeSubLabels';
import { computeLevelMaps, defaultPositionForNode } from './workflowGraphLayout';
import type { WorkflowGraph } from '../../types';

export type BuildReactFlowNodesParams = {
  graph: WorkflowGraph;
  selectedNodes: string[];
  activeNodeId: string | null;
};

/** 워크플로 그래프 → React Flow 노드 배열 (레이아웃·스타일·서브라벨 포함) */
export const buildReactFlowNodes = ({
  graph,
  selectedNodes,
  activeNodeId,
}: BuildReactFlowNodesParams): RFNode[] => {
  const { levels, nodesPerLevel } = computeLevelMaps(graph.nodes, graph.edges);

  return graph.nodes.map((n) => {
    const { x: defaultX, y: defaultY } = defaultPositionForNode(n.id, levels, nodesPerLevel);

    const subLabel = getNodeSubLabel(n);

    const labelContent =
      subLabel && n.type !== 'team' ? (
        <div className="flex flex-col gap-1 items-start w-full min-w-0">
          <span className="leading-tight">{n.label}</span>
          <span className="text-[10px] font-medium text-white/80 leading-snug w-full">{subLabel}</span>
        </div>
      ) : (
        n.label
      );

    return {
      id: n.id,
      selected: selectedNodes.includes(n.id),
      parentId: n.parentId,
      extent: (n.parentId ? 'parent' : undefined) as 'parent' | undefined,
      data: {
        label: labelContent,
        subLabel,
        type: n.type,
        metrics: n.metrics,
      },
      position: {
        x: n.position?.x ?? defaultX,
        y: n.position?.y ?? defaultY,
      },
      type: n.type === 'team' ? 'group' : 'default',
      style:
        n.type === 'team'
          ? {
              background: 'rgba(236, 72, 153, 0.05)',
              border: '2px dashed rgba(236, 72, 153, 0.3)',
              borderRadius: '16px',
              width: n.config?.width || 400,
              height: n.config?.height || 300,
            }
          : {
              background: activeNodeId === n.id ? '#4f46e5' : getNodeColor(n.type),
              color: '#fff',
              borderRadius: '12px',
              padding: '12px',
              width: 200,
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'left' as const,
              border:
                activeNodeId === n.id ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
              boxShadow:
                activeNodeId === n.id
                  ? '0 0 20px rgba(79, 70, 229, 0.6)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease',
            },
    };
  });
};
