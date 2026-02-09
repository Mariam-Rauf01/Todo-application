// Simple test to verify API endpoints
async function testAPIEndpoints() {
  console.log('Testing API endpoints...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:8000/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test a non-existent endpoint to see the difference
    const tasksResponse = await fetch('http://localhost:8000/api/tasks', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    console.log('Tasks endpoint status (expected 401):', tasksResponse.status);
    
    console.log('API endpoints test completed.');
  } catch (error) {
    console.error('Error testing API endpoints:', error);
  }
}

testAPIEndpoints();