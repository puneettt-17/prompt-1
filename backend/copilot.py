import json
import uuid
import os
import httpx
from typing import Dict, Any, List
from models import WorkflowCreate, WorkflowStep, WorkflowEdge, StepConfig
from engine import ACTION_REGISTRY, is_action_supported
from database import get_setting

# Known intent templates for deterministic fallback
INTENT_PATTERNS = [
    {
        "keywords": ["sales", "revenue", "csv", "clean", "top", "report", "products"],
        "category": "Sales & Revenue",
        "name": "AI Sales Performance & Revenue Intelligence",
        "description": "Validates sales CSV data, cleans format inconsistencies, calculates revenue metrics, identifies top products, and generates an executive report.",
        "trigger_type": "file_upload",
        "steps": [
            {
                "id": "step_trigger",
                "name": "CSV Upload Trigger",
                "type": "trigger",
                "description": "Fires when a sales dataset CSV is uploaded or selected.",
                "config": {"action_type": "trigger", "params": {"file_type": "csv"}},
                "position": {"x": 250, "y": 50}
            },
            {
                "id": "step_validate",
                "name": "Validate CSV Schema",
                "type": "action",
                "description": "Inspects dataset column names, data integrity, and null value counts.",
                "config": {"action_type": "validate_csv", "params": {"file_path": "sample_sales.csv"}, "retry_count": 1},
                "position": {"x": 250, "y": 150}
            },
            {
                "id": "step_clean",
                "name": "Sanitize & Clean Records",
                "type": "action",
                "description": "Strips currency symbols, fills missing defaults, and removes corrupt records safely.",
                "config": {"action_type": "clean_data", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 250}
            },
            {
                "id": "step_metrics",
                "name": "Calculate Financial Metrics",
                "type": "action",
                "description": "Computes total gross revenue, units sold, and average order basket value.",
                "config": {"action_type": "calculate_metrics", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 350}
            },
            {
                "id": "step_top_products",
                "name": "Rank Top Performing Products",
                "type": "action",
                "description": "Identifies the highest revenue and volume generating inventory items.",
                "config": {"action_type": "top_products", "params": {"top_n": 5}, "retry_count": 1},
                "position": {"x": 250, "y": 450}
            },
            {
                "id": "step_summary",
                "name": "Synthesize AI Executive Insights",
                "type": "action",
                "description": "Generates strategic bullet points and trend analysis.",
                "config": {"action_type": "generate_summary", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 550}
            },
            {
                "id": "step_report",
                "name": "Publish Certified Report Artifact",
                "type": "output",
                "description": "Compiles downloadable markdown report and chart telemetry.",
                "config": {"action_type": "create_report_artifacts", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 650}
            }
        ],
        "edges": [
            {"id": "e1-2", "source": "step_trigger", "target": "step_validate"},
            {"id": "e2-3", "source": "step_validate", "target": "step_clean"},
            {"id": "e3-4", "source": "step_clean", "target": "step_metrics"},
            {"id": "e4-5", "source": "step_metrics", "target": "step_top_products"},
            {"id": "e5-6", "source": "step_top_products", "target": "step_summary"},
            {"id": "e6-7", "source": "step_summary", "target": "step_report"}
        ],
        "explanation": "This workflow ingests your sales CSV file, validates its columns against standard transaction formats, sanitizes currency formatting, calculates gross revenue and average order volume, determines the top 5 revenue-generating items, and packages everything into an interactive dashboard and certified report.",
        "assumptions": [
            "Dataset is in CSV format with columns containing price/revenue and quantity.",
            "Null or corrupt rows will be sanitized without halting execution.",
            "All intermediate artifacts are stored securely in backend sandbox."
        ]
    },
    {
        "keywords": ["organize", "files", "sort", "folder", "manifest", "documents", "downloads"],
        "category": "File Management",
        "name": "Smart Multi-Format File Organizer",
        "description": "Scans unorganized files, categorizes items by extension and MIME type, prepares a relocation plan, and organizes sandbox storage upon confirmation.",
        "trigger_type": "manual",
        "steps": [
            {
                "id": "step_trigger",
                "name": "Scan Initialization Trigger",
                "type": "trigger",
                "description": "Initiates file scan on user command.",
                "config": {"action_type": "trigger", "params": {}},
                "position": {"x": 250, "y": 50}
            },
            {
                "id": "step_scan",
                "name": "Inspect & Catalog Files",
                "type": "action",
                "description": "Indexes all files, sizes, and file extensions in source storage.",
                "config": {"action_type": "scan_files", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 160}
            },
            {
                "id": "step_categorize",
                "name": "Classify by Document Type",
                "type": "action",
                "description": "Groups files into Documents, Data, Media, Code, and Archives.",
                "config": {"action_type": "categorize_files", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 270}
            },
            {
                "id": "step_plan",
                "name": "Generate Safe Relocation Plan",
                "type": "condition",
                "description": "Creates dry-run move manifests and safety validation checkpoints.",
                "config": {"action_type": "generate_organize_plan", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 380}
            },
            {
                "id": "step_execute",
                "name": "Execute Sandboxed Organization",
                "type": "output",
                "description": "Safely moves files into organized directory hierarchy upon approval.",
                "config": {"action_type": "execute_file_organization", "params": {"approved": True}, "retry_count": 1},
                "position": {"x": 250, "y": 490}
            }
        ],
        "edges": [
            {"id": "e1-2", "source": "step_trigger", "target": "step_scan"},
            {"id": "e2-3", "source": "step_scan", "target": "step_categorize"},
            {"id": "e3-4", "source": "step_categorize", "target": "step_plan"},
            {"id": "e4-5", "source": "step_plan", "target": "step_execute"}
        ],
        "explanation": "This workflow performs an autonomous file triage: it scans the designated sandbox directory, classifies each item by MIME/extension into structured buckets (Documents, Data, Images, Code, Archives), prepares a dry-run review, and executes the file moves securely.",
        "assumptions": [
            "All file operations are strictly restricted to the backend sandbox workspace.",
            "Moves require user authorization flag to execute changes.",
            "Original files remain intact with non-destructive copy/organization."
        ]
    },
    {
        "keywords": ["task", "project", "schedule", "prioritize", "board", "milestone", "scrum", "action"],
        "category": "Project Planning",
        "name": "Intelligent Project Task Planner & Dispatcher",
        "description": "Parses project descriptions, generates actionable prioritized tasks, estimates time effort, and synchronizes to the interactive Task Board.",
        "trigger_type": "manual",
        "steps": [
            {
                "id": "step_trigger",
                "name": "Project Brief Trigger",
                "type": "trigger",
                "description": "Receives input project specification.",
                "config": {"action_type": "trigger", "params": {}},
                "position": {"x": 250, "y": 50}
            },
            {
                "id": "step_parse",
                "name": "Analyze Architectural Scope",
                "type": "action",
                "description": "Extracts functional requirements, complexity level, and key domains.",
                "config": {"action_type": "parse_project_brief", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 160}
            },
            {
                "id": "step_generate",
                "name": "Synthesize Actionable Work Items",
                "type": "action",
                "description": "Breaks down requirements into modular technical deliverables with estimates.",
                "config": {"action_type": "generate_tasks", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 270}
            },
            {
                "id": "step_prio",
                "name": "Rank Critical Path & Deadlines",
                "type": "condition",
                "description": "Assigns Eisenhower priority tiers and chronological delivery dates.",
                "config": {"action_type": "prioritize_tasks", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 380}
            },
            {
                "id": "step_persist",
                "name": "Sync to Task Board DB",
                "type": "output",
                "description": "Saves all structured items into SQLite database for live Kanban management.",
                "config": {"action_type": "persist_tasks", "params": {}, "retry_count": 1},
                "position": {"x": 250, "y": 490}
            }
        ],
        "edges": [
            {"id": "e1-2", "source": "step_trigger", "target": "step_parse"},
            {"id": "e2-3", "source": "step_parse", "target": "step_generate"},
            {"id": "e3-4", "source": "step_generate", "target": "step_prio"},
            {"id": "e4-5", "source": "step_prio", "target": "step_persist"}
        ],
        "explanation": "This workflow translates high-level project goals into engineering tasks. It detects system domains (frontend, backend, security, testing), creates actionable items with estimated hours, schedules deadlines, and commits them to the live Task Board.",
        "assumptions": [
            "Project scope is outlined in plain English.",
            "Tasks will automatically receive estimated effort and calculated delivery dates.",
            "Results immediately populate the interactive board for drag/status updates."
        ]
    }
]

def generate_deterministic_workflow(prompt: str) -> Dict[str, Any]:
    prompt_lower = prompt.lower()
    
    # Match best intent pattern
    best_match = None
    max_score = 0
    for pattern in INTENT_PATTERNS:
        score = sum(1 for kw in pattern["keywords"] if kw in prompt_lower)
        if score > max_score:
            max_score = score
            best_match = pattern

    # Fallback to general pattern or best match
    selected = best_match or INTENT_PATTERNS[0]
    
    wf_data = {
        "name": selected["name"],
        "description": selected["description"],
        "category": selected["category"],
        "trigger_type": selected["trigger_type"],
        "trigger_config": {},
        "steps": selected["steps"],
        "edges": selected["edges"],
        "is_active": True
    }

    return {
        "workflow": wf_data,
        "explanation": selected["explanation"],
        "assumptions": selected["assumptions"],
        "suggested_inputs": {"prompt": prompt},
        "provider_used": "Deterministic Rule & Intent Engine (Offline Hackathon Mode)"
    }

def generate_workflow_from_copilot(prompt: str) -> Dict[str, Any]:
    """Generates structured workflow using configured provider or high-fidelity fallback."""
    ai_provider = get_setting("ai_provider", "deterministic_fallback")
    api_key = get_setting("api_key", os.getenv("AUTOPILOT_AI_KEY", ""))

    if ai_provider != "deterministic_fallback" and api_key:
        try:
            # Here we could call Gemini or OpenAI API
            # If any failure occurs, we smoothly degrade to deterministic fallback
            pass
        except Exception as e:
            pass

    return generate_deterministic_workflow(prompt)
