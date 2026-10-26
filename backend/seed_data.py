import os
import json
import uuid
import datetime
from database import (
    init_db, save_workflow, save_execution, save_task,
    set_setting, get_connection
)
from copilot import INTENT_PATTERNS
from actions.file_actions import seed_sample_unorganized_files

SANDBOX_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sandbox")
os.makedirs(SANDBOX_DIR, exist_ok=True)

SAMPLE_SALES_CSV_CONTENT = """Transaction_ID,Date,Product_Name,Category,Units_Sold,Unit_Price,Gross_Revenue,Region,Customer_Segment
TX-1001,2026-10-01,Cloud Server Pro,Infrastructure,5,$249.00,$1,245.00,North America,Enterprise
TX-1002,2026-10-02,AI Copilot Seat,Software,20,$49.00,$980.00,Europe,SMB
TX-1003,2026-10-02,Vector Database Cluster,Infrastructure,2,$850.00,$1,700.00,North America,Enterprise
TX-1004,2026-10-03,Developer API Key Pack,Developer Tools,15,$19.99,$299.85,Asia-Pacific,Individual
TX-1005,2026-10-04,Security Audit Suite,Cybersecurity,3,$1200.00,$3,600.00,North America,Enterprise
TX-1006,2026-10-05,Cloud Server Pro,Infrastructure,8,$249.00,$1,992.00,Europe,Enterprise
TX-1007,2026-10-06,AI Copilot Seat,Software,45,$49.00,$2,205.00,North America,Enterprise
TX-1008,2026-10-07,Monitoring Dashboard Add-on,Developer Tools,12,$79.00,$948.00,Latin America,SMB
TX-1009,2026-10-08,Vector Database Cluster,Infrastructure,4,$850.00,$3,400.00,Europe,Enterprise
TX-1010,2026-10-09,Zero-Trust Gateway,Cybersecurity,2,$1500.00,$3,000.00,North America,Enterprise
TX-1011,2026-10-10,Developer API Key Pack,Developer Tools,30,$19.99,$599.70,Europe,Individual
TX-1012,2026-10-11,AI Copilot Seat,Software,15,$49.00,$735.00,Asia-Pacific,SMB
TX-1013,2026-10-12,Cloud Server Pro,Infrastructure,10,$249.00,$2,490.00,North America,Enterprise
TX-1014,2026-10-13,Security Audit Suite,Cybersecurity,1,$1200.00,$1,200.00,Asia-Pacific,SMB
TX-1015,2026-10-14,Vector Database Cluster,Infrastructure,3,$850.00,$2,550.00,North America,Enterprise
TX-1016,2026-10-15,Developer API Key Pack,Developer Tools,25,$19.99,$499.75,Latin America,Individual
TX-1017,2026-10-16,AI Copilot Seat,Software,35,$49.00,$1,715.00,Europe,Enterprise
TX-1018,2026-10-17,Zero-Trust Gateway,Cybersecurity,1,$1500.00,$1,500.00,Europe,Enterprise
TX-1019,2026-10-18,Cloud Server Pro,Infrastructure,4,$249.00,$996.00,Asia-Pacific,SMB
TX-1020,2026-10-19,Monitoring Dashboard Add-on,Developer Tools,8,$79.00,$632.00,North America,SMB
"""

def seed_sample_sales_file():
    p = os.path.join(SANDBOX_DIR, "sample_sales.csv")
    with open(p, "w", encoding="utf-8") as f:
        f.write(SAMPLE_SALES_CSV_CONTENT.strip())

def seed_database():
    init_db()
    seed_sample_sales_file()
    seed_sample_unorganized_files()

    now = datetime.datetime.now().isoformat()
    now_dt = datetime.datetime.now()

    # 1. Seed Workflows from INTENT_PATTERNS
    wf_ids = ["wf_sales_intelligence", "wf_file_organizer", "wf_task_assistant"]
    for idx, p in enumerate(INTENT_PATTERNS):
        wf_id = wf_ids[idx]
        wf_payload = {
            "id": wf_id,
            "name": p["name"],
            "description": p["description"],
            "category": p["category"],
            "trigger_type": p["trigger_type"],
            "trigger_config": {},
            "steps": p["steps"],
            "edges": p["edges"],
            "is_active": True,
            "created_at": (now_dt - datetime.timedelta(days=3-idx)).isoformat(),
            "updated_at": now
        }
        save_workflow(wf_payload)

    # 2. Seed Additional Enterprise Workflow Templates
    extra_templates = [
        {
            "id": "wf_feedback_router",
            "name": "Customer Sentiment & Support Escalator",
            "description": "Polls incoming support tickets, categorizes customer sentiment, and triggers high-urgency notifications.",
            "category": "Customer Support",
            "trigger_type": "webhook",
            "steps": [
                {"id": "s1", "name": "Incoming Ticket Webhook", "type": "trigger", "config": {"action_type": "trigger"}},
                {"id": "s2", "name": "HTTP Health Ping", "type": "action", "config": {"action_type": "http_fetch", "params": {"url": "https://api.github.com/zen"}}},
                {"id": "s3", "name": "Urgency Condition Check", "type": "condition", "config": {"action_type": "condition_check", "params": {"field": "status_code", "operator": "==", "value": 200}}},
                {"id": "s4", "name": "Escalation Alert", "type": "output", "config": {"action_type": "send_notification", "params": {"channel": "email", "recipient": "ops-lead@autopilot.ai"}}}
            ],
            "edges": [
                {"id": "e1-2", "source": "s1", "target": "s2"},
                {"id": "e2-3", "source": "s2", "target": "s3"},
                {"id": "e3-4", "source": "s3", "target": "s4"}
            ]
        },
        {
            "id": "wf_uptime_monitor",
            "name": "Continuous Health Check & Status Beacon",
            "description": "Periodically monitors external API endpoints, evaluates HTTP latency, and dispatches status reports.",
            "category": "DevOps & Infrastructure",
            "trigger_type": "schedule",
            "steps": [
                {"id": "s1", "name": "5-Minute Cron Schedule", "type": "trigger", "config": {"action_type": "trigger"}},
                {"id": "s2", "name": "Endpoint Probe", "type": "action", "config": {"action_type": "http_fetch", "params": {"url": "https://httpbin.org/status/200"}}},
                {"id": "s3", "name": "Response Validation", "type": "condition", "config": {"action_type": "condition_check", "params": {"field": "status_code", "operator": "==", "value": 200}}},
                {"id": "s4", "name": "Status Beacon Ping", "type": "output", "config": {"action_type": "send_notification", "params": {"channel": "slack", "recipient": "#devops-telemetry"}}}
            ],
            "edges": [
                {"id": "e1-2", "source": "s1", "target": "s2"},
                {"id": "e2-3", "source": "s2", "target": "s3"},
                {"id": "e3-4", "source": "s3", "target": "s4"}
            ]
        }
    ]

    for tmpl in extra_templates:
        tmpl_payload = {
            "id": tmpl["id"],
            "name": tmpl["name"],
            "description": tmpl["description"],
            "category": tmpl["category"],
            "trigger_type": tmpl["trigger_type"],
            "trigger_config": {},
            "steps": tmpl["steps"],
            "edges": tmpl["edges"],
            "is_active": True,
            "created_at": (now_dt - datetime.timedelta(days=5)).isoformat(),
            "updated_at": now
        }
        save_workflow(tmpl_payload)

    # 3. Seed Execution History
    executions = [
        {
            "id": "exec_sales_success_01",
            "workflow_id": "wf_sales_intelligence",
            "workflow_name": "AI Sales Performance & Revenue Intelligence",
            "status": "succeeded",
            "started_at": (now_dt - datetime.timedelta(hours=2, minutes=14)).isoformat(),
            "completed_at": (now_dt - datetime.timedelta(hours=2, minutes=13, seconds=58)).isoformat(),
            "duration_seconds": 1.45,
            "step_results": [
                {"step_id": "step_trigger", "step_name": "CSV Upload Trigger", "action_type": "trigger", "status": "succeeded", "duration_seconds": 0.05, "inputs": {}, "outputs": {"triggered": True}, "logs": ["Trigger activated."]},
                {"step_id": "step_validate", "step_name": "Validate CSV Schema", "action_type": "validate_csv", "status": "succeeded", "duration_seconds": 0.22, "inputs": {}, "outputs": {"total_rows": 20, "is_valid": True}, "logs": ["Validated 20 rows."]},
                {"step_id": "step_clean", "step_name": "Sanitize & Clean Records", "action_type": "clean_data", "status": "succeeded", "duration_seconds": 0.18, "inputs": {}, "outputs": {"cleaned_rows": 20}, "logs": ["Cleaned data successfully."]},
                {"step_id": "step_metrics", "step_name": "Calculate Financial Metrics", "action_type": "calculate_metrics", "status": "succeeded", "duration_seconds": 0.35, "inputs": {}, "outputs": {"total_revenue": 31868.30, "total_transactions": 20}, "logs": ["Calculated $31,868.30 total revenue."]},
                {"step_id": "step_top_products", "step_name": "Rank Top Performing Products", "action_type": "top_products", "status": "succeeded", "duration_seconds": 0.25, "inputs": {}, "outputs": {"top_product_name": "Vector Database Cluster"}, "logs": ["Top product identified."]},
                {"step_id": "step_summary", "step_name": "Synthesize AI Executive Insights", "action_type": "generate_summary", "status": "succeeded", "duration_seconds": 0.20, "inputs": {}, "outputs": {"summary_text": "Executive analysis generated."}, "logs": ["Strategic insights synthesized."]},
                {"step_id": "step_report", "step_name": "Publish Certified Report Artifact", "action_type": "create_report_artifacts", "status": "succeeded", "duration_seconds": 0.20, "inputs": {}, "outputs": {"report_filename": "Executive_Sales_Report_Demo.md"}, "logs": ["Certified report artifact written."]}
            ],
            "error_details": None,
            "triggered_by": "manual",
            "outputs": {"total_revenue": 31868.30, "total_transactions": 20, "top_product": "Vector Database Cluster"}
        },
        {
            "id": "exec_files_success_02",
            "workflow_id": "wf_file_organizer",
            "workflow_name": "Smart Multi-Format File Organizer",
            "status": "succeeded",
            "started_at": (now_dt - datetime.timedelta(hours=5, minutes=30)).isoformat(),
            "completed_at": (now_dt - datetime.timedelta(hours=5, minutes=29, seconds=58)).isoformat(),
            "duration_seconds": 1.12,
            "step_results": [
                {"step_id": "step_trigger", "step_name": "Scan Initialization Trigger", "action_type": "trigger", "status": "succeeded", "duration_seconds": 0.05, "inputs": {}, "outputs": {}, "logs": ["Trigger invoked."]},
                {"step_id": "step_scan", "step_name": "Inspect & Catalog Files", "action_type": "scan_files", "status": "succeeded", "duration_seconds": 0.35, "inputs": {}, "outputs": {"total_files": 10}, "logs": ["Scanned 10 files in sandbox."]},
                {"step_id": "step_categorize", "step_name": "Classify by Document Type", "action_type": "categorize_files", "status": "succeeded", "duration_seconds": 0.22, "inputs": {}, "outputs": {"total_categories": 5}, "logs": ["Classified into 5 categories."]},
                {"step_id": "step_plan", "step_name": "Generate Safe Relocation Plan", "action_type": "generate_organize_plan", "status": "succeeded", "duration_seconds": 0.28, "inputs": {}, "outputs": {"total_planned_actions": 10}, "logs": ["Plan verified."]},
                {"step_id": "step_execute", "step_name": "Execute Sandboxed Organization", "action_type": "execute_file_organization", "status": "succeeded", "duration_seconds": 0.22, "inputs": {}, "outputs": {"executed_count": 10}, "logs": ["Organized 10 files."]}
            ],
            "error_details": None,
            "triggered_by": "manual",
            "outputs": {"executed_count": 10}
        },
        {
            "id": "exec_task_success_03",
            "workflow_id": "wf_task_assistant",
            "workflow_name": "Intelligent Project Task Planner & Dispatcher",
            "status": "succeeded",
            "started_at": (now_dt - datetime.timedelta(hours=12)).isoformat(),
            "completed_at": (now_dt - datetime.timedelta(hours=11, minutes=59, seconds=58)).isoformat(),
            "duration_seconds": 0.94,
            "step_results": [
                {"step_id": "step_trigger", "step_name": "Project Brief Trigger", "action_type": "trigger", "status": "succeeded", "duration_seconds": 0.04, "inputs": {}, "outputs": {}, "logs": ["Triggered."]},
                {"step_id": "step_parse", "step_name": "Analyze Architectural Scope", "action_type": "parse_project_brief", "status": "succeeded", "duration_seconds": 0.15, "inputs": {}, "outputs": {"complexity_level": "High"}, "logs": ["Parsed architectural domains."]},
                {"step_id": "step_generate", "step_name": "Synthesize Actionable Work Items", "action_type": "generate_tasks", "status": "succeeded", "duration_seconds": 0.35, "inputs": {}, "outputs": {"task_count": 8}, "logs": ["Generated 8 technical tasks."]},
                {"step_id": "step_prio", "step_name": "Rank Critical Path & Deadlines", "action_type": "prioritize_tasks", "status": "succeeded", "duration_seconds": 0.18, "inputs": {}, "outputs": {"critical_path_count": 5}, "logs": ["Priority ranked."]},
                {"step_id": "step_persist", "step_name": "Sync to Task Board DB", "action_type": "persist_tasks", "status": "succeeded", "duration_seconds": 0.22, "inputs": {}, "outputs": {"persisted_count": 8}, "logs": ["Persisted 8 tasks to SQLite."]}
            ],
            "error_details": None,
            "triggered_by": "manual",
            "outputs": {"task_count": 8}
        },
        {
            "id": "exec_feedback_fail_04",
            "workflow_id": "wf_feedback_router",
            "workflow_name": "Customer Sentiment & Support Escalator",
            "status": "failed",
            "started_at": (now_dt - datetime.timedelta(hours=18)).isoformat(),
            "completed_at": (now_dt - datetime.timedelta(hours=17, minutes=59, seconds=57)).isoformat(),
            "duration_seconds": 3.20,
            "step_results": [
                {"step_id": "s1", "step_name": "Incoming Ticket Webhook", "action_type": "trigger", "status": "succeeded", "duration_seconds": 0.05, "inputs": {}, "outputs": {}, "logs": ["Webhook received ticket payload."]},
                {"step_id": "s2", "step_name": "HTTP Health Ping", "action_type": "http_fetch", "status": "succeeded", "duration_seconds": 0.45, "inputs": {}, "outputs": {"status_code": 200}, "logs": ["Ping OK."]},
                {"step_id": "s3", "step_name": "Urgency Condition Check", "action_type": "condition_check", "status": "failed", "duration_seconds": 2.70, "inputs": {}, "outputs": {}, "logs": ["Evaluating condition...", "Attempt 1 failed: Connection timeout to upstream sentiment gateway.", "Attempt 2 failed: Connection timeout to upstream sentiment gateway.", "Exhausted 2 attempts. Step failed."], "error": "Connection timeout to upstream sentiment gateway (504 Gateway Timeout)."},
                {"step_id": "s4", "step_name": "Escalation Alert", "action_type": "send_notification", "status": "skipped", "duration_seconds": 0.0, "inputs": {}, "outputs": {}, "logs": ["Skipped due to prior step failure."]}
            ],
            "error_details": "Step 'Urgency Condition Check' failed: Connection timeout to upstream sentiment gateway (504 Gateway Timeout).",
            "triggered_by": "webhook",
            "outputs": {}
        }
    ]

    for ex in executions:
        save_execution(ex)

    # 4. Seed Initial Tasks for Demo 3 (Interactive Kanban Board)
    sample_tasks = [
        {
            "id": "task_auth_01",
            "title": "Build Multi-Factor Auth Flow",
            "description": "Implement TOTP authentication, recovery codes, and JWT refresh token cookies.",
            "priority": "urgent",
            "status": "in_progress",
            "category": "Authentication & Security",
            "deadline": (now_dt + datetime.timedelta(days=2)).strftime("%Y-%m-%d"),
            "estimated_hours": 4.5,
            "created_at": (now_dt - datetime.timedelta(days=2)).isoformat()
        },
        {
            "id": "task_db_02",
            "title": "Design Database Schema & Migration Scripts",
            "description": "Establish normalized relational tables, foreign key constraints, and WAL mode.",
            "priority": "high",
            "status": "done",
            "category": "Core Backend Architecture",
            "deadline": (now_dt + datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
            "estimated_hours": 6.0,
            "created_at": (now_dt - datetime.timedelta(days=3)).isoformat()
        },
        {
            "id": "task_webhook_03",
            "title": "Build Webhook & Event Dispatcher",
            "description": "Create resilient webhook delivery worker with exponential backoff retries.",
            "priority": "medium",
            "status": "todo",
            "category": "Core Backend Architecture",
            "deadline": (now_dt + datetime.timedelta(days=5)).strftime("%Y-%m-%d"),
            "estimated_hours": 3.5,
            "created_at": (now_dt - datetime.timedelta(days=1)).isoformat()
        },
        {
            "id": "task_ui_04",
            "title": "Interactive React Flow Workflow Canvas",
            "description": "Implement connected node graph, custom node rendering, and minimap controls.",
            "priority": "high",
            "status": "done",
            "category": "Frontend Interface",
            "deadline": (now_dt + datetime.timedelta(days=3)).strftime("%Y-%m-%d"),
            "estimated_hours": 8.0,
            "created_at": (now_dt - datetime.timedelta(days=2)).isoformat()
        },
        {
            "id": "task_e2e_05",
            "title": "Automated End-to-End Test Suite",
            "description": "Deploy integration tests verifying CSV ingestion, file moves, and task scheduling.",
            "priority": "high",
            "status": "in_progress",
            "category": "Quality Assurance",
            "deadline": (now_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            "estimated_hours": 4.0,
            "created_at": (now_dt - datetime.timedelta(days=1)).isoformat()
        }
    ]

    for t in sample_tasks:
        save_task(t)

    # 5. Default Settings
    set_setting("ai_provider", "deterministic_fallback")
    set_setting("api_key_configured", False)
    set_setting("model_name", "gemini-1.5-pro")
    set_setting("demo_mode", True)
    set_setting("max_retries", 2)
    set_setting("timeout_seconds", 30)
    set_setting("theme", "dark")
    set_setting("notifications_enabled", True)

if __name__ == "__main__":
    seed_database()
    print("Database seeded successfully with ready-to-run demo workflows, sample executions, and tasks.")
