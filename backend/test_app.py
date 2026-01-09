"""
Basic tests to verify the application is working correctly.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the AI-Powered Todo Web Application"}

def test_health():
    """Test the health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_auth_routes_exist():
    """Test that auth routes are available (will return 422 for missing data, not 404)"""
    # Test signup route exists - will return 422 for missing data instead of 404
    response = client.post("/api/auth/signup")
    assert response.status_code in [422, 400]  # Validation error is expected

    # Test login route exists - will return 422 for missing data instead of 404
    response = client.post("/api/auth/login")
    assert response.status_code in [422, 400]  # Validation error is expected

def test_tasks_routes_exist():
    """Test that tasks routes exist (should require authentication)"""
    # Test tasks route exists - will return 401 for missing auth instead of 404
    response = client.get("/api/tasks/")
    assert response.status_code in [401, 422]  # Unauthorized or validation error is expected