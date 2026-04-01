import React from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  MarkerType,
  Node as RFNode,
  Edge as RFEdge,
  NodeChange,
  EdgeChange,
  Connection
} from 'reactflow';
import ForceGraph3D from 'react-force-graph-3d';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/ui/utils';
import { WorkflowGraph, Node, Edge } from '../../types';

interface GraphViewProps {
  viewMode: '2d' | '3d' | 'code';
  graph: WorkflowGraph;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: RFNode) => void;
  onPaneClick: () => void;
  activeNodeId: string | null;
  getNodeColor: (type: string) => string;
  forceData: any;
}

export const GraphView: React.FC<GraphViewProps> = ({
  viewMode,
  graph,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  activeNodeId,
  getNodeColor,
  forceData
}) => {
  const rfNodes: RFNode[] = graph.nodes.map(node => ({
    id: node.id,
    type: 'default',
    data: { 
      label: (
        <div className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-500",
          activeNodeId === node.id ? "scale-110 shadow-2xl shadow-white/20 ring-2 ring-white/50 bg-white/10" : ""
        )}>
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">{node.type}</div>
          <div className="font-bold text-xs">{node.label}</div>
          {node.metrics?.status === 'running' && (
            <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-full h-full bg-indigo-400"
              />
            </div>
          )}
        </div>
      )
    },
    position: node.position || { x: Math.random() * 400, y: Math.random() * 400 },
    style: {
      background: activeNodeId === node.id ? '#fff' : getNodeColor(node.type),
      color: activeNodeId === node.id ? '#000' : '#fff',
      borderRadius: '12px',
      border: activeNodeId === node.id ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
      padding: '10px',
      width: 150,
      boxShadow: activeNodeId === node.id ? '0 0 30px rgba(255,255,255,0.3)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }));

  const rfEdges: RFEdge[] = graph.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: activeNodeId === edge.source || edge.animated,
    style: { 
      stroke: activeNodeId === edge.source ? '#fff' : 'rgba(255,255,255,0.2)', 
      strokeWidth: activeNodeId === edge.source ? 3 : 1,
      transition: 'all 0.3s ease'
    },
    labelStyle: { fill: '#888', fontWeight: 700, fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed, color: activeNodeId === edge.source ? '#fff' : 'rgba(255,255,255,0.2)' }
  }));

  return (
    <div className="flex-1 relative bg-[#050505] overflow-hidden">
      <AnimatePresence mode="wait">
        {viewMode === '2d' ? (
          <motion.div 
            key="2d"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full h-full"
          >
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={(connection) => {
                console.log("GraphView onConnect triggered:", connection);
                onConnect(connection);
              }}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              className="bg-dot-pattern"
            >
              <Background color="#333" gap={20} />
              <Controls className="bg-[#0a0a0a] border-white/10 fill-white" />
              <MiniMap 
                nodeColor={(n) => {
                  const node = graph.nodes.find(gn => gn.id === n.id);
                  return node ? getNodeColor(node.type) : '#333';
                }}
                maskColor="rgba(0,0,0,0.5)"
                className="bg-[#0a0a0a] border-white/10"
              />
            </ReactFlow>
          </motion.div>
        ) : viewMode === '3d' ? (
          <motion.div 
            key="3d"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <ForceGraph3D
              graphData={forceData}
              nodeLabel="label"
              nodeAutoColorBy="type"
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
              backgroundColor="#050505"
              linkColor={() => 'rgba(255,255,255,0.1)'}
              nodeThreeObjectExtend={true}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
