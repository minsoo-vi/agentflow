import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import { WorkflowGraph, Node } from '../../types';
import { executeNode } from '../../services/simulation/simulationService';
import type { AgentFlowGlobalDb, AgentFlowNodeOutputs, SimulationResultsSummary } from '../../types/simulation';

export const useWorkflowSimulation = (
  graph: WorkflowGraph,
  setGraph: Dispatch<SetStateAction<WorkflowGraph>>,
  setLogs: Dispatch<SetStateAction<string[]>>,
  globalDB: AgentFlowGlobalDb,
  setGlobalDB: Dispatch<SetStateAction<AgentFlowGlobalDb>>,
) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] = useState<SimulationResultsSummary | null>(null);
  const [nodeOutputs, setNodeOutputs] = useState<AgentFlowNodeOutputs>({});
  
  const isSimulatingRef = useRef(false);

  const stopSimulation = useCallback(() => {
    isSimulatingRef.current = false;
    setIsSimulating(false);
    setActiveNodeId(null);
    setLogs(prev => [...prev, "[SYSTEM] 시뮬레이션이 중단되었습니다."]);
  }, [setLogs]);

  const runSimulation = useCallback(async () => {
    if (isSimulating) return;
    
    isSimulatingRef.current = true;
    setIsSimulating(true);
    setLogs(prev => [...prev, `[SYSTEM] 시뮬레이션 시작: ${new Date().toLocaleTimeString()}`]);
    
    const nodes = [...graph.nodes];
    const startNode = nodes.find(n => n.type === 'start');
    
    if (!startNode) {
      setLogs(prev => [...prev, "[ERROR] 시작 노드를 찾을 수 없습니다."]);
      setIsSimulating(false);
      isSimulatingRef.current = false;
      return;
    }

    let currentNodeId = startNode.id;
    const visited = new Set<string>();
    const results: SimulationResultsSummary = { steps: [] };

    while (currentNodeId && !visited.has(currentNodeId) && isSimulatingRef.current) {
      const node = nodes.find(n => n.id === currentNodeId);
      if (!node) break;
      
      visited.add(currentNodeId);
      setActiveNodeId(currentNodeId);
      
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          setLogs(prev => [...prev, `[TEAM] ${parent.label} 내에서 실행 중...`]);
        }
      }

      // Update node status to running
      setGraph(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === node.id ? { ...n, metrics: { ...n.metrics, status: 'running' } } : n)
      }));

      setLogs(prev => [...prev, `[SIM] ${node.label} 실행 중...`]);
      
      try {
        const result = await executeNode(
          node, 
          { text: results.steps.length > 0 ? results.steps[results.steps.length - 1].output : '' }, 
          [], // logs not needed for executeNode anymore as it's handled here
          globalDB, 
          setGlobalDB, 
          graph
        );
        
        const logMessage = result.message || `[RESULT] ${node.label} 완료`;
        setLogs(prev => [...prev, logMessage]);
        
        // Store node output
        setNodeOutputs(prev => ({
          ...prev,
          [node.id]: {
            timestamp: new Date().toLocaleTimeString(),
            data: result,
            status: result.status || 'success'
          }
        }));

        const latency = `${(Math.random() * 500 + 100).toFixed(0)}ms`;
        const tokens = Math.floor(Math.random() * 1000 + 100);
        
        results.steps.push({
          nodeId: node.id,
          label: node.label,
          latency,
          tokens,
          output: result.response || result.message || JSON.stringify(result)
        });

        // Update node status to success
        setGraph(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === node.id ? { 
            ...n, 
            metrics: { 
              ...n.metrics, 
              status: result.status === 'error' ? 'error' : 'success',
              latency,
              tokens
            } 
          } : n)
        }));

        if (result.status === 'error') {
          setLogs(prev => [...prev, `[ERROR] ${node.label} 실행 중 오류가 발생하여 중단합니다.`]);
          break;
        }

        if (node.type === 'end') {
          setLogs(prev => [...prev, `[SYSTEM] 시뮬레이션 완료: 종료 노드 도달`]);
          break;
        }

        // Find next node
        const outgoingEdges = graph.edges.filter(e => e.source === node.id);
        if (outgoingEdges.length === 0) {
          setLogs(prev => [...prev, `[WARNING] ${node.label}에서 나가는 연결이 없습니다.`]);
          break;
        }

        if (node.type === 'router') {
          const decision = result.decision;
          const nextEdge = outgoingEdges.find(e => e.label === decision || e.target === decision) || outgoingEdges[0];
          setLogs(prev => [...prev, `[SIM] 라우터 결정: ${nextEdge.label || nextEdge.target}`]);
          currentNodeId = nextEdge.target;
        } else {
          currentNodeId = outgoingEdges[0].target;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        setLogs(prev => [...prev, `[ERROR] ${node.label} 실행 중 예외 발생: ${err instanceof Error ? err.message : String(err)}`]);
        break;
      }
    }

    setSimulationResults(results);
    setIsSimulating(false);
    isSimulatingRef.current = false;
    setActiveNodeId(null);
  }, [graph, isSimulating, setGraph, setLogs, globalDB, setGlobalDB]);

  return {
    isSimulating,
    activeNodeId,
    simulationResults,
    nodeOutputs,
    runSimulation,
    stopSimulation,
    setNodeOutputs
  };
};
