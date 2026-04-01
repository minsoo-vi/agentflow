import { WorkflowGraph } from '../../types';
import { MODEL_REGISTRY, TOOL_REGISTRY } from '../../constants';

export const generatePythonCode = (currentGraph: WorkflowGraph): string => {
  let code = `import asyncio
from typing import Annotated, TypedDict, Union, List
from langgraph.graph import StateGraph, END

# Define state
class AgentState(TypedDict):
    messages: Annotated[List[str], "The messages in the conversation"]
    score: float
    data: dict
    next_step: str

# Define nodes
`;

  currentGraph.nodes.forEach(node => {
    if (node.type !== 'start' && node.type !== 'end' && node.type !== 'router') {
      const safeId = node.id.replace(/-/g, '_');
      code += `async def ${safeId}_node(state: AgentState):
    print(f"--- Executing ${node.label} (${node.type}) ---")
    # Node Config: ${JSON.stringify(node.config || {})}
`;
      
      switch (node.type) {
        case 'database':
          code += `    # Database operation: ${node.config?.operation || 'read'} on ${node.config?.collection || 'default'}
    return {"messages": state["messages"] + [f"DB Result from ${node.config?.collection || 'default'}"], "data": {**state.get("data", {}), "db_result": "mock_data"}}
\n`;
          break;
        case 'vector':
          code += `    # Vector search: ${node.config?.query || 'search'}
    return {"messages": state["messages"] + [f"Found relevant documents in VectorDB"], "data": {**state.get("data", {}), "docs": ["doc1", "doc2"]}}
\n`;
          break;
        case 'mcp':
          code += `    # MCP Call: ${node.config?.mcpMethod || 'call'} to ${node.config?.mcpServerUrl || 'server'}
    return {"messages": state["messages"] + [f"MCP Response from ${node.config?.mcpMethod}"]}
\n`;
          break;
        case 'report':
          code += `    # Report generation: ${node.config?.reportFormat || 'markdown'}
    return {"messages": state["messages"] + ["Report generated"], "data": {**state.get("data", {}), "report": "Report content here"}}
\n`;
          break;
        case 'storage':
          code += `    # Storage: save to ${node.config?.storagePath || '/data'}
    return {"messages": state["messages"] + ["Data saved to storage"]}
\n`;
          break;
        case 'datasource':
          code += `    # Load external data: format=${node.config?.dataFormat || 'csv'} path=${node.config?.filePath || './data/input.csv'}
    return {"messages": state["messages"] + ["Data loaded from source"], "data": {**state.get("data", {}), "imported": "rows_or_text"}}
\n`;
          break;
        case 'agent':
          const modelInfo = MODEL_REGISTRY.find(m => m.id === node.config?.model) || { name: 'Gemini 3 Flash' };
          code += `    # Agent logic: ${modelInfo.name}
    # System Instruction: ${node.config?.systemInstruction || 'You are a helpful assistant.'}
    return {"messages": state["messages"] + ["${node.label} processed"], "score": 0.85}
\n`;
          break;
        case 'tool':
          const toolInfo = TOOL_REGISTRY.find(t => t.id === node.config?.toolId) || { name: 'Google Search' };
          code += `    # Tool logic: ${toolInfo.name}
    return {"messages": state["messages"] + ["Tool ${node.label} result"]}
\n`;
          break;
        case 'ingest':
        case 'chunk':
        case 'embed':
        case 'retrieve':
          code += `    # RAG step (${node.type})
    return {"messages": state["messages"] + ["${node.type} done"], "data": {**state.get("data", {})}}
\n`;
          break;
        case 'python':
          code += `    # Python node — see config.pythonCode
    return {"messages": state["messages"] + ["python step"], "data": state.get("data", {})}
\n`;
          break;
        case 'team':
          code += `    # Team coordination: ${node.config?.teamStrategy || 'collaborative'}
    return {"messages": state["messages"] + ["${node.label} team step"], "score": state.get("score", 0.0)}
\n`;
          break;
        default:
          code += `    return {"messages": state["messages"] + ["${node.label} completed"]}\n\n`;
      }
    } else if (node.type === 'router') {
      const safeId = node.id.replace(/-/g, '_');
      code += `def ${safeId}_router(state: AgentState):
    # Routing logic: ${node.config?.routingStrategy || 'llm_decider'}
`;
      const outgoing = currentGraph.edges.filter(e => e.source === node.id);
      outgoing.forEach((edge, idx) => {
        if (edge.logic) {
          const condition = edge.logic.replace('return ', '').trim();
          if (idx === 0) {
            code += `    if ${condition}:\n        return "${edge.target}"\n`;
          } else {
            code += `    elif ${condition}:\n        return "${edge.target}"\n`;
          }
        }
      });
      
      // Fallback
      const fallback = outgoing[0]?.target || 'END';
      code += `    return "${fallback}" # Default fallback\n\n`;
    }
  });

  code += `# Initialize graph
workflow = StateGraph(AgentState)

# Add nodes
`;
  currentGraph.nodes.forEach(node => {
    if (node.type !== 'start' && node.type !== 'end' && node.type !== 'router') {
      const safeId = node.id.replace(/-/g, '_');
      code += `workflow.add_node("${node.id}", ${safeId}_node)\n`;
    }
  });

  code += `\n# Set entry point\n`;
  const startNode = currentGraph.nodes.find(n => n.type === 'start');
  const firstEdge = currentGraph.edges.find(e => e.source === startNode?.id);
  if (firstEdge) {
    code += `workflow.set_entry_point("${firstEdge.target}")\n`;
  }

  code += `\n# Add edges\n`;
  const processedRouters = new Set<string>();
  
  currentGraph.edges.forEach(edge => {
    const sourceNode = currentGraph.nodes.find(n => n.id === edge.source);
    const targetNode = currentGraph.nodes.find(n => n.id === edge.target);
    
    if (sourceNode?.type === 'router') {
      if (!processedRouters.has(edge.source)) {
        processedRouters.add(edge.source);
        const mapping: Record<string, string> = {};
        currentGraph.edges.filter(e => e.source === edge.source).forEach(e => {
          mapping[e.target] = e.target === 'end' ? 'END' : e.target;
        });
        
        const safeId = edge.source.replace(/-/g, '_');
        code += `workflow.add_conditional_edges(
    "${edge.source}",
    ${safeId}_router,
    ${JSON.stringify(mapping, null, 8).replace(/"END"/g, 'END')}
)\n`;
      }
    } else if (targetNode?.type === 'end') {
      code += `workflow.add_edge("${edge.source}", END)\n`;
    } else if (sourceNode?.type !== 'start') {
      code += `workflow.add_edge("${edge.source}", "${edge.target}")\n`;
    }
  });

  code += `\n# Compile
workflow_app = workflow.compile()

# Run
async def main():
    inputs = {"messages": ["Initial query"], "score": 0.0, "data": {}, "next_step": ""}
    async for output in workflow_app.stream(inputs):
        print(output)

if __name__ == "__main__":
    asyncio.run(main())
`;
  return code;
};
