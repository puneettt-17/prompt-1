export interface WorkflowStep {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'condition' | 'output';
  description?: string;
  config: {
    action_type: string;
    params?: Record<string, any>;
    retry_count?: number;
    timeout_seconds?: number;
  };
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  execution_count?: number;
  last_execution_status?: string | null;
  last_execution_time?: string | null;
}

export interface StepExecutionResult {
  step_id: string;
  step_name: string;
  action_type: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  duration_seconds: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  logs: string[];
  error?: string | null;
}

export interface Execution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  started_at: string;
  completed_at?: string | null;
  duration_seconds: number;
  step_results: StepExecutionResult[];
  error_details?: string | null;
  triggered_by: string;
  outputs: Record<string, any>;
}

export interface DashboardStats {
  total_workflows: number;
  active_workflows: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  execution_success_rate: number;
  estimated_time_saved_hours: number;
  estimated_time_saved_label: string;
  category_distribution: { category: string; count: number }[];
  recent_activity: Execution[];
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  category: string;
  deadline?: string;
  estimated_hours: number;
  created_at: string;
}

export interface CopilotResponse {
  workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>;
  explanation: string;
  assumptions: string[];
  suggested_inputs: Record<string, any>;
  provider_used: string;
}

export interface Settings {
  ai_provider: string;
  api_key_configured: boolean;
  model_name: string;
  max_retries: number;
  timeout_seconds: number;
  demo_mode: boolean;
  notifications_enabled: boolean;
}

const API_BASE = '/api';

export const api = {
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  getStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  generateWorkflowWithCopilot: async (prompt: string): Promise<CopilotResponse> => {
    const res = await fetch(`${API_BASE}/copilot/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error('Copilot workflow generation failed');
    return res.json();
  },

  getWorkflows: async (): Promise<Workflow[]> => {
    const res = await fetch(`${API_BASE}/workflows`);
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  },

  getWorkflow: async (id: string): Promise<Workflow> => {
    const res = await fetch(`${API_BASE}/workflows/${id}`);
    if (!res.ok) throw new Error('Failed to fetch workflow');
    return res.json();
  },

  createWorkflow: async (data: Partial<Workflow>): Promise<Workflow> => {
    const res = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create workflow');
    return res.json();
  },

  updateWorkflow: async (id: string, data: Partial<Workflow>): Promise<Workflow> => {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update workflow');
    return res.json();
  },

  deleteWorkflow: async (id: string) => {
    const res = await fetch(`${API_BASE}/workflows/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete workflow');
    return res.json();
  },

  duplicateWorkflow: async (id: string): Promise<Workflow> => {
    const res = await fetch(`${API_BASE}/workflows/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to duplicate workflow');
    return res.json();
  },

  runWorkflow: async (id: string, overrides?: Record<string, any>): Promise<Execution> => {
    const res = await fetch(`${API_BASE}/workflows/${id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: overrides ? JSON.stringify(overrides) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Run failed' }));
      throw new Error(err.detail || 'Workflow execution failed');
    }
    return res.json();
  },

  getExecutions: async (): Promise<Execution[]> => {
    const res = await fetch(`${API_BASE}/executions`);
    if (!res.ok) throw new Error('Failed to fetch executions');
    return res.json();
  },

  getExecution: async (id: string): Promise<Execution> => {
    const res = await fetch(`${API_BASE}/executions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch execution details');
    return res.json();
  },

  rerunExecution: async (id: string): Promise<Execution> => {
    const res = await fetch(`${API_BASE}/executions/${id}/rerun`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to rerun execution');
    return res.json();
  },

  getTasks: async (): Promise<TaskItem[]> => {
    const res = await fetch(`${API_BASE}/tasks`);
    if (!res.ok) throw new Error('Failed to load tasks');
    return res.json();
  },

  createTask: async (task: Partial<TaskItem>): Promise<TaskItem> => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  updateTask: async (id: string, task: Partial<TaskItem>): Promise<TaskItem> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  deleteTask: async (id: string) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  getSettings: async (): Promise<Settings> => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings: Settings): Promise<Settings> => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('File upload failed');
    return res.json();
  },

  resetSandbox: async () => {
    const res = await fetch(`${API_BASE}/sandbox/reset`, { method: 'POST' });
    return res.json();
  },
};
