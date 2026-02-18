import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call backend API for authentication
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    
    const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: email,
        password: password,
      }).toString(),
    });

    if (!loginResponse.ok) {
      // Try to parse as JSON, but handle non-JSON responses
      const contentType = loginResponse.headers.get('content-type');
      let errorMessage = 'Login failed';
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await loginResponse.json();
        errorMessage = errorData.detail || errorData.error || 'Invalid email or password';
      } else {
        // Handle non-JSON response (like HTML error pages)
        const textResponse = await loginResponse.text();
        console.error('Non-JSON error response:', textResponse);
        errorMessage = `Server error: ${loginResponse.status}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: loginResponse.status }
      );
    }

    const tokenData = await loginResponse.json();

    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      email: tokenData.email || email,
      full_name: tokenData.full_name || email.split('@')[0],
      user_id: tokenData.user_id,
      message: 'Login successful'
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    // Provide more helpful error message
    let errorMessage = 'Login failed';
    let isNetworkError = false;
    
    if (error instanceof TypeError) {
      console.log('TypeError message:', error.message);
      if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to backend at ' + process.env.NEXT_PUBLIC_BACKEND_URL + '. Please ensure the backend server is running';
        isNetworkError = true;
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = 'Login error: ' + error.message.slice(0, 150);
    }
    
    console.error('Final error:', { errorMessage, isNetworkError, backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL });
    return NextResponse.json(
      { error: errorMessage, isNetworkError },
      { status: isNetworkError ? 503 : 500 }
    );
  }
}
