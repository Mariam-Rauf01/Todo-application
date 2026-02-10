import { NextRequest, NextResponse } from 'next/server';

function jsonResponse(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    // Call backend API for registration
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    
    const signupResponse = await fetch(`${backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        full_name: full_name || 'User',
      }),
    });

    if (!signupResponse.ok) {
      const errorData = await signupResponse.json();
      return NextResponse.json(
        { error: errorData.detail || 'Signup failed' },
        { status: signupResponse.status }
      );
    }

    const userData = await signupResponse.json();

    // Backend returns user object directly, extract the id
    const userId = userData.id || userData.user_id || userData.userId;

    return NextResponse.json({
      user_id: userId,
      email: userData.email,
      full_name: userData.full_name,
      message: 'Account created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    // Provide more helpful error message
    let errorMessage = 'Signup failed';
    let isNetworkError = false;
    
    if (error instanceof TypeError) {
      console.log('TypeError message:', error.message);
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to backend at ' + process.env.NEXT_PUBLIC_BACKEND_URL + '. Please ensure the backend server is running';
        isNetworkError = true;
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = 'Signup failed: ' + error.message.slice(0, 150);
    }
    
    console.error('Final error:', { errorMessage, isNetworkError, backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL });
    return NextResponse.json(
      { error: errorMessage, isNetworkError },
      { status: isNetworkError ? 503 : 500 }
    );
  }
}
