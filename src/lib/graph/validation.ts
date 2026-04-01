import { WorkflowGraph } from '../../types';

export const validateWorkflow = (graph: WorkflowGraph): { valid: boolean; error?: string } => {
  if (!graph.nodes || graph.nodes.length === 0) {
    return { valid: false, error: "워크플로우에 노드가 없습니다." };
  }

  const hasStart = graph.nodes.some(n => n.type === 'start');
  const hasEnd = graph.nodes.some(n => n.type === 'end');

  if (!hasStart) return { valid: false, error: "워크플로우에 'start' 노드가 필요합니다." };
  if (!hasEnd) return { valid: false, error: "워크플로우에 'end' 노드가 필요합니다." };

  // Check for disconnected nodes (simple check)
  // Every node (except start) should have an incoming edge
  // Every node (except end) should have an outgoing edge
  
  for (const node of graph.nodes) {
    if (node.type !== 'start') {
      const hasIncoming = graph.edges.some(e => e.target === node.id);
      if (!hasIncoming) return { valid: false, error: `노드 '${node.label}'에 연결된 입력이 없습니다.` };
    }
    if (node.type !== 'end') {
      const hasOutgoing = graph.edges.some(e => e.source === node.id);
      if (!hasOutgoing) return { valid: false, error: `노드 '${node.label}'에 연결된 출력이 없습니다.` };
    }
  }

  return { valid: true };
};
