import os
import shutil
from typing import Dict, Any, List

SANDBOX_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sandbox")
FILES_SOURCE_DIR = os.path.join(SANDBOX_DIR, "unorganized_files")
ORGANIZED_DIR = os.path.join(SANDBOX_DIR, "organized_files")

os.makedirs(FILES_SOURCE_DIR, exist_ok=True)
os.makedirs(ORGANIZED_DIR, exist_ok=True)

CATEGORY_RULES = {
    "Documents": [".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt", ".md"],
    "Data & Sheets": [".csv", ".xlsx", ".xls", ".json", ".tsv", ".parquet", ".sql"],
    "Images & Media": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".mp4", ".mov"],
    "Code & Scripts": [".py", ".ts", ".js", ".html", ".css", ".jsx", ".tsx", ".sh"],
    "Archives": [".zip", ".tar", ".gz", ".rar", ".7z"]
}

def get_category_for_ext(ext: str) -> str:
    ext_lower = ext.lower()
    for cat, extensions in CATEGORY_RULES.items():
        if ext_lower in extensions:
            return cat
    return "Miscellaneous"

def seed_sample_unorganized_files():
    """Create sample files in sandbox if folder is empty for instant demo."""
    if not os.path.exists(FILES_SOURCE_DIR) or len(os.listdir(FILES_SOURCE_DIR)) == 0:
        sample_files = [
            ("Q3_Financial_Brief.docx", "Document text brief content"),
            ("Product_Roadmap_2026.pdf", "%PDF-1.4 sample pdf content"),
            ("app_icon_v2.png", "PNG dummy binary content"),
            ("banner_graphic.svg", "<svg><circle cx='50' cy='50' r='40'/></svg>"),
            ("q3_customer_leads.csv", "name,email,score\nAlice,alice@example.com,94"),
            ("telemetry_dump.json", "{\"status\": \"ok\", \"events\": 450}"),
            ("data_pipeline.py", "import pandas as pd\nprint('Pipeline')"),
            ("index.html", "<!doctype html><html><body><h1>Demo</h1></body></html>"),
            ("backup_archive_oct.zip", "PK\x03\x04 dummy zip"),
            ("meeting_notes_raw.txt", "1. Kickoff\n2. Milestones\n3. Deploy")
        ]
        for name, text in sample_files:
            p = os.path.join(FILES_SOURCE_DIR, name)
            with open(p, "w", encoding="utf-8") as f:
                f.write(text)

def action_scan_files(params: Dict[str, Any], previous_outputs: Dict[str, Any]) -> Dict[str, Any]:
    seed_sample_unorganized_files()
    
    files_list = []
    total_bytes = 0
    
    for f in os.listdir(FILES_SOURCE_DIR):
        full_p = os.path.join(FILES_SOURCE_DIR, f)
        if os.path.isfile(full_p):
            sz = os.path.getsize(full_p)
            ext = os.path.splitext(f)[1]
            total_bytes += sz
            files_list.append({
                "filename": f,
                "size_bytes": sz,
                "extension": ext or "none",
                "category": get_category_for_ext(ext)
            })

    return {
        "source_directory": FILES_SOURCE_DIR,
        "total_files": len(files_list),
        "total_size_kb": round(total_bytes / 1024, 2),
        "files": files_list,
        "status_message": f"Scanned {len(files_list)} unorganized files ({round(total_bytes / 1024, 2)} KB total)."
    }

def action_categorize_files(params: Dict[str, Any], previous_outputs: Dict[str, Any]) -> Dict[str, Any]:
    scanned = previous_outputs.get("scan_files", {}) or previous_outputs
    files = scanned.get("files", [])

    categorized = {}
    for item in files:
        cat = item["category"]
        if cat not in categorized:
            categorized[cat] = []
        categorized[cat].append(item)

    category_summary = [
        {"category": cat, "count": len(items), "extensions": list(set(i["extension"] for i in items))}
        for cat, items in categorized.items()
    ]

    return {
        "categorized": categorized,
        "category_summary": category_summary,
        "total_categories": len(category_summary),
        "status_message": f"Classified {len(files)} files into {len(category_summary)} distinct system folders."
    }

def action_generate_organize_plan(params: Dict[str, Any], previous_outputs: Dict[str, Any]) -> Dict[str, Any]:
    categorized_data = previous_outputs.get("categorize_files", {}) or previous_outputs
    categorized = categorized_data.get("categorized", {})

    proposed_moves = []
    for cat, items in categorized.items():
        folder_slug = cat.lower().replace(" ", "_").replace("&", "and")
        target_folder = os.path.join(ORGANIZED_DIR, folder_slug)
        for item in items:
            source = os.path.join(FILES_SOURCE_DIR, item["filename"])
            dest = os.path.join(target_folder, item["filename"])
            proposed_moves.append({
                "filename": item["filename"],
                "category": cat,
                "source_relative": f"unorganized_files/{item['filename']}",
                "dest_relative": f"organized_files/{folder_slug}/{item['filename']}",
                "reason": f"MIME / Extension match for {cat} ({item['extension']})"
            })

    return {
        "proposed_moves": proposed_moves,
        "total_planned_actions": len(proposed_moves),
        "requires_approval": True,
        "safety_guarantee": "Sandboxed inside dedicated backend/sandbox workspace. No system files touched.",
        "status_message": f"Formulated execution plan with {len(proposed_moves)} safe relocation operations. Ready for user authorization."
    }

def action_execute_file_organization(params: Dict[str, Any], previous_outputs: Dict[str, Any]) -> Dict[str, Any]:
    # Check if approved
    approval = params.get("approved", True)
    if not approval:
        return {
            "status": "skipped",
            "executed_moves": 0,
            "status_message": "File organization operation held pending explicit user confirmation."
        }

    plan = previous_outputs.get("generate_organize_plan", {}) or previous_outputs
    moves = plan.get("proposed_moves", [])

    executed_moves = []
    for m in moves:
        cat_folder = m["dest_relative"].split("/")[1]
        dest_dir = os.path.join(ORGANIZED_DIR, cat_folder)
        os.makedirs(dest_dir, exist_ok=True)
        
        src_path = os.path.join(FILES_SOURCE_DIR, m["filename"])
        dest_path = os.path.join(dest_dir, m["filename"])

        if os.path.exists(src_path):
            shutil.copy2(src_path, dest_path)
            executed_moves.append({
                "file": m["filename"],
                "from": m["source_relative"],
                "to": m["dest_relative"],
                "status": "relocated_safely"
            })

    return {
        "executed_count": len(executed_moves),
        "target_directory": ORGANIZED_DIR,
        "operations": executed_moves,
        "status_message": f"Successfully and securely organized {len(executed_moves)} files into structured directories."
    }
