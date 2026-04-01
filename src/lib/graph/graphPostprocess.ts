import { WorkflowGraph, Node, Edge } from '../../types';

/**
 * 라우터가 종료 노드로 직접 연결된 경우(보고서 단계 생략) 최종 보고서 노드를 끼워 넣습니다.
 * 시뮬레이션에서 통과 분기 후 반드시 통합 리포트가 생성되도록 합니다.
 */
export const insertReportBetweenRouterAndEnd = (graph: WorkflowGraph): WorkflowGraph => {
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const routerToEndEdges: Edge[] = [];

  for (const e of graph.edges) {
    const src = nodeById.get(e.source);
    const tgt = nodeById.get(e.target);
    if (src?.type === 'router' && tgt?.type === 'end') {
      routerToEndEdges.push(e);
    }
  }

  if (routerToEndEdges.length === 0) {
    return graph;
  }

  const removeIds = new Set(routerToEndEdges.map((e) => e.id));
  const newNodes: Node[] = [...graph.nodes];
  const newEdges: Edge[] = graph.edges.filter((e) => !removeIds.has(e.id));

  routerToEndEdges.forEach((e, idx) => {
    const reportId = `report_${e.source}_end_${idx}_${Date.now().toString(36)}`;
    newNodes.push({
      id: reportId,
      type: 'report',
      label: '최종 보고서',
      description: '작성자·비평가 맥락을 바탕으로 한 최종 통합 보고서입니다.',
      config: { reportFormat: 'markdown' },
    });
    newEdges.push({
      id: `${e.id}_to_report`,
      source: e.source,
      target: reportId,
      label: e.label,
      logic: e.logic,
      condition: e.condition,
    });
    newEdges.push({
      id: `${reportId}_to_end`,
      source: reportId,
      target: e.target,
      label: '',
    });
  });

  return { nodes: newNodes, edges: newEdges };
};
