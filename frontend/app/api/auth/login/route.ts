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
      const errorData = await loginResponse.json();
      return NextResponse.json(
        { error: errorData.detail || 'Invalid email or password' },
        { status: loginResponse.status }
      );
    }

    const tokenData = await loginResponse.json();

    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      email: email,
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
