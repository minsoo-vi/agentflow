import React from 'react';
import { 
  Send, 
  Plus, 
  Zap, 
  Cpu, 
  GitBranch, 
  Database, 
  HardDrive, 
  Layout, 
  Search, 
  Server, 
  FileText, 
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/ui/utils';

interface ChatInterfaceProps {
  chatMessages: any[];
  chatInput: string;
  setChatInput: (input: string) => void;
  onSendMessage: () => void;
  isChatLoading: boolean;
  onNewChat: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatMessages,
  chatInput,
  setChatInput,
  onSendMessage,
  isChatLoading,
  onNewChat
}) => {
  return (
    <div className="h-[400px] border-t border-white/10 bg-[#0a0a0a] flex flex-col shadow-2xl z-50">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Zap size={16} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">AI Architect</h2>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Natural Language Workflow Design</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onNewChat}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
          <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Gemini 3.1 Pro
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/40">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-6">
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <Zap size={40} className="text-indigo-400" />
            </div>
            <div className="max-w-md">
              <p className="text-lg font-bold text-white mb-2 tracking-tight">How can I help you build today?</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                "Create a research workflow that searches Google for the latest AI news, summarizes it, and saves it to Firestore."
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              <SuggestionCard label="Market Research" />
              <SuggestionCard label="Content Pipeline" />
              <SuggestionCard label="Code Assistant" />
              <SuggestionCard label="Data Analysis" />
            </div>
          </div>
        ) : (
          chatMessages.map((msg, i) => (
            <div 
              key={i} 
              className={cn(
                "flex gap-4 max-w-3xl animate-in fade-in slide-in-from-bottom-2",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border shadow-sm",
                msg.role === 'user' ? "bg-white/5 border-white/10" : "bg-indigo-500 border-indigo-400"
              )}>
                {msg.role === 'user' ? <Plus size={16} className="text-gray-400" /> : <Zap size={16} className="text-white" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' ? "bg-white/5 border border-white/10 text-gray-200" : "bg-indigo-500/10 border border-indigo-500/20 text-white"
              )}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isChatLoading && (
          <div className="flex gap-4 max-w-3xl animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-indigo-400" />
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 text-sm italic">
              Architecting your workflow...
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/10 bg-[#0a0a0a]">
        <div className="relative group max-w-4xl mx-auto">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Describe the workflow you want to build..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all group-hover:border-white/20 shadow-inner"
          />
          <button 
            onClick={onSendMessage}
            disabled={isChatLoading || !chatInput.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SuggestionCard = ({ label }: { label: string }) => (
  <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-left flex items-center justify-between group">
    {label}
    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);
