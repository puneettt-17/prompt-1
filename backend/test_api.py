from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_api():
    print("Testing /api/health...")
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("Health response:", r.json()["status"])

    print("\nTesting /api/dashboard/stats...")
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 200, f"Stats failed: {r.text}"
    stats = r.json()
    print("Total Workflows:", stats["total_workflows"])
    print("Execution Success Rate:", stats["execution_success_rate"], "%")
    print("Time saved:", stats["estimated_time_saved_label"])

    print("\nTesting /api/copilot/generate...")
    r = client.post("/api/copilot/generate", json={"prompt": "Analyze my sales CSV and create an executive report"})
    assert r.status_code == 200, f"Copilot failed: {r.text}"
    copilot_res = r.json()
    print("Generated Workflow:", copilot_res["workflow"]["name"])
    print("Explanation:", copilot_res["explanation"][:80], "...")

    print("\nTesting /api/workflows/wf_sales_intelligence/run...")
    r = client.post("/api/workflows/wf_sales_intelligence/run")
    assert r.status_code == 200, f"Run failed: {r.text}"
    exec_res = r.json()
    print("Execution ID:", exec_res["id"], "Status:", exec_res["status"])

    print("\nTesting /api/tasks...")
    r = client.get("/api/tasks")
    assert r.status_code == 200, f"Tasks failed: {r.text}"
    tasks = r.json()
    print(f"Loaded {len(tasks)} tasks.")

    print("\nTesting /api/supabase/status...")
    r = client.get("/api/supabase/status")
    assert r.status_code == 200, f"Supabase status failed: {r.text}"
    sb_status = r.json()
    print("Supabase connection status:", sb_status.get("message"))

    print("\nTesting /api/supabase/audit...")
    r = client.get("/api/supabase/audit")
    assert r.status_code == 200, f"Supabase audit failed: {r.text}"
    audit = r.json()
    print("Audit Step 1 (Client):", audit["step_1_client_init"]["passed"])
    print("Audit Step 2 (Tables):", audit["step_2_tables_exist"]["passed"])
    print("Audit Step 3 (RLS):", audit["step_3_rls_policies"]["passed"])
    print("Audit Step 4 (Auth):", audit["step_4_user_authentication"]["passed"])
    print("Overall Audit Status:", audit["summary"]["status"])

    print("\nALL API ENDPOINTS TESTED AND FUNCTIONING PERFECTLY!")

if __name__ == "__main__":
    test_api()
