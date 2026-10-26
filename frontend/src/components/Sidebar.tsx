import React from 'react';
import { 
  LayoutDashboard, 
  Workflow as WorkflowIcon, 
  Layers, 
  History, 
  CheckSquare, 
  Settings as SettingsIcon,
  FolderLock,
  ExternalLink,
  Flame
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'builder', label: 'AI Automation Builder', icon: WorkflowIcon, badge: 'Copilot' },
    { id: 'workflows', label: 'Workflow Library', icon: Layers, badge: null },
    { id: 'history', label: 'Execution History', icon: History, badge: null },
    { id: 'tasks', label: 'Intelligent Task Board', icon: CheckSquare, badge: 'Demo 3' },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon, badge: null },
  ];

  return (
    <aside className="w-64 border-r border-charcoal-700 bg-charcoal-900/95 flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        {/* Navigation Category */}
        <div>
          <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-electric-500/15 text-electric-400 border border-electric-500/30 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-charcoal-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-electric-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      isActive 
                        ? 'bg-electric-500/20 text-electric-300' 
                        : 'bg-charcoal-800 text-slate-400 border border-charcoal-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Demo Fast-Track Section */}
        <div className="p-3 rounded-xl bg-charcoal-800/80 border border-charcoal-700">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Hackathon Demos</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            3 end-to-end automations ready for judge evaluation:
          </p>
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab('builder')}
              className="w-full text-left text-[11px] px-2 py-1 rounded bg-charcoal-900/60 hover:bg-charcoal-700 text-slate-300 hover:text-electric-400 transition-colors flex items-center justify-between"
            >
              <span>1. AI Sales Intelligence</span>
              <span className="text-[9px] text-emerald-400">CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className="w-full text-left text-[11px] px-2 py-1 rounded bg-charcoal-900/60 hover:bg-charcoal-700 text-slate-300 hover:text-electric-400 transition-colors flex items-center justify-between"
            >
              <span>2. Smart File Organizer</span>
              <span className="text-[9px] text-violetAccent-400">Sandbox</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className="w-full text-left text-[11px] px-2 py-1 rounded bg-charcoal-900/60 hover:bg-charcoal-700 text-slate-300 hover:text-electric-400 transition-colors flex items-center justify-between"
            >
              <span>3. Task Board Assistant</span>
              <span className="text-[9px] text-blue-400">Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & Sandbox Status Footer */}
      <div className="pt-4 border-t border-charcoal-800">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1">
          <FolderLock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Sandbox Enforced</span>
        </div>
        <p className="text-[10px] text-slate-500">
          Zero arbitrary execution. All actions verified via allowlist.
        </p>
      </div>
    </aside>
  );
};
