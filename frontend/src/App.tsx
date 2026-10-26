import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { BuilderPage } from './pages/BuilderPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { HistoryPage } from './pages/HistoryPage';
import { TasksPage } from './pages/TasksPage';
import { SettingsPage } from './pages/SettingsPage';
import { 
  api, 
  DashboardStats, 
  Workflow, 
  Execution, 
  TaskItem, 
  Settings 
} from './api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Global State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Cross-page parameters
  const [builderWorkflow, setBuilderWorkflow] = useState<Workflow | null>(null);
  const [builderPrompt, setBuilderPrompt] = useState<string | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, wRes, eRes, tRes, setRes] = await Promise.all([
        api.getStats().catch(() => null),
        api.getWorkflows().catch(() => []),
        api.getExecutions().catch(() => []),
        api.getTasks().catch(() => []),
        api.getSettings().catch(() => null),
      ]);
      if (sRes) setStats(sRes);
      setWorkflows(wRes);
      setExecutions(eRes);
      setTasks(tRes);
      if (setRes) setSettings(setRes);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for cross-page navigation
  const handleSelectPromptFromDashboard = (prompt: string) => {
    setBuilderWorkflow(null);
    setBuilderPrompt(prompt);
    setActiveTab('builder');
  };

  const handleOpenWorkflowInBuilder = (workflowId: string) => {
    const wf = workflows.find((w) => w.id === workflowId);
    if (wf) {
      setBuilderWorkflow(wf);
      setBuilderPrompt(null);
      setActiveTab('builder');
    }
  };

  const handleRunWorkflowFromDashboard = async (workflowId: string) => {
    const wf = workflows.find((w) => w.id === workflowId);
    if (wf) {
      setBuilderWorkflow(wf);
      setBuilderPrompt(null);
      setActiveTab('builder');
    }
  };

  const handleOpenExecutionDetails = (executionId: string) => {
    setSelectedExecutionId(executionId);
    setActiveTab('history');
  };

  const handleCreateNewWorkflow = () => {
    setBuilderWorkflow(null);
    setBuilderPrompt('');
    setActiveTab('builder');
  };

  return (
    <div className="min-h-screen bg-charcoal-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar onNewWorkflow={handleCreateNewWorkflow} activeTab={activeTab} />

      {/* Main Body with Sidebar + Page View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-charcoal-900">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              loading={loading}
              onSelectPrompt={handleSelectPromptFromDashboard}
              onRunWorkflow={handleRunWorkflowFromDashboard}
              onOpenWorkflow={handleOpenWorkflowInBuilder}
              onOpenExecution={handleOpenExecutionDetails}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'builder' && (
            <BuilderPage
              initialWorkflow={builderWorkflow}
              initialPrompt={builderPrompt}
              onSaveWorkflowSuccess={loadData}
              onNavigateToHistory={() => setActiveTab('history')}
              onNavigateToTasks={() => setActiveTab('tasks')}
            />
          )}

          {activeTab === 'workflows' && (
            <WorkflowsPage
              workflows={workflows}
              loading={loading}
              onRefresh={loadData}
              onOpenWorkflow={handleOpenWorkflowInBuilder}
              onRunWorkflow={handleRunWorkflowFromDashboard}
              onCreateNew={handleCreateNewWorkflow}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              executions={executions}
              loading={loading}
              onRefresh={loadData}
              selectedExecutionId={selectedExecutionId}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksPage
              tasks={tasks}
              loading={loading}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              settings={settings}
              loading={loading}
              onRefresh={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
