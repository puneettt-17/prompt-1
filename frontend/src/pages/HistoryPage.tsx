import React, { useState } from 'react';
import { 
  History, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  Terminal, 
  ArrowRight,
  Filter,
  Eye,
  Play
} from 'lucide-react';
import { Execution, api } from '../api';

interface HistoryPageProps {
  executions: Execution[];
  loading: boolean;
  onRefresh: () => void;
  selectedExecutionId?: string | null;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  executions,
  loading,
  onRefresh,
  selectedExecutionId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'succeeded' | 'failed'>('all');
  const [activeModalExecution, setActiveModalExecution] = useState<Execution | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);

  // If selectedExecutionId was passed from dashboard
  React.useEffect(() => {
    if (selectedExecutionId && executions.length > 0) {
      const match = executions.find((e) => e.id === selectedExecutionId);
      if (match) setActiveModalExecution(match);
    }
  }, [selectedExecutionId, executions]);

  const filtered = executions.filter((e) => {
    const matchesSearch = e.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRerun = async (id: string) => {
    setIsRerunning(true);
    try {
      const newEx = await api.rerunExecution(id);
      setActiveModalExecution(newEx);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Rerun failed');
    } finally {
      setIsRerunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <History className="w-5 h-5 text-electric-400" />
            <span>Execution Telemetry & Audit Log</span>
          </h2>
          <p className="text-xs text-slate-400">
            Persistent execution history, per-step timing, inputs/outputs, and failure diagnostics
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-xs font-medium border border-charcoal-700 flex items-center space-x-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            id="input-search-history"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by workflow name or execution ID..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-charcoal-900 border border-charcoal-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 w-full sm:w-auto">
          {(['all', 'succeeded', 'failed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-colors ${
                statusFilter === st
                  ? 'bg-electric-600 text-white'
                  : 'bg-charcoal-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Executions Table */}
      <div className="p-5 rounded-xl bg-charcoal-850 border border-charcoal-700 overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-charcoal-700 text-slate-400 font-mono">
              <th className="pb-3">Status</th>
              <th className="pb-3">Workflow Name</th>
              <th className="pb-3">Execution ID</th>
              <th className="pb-3">Trigger</th>
              <th className="pb-3">Duration</th>
              <th className="pb-3">Started At</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Loading executions from SQLite database...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No execution runs found matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((ex) => (
                <tr key={ex.id} className="hover:bg-charcoal-800/60 transition-colors">
                  <td className="py-3">
                    {ex.status === 'succeeded' ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>SUCCEEDED</span>
                      </span>
                    ) : ex.status === 'failed' ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-mono border border-rose-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        <span>FAILED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-electric-500/10 text-electric-400 text-[10px] font-mono border border-electric-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-pulse"></span>
                        <span>RUNNING</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-semibold text-slate-200 max-w-xs truncate">
                    {ex.workflow_name}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-slate-400">
                    {ex.id}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-slate-400 uppercase">
                    {ex.triggered_by}
                  </td>
                  <td className="py-3 font-mono text-slate-300">
                    {ex.duration_seconds}s
                  </td>
                  <td className="py-3 font-mono text-[11px] text-slate-400">
                    {new Date(ex.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => setActiveModalExecution(ex)}
                      className="px-2.5 py-1 rounded bg-charcoal-800 hover:bg-charcoal-700 text-electric-400 text-xs font-medium border border-charcoal-700"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => handleRerun(ex.id)}
                      disabled={isRerunning}
                      className="px-2.5 py-1 rounded bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 hover:text-white text-xs font-medium border border-charcoal-700"
                    >
                      Rerun
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Execution Details Modal */}
      {activeModalExecution && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[88vh] bg-charcoal-900 border border-charcoal-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-charcoal-700 bg-charcoal-850 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>{activeModalExecution.workflow_name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                    activeModalExecution.status === 'succeeded'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {activeModalExecution.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: <span className="font-mono text-slate-300">{activeModalExecution.id}</span> • Duration: <span className="font-mono text-slate-300">{activeModalExecution.duration_seconds}s</span>
                </p>
              </div>

              <button
                onClick={() => setActiveModalExecution(null)}
                className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Failure Diagnostic Alert if failed */}
              {activeModalExecution.error_details && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Error Diagnostic Analysis</span>
                  </div>
                  <p className="font-mono text-[11px]">{activeModalExecution.error_details}</p>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-rose-500/20">
                    Recommended Fix: Verify network upstream endpoint or check retry parameters in Workflow Settings.
                  </p>
                </div>
              )}

              {/* Step Sequence Timeline */}
              <div className="space-y-3">
                <h4 className="font-mono uppercase text-slate-400 text-[11px] font-bold">
                  Step Execution Breakdown
                </h4>
                <div className="space-y-3">
                  {activeModalExecution.step_results.map((st, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-charcoal-850 border border-charcoal-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {st.status === 'succeeded' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : st.status === 'failed' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-bold text-white">{st.step_name}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            ({st.action_type})
                          </span>
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {st.duration_seconds}s
                        </span>
                      </div>

                      {/* Logs Snippet */}
                      <div className="p-2.5 rounded-lg bg-charcoal-950 font-mono text-[11px] text-slate-300 space-y-1">
                        {st.logs.map((log, lidx) => (
                          <div key={lidx} className="leading-relaxed">
                            <span className="text-slate-600 select-none">&gt; </span>
                            {log}
                          </div>
                        ))}
                        {st.error && (
                          <div className="text-rose-400 font-bold">
                            &gt; EXCEPTION: {st.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-charcoal-850 border-t border-charcoal-700 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Triggered via: <span className="font-mono text-slate-300 uppercase">{activeModalExecution.triggered_by}</span>
              </span>
              <button
                onClick={() => handleRerun(activeModalExecution.id)}
                disabled={isRerunning}
                className="px-4 py-2 rounded-lg bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-glow-blue"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Rerun Automation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
