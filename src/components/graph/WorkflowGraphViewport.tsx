import React from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node as RFNode,
  Edge as RFEdge,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getNodeColor } from '../../lib/ui/utils';

export type WorkflowGraphViewportProps = {
  viewMode: '2d' | '3d';
  forceData: { nodes: object[]; links: object[] };
  onForceGraphNodeClick: (node: object) => void;
  rfNodes: RFNode[];
  rfEdges: RFEdge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (params: Connection) => void;
  onNodeDragStop: (e: React.MouseEvent, node: RFNode) => void;
  onPaneClick: () => void;
  onReactFlowNodeClick: (_: React.MouseEvent, node: RFNode) => void;
  onSelectionChange: (sel: { nodes: RFNode[]; edges: RFEdge[] }) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
};

export const WorkflowGraphViewport = ({
  viewMode,
  forceData,
  onForceGraphNodeClick,
  rfNodes,
  rfEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStop,
  onPaneClick,
  onReactFlowNodeClick,
  onSelectionChange,
  onDragOver,
  onDrop,
}: WorkflowGraphViewportProps) => {
  return (
    <div className="flex-1 bg-black">
      {viewMode === '3d' ? (
        <ForceGraph3D
          graphData={forceData}
          backgroundColor="#000000"
          nodeLabel="label"
          nodeColor="color"
          nodeRelSize={8}
          linkColor={(link: { isParentLink?: boolean }) =>
            link.isParentLink ? 'rgba(236, 72, 153, 0.3)' : '#333'
          }
          linkWidth={(link: { isParentLink?: boolean }) => (link.isParentLink ? 1 : 2)}
          linkDirectionalParticles={(link: { isParentLink?: boolean }) =>
            link.isParentLink ? 0 : 2
          }
          linkDirectionalParticleSpeed={0.01}
          onNodeClick={onForceGraphNodeClick}
          nodeThreeObjectExtend={true}
          nodeVal="val"
        />
      ) : (
        <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            onNodeClick={onReactFlowNodeClick}
            onSelectionChange={onSelectionChange}
            defaultEdgeOptions={{ interactionWidth: 20 }}
            fitView
          >
            <Background color="#222" gap={20} />
            <Controls />
            <MiniMap
              nodeColor={(n: { data?: { type?: string } }) => getNodeColor(n.data?.type ?? 'agent')}
              maskColor="rgba(0,0,0,0.5)"
            />
          </ReactFlow>
        </div>
      )}
    </div>
  );
};
