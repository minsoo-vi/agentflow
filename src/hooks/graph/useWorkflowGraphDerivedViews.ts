import { useMemo } from 'react';
import type { WorkflowGraph } from '../../types';
import { buildReactFlowEdges } from '../../lib/graph/buildReactFlowEdges';
import { buildReactFlowNodes } from '../../lib/graph/buildReactFlowNodes';
import { buildForceGraphData } from '../../lib/graph/buildForceGraphData';

type UseWorkflowGraphDerivedViewsArgs = {
  graph: WorkflowGraph;
  selectedNodes: string[];
  activeNodeId: string | null;
  isSimulating: boolean;
  nodeOutputs: Record<string, unknown>;
  selectedEdges: string[];
};

/** React Flow 노드/엣지 및 3D force-graph용 파생 데이터 */
export const useWorkflowGraphDerivedViews = ({
  graph,
  selectedNodes,
  activeNodeId,
  isSimulating,
  nodeOutputs,
  selectedEdges,
}: UseWorkflowGraphDerivedViewsArgs) => {
  const rfNodes = useMemo(
    () =>
      buildReactFlowNodes({
        graph,
        selectedNodes,
        activeNodeId,
      }),
    [graph, activeNodeId, isSimulating, selectedNodes],
  );

  const rfEdges = useMemo(
    () =>
      buildReactFlowEdges(graph.edges, {
        nodeOutputs,
        selectedEdges,
        isSimulating,
        activeNodeId,
      }),
    [graph.edges, isSimulating, activeNodeId, nodeOutputs, selectedEdges],
  );

  const forceData = useMemo(() => buildForceGraphData(graph, activeNodeId), [graph, activeNodeId]);

  return { rfNodes, rfEdges, forceData };
};
