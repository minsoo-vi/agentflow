import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import {
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  Node as RFNode,
  Edge as RFEdge,
} from 'reactflow';
import { CODE_SNIPPETS } from '../../constants';
import { createPaletteDroppedNode } from '../../lib/graph/createPaletteDroppedNode';
import { computeNodeFilePaths } from '../../lib/project/nodeCodePaths';
import { computeLevelMaps, defaultPositionForNode } from '../../lib/graph/workflowGraphLayout';
import type { Edge, Node, WorkflowGraph } from '../../types';

type EditorSync = {
  setFileContents: Dispatch<SetStateAction<Record<string, string>>>;
  setGeneratedCode: Dispatch<SetStateAction<string>>;
  setCurrentFilePath: Dispatch<SetStateAction<string>>;
};

type UseWorkflowGraphMutationsArgs = {
  graph: WorkflowGraph;
  setGraph: Dispatch<SetStateAction<WorkflowGraph>>;
  setSelectedNode: Dispatch<SetStateAction<Node | null>>;
  setLogs: Dispatch<SetStateAction<string[]>>;
  editorSync: EditorSync;
};

export const useWorkflowGraphMutations = ({
  graph,
  setGraph,
  setSelectedNode,
  setLogs,
  editorSync,
}: UseWorkflowGraphMutationsArgs) => {
  const { setFileContents, setGeneratedCode, setCurrentFilePath } = editorSync;

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);

  const calculateLayout = useCallback((_currentGraph: WorkflowGraph, force = false) => {
    if (force) {
      setGraph((prev) => {
        const { levels, nodesPerLevel } = computeLevelMaps(prev.nodes, prev.edges);
        return {
          ...prev,
          nodes: prev.nodes.map((n) => ({
            ...n,
            position: defaultPositionForNode(n.id, levels, nodesPerLevel),
          })),
        };
      });
    }
  }, [setGraph]);

  /** 드래그 중 매 틱 setGraph 시 RF StoreUpdater와 충돌할 수 있어, 삭제만 반영합니다. 좌표는 onNodeDragStop에서 반영. */
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const deletedNodes = changes.filter((c) => c.type === 'remove') as { id: string }[];
    if (deletedNodes.length === 0) return;

    const deletedIds = new Set(deletedNodes.map((d) => d.id));
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => !deletedIds.has(n.id)),
      edges: prev.edges.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)),
    }));
  }, [setGraph]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: RFNode) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === node.id ? { ...n, position: { x: node.position.x, y: node.position.y } } : n,
        ),
      }));
    },
    [setGraph],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        setGraph((prev) => {
          const newEdges = applyEdgeChanges(changes, prev.edges) as RFEdge[];
          return {
            ...prev,
            edges: newEdges as Edge[],
          };
        });
      }
    },
    [setGraph],
  );

  const onSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: RFNode[]; edges: RFEdge[] }) => {
      const nodeIds = nodes.map((n) => n.id);
      const edgeIds = edges.map((e) => e.id);

      setSelectedNodes((prev) => {
        if (prev.length === nodeIds.length && prev.every((id, i) => id === nodeIds[i])) return prev;
        return nodeIds;
      });

      setSelectedEdges((prev) => {
        if (prev.length === edgeIds.length && prev.every((id, i) => id === edgeIds[i])) return prev;
        return edgeIds;
      });
    },
    [],
  );

  const groupAsTeam = useCallback(() => {
    if (selectedNodes.length < 2) return;

    const teamId = `team_${Date.now()}`;
    const selectedNodesData = graph.nodes.filter((n) => selectedNodes.includes(n.id));

    const minX = Math.min(...selectedNodesData.map((n) => n.position?.x || 0));
    const minY = Math.min(...selectedNodesData.map((n) => n.position?.y || 0));
    const maxX = Math.max(...selectedNodesData.map((n) => (n.position?.x || 0) + 200));
    const maxY = Math.max(...selectedNodesData.map((n) => (n.position?.y || 0) + 100));

    const width = maxX - minX + 100;
    const height = maxY - minY + 100;

    const newTeamNode: Node = {
      id: teamId,
      type: 'team',
      label: 'New Agent Team',
      position: { x: minX - 50, y: minY - 50 },
      config: { width, height },
      metrics: { status: 'idle' },
    };

    setGraph((prev) => ({
      ...prev,
      nodes: [
        ...prev.nodes.map((n) =>
          selectedNodes.includes(n.id)
            ? {
                ...n,
                parentId: teamId,
                position: {
                  x: (n.position?.x || 0) - (minX - 50),
                  y: (n.position?.y || 0) - (minY - 50),
                },
              }
            : n,
        ),
        newTeamNode,
      ],
    }));

    setSelectedNodes([]);
    setLogs((prev) => [...prev, `[SYSTEM] 새로운 에이전트 팀이 생성되었습니다: ${teamId}`]);
  }, [selectedNodes, graph.nodes, setGraph, setLogs]);

  const ungroupTeam = useCallback(
    (teamId: string) => {
      const teamNode = graph.nodes.find((n) => n.id === teamId);
      if (!teamNode) return;

      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes
          .filter((n) => n.id !== teamId)
          .map((n) =>
            n.parentId === teamId
              ? {
                  ...n,
                  parentId: undefined,
                  position: {
                    x: (n.position?.x || 0) + (teamNode.position?.x || 0),
                    y: (n.position?.y || 0) + (teamNode.position?.y || 0),
                  },
                }
              : n,
          ),
      }));

      setLogs((prev) => [...prev, `[SYSTEM] 팀 그룹이 해제되었습니다: ${teamNode.label}`]);
    },
    [graph.nodes, setGraph, setLogs],
  );

  const deleteNode = useCallback(
    (id: string) => {
      console.log('deleteNode called for id:', id);
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== id),
        edges: prev.edges.filter((e) => e.source !== id && e.target !== id),
      }));
      setSelectedNode((prev) => (prev?.id === id ? null : prev));
    },
    [setGraph, setSelectedNode],
  );

  const updateNodeConfig = useCallback(
    (id: string, config: Record<string, unknown>) => {
      setGraph((prev) => {
        const newNodes = prev.nodes.map((n) =>
          n.id === id ? { ...n, config: { ...n.config, ...config } } : n,
        );
        return { ...prev, nodes: newNodes };
      });

      const node = graph.nodes.find((n) => n.id === id);
      if (!node) return;
      const updatedNodes = graph.nodes.map((n) =>
        n.id === id ? { ...n, config: { ...n.config, ...config } } : n,
      );
      const pathMap = computeNodeFilePaths(updatedNodes);
      const fullPath = pathMap.get(id);

      const functionId =
        (config.model as string | undefined) ||
        (config.toolId as string | undefined) ||
        (config.storageType as string | undefined) ||
        (config.mcpId as string | undefined);
      if (fullPath && functionId && CODE_SNIPPETS[functionId]) {
        setFileContents((prev) => ({
          ...prev,
          [fullPath]: CODE_SNIPPETS[functionId],
        }));
        setGeneratedCode(CODE_SNIPPETS[functionId]);
        setCurrentFilePath(fullPath);
      }
    },
    [graph.nodes, setGraph, setFileContents, setGeneratedCode, setCurrentFilePath],
  );

  const deleteEdge = useCallback(
    (id: string) => {
      setGraph((prev) => ({
        ...prev,
        edges: prev.edges.filter((e) => e.id !== id),
      }));
    },
    [setGraph],
  );

  const updateNodeLabel = useCallback(
    (id: string, label: string) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === id ? { ...n, label } : n)),
      }));
    },
    [setGraph],
  );

  const updateNodeDescription = useCallback(
    (id: string, description: string) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === id ? { ...n, description } : n)),
      }));
    },
    [setGraph],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('onConnect called:', params);
      const newEdge: Edge = {
        id: `e_${params.source}_${params.target}`,
        source: params.source!,
        target: params.target!,
        label: '',
      };
      setGraph((prev) => ({
        ...prev,
        edges: [...prev.edges, newEdge],
      }));
    },
    [setGraph],
  );

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type && event.dataTransfer.files?.length) {
        return;
      }
      if (!type) return;

      const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = createPaletteDroppedNode(type, position);

      setGraph((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
      }));
    },
    [setGraph],
  );

  return {
    selectedNodes,
    selectedEdges,
    calculateLayout,
    onNodesChange,
    onNodeDragStop,
    onEdgesChange,
    onSelectionChange,
    groupAsTeam,
    ungroupTeam,
    deleteNode,
    deleteEdge,
    updateNodeLabel,
    updateNodeDescription,
    updateNodeConfig,
    onConnect,
    onDragStart,
    onDragOver,
    onDrop,
  };
};
