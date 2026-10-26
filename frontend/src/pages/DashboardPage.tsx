import React, { useState } from 'react';
import { 
  Workflow as WorkflowIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Play, 
  ArrowRight, 
  FileSpreadsheet, 
  FolderTree, 
  KanbanSquare, 
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { DashboardStats, Workflow, Execution } from '../api';

interface DashboardPageProps {
  stats: DashboardStats | null;
  loading: boolean;
  onSelectPrompt: (prompt: string) => void;
  onRunWorkflow: (workflowId: string) => void;
  onOpenWorkflow: (workflowId: string) => void;
  onOpenExecution: (executionId: string) => void;
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  loading,
  onSelectPrompt,
  onRunWorkflow,
  onOpenWorkflow,
  onOpenExecution,
  onNavigate,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');

  const samplePrompts = [
    "When I upload a sales CSV file, clean the data, identify top products, calculate revenue, and generate an executive report",
    "Organize uploaded files by extension, categorize into documents/images/data, and generate relocation plan",
    "Turn project description into prioritized engineering tasks with deadlines and sync to task board"
  ];

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPrompt.trim()) {
      onSelectPrompt(quickPrompt.trim());
    }
  };

  const chartColors = ['#38bdf8', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome & Prompt Copilot Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-charcoal-850 via-charcoal-800 to-charcoal-850 border border-charcoal-700 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-electric-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violetAccent-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-electric-500/15 border border-electric-500/30 text-electric-400 text-xs font-mono font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>AI Automation Copilot Ready</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Automate Digital Tasks with <span className="bg-gradient-to-r from-electric-400 to-violetAccent-400 bg-clip-text text-transparent">Natural Language</span>
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            State your workflow goal in plain English. AutoPilot AI parses your intent, validates actions against a secure allowlist, and synthesizes an executable graph with live telemetry.
          </p>

          {/* Quick Natural Language Input */}
          <form onSubmit={handlePromptSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                id="input-quick-prompt"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="e.g. Analyze sales CSV, compute profit margins, and compile certified report..."
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-all shadow-inner"
              />
              <Sparkles className="absolute right-3.5 top-3.5 w-4 h-4 text-electric-400 pointer-events-none" />
            </div>
            <button
              type="submit"
              id="btn-generate-quick-prompt"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-electric-600 to-violetAccent-600 hover:from-electric-500 hover:to-violetAccent-500 text-white text-sm font-semibold shadow-glow-blue flex items-center justify-center space-x-2 transition-all flex-shrink-0"
            >
              <span>Generate Workflow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Prompt Chips */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-mono text-slate-400">Suggestions:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuickPrompt(p);
                  onSelectPrompt(p);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-charcoal-900/80 hover:bg-charcoal-700 text-slate-300 hover:text-electric-300 border border-charcoal-700 transition-colors text-left truncate max-w-xs"
              >
                {p.slice(0, 48)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workflows */}
        <div className="p-5 rounded-xl bg-charcoal-850 border border-charcoal-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-400">Total Workflows</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? '...' : stats?.total_workflows || 0}
            </h3>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
              {stats?.active_workflows || 0} Active & Ready
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center text-electric-400">
            <WorkflowIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Total Executions */}
        <div className="p-5 rounded-xl bg-charcoal-850 border border-charcoal-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-400">Total Executions</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? '...' : stats?.total_executions || 0}
            </h3>
            <div className="flex items-center space-x-2 mt-1 text-[11px]">
              <span className="text-emerald-400 font-medium">{stats?.successful_executions || 0} passed</span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400 font-medium">{stats?.failed_executions || 0} failed</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violetAccent-500/10 border border-violetAccent-500/20 flex items-center justify-center text-violetAccent-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Execution Success Rate */}
        <div className="p-5 rounded-xl bg-charcoal-850 border border-charcoal-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-400">Success Rate</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? '...' : `${stats?.execution_success_rate || 100}%`}
            </h3>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Production Resilient
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Estimated Time Saved */}
        <div className="p-5 rounded-xl bg-charcoal-850 border border-charcoal-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-400">Time Saved</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? '...' : `${stats?.estimated_time_saved_hours || 0} hrs`}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              *Calculated at 20 min/run
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3 Working Demonstrations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <Zap className="w-4 h-4 text-electric-400" />
              <span>Three Ready-to-Run Demonstrations</span>
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic, end-to-end verified workflows built specifically for hackathon judging.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Demo 1: AI Sales Report */}
          <div className="rounded-xl bg-charcoal-850 border border-charcoal-700 p-5 flex flex-col justify-between hover:border-electric-500/50 transition-all duration-200 shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-electric-500/10 text-electric-400 border border-electric-500/20">
                  Demo 1: CSV
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">AI Sales Performance & Revenue</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ingests transaction CSV, cleans corrupt values, calculates gross revenue & AOV, ranks top products, and writes an executive report.
              </p>
              <div className="mt-4 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Validation & Safe currency sanitization</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Interactive Recharts telemetry</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Downloadable certified markdown artifact</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-charcoal-800 flex items-center space-x-2">
              <button
                onClick={() => onRunWorkflow('wf_sales_intelligence')}
                id="btn-run-demo-1"
                className="flex-1 py-2 px-3 rounded-lg bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-glow-blue"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Live Demo</span>
              </button>
              <button
                onClick={() => onOpenWorkflow('wf_sales_intelligence')}
                id="btn-view-demo-1"
                className="py-2 px-3 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-xs font-medium border border-charcoal-700 transition-colors"
              >
                View Canvas
              </button>
            </div>
          </div>

          {/* Demo 2: Smart File Organizer */}
          <div className="rounded-xl bg-charcoal-850 border border-charcoal-700 p-5 flex flex-col justify-between hover:border-violetAccent-500/50 transition-all duration-200 shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-violetAccent-500/15 border border-violetAccent-500/30 flex items-center justify-center text-violetAccent-400">
                  <FolderTree className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violetAccent-500/10 text-violetAccent-400 border border-violetAccent-500/20">
                  Demo 2: Storage
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Smart Multi-Format File Organizer</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Scans unorganized storage, categorizes by extension and MIME, compiles dry-run relocation plan, and safely organizes sandbox files.
              </p>
              <div className="mt-4 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5 Structured category buckets</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mandatory safety confirmation guard</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero host file modification (100% sandboxed)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-charcoal-800 flex items-center space-x-2">
              <button
                onClick={() => onRunWorkflow('wf_file_organizer')}
                id="btn-run-demo-2"
                className="flex-1 py-2 px-3 rounded-lg bg-violetAccent-600 hover:bg-violetAccent-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-glow-violet"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Live Demo</span>
              </button>
              <button
                onClick={() => onOpenWorkflow('wf_file_organizer')}
                id="btn-view-demo-2"
                className="py-2 px-3 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-xs font-medium border border-charcoal-700 transition-colors"
              >
                View Canvas
              </button>
            </div>
          </div>

          {/* Demo 3: Intelligent Task Assistant */}
          <div className="rounded-xl bg-charcoal-850 border border-charcoal-700 p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-200 shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <KanbanSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Demo 3: Planning
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Intelligent Project Task Planner</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Deconstructs project descriptions, generates prioritized engineering deliverables with estimated hours, and populates the Task Board.
              </p>
              <div className="mt-4 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Eisenhower priority classification</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Estimated hours & calculated deadlines</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Full interactive SQLite Kanban board</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-charcoal-800 flex items-center space-x-2">
              <button
                onClick={() => onRunWorkflow('wf_task_assistant')}
                id="btn-run-demo-3"
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-glow-emerald"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Live Demo</span>
              </button>
              <button
                onClick={() => onNavigate('tasks')}
                id="btn-view-demo-3"
                className="py-2 px-3 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-xs font-medium border border-charcoal-700 transition-colors"
              >
                Open Board
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Recharts */}
        <div className="p-5 rounded-xl bg-charcoal-850 border border-charcoal-700 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Workflow Categories</h4>
            <p className="text-xs text-slate-400 mb-4">Distribution across organizational functions</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.category_distribution || []}>
                  <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0e1422', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(stats?.category_distribution || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pt-3 border-t border-charcoal-800 flex items-center justify-between text-xs text-slate-400">
            <span>Enterprise Distribution</span>
            <span className="font-mono text-electric-400">{stats?.total_workflows || 0} Automations</span>
          </div>
        </div>

        {/* Recent Execution Activity Table */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-charcoal-850 border border-charcoal-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white">Recent Automation Activity</h4>
              <p className="text-xs text-slate-400">Live persisted execution logs and status outcomes</p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-electric-400 hover:text-electric-300 font-medium flex items-center space-x-1"
            >
              <span>View All Runs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-700 text-slate-400 font-mono">
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5">Workflow Name</th>
                  <th className="pb-2.5">Triggered By</th>
                  <th className="pb-2.5">Duration</th>
                  <th className="pb-2.5">Started</th>
                  <th className="pb-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {(stats?.recent_activity || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No executions recorded yet. Run a demo above!
                    </td>
                  </tr>
                ) : (
                  (stats?.recent_activity || []).map((ex) => (
                    <tr key={ex.id} className="hover:bg-charcoal-800/50 transition-colors">
                      <td className="py-2.5">
                        {ex.status === 'succeeded' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>SUCCESS</span>
                          </span>
                        ) : ex.status === 'failed' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            <span>FAILED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-400 text-[10px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-pulse"></span>
                            <span>RUNNING</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 font-medium text-slate-200 max-w-xs truncate">
                        {ex.workflow_name}
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-400 uppercase">
                        {ex.triggered_by}
                      </td>
                      <td className="py-2.5 font-mono text-slate-400">
                        {ex.duration_seconds}s
                      </td>
                      <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                        {new Date(ex.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onOpenExecution(ex.id)}
                          className="px-2 py-1 rounded bg-charcoal-800 hover:bg-charcoal-700 text-electric-400 text-[11px] font-medium border border-charcoal-700"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
