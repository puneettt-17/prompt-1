from engine import execute_workflow
import json

def test_all_three_demos():
    print("Testing Demo 1: AI Sales Intelligence...")
    res1 = execute_workflow("wf_sales_intelligence")
    print(f"Demo 1 Status: {res1['status']}, Duration: {res1['duration_seconds']}s")
    assert res1["status"] == "succeeded", f"Demo 1 failed: {res1.get('error_details')}"
    assert "total_revenue" in res1["outputs"], "total_revenue missing"
    print(f"Total Revenue: ${res1['outputs']['total_revenue']:,.2f}")

    print("\nTesting Demo 2: File Organizer...")
    res2 = execute_workflow("wf_file_organizer", override_params={"approved": True})
    print(f"Demo 2 Status: {res2['status']}, Duration: {res2['duration_seconds']}s")
    assert res2["status"] == "succeeded", f"Demo 2 failed: {res2.get('error_details')}"
    print(f"Executed moves: {res2['outputs'].get('executed_count')}")

    print("\nTesting Demo 3: Task Assistant...")
    res3 = execute_workflow("wf_task_assistant")
    print(f"Demo 3 Status: {res3['status']}, Duration: {res3['duration_seconds']}s")
    assert res3["status"] == "succeeded", f"Demo 3 failed: {res3.get('error_details')}"
    print(f"Tasks generated & persisted: {res3['outputs'].get('task_count')}")

    print("\nALL THREE DEMOS PASSED 100% SUCCESSFULLY!")

if __name__ == "__main__":
    test_all_three_demos()
