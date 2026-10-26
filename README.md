# 🚀 AutoPilot AI | Autonomous Natural-Language Automation Engine

> **Live Demo Ready for National Hackathon Presentation**  
> AutoPilot AI turns plain English requests into verified multi-step automation workflows with visual node graphs, safe sandboxed execution, real-time telemetry, and certified report generation.

---

## 🌟 Key Features

1. **AI Automation Copilot**:
   - Parses natural-language requests into structured, executable workflows.
   - Enforces an **execution allowlist** with zero arbitrary code execution.
   - Operates in high-fidelity **Deterministic Rule & Intent Mode** (offline-safe) with optional **Gemini** / **OpenAI** API connectors.

2. **Visual Workflow Canvas**:
   - Sequential dependency chain showing Trigger, Action, Condition, and Output nodes.
   - Parameter inspector drawer for per-step configuration and bounded retry policies (0 to 3 attempts).
   - Dynamic step addition, deletion, and node property modification.

3. **Three Verified End-to-End Demonstrations**:
   - 📊 **Demo 1: AI Sales Intelligence & Report**: Ingests sales CSV files, cleans corrupt entries and currency symbols, computes gross revenue & average order value, identifies top products, renders Recharts telemetry, and compiles a certified executive markdown report artifact.
   - 📁 **Demo 2: Smart File Organizer**: Scans unorganized files in sandbox storage, classifies files into 5 structured buckets by MIME/extension, prepares a dry-run relocation plan, requires user authorization, and safely relocates files within the sandboxed workspace.
   - 📋 **Demo 3: Intelligent Task Assistant**: Deconstructs raw project briefs into actionable engineering deliverables with Eisenhower priority classification, estimated hours, and suggested deadlines, rendered on an interactive 3-column SQLite Kanban board.

4. **Overview Dashboard & Telemetry Audit Trail**:
   - Real-time persisted KPI cards: Total Workflows, Total Executions, Success Rate (%), and Calculated Time Saved (`20 min/run estimate`).
   - Category distribution chart powered by Recharts.
   - Detailed Execution History with per-step execution durations, inputs/outputs, terminal logs, and error diagnostics.

5. **Security & Sandbox Isolation**:
   - All file operations are strictly restricted to `backend/sandbox` to prevent directory traversal.
   - Zero shell execution of generated text.
   - Bounded retries and strict execution timeouts.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 5 + Tailwind CSS (v3) + Lucide Icons + Recharts
- **Backend**: Python 3.11 + FastAPI + Uvicorn + Pydantic v2
- **Data Engine**: Python Pandas (with robust pure-Python fallback for enterprise AppLocker/Device Guard environments)
- **Database**: SQLite (persistent storage for workflows, executions, tasks, and settings)

---

## ⚡ Quick Start & Run Instructions

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **Python** 3.10+ or 3.11+

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python seed_data.py
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*The FastAPI backend will start at `http://127.0.0.1:8000` (API docs at `http://127.0.0.1:8000/docs`).*

### 3. Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev -- --host 127.0.0.1 --port 5173
```
*The Vite frontend will start at `http://127.0.0.1:5173` with automatic API proxying to port 8000.*

---

## 🧪 Testing the Engine

To run automated end-to-end integration tests verifying all 3 demos and REST endpoints:

```bash
# Test Workflow Engine (all 3 demos end-to-end)
cd backend
python test_engine.py

# Test REST API Endpoints & Health Check
python test_api.py
```

---

## 🎯 5-Minute Hackathon Demo Script for Judges

1. **Open Dashboard**:
   - Navigate to `http://127.0.0.1:5173`.
   - Point out real persisted KPI stats and the calculated time saved metric.
2. **Demo 1 (AI Sales Report)**:
   - Click **"Run Live Demo"** on the AI Sales Performance card.
   - Watch the step-by-step telemetry modal execute: CSV validation, currency cleaning, revenue metrics calculation, top products ranking, and report generation.
   - Inspect the Recharts bar chart, KPI summary, and click **"Download Report (.md)"**.
3. **Demo 2 (Smart File Organizer)**:
   - Click **"Run Live Demo"** on the File Organizer card.
   - Notice the classification into 5 distinct categories and the safe relocation inside `backend/sandbox`.
4. **Demo 3 (Task Assistant)**:
   - Click **"Open Board"** or navigate to **"Intelligent Task Board"** in the sidebar.
   - Type a project description like *"Build mobile app with auth, Stripe checkout, and push notifications"*.
   - Click **"Generate Tasks"** and watch the Kanban columns populate with prioritized deliverables.
   - Click **"Start"** and **"Complete"** to transition tasks in SQLite.
5. **Inspect Execution History**:
   - Click **"Execution History"** in the sidebar to review the full audit log, durations, and per-step terminal outputs.
