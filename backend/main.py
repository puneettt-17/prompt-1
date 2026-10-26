import os
import uuid
import datetime
import shutil
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from database import (
    init_db, get_all_workflows, get_workflow_by_id, save_workflow,
    delete_workflow, get_executions, get_execution_by_id,
    get_all_tasks, save_task, delete_task, get_setting, set_setting,
    run_supabase_audit
)
from models import (
    WorkflowCreate, WorkflowUpdate, WorkflowResponse,
    ExecutionResponse, TaskItem, TaskCreate, TaskUpdate,
    CopilotPromptRequest, CopilotPromptResponse, SettingsModel
)
from engine import execute_workflow, ACTION_REGISTRY, is_action_supported
from copilot import generate_workflow_from_copilot
from seed_data import seed_database, SANDBOX_DIR, seed_sample_sales_file, seed_sample_unorganized_files

def load_env_files():
    candidates = [
        os.path.join(os.path.dirname(__file__), ".env.local"),
        os.path.join(os.path.dirname(__file__), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, _, v = line.partition("=")
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except:
                pass

load_env_files()

app = FastAPI(
    title="AutoPilot AI Backend",
    description="Autonomous Natural-Language Automation Engine API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    # Check if workflows exist; if empty, seed database
    existing_wfs = get_all_workflows()
    if not existing_wfs:
        seed_database()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AutoPilot AI Engine",
        "timestamp": datetime.datetime.now().isoformat(),
        "sandbox_ready": os.path.exists(SANDBOX_DIR),
        "supported_actions": list(ACTION_REGISTRY.keys()),
        "supabase_configured": bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_ANON_KEY"))
    }

@app.get("/api/supabase/status")
async def supabase_status():
    import httpx
    url = os.getenv("SUPABASE_URL", "https://tsgsgfsaavezdcpqqkpy.supabase.co")
    key = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_BCaKYkBRnJnkM8QJtDgDQw_mHHBva00")
    
    if not url or not key:
        return {"configured": False, "connected": False, "message": "Supabase credentials not found."}
        
    start = datetime.datetime.now()
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(f"{url}/auth/v1/health", headers={
                "apikey": key,
                "Authorization": f"Bearer {key}"
            })
            duration_ms = round((datetime.datetime.now() - start).total_seconds() * 1000)
            is_connected = res.status_code == 200
            data = res.json() if res.status_code == 200 else {}
            return {
                "configured": True,
                "connected": is_connected,
                "status_code": res.status_code,
                "latency_ms": duration_ms,
                "url": url,
                "version": data.get("version", "v2"),
                "service": data.get("name", "GoTrue Auth & Storage"),
                "message": f"Connected to Supabase ({data.get('name', 'GoTrue')} {data.get('version', '')} in {duration_ms}ms)" if is_connected else f"HTTP {res.status_code}"
            }
    except Exception as e:
        return {
            "configured": True,
            "connected": False,
            "url": url,
            "message": f"Connection check failed: {str(e)}"
        }

@app.get("/api/supabase/audit")
def supabase_audit_endpoint():
    return run_supabase_audit()

# --- DASHBOARD METRICS ---
@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    wfs = get_all_workflows()
    executions = get_executions(limit=100)
    
    total_wfs = len(wfs)
    active_wfs = sum(1 for w in wfs if w.get("is_active"))
    
    total_execs = len(executions)
    succeeded_execs = sum(1 for e in executions if e.get("status") == "succeeded")
    failed_execs = sum(1 for e in executions if e.get("status") == "failed")
    
    success_rate = round((succeeded_execs / total_execs * 100), 1) if total_execs > 0 else 100.0
    
    # Calculate estimated time saved: baseline 20 minutes per manual repetitive execution
    minutes_saved = succeeded_execs * 20
    hours_saved = round(minutes_saved / 60, 1)
    
    # Category distribution
    categories: Dict[str, int] = {}
    for w in wfs:
        c = w.get("category", "General")
        categories[c] = categories.get(c, 0) + 1

    return {
        "total_workflows": total_wfs,
        "active_workflows": active_wfs,
        "total_executions": total_execs,
        "successful_executions": succeeded_execs,
        "failed_executions": failed_execs,
        "execution_success_rate": success_rate,
        "estimated_time_saved_hours": hours_saved,
        "estimated_time_saved_label": f"{hours_saved} hrs saved (calculated at 20 min/execution)",
        "category_distribution": [{"category": k, "count": v} for k, v in categories.items()],
        "recent_activity": executions[:5]
    }

# --- AI COPILOT ---
@app.post("/api/copilot/generate", response_model=CopilotPromptResponse)
def copilot_generate(req: CopilotPromptRequest):
    if not req.prompt or len(req.prompt.strip()) == 0:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    
    result = generate_workflow_from_copilot(req.prompt)
    return result

# --- WORKFLOW CRUD ---
@app.get("/api/workflows")
def list_workflows():
    return get_all_workflows()

@app.get("/api/workflows/{workflow_id}")
def get_workflow(workflow_id: str):
    wf = get_workflow_by_id(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")
    return wf

@app.post("/api/workflows")
def create_workflow(payload: WorkflowCreate):
    wf_id = f"wf_{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now().isoformat()
    wf_dict = payload.model_dump()
    wf_dict["id"] = wf_id
    wf_dict["created_at"] = now
    wf_dict["updated_at"] = now
    save_workflow(wf_dict)
    return get_workflow_by_id(wf_id)

@app.put("/api/workflows/{workflow_id}")
def update_workflow(workflow_id: str, payload: WorkflowUpdate):
    wf = get_workflow_by_id(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        wf[k] = v
    wf["updated_at"] = datetime.datetime.now().isoformat()
    save_workflow(wf)
    return get_workflow_by_id(workflow_id)

@app.delete("/api/workflows/{workflow_id}")
def remove_workflow(workflow_id: str):
    deleted = delete_workflow(workflow_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    return {"message": "Workflow deleted successfully.", "id": workflow_id}

@app.post("/api/workflows/{workflow_id}/duplicate")
def duplicate_workflow(workflow_id: str):
    wf = get_workflow_by_id(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    
    new_id = f"wf_{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now().isoformat()
    wf["id"] = new_id
    wf["name"] = f"{wf['name']} (Copy)"
    wf["created_at"] = now
    wf["updated_at"] = now
    save_workflow(wf)
    return get_workflow_by_id(new_id)

@app.post("/api/workflows/{workflow_id}/run")
def run_workflow(workflow_id: str, overrides: Optional[Dict[str, Any]] = None):
    try:
        execution = execute_workflow(workflow_id, override_params=overrides, triggered_by="manual")
        return execution
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- EXECUTIONS ---
@app.get("/api/executions")
def list_executions(limit: int = 50):
    return get_executions(limit=limit)

@app.get("/api/executions/{execution_id}")
def get_execution(execution_id: str):
    ex = get_execution_by_id(execution_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Execution record not found.")
    return ex

@app.post("/api/executions/{execution_id}/rerun")
def rerun_execution(execution_id: str):
    ex = get_execution_by_id(execution_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Execution record not found.")
    
    wf_id = ex["workflow_id"]
    try:
        new_execution = execute_workflow(wf_id, override_params=None, triggered_by="rerun")
        return new_execution
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- TASKS (DEMO 3 & KANBAN) ---
@app.get("/api/tasks")
def list_tasks():
    return get_all_tasks()

@app.post("/api/tasks")
def create_task(payload: TaskCreate):
    t_id = f"task_{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now().isoformat()
    t_dict = payload.model_dump()
    t_dict["id"] = t_id
    t_dict["created_at"] = now
    save_task(t_dict)
    tasks = get_all_tasks()
    created = next((t for t in tasks if t["id"] == t_id), t_dict)
    return created

@app.put("/api/tasks/{task_id}")
def update_task_item(task_id: str, payload: TaskUpdate):
    tasks = get_all_tasks()
    t = next((item for item in tasks if item["id"] == task_id), None)
    if not t:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        t[k] = v
    save_task(t)
    return t

@app.delete("/api/tasks/{task_id}")
def remove_task(task_id: str):
    deleted = delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"message": "Task deleted.", "id": task_id}

# --- SETTINGS ---
@app.get("/api/settings")
def read_settings():
    return {
        "ai_provider": get_setting("ai_provider", "deterministic_fallback"),
        "api_key_configured": bool(get_setting("api_key_configured", False)),
        "model_name": get_setting("model_name", "gemini-1.5-pro"),
        "max_retries": int(get_setting("max_retries", 2)),
        "timeout_seconds": int(get_setting("timeout_seconds", 30)),
        "demo_mode": bool(get_setting("demo_mode", True)),
        "notifications_enabled": bool(get_setting("notifications_enabled", True))
    }

@app.put("/api/settings")
def update_settings(payload: SettingsModel):
    set_setting("ai_provider", payload.ai_provider)
    set_setting("api_key_configured", payload.api_key_configured)
    set_setting("model_name", payload.model_name)
    set_setting("max_retries", payload.max_retries)
    set_setting("timeout_seconds", payload.timeout_seconds)
    set_setting("demo_mode", payload.demo_mode)
    set_setting("notifications_enabled", payload.notifications_enabled)
    return payload

# --- FILE OPERATIONS & ARTIFACTS ---
@app.post("/api/files/upload")
async def upload_file(file: UploadFile = File(...)):
    # Sanitize filename and restrict to sandbox
    clean_name = os.path.basename(file.filename)
    target_path = os.path.join(SANDBOX_DIR, clean_name)
    
    with open(target_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    return {
        "filename": clean_name,
        "size_bytes": len(content),
        "status": "uploaded",
        "sandbox_path": clean_name
    }

@app.get("/api/files/download/{filename}")
def download_file(filename: str):
    clean_name = os.path.basename(filename)
    file_path = os.path.join(SANDBOX_DIR, clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found in sandbox.")
    return FileResponse(file_path, filename=clean_name)

@app.get("/api/sandbox/files")
def list_sandbox_files():
    files = []
    if os.path.exists(SANDBOX_DIR):
        for f in os.listdir(SANDBOX_DIR):
            fp = os.path.join(SANDBOX_DIR, f)
            if os.path.isfile(fp):
                files.append({
                    "name": f,
                    "size": os.path.getsize(fp),
                    "modified": datetime.datetime.fromtimestamp(os.path.getmtime(fp)).isoformat()
                })
    return {"sandbox_directory": SANDBOX_DIR, "files": files}

@app.post("/api/sandbox/reset")
def reset_sandbox():
    seed_database()
    return {"message": "Sandbox workspace reset and sample demo data refreshed successfully."}
