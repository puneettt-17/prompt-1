import datetime
from typing import Dict, Any

def action_condition_check(params: Dict[str, Any], previous_outputs: Dict[str, Any]) -> Dict[str, Any]:
    field = params.get("field", "")
    operator = params.get("operator", "==")
    target_value = params.get("value")

    # Traverse nested fields e.g. "total_revenue" or "calculate_metrics.total_revenue"
    current = previous_outputs
    parts = field.split(".") if field else []
    actual_value = None

    if len(parts) == 1 and parts[0] in current:
        actual_value = current[parts[0]]
    elif len(parts) > 1:
        temp = current
        for p in parts:
            if isinstance(temp, dict) and p in temp:
                temp = temp[p]
            else:
                temp = None
                break
        actual_value = temp
    else:
        # Search anywhere in previous_outputs
        for k, v in current.items():
            if isinstance(v, dict) and field in v:
                actual_value = v[field]
                break
            elif k == field:
                actual_value = v
                break

    # Evaluate condition
    passed = False
    try:
        if operator == "==":
            passed = (actual_value == target_value)
        elif operator == "!=":
            passed = (actual_value != target_value)
        elif operator == ">":
            passed = (float(actual_value) > float(target_value))
        elif operator == ">=":
            passed = (float(actual_value) >= float(target_value))
        elif operator == "<":
            passed = (float(actual_value) < float(target_value))
        elif operator == "<=":
            passed = (float(actual_value) <= float(target_value))
        elif operator == "contains":
            passed = (str(target_value).lower() in str(actual_value).lower())
    except Exception as e:
        passed = False

    return {
        "field": field,
        "operator": operator,
        "expected_value": target_value,
        "actual_value": actual_value,
        "condition_met": passed,
        "status_message": f"Evaluated condition '{field} {operator} {target_value}': {'PASSED' if passed else 'NOT MET'} (actual: {actual_value})."
    }

def action_send_notification(params: Dict[str, Any], previous_outputs: Dict[str, Any]) -> Dict[str, Any]:
    channel = params.get("channel", "email")  # email, slack, webhook, browser
    recipient = params.get("recipient", "team@autopilot.ai")
    custom_msg = params.get("message")

    # If previous step had summary or status message, include it
    summary_text = previous_outputs.get("summary_text") or previous_outputs.get("status_message") or "Workflow executed successfully."
    body = custom_msg or f"AutoPilot AI Notification: {summary_text}"

    return {
        "channel": channel,
        "recipient": recipient,
        "timestamp": datetime.datetime.now().isoformat(),
        "delivered": True,
        "message_preview": body[:120] + ("..." if len(body) > 120 else ""),
        "status_message": f"Dispatched {channel.upper()} notification to {recipient}."
    }

def action_http_fetch(params: Dict[str, Any], previous_outputs: Dict[str, Any]) -> Dict[str, Any]:
    url = params.get("url", "https://api.github.com/zen")
    method = params.get("method", "GET").upper()

    # Safety: ensure url has valid scheme
    if not (url.startswith("http://") or url.startswith("https://")):
        raise ValueError("Only http:// and https:// URLs are permitted.")

    return {
        "url": url,
        "method": method,
        "status_code": 200,
        "response_mock": {"status": "ok", "message": "Telemetry ping acknowledged by remote service."},
        "status_message": f"Successfully executed {method} request to {url} (HTTP 200 OK)."
    }
