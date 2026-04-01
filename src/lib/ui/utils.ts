import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getNodeColor = (type: string) => {
  switch (type) {
    case 'start': return '#10b981';
    case 'end': return '#ef4444';
    case 'agent': return '#6366f1';
    case 'tool': return '#f59e0b';
    case 'router': return '#8b5cf6';
    case 'team': return '#ec4899';
    case 'database': return '#3b82f6';
    case 'vector': return '#06b6d4';
    case 'mcp': return '#f43f5e';
    case 'report': return '#84cc16';
    case 'storage': return '#71717a';
    case 'datasource': return '#0d9488';
    default: return '#6b7280';
  }
};
