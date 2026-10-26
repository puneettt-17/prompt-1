import React, { useState } from 'react';
import { 
  KanbanSquare, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Tag,
  AlertCircle
} from 'lucide-react';
import { TaskItem, api } from '../api';

interface TasksPageProps {
  tasks: TaskItem[];
  loading: boolean;
  onRefresh: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ tasks, loading, onRefresh }) => {
  const [projectPrompt, setProjectPrompt] = useState(
    'Build an autonomous customer feedback engine with sentiment analysis, priority alert router, team assignments, and executive dashboards'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState('Core Architecture');
  const [newHours, setNewHours] = useState(3.0);

  const handleGenerateTasks = async () => {
    if (!projectPrompt.trim()) return;
    setIsGenerating(true);
    try {
      // Run Demo 3 workflow with custom project description override
      await api.runWorkflow('wf_task_assistant', { project_description: projectPrompt.trim() });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Task generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await api.createTask({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        category: newCategory,
        estimated_hours: newHours,
        status: 'todo',
        deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
      });
      setShowNewTaskModal(false);
      setNewTitle('');
      setNewDesc('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Task creation failed');
    }
  };

  const columns = [
    { id: 'todo', label: 'To Do', color: 'border-slate-500 text-slate-300' },
    { id: 'in_progress', label: 'In Progress', color: 'border-electric-500 text-electric-400' },
    { id: 'done', label: 'Completed', color: 'border-emerald-500 text-emerald-400' },
  ];

  const priorityBadges = {
    urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    medium: 'bg-electric-500/10 text-electric-400 border-electric-500/30',
    low: 'bg-slate-700/50 text-slate-400 border-slate-600',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <KanbanSquare className="w-5 h-5 text-emerald-400" />
            <span>Intelligent Task Assistant</span>
          </h2>
          <p className="text-xs text-slate-400">
            Demo 3: Natural language project decomposition into prioritized engineering sprints & schedule
          </p>
        </div>

        <button
          onClick={() => setShowNewTaskModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-glow-emerald flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Project Description Copilot Ingestion Bar */}
      <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-700 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-white">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Synthesize Engineering Tasks with AI Copilot</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            id="input-task-project-description"
            value={projectPrompt}
            onChange={(e) => setProjectPrompt(e.target.value)}
            placeholder="Describe your software project or feature requirements..."
            className="flex-1 p-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleGenerateTasks}
            disabled={isGenerating || !projectPrompt.trim()}
            id="btn-generate-tasks"
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-glow-emerald transition-all flex-shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Deconstructing Project...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Tasks</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Kanban Board 3-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="rounded-2xl bg-charcoal-850 border border-charcoal-700 p-4 flex flex-col min-h-[500px]">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-700 mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.id === 'done' ? 'bg-emerald-400' : col.id === 'in_progress' ? 'bg-electric-400' : 'bg-slate-400'}`}></span>
                  <h3 className="text-sm font-bold text-white">{col.label}</h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-charcoal-900 border border-charcoal-700 text-slate-400">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-500 italic">
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-700 hover:border-slate-500 transition-all shadow-md group relative space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${priorityBadges[task.priority] || priorityBadges.medium}`}>
                          {task.priority}
                        </span>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white leading-snug">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {task.description}
                      </p>

                      {/* Metadata Footer */}
                      <div className="pt-2 border-t border-charcoal-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[100px]">{task.category}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{task.estimated_hours}h</span>
                        </span>
                      </div>

                      {/* Status Transition Quick Action */}
                      <div className="pt-1 flex justify-end gap-1 text-[10px]">
                        {col.id === 'todo' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                            className="px-2 py-0.5 rounded bg-charcoal-800 hover:bg-charcoal-700 text-electric-400 border border-charcoal-700 flex items-center space-x-1"
                          >
                            <span>Start</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {col.id === 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'done')}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Complete</span>
                          </button>
                        )}
                        {col.id === 'done' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'todo')}
                            className="px-2 py-0.5 rounded bg-charcoal-800 hover:bg-charcoal-700 text-slate-400 border border-charcoal-700"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-charcoal-900 border border-charcoal-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Create New Task Item</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement webhook authentication"
                  className="w-full p-2.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Key implementation objectives..."
                  className="w-full p-2.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-slate-100"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newHours}
                    onChange={(e) => setNewHours(parseFloat(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-slate-100"
                  >
                  </input>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glow-emerald"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
