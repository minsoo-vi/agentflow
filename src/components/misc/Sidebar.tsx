import React from 'react';
import { 
  Plus, 
  Cpu, 
  Wrench, 
  GitBranch, 
  Database, 
  HardDrive, 
  Zap, 
  Layout, 
  Folder, 
  FileText, 
  PlusCircle,
  ArrowRight,
  MessageSquare,
  Code,
  Layers,
  Server,
  Maximize2,
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/ui/utils';
import { 
  MODEL_REGISTRY, 
  TOOL_REGISTRY, 
  DATABASE_REGISTRY, 
  VECTOR_REGISTRY, 
  STORAGE_REGISTRY, 
  MCP_REGISTRY 
} from '../../constants';

interface SidebarProps {
  onAddNode: (type: string, label: string, config?: any) => void;
  activeTab: 'chat' | 'nodes' | 'code' | 'library';
  setActiveTab: (tab: 'chat' | 'nodes' | 'code' | 'library') => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onAddNode, 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  children 
}) => {
  return (
    <motion.div 
      initial={false}
      animate={{ width: isOpen ? 450 : 0, opacity: isOpen ? 1 : 0 }}
      className="relative border-r border-white/10 bg-[#0a0a0a] flex flex-col h-full overflow-hidden z-30 shadow-2xl"
    >
      <div className="p-6 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">AgentFlow</h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Visual Workflow Engine</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
          >
            <Maximize2 size={18} className="rotate-180" />
          </button>
        </div>

        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          <TabButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')}
            icon={<MessageSquare size={14} />}
            label="AI Builder"
          />
          <TabButton 
            active={activeTab === 'nodes'} 
            onClick={() => setActiveTab('nodes')}
            icon={<Layout size={14} />}
            label="Palette"
          />
          <TabButton 
            active={activeTab === 'code'} 
            onClick={() => setActiveTab('code')}
            icon={<Code size={14} />}
            label="Editor"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
    )}
  >
    {icon}
    {label}
  </button>
);

export const NodePalette: React.FC<{ onAddNode: (type: string, label: string, config?: any) => void }> = ({ onAddNode }) => (
  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-black/40">
    <section>
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Core Logic Blocks</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NodePaletteItem 
          icon={<Cpu size={20} />} 
          label="AI Agent" 
          color="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
          onClick={() => onAddNode('agent', 'New Agent')}
        />
        <NodePaletteItem 
          icon={<Wrench size={20} />} 
          label="Tool Call" 
          color="bg-amber-500/10 text-amber-400 border-amber-500/20"
          onClick={() => onAddNode('tool', 'New Tool')}
        />
        <NodePaletteItem 
          icon={<GitBranch size={20} />} 
          label="Router" 
          color="bg-purple-500/10 text-purple-400 border-purple-500/20"
          onClick={() => onAddNode('router', 'New Router')}
        />
        <NodePaletteItem 
          icon={<Layers size={20} />} 
          label="Team" 
          color="bg-pink-500/10 text-pink-400 border-pink-500/20"
          onClick={() => onAddNode('team', 'New Team')}
        />
      </div>
    </section>

    <section>
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-1 h-4 bg-blue-500 rounded-full" />
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data & Persistence</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NodePaletteItem 
          icon={<Database size={20} />} 
          label="Database" 
          color="bg-blue-500/10 text-blue-400 border-blue-500/20"
          onClick={() => onAddNode('database', 'New DB')}
        />
        <NodePaletteItem 
          icon={<FileSpreadsheet size={20} />} 
          label="Data Import" 
          color="bg-teal-500/10 text-teal-400 border-teal-500/20"
          onClick={() => onAddNode('datasource', '데이터 가져오기', { dataFormat: 'csv', filePath: './data/input.csv', delimiter: ',', inlineSample: '', importedFiles: [] })}
        />
        <NodePaletteItem 
          icon={<HardDrive size={20} />} 
          label="Vector DB" 
          color="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
          onClick={() => onAddNode('vector', 'New Vector')}
        />
        <NodePaletteItem 
          icon={<Folder size={20} />} 
          label="Storage" 
          color="bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
          onClick={() => onAddNode('storage', 'New Storage')}
        />
        <NodePaletteItem 
          icon={<FileText size={20} />} 
          label="Report" 
          color="bg-lime-500/10 text-lime-400 border-lime-500/20"
          onClick={() => onAddNode('report', 'New Report')}
        />
      </div>
    </section>

    <section>
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-1 h-4 bg-rose-500 rounded-full" />
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Integration</h3>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <NodePaletteItem 
          icon={<Server size={20} />} 
          label="MCP Server Connection" 
          color="bg-rose-500/10 text-rose-400 border-rose-500/20"
          onClick={() => onAddNode('mcp', 'New MCP')}
        />
      </div>
    </section>
  </div>
);

interface NodePaletteItemProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

const NodePaletteItem: React.FC<NodePaletteItemProps> = ({ icon, label, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02, translateY: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all shadow-sm",
      color
    )}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </motion.button>
);

