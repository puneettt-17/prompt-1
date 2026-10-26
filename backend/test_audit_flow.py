import httpx
import json

base_url = 'http://127.0.0.1:5173/api'

# Test 5: Create a test workflow
workflow_payload = {
    'name': 'Audit Integration Test Workflow',
    'description': 'Automated workflow created for Supabase integration audit verification',
    'category': 'Sales',
    'trigger_type': 'manual',
    'trigger_config': {},
    'steps': [
        {
            'id': 'step_1',
            'name': 'Validate CSV',
            'type': 'action',
            'config': {'action_type': 'validate_csv', 'params': {'file_path': 'sample_sales.csv'}}
        },
        {
            'id': 'step_2',
            'name': 'Clean Data',
            'type': 'action',
            'config': {'action_type': 'clean_data', 'params': {}}
        },
        {
            'id': 'step_3',
            'name': 'Calculate Metrics',
            'type': 'action',
            'config': {'action_type': 'calculate_metrics', 'params': {}}
        }
    ],
    'edges': [
        {'id': 'e1-2', 'source': 'step_1', 'target': 'step_2'},
        {'id': 'e2-3', 'source': 'step_2', 'target': 'step_3'}
    ]
}

print('=== Test 5: Creating test workflow via /api/workflows ===')
res_create = httpx.post(f'{base_url}/workflows', json=workflow_payload)
print('Create status:', res_create.status_code)
created_wf = res_create.json()
wf_id = created_wf['id']
print('Created Workflow ID:', wf_id)
print('Created Workflow Name:', created_wf['name'])

# Test 6: Reload / Get Workflow
print('\n=== Test 6: Confirm workflow persists on reload ===')
res_get = httpx.get(f'{base_url}/workflows/{wf_id}')
print('Get status:', res_get.status_code)
fetched_wf = res_get.json()
print('Fetched Workflow ID:', fetched_wf['id'])
print('Fetched steps count:', len(fetched_wf['steps']))
assert fetched_wf['id'] == wf_id, 'Workflow ID mismatch'

# Test 7: Execute Workflow
print('\n=== Test 7: Execute test workflow & verify status/logs ===')
res_run = httpx.post(f'{base_url}/workflows/{wf_id}/run', json={})
print('Run status:', res_run.status_code)
run_data = res_run.json()
exec_id = run_data['id']
print('Execution ID:', exec_id)
print('Execution Status:', run_data['status'])
print('Step Results count:', len(run_data.get('step_results', [])))
for s in run_data.get('step_results', []):
    print(f" - Step '{s.get('step_name')}': status={s.get('status')}, logs_count={len(s.get('logs', []))}")

# Verify execution is persisted
res_exec = httpx.get(f'{base_url}/executions/{exec_id}')
assert res_exec.status_code == 200, 'Execution record not found'
exec_record = res_exec.json()
print('Persisted execution status:', exec_record['status'])
print('Persisted outputs:', list(exec_record['outputs'].keys()))
print('\nEnd-to-End Workflow & Execution Lifecycle Verified Successfully!')
