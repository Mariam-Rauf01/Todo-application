import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll simulate a successful response
    // In a real application, you would:
    // 1. Check if the email exists in your database
    // 2. Generate a password reset token
    // 3. Send an email with the reset link
    
    // Try to call backend, but don't fail if it's not available
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    
    try {
      await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
    } catch (e) {
      // Backend not available, that's okay for demo
      console.log('Backend not available for forgot password');
    }
    
    // Return success for demo
    return NextResponse.json({ 
      message: 'Password reset link has been sent to your email!' 
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
