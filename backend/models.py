from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import datetime

class StepConfig(BaseModel):
    action_type: str
    params: Dict[str, Any] = Field(default_factory=dict)
    retry_count: int = 1
    timeout_seconds: int = 30

class Condition(BaseModel):
    field: str
    operator: str  # "==", "!=", ">", "<", ">=", "<=", "contains"
    value: Any

class WorkflowStep(BaseModel):
    id: str
    name: str
    type: str = "action"  # "trigger", "action", "condition", "output"
    description: Optional[str] = None
    config: StepConfig
    conditions: Optional[List[Condition]] = None
    position: Optional[Dict[str, float]] = None

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class WorkflowCreate(BaseModel):
    name: str
    description: str
    category: Optional[str] = "General"
    trigger_type: str = "manual"  # "manual", "file_upload", "webhook", "schedule"
    trigger_config: Dict[str, Any] = Field(default_factory=dict)
    steps: List[WorkflowStep]
    edges: List[WorkflowEdge] = Field(default_factory=list)
    is_active: bool = True

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    trigger_type: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    steps: Optional[List[WorkflowStep]] = None
    edges: Optional[List[WorkflowEdge]] = None
    is_active: Optional[bool] = None

class WorkflowResponse(WorkflowCreate):
    id: str
    created_at: str
    updated_at: str
    execution_count: int = 0
    last_execution_status: Optional[str] = None
    last_execution_time: Optional[str] = None

class StepExecutionResult(BaseModel):
    step_id: str
    step_name: str
    action_type: str
    status: str  # "pending", "running", "succeeded", "failed", "skipped"
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_seconds: float = 0.0
    inputs: Dict[str, Any] = Field(default_factory=dict)
    outputs: Dict[str, Any] = Field(default_factory=dict)
    logs: List[str] = Field(default_factory=list)
    error: Optional[str] = None

class ExecutionResponse(BaseModel):
    id: str
    workflow_id: str
    workflow_name: str
    status: str  # "pending", "running", "succeeded", "failed"
    started_at: str
    completed_at: Optional[str] = None
    duration_seconds: float = 0.0
    step_results: List[StepExecutionResult] = Field(default_factory=list)
    error_details: Optional[str] = None
    triggered_by: str = "manual"
    outputs: Dict[str, Any] = Field(default_factory=dict)

class TaskItem(BaseModel):
    id: str
    title: str
    description: str
    priority: str  # "urgent", "high", "medium", "low"
    status: str  # "todo", "in_progress", "done"
    category: str = "General"
    deadline: Optional[str] = None
    estimated_hours: float = 2.0
    created_at: str

class TaskCreate(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    status: str = "todo"
    category: str = "General"
    deadline: Optional[str] = None
    estimated_hours: float = 2.0

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    deadline: Optional[str] = None
    estimated_hours: Optional[float] = None

class CopilotPromptRequest(BaseModel):
    prompt: str
    mode: Optional[str] = "generate"  # "generate", "explain", "refine"

class CopilotPromptResponse(BaseModel):
    workflow: WorkflowCreate
    explanation: str
    assumptions: List[str]
    suggested_inputs: Dict[str, Any] = Field(default_factory=dict)
    provider_used: str

class SettingsModel(BaseModel):
    ai_provider: str = "deterministic_fallback"  # "gemini", "openai", "deterministic_fallback"
    api_key_configured: bool = False
    model_name: str = "gemini-1.5-pro"
    max_retries: int = 2
    timeout_seconds: int = 45
    demo_mode: bool = True
    notifications_enabled: bool = True
