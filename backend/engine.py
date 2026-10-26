import time
import datetime
import uuid
import traceback
from typing import Dict, Any, List, Optional
from database import save_execution, get_workflow_by_id
from actions.sales_actions import (
    action_validate_csv, action_clean_data, action_calculate_metrics,
    action_top_products, action_generate_summary, action_create_report_artifacts
)
from actions.file_actions import (
    action_scan_files, action_categorize_files, action_generate_organize_plan,
    action_execute_file_organization
)
from actions.task_actions import (
    action_parse_project_brief, action_generate_tasks, action_prioritize_tasks,
    action_persist_tasks
)
from actions.generic_actions import (
    action_condition_check, action_send_notification, action_http_fetch
)

ACTION_REGISTRY = {
    # Sales Intelligence Actions
    "validate_csv": action_validate_csv,
    "clean_data": action_clean_data,
    "calculate_metrics": action_calculate_metrics,
    "top_products": action_top_products,
    "generate_summary": action_generate_summary,
    "create_report_artifacts": action_create_report_artifacts,
    
    # File Organizer Actions
    "scan_files": action_scan_files,
    "categorize_files": action_categorize_files,
    "generate_organize_plan": action_generate_organize_plan,
    "execute_file_organization": action_execute_file_organization,
    
    # Task Assistant Actions
    "parse_project_brief": action_parse_project_brief,
    "generate_tasks": action_generate_tasks,
    "prioritize_tasks": action_prioritize_tasks,
    "persist_tasks": action_persist_tasks,
    
    # Generic & System Actions
    "condition_check": action_condition_check,
    "send_notification": action_send_notification,
    "http_fetch": action_http_fetch,
}

def is_action_supported(action_type: str) -> bool:
    return action_type in ACTION_REGISTRY

def validate_workflow_spec(wf: Dict[str, Any]) -> List[str]:
    """Validates workflow against safety allowlist and structural integrity."""
    errors = []
    steps = wf.get("steps", [])
    if not steps:
        errors.append("Workflow must contain at least one step.")

    for idx, s in enumerate(steps):
        s_type = s.get("type", "action")
        cfg = s.get("config", {})
        act = cfg.get("action_type")
        
        if s_type == "trigger":
            continue
            
        if not act:
            errors.append(f"Step #{idx+1} ('{s.get('name', 'unnamed')}') is missing action_type.")
        elif act not in ACTION_REGISTRY:
            errors.append(f"Step #{idx+1}: Action '{act}' is not on the approved execution allowlist.")

    return errors

def execute_workflow(
    workflow_id: str,
    override_params: Optional[Dict[str, Any]] = None,
    triggered_by: str = "manual"
) -> Dict[str, Any]:
    """Executes a workflow synchronously with bounded retries and persistent telemetry."""
    wf = get_workflow_by_id(workflow_id)
    if not wf:
        raise ValueError(f"Workflow '{workflow_id}' not found.")

    val_errors = validate_workflow_spec(wf)
    if val_errors:
        raise ValueError(f"Workflow validation failed: {'; '.join(val_errors)}")

    execution_id = f"exec_{uuid.uuid4().hex[:10]}"
    started_at = datetime.datetime.now().isoformat()
    steps = wf.get("steps", [])

    execution_record = {
        "id": execution_id,
        "workflow_id": wf["id"],
        "workflow_name": wf["name"],
        "status": "running",
        "started_at": started_at,
        "completed_at": None,
        "duration_seconds": 0.0,
        "step_results": [],
        "error_details": None,
        "triggered_by": triggered_by,
        "outputs": {}
    }
    save_execution(execution_record)

    all_outputs: Dict[str, Any] = override_params.copy() if override_params else {}
    step_results = []
    overall_status = "succeeded"
    failure_reason = None
    start_time_monotonic = time.time()

    for idx, step in enumerate(steps):
        step_id = step.get("id", f"step_{idx}")
        step_name = step.get("name", f"Step {idx+1}")
        step_type = step.get("type", "action")
        cfg = step.get("config", {})
        action_type = cfg.get("action_type", "")
        params = cfg.get("params", {}).copy()
        retries = max(0, min(cfg.get("retry_count", 1), 3))  # Bounded retries: 0 to 3

        # Merge step params with global overrides
        if override_params:
            for k, v in override_params.items():
                if k not in params:
                    params[k] = v

        step_res = {
            "step_id": step_id,
            "step_name": step_name,
            "action_type": action_type or step_type,
            "status": "running",
            "started_at": datetime.datetime.now().isoformat(),
            "completed_at": None,
            "duration_seconds": 0.0,
            "inputs": params,
            "outputs": {},
            "logs": [f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Initialized step: {step_name}"],
            "error": None
        }

        # If previous step failed and this is not a recovery step, fail
        if overall_status == "failed":
            step_res["status"] = "skipped"
            step_res["logs"].append("Skipped due to prior step failure.")
            step_results.append(step_res)
            continue

        # Handle Trigger Node
        if step_type == "trigger":
            step_res["status"] = "succeeded"
            step_res["outputs"] = {"triggered": True, "params": params}
            step_res["logs"].append(f"Trigger condition met via {wf.get('trigger_type', 'manual')}.")
            step_res["completed_at"] = datetime.datetime.now().isoformat()
            step_results.append(step_res)
            continue

        # Execute Action with Bounded Retries
        executor = ACTION_REGISTRY.get(action_type)
        if not executor:
            step_res["status"] = "failed"
            step_res["error"] = f"Action '{action_type}' is not recognized."
            step_res["logs"].append(f"ERROR: Unrecognized action '{action_type}'.")
            overall_status = "failed"
            failure_reason = step_res["error"]
            step_results.append(step_res)
            break

        attempt = 0
        step_success = False
        step_start_monotonic = time.time()

        while attempt <= retries and not step_success:
            attempt += 1
            try:
                step_res["logs"].append(f"Executing action '{action_type}' (Attempt {attempt}/{retries+1})...")
                output = executor(params, all_outputs)
                step_res["outputs"] = output
                step_res["status"] = "succeeded"
                step_res["logs"].append(output.get("status_message", "Action completed successfully."))
                step_success = True
                
                # Merge into cumulative all_outputs
                all_outputs[action_type] = output
                for k, v in output.items():
                    all_outputs[k] = v

            except Exception as e:
                err_msg = str(e)
                step_res["logs"].append(f"Attempt {attempt} failed: {err_msg}")
                if attempt > retries:
                    step_res["status"] = "failed"
                    step_res["error"] = err_msg
                    step_res["logs"].append(f"Exhausted {retries+1} attempts. Step failed.")
                    overall_status = "failed"
                    failure_reason = f"Step '{step_name}' failed: {err_msg}"
                else:
                    time.sleep(0.5)  # brief backoff

        step_res["duration_seconds"] = round(time.time() - step_start_monotonic, 3)
        step_res["completed_at"] = datetime.datetime.now().isoformat()
        step_results.append(step_res)

        # Check for condition check results
        if action_type == "condition_check":
            cond_met = step_res["outputs"].get("condition_met", True)
            if not cond_met:
                step_res["logs"].append("Conditional branch evaluated to FALSE.")

    total_duration = round(time.time() - start_time_monotonic, 3)
    completed_at = datetime.datetime.now().isoformat()

    execution_record["status"] = overall_status
    execution_record["completed_at"] = completed_at
    execution_record["duration_seconds"] = total_duration
    execution_record["step_results"] = step_results
    execution_record["error_details"] = failure_reason
    execution_record["outputs"] = all_outputs

    save_execution(execution_record)
    return execution_record
