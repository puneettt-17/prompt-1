import React from 'react';
import { Cpu, ShieldCheck, Zap, Sparkles, Plus, Terminal } from 'lucide-react';

interface NavbarProps {
  onNewWorkflow: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewWorkflow, activeTab }) => {
  return (
    <header className="h-16 border-b border-charcoal-700 bg-charcoal-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 to-violetAccent-500 flex items-center justify-center shadow-glow-blue">
          <Zap className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
              AutoPilot<span className="text-electric-400 font-mono ml-1">AI</span>
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-400 border border-electric-500/20">
              v2.4 Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Autonomous Natural-Language Automation Engine
          </p>
        </div>
      </div>

      {/* System Telemetry & Quick Action */}
      <div className="flex items-center space-x-4">
        {/* Heartbeat Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-mono text-emerald-400">ONLINE</span>
          <span className="text-slate-500">|</span>
          <ShieldCheck className="w-3.5 h-3.5 text-violetAccent-400" />
          <span className="text-slate-300">Sandbox Isolation Active</span>
        </div>

        {/* AI Provider Indicator */}
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-electric-400" />
          <span className="text-slate-400">Copilot:</span>
          <span className="font-medium text-slate-200">Deterministic Rule Engine</span>
        </div>

        {/* Create Workflow Button */}
        <button
          onClick={onNewWorkflow}
          id="btn-create-workflow-header"
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-electric-600 to-violetAccent-600 hover:from-electric-500 hover:to-violetAccent-500 text-white text-xs font-semibold shadow-glow-blue transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Create Automation</span>
        </button>
      </div>
    </header>
  );
};
