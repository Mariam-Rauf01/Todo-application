import requests
import json
from typing import Dict, Any, Optional
import os

class DaprClient:
    def __init__(self, dapr_http_port: int = 3500, dapr_grpc_port: int = 50001):
        self.dapr_http_port = dapr_http_port
        self.dapr_grpc_port = dapr_grpc_port
        self.dapr_base_url = f"http://localhost:{dapr_http_port}"
    
    def invoke_service(self, app_id: str, method: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Invoke a method on another Dapr service"""
        url = f"{self.dapr_base_url}/v1.0/invoke/{app_id}/method/{method}"
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(data))
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error invoking service {app_id}/{method}: {e}")
            return {"error": str(e)}
    
    def publish_event(self, pubsub_name: str, topic_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Publish an event to a Dapr pubsub component"""
        url = f"{self.dapr_base_url}/v1.0/publish/{pubsub_name}/{topic_name}"
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(data))
            response.raise_for_status()
            return {"status": "success"}
        except requests.exceptions.RequestException as e:
            print(f"Error publishing to {pubsub_name}/{topic_name}: {e}")
            return {"error": str(e)}
    
    def save_state(self, store_name: str, key: str, value: Any) -> Dict[str, Any]:
        """Save state to a Dapr state store"""
        url = f"{self.dapr_base_url}/v1.0/state/{store_name}"
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        state_item = [{
            "key": key,
            "value": value
        }]
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(state_item))
            response.raise_for_status()
            return {"status": "success"}
        except requests.exceptions.RequestException as e:
            print(f"Error saving state to {store_name}/{key}: {e}")
            return {"error": str(e)}
    
    def get_state(self, store_name: str, key: str) -> Any:
        """Get state from a Dapr state store"""
        url = f"{self.dapr_base_url}/v1.0/state/{store_name}/{key}"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error getting state from {store_name}/{key}: {e}")
            return None

# Example usage
if __name__ == "__main__":
    client = DaprClient()
    
    # Example: Invoke our todo service
    result = client.invoke_service(
        app_id="todo-backend",
        method="todo-service",
        data={
            "operation": "create_task",
            "data": {
                "task": {
                    "title": "Sample task from Dapr client",
                    "description": "Created via Dapr service invocation"
                }
            }
        }
    )
    print("Service invocation result:", result)