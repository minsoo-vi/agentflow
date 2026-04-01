import React from 'react';
import type { Edge as AppEdge } from '../../types';
import type { Edge as RFEdge } from 'reactflow';

export type BuildReactFlowEdgesOptions = {
  nodeOutputs: Record<string, unknown>;
  selectedEdges: string[];
  isSimulating: boolean;
  activeNodeId: string | null;
};

/** React Flow `edges` 배열 — 시뮬레이션 중 소스 노드 출력 시 라벨·스타일 강조. */
export const buildReactFlowEdges = (
  edges: AppEdge[],
  {
    nodeOutputs,
    selectedEdges,
    isSimulating,
    activeNodeId,
  }: BuildReactFlowEdgesOptions,
): RFEdge[] =>
  edges.map((edge) => {
    const output = nodeOutputs[edge.source];
    return {
      ...edge,
      selected: selectedEdges.includes(edge.id),
      animated: isSimulating && activeNodeId === edge.source,
      label: output ? (
        <div className="pointer-events-none bg-indigo-600 text-[8px] text-white px-1.5 py-0.5 rounded-full border border-indigo-400 shadow-lg animate-pulse">
          DATA
        </div>
      ) : (
        edge.label || ''
      ),
      style: {
        stroke: output ? '#6366f1' : '#4b5563',
        strokeWidth: output ? 2 : 1,
      },
      labelStyle: { fill: '#9ca3af', fontSize: 11, fontWeight: 600, pointerEvents: 'none' as const },
      labelBgStyle: { fill: '#111827', fillOpacity: 0.92, pointerEvents: 'none' as const },
      labelBgPadding: [4, 2] as [number, number],
      interactionWidth: 20,
    };
  });
