#!/usr/bin/env python3
"""Test script to check if the server is running and responding correctly"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_server():
    print("=" * 60)
    print("Testing Server Connectivity")
    print("=" * 60)
    
    # Test 1: Check if server is running
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("   [ERROR] Server is not running!")
        print("   Solution: Run 'python run_server.py' to start the server")
        return False
    except requests.exceptions.Timeout:
        print("   [ERROR] Server timeout")
        return False
    except Exception as e:
        print(f"   [ERROR] {e}")
        return False
    
    # Test 2: Test signup endpoint
    print("\n2. Testing signup endpoint...")
    test_email = f"test_{requests.utils.default_user_agent().replace(' ', '_')}@test.com"
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": test_email,
                "full_name": "Test User",
                "password": "testpass123"
            },
            timeout=5
        )
        print(f"   Status: {response.status_code}")
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        print(f"   Content-Type: {content_type}")
        
        if 'application/json' in content_type:
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"   [WARNING] Response is not JSON!")
            print(f"   Raw response (first 200 chars): {response.text[:200]}")
    except Exception as e:
        print(f"   [ERROR] {e}")
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)
    return True

if __name__ == "__main__":
    test_server()
