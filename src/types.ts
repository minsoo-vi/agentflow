import { LucideIcon } from 'lucide-react';

export interface Node {
  id: string;
  label: string;
  type: 'start' | 'end' | 'agent' | 'tool' | 'router' | 'team' | 'database' | 'vector' | 'mcp' | 'report' | 'storage' | 'python' | 'ingest' | 'chunk' | 'embed' | 'retrieve' | 'datasource';
  description?: string;
  config?: Record<string, any>;
  skills?: string[]; // Added skills property
  position?: { x: number, y: number };
  parentId?: string;
  metrics?: {
    status?: 'idle' | 'running' | 'success' | 'error';
    latency?: string;
    tokens?: number;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
  logic?: string;
  animated?: boolean;
}

export interface RegistryItem {
  id: string;
  name: string;
  desc: string;
  color: string;
  icon?: LucideIcon;
  url?: string;
}

export interface WorkflowGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface RegistryItem {
  id: string;
  name: string;
  desc: string;
  color: string;
  icon?: LucideIcon;
}
