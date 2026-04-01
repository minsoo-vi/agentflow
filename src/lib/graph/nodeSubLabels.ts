import {
  MODEL_REGISTRY,
  TOOL_REGISTRY,
  DATABASE_REGISTRY,
  VECTOR_REGISTRY,
  STORAGE_REGISTRY,
  MCP_REGISTRY,
} from '../../constants';
import type { Node } from '../../types';

/** React Flow 노드에 표시할 보조 라벨(모델·도구·스토리지 등). */
export const getNodeSubLabel = (n: Node): string => {
  if (n.type === 'agent') {
    const model = MODEL_REGISTRY.find((m) => m.id === n.config?.model);
    return model ? model.name : 'Gemini 3 Flash';
  }
  if (n.type === 'tool') {
    const tool = TOOL_REGISTRY.find((t) => t.id === n.config?.toolId);
    return tool ? tool.name : 'Google Search';
  }
  if (n.type === 'database') {
    const db = DATABASE_REGISTRY.find((s) => s.id === n.config?.storageType);
    return db ? db.name : 'Firestore DB';
  }
  if (n.type === 'vector') {
    const vdb = VECTOR_REGISTRY.find((s) => s.id === n.config?.storageType);
    return vdb ? vdb.name : 'Vector DB';
  }
  if (n.type === 'storage') {
    const storage = STORAGE_REGISTRY.find((s) => s.id === n.config?.storageType);
    return storage ? storage.name : 'Local Cache';
  }
  if (n.type === 'mcp') {
    const mcp = MCP_REGISTRY.find((m) => m.id === n.config?.mcpId);
    return mcp ? mcp.name : 'MCP Server';
  }
  if (n.type === 'router') {
    const routingLabels: Record<string, string> = {
      llm_decider: 'LLM Decider',
      round_robin: 'Round Robin',
      least_busy: 'Least Busy',
    };
    const sid = n.config?.routingStrategy || 'llm_decider';
    return routingLabels[sid] ?? routingLabels.llm_decider;
  }
  if (n.type === 'datasource') {
    const fmt = (n.config?.dataFormat as string) || 'csv';
    return fmt.toUpperCase();
  }
  return '';
};
