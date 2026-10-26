import React, { useState } from 'react';
import { 
  Search, 
  Play, 
  Edit3, 
  Copy, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  Zap,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Workflow, api } from '../api';

interface WorkflowsPageProps {
  workflows: Workflow[];
  loading: boolean;
  onRefresh: () => void;
  onOpenWorkflow: (workflowId: string) => void;
  onRunWorkflow: (workflowId: string) => void;
  onCreateNew: () => void;
}

export const WorkflowsPage: React.FC<WorkflowsPageProps> = ({
  workflows,
  loading,
  onRefresh,
  onOpenWorkflow,
  onRunWorkflow,
  onCreateNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(workflows.map((w) => w.category || 'General')))];

  const filtered = workflows.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || w.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleToggleActive = async (wf: Workflow) => {
    try {
      await api.updateWorkflow(wf.id, { is_active: !wf.is_active });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateWorkflow(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate workflow');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow and its execution records?')) return;
    try {
      await api.deleteWorkflow(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-electric-400" />
            <span>Workflow Library</span>
          </h2>
          <p className="text-xs text-slate-400">
            Saved automations, trigger blueprints, and prebuilt enterprise pipelines
          </p>
        </div>

        <button
          onClick={onCreateNew}
          id="btn-create-workflow-library"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-electric-600 to-violetAccent-600 hover:from-electric-500 hover:to-violetAccent-500 text-white text-xs font-semibold shadow-glow-blue flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Automation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-700 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            id="input-search-workflows"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search workflows by name or action..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-charcoal-900 border border-charcoal-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {/* Categories Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-electric-600 text-white'
                  : 'bg-charcoal-800 text-slate-400 hover:text-slate-200 hover:bg-charcoal-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            Loading workflows from SQLite database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            No workflows matched your search. Click "New Automation" to create one.
          </div>
        ) : (
          filtered.map((wf) => (
            <div
              key={wf.id}
              className="p-5 rounded-xl bg-charcoal-850 border border-charcoal-700 flex flex-col justify-between hover:border-charcoal-600 transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-electric-500/10 text-electric-400 border border-electric-500/20">
                    {wf.category || 'General'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(wf)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                      wf.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${wf.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                    <span>{wf.is_active ? 'ACTIVE' : 'PAUSED'}</span>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-electric-300 transition-colors">
                  {wf.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {wf.description}
                </p>

                {/* Metadata Pills */}
                <div className="mt-4 pt-3 border-t border-charcoal-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{wf.steps.length} Steps</span>
                  <span className="uppercase text-slate-400">Trigger: {wf.trigger_type}</span>
                </div>

                {/* Last Run Status */}
                <div className="mt-2 text-[10px] flex items-center justify-between text-slate-500 font-mono">
                  <span>Last Run:</span>
                  {wf.last_execution_status === 'succeeded' ? (
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Succeeded</span>
                    </span>
                  ) : wf.last_execution_status === 'failed' ? (
                    <span className="text-rose-400 font-medium flex items-center space-x-1">
                      <XCircle className="w-3 h-3" />
                      <span>Failed</span>
                    </span>
                  ) : (
                    <span>Never executed</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-charcoal-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onRunWorkflow(wf.id)}
                  id={`btn-run-wf-${wf.id}`}
                  className="flex-1 py-1.5 rounded-lg bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold flex items-center justify-center space-x-1 shadow-glow-blue transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </button>
                <button
                  onClick={() => onOpenWorkflow(wf.id)}
                  id={`btn-edit-wf-${wf.id}`}
                  className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 hover:text-white border border-charcoal-700 transition-colors"
                  title="Edit in Canvas"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicate(wf.id)}
                  className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 hover:text-white border border-charcoal-700 transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(wf.id)}
                  className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-charcoal-700 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
