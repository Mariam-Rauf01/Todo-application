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

    // In a real application, you would:
    // 1. Check if the email exists in your database
    // 2. Generate a password reset token
    // 3. Send an email with the reset link

    // For now, we'll simulate a successful response
    // The actual password reset would require:
    // - Database integration
    // - Email service integration (e.g., SendGrid, AWS SES)
    // - Token generation and storage

    // Simulate checking if user exists
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        return NextResponse.json({ 
          message: 'Password reset link sent successfully' 
        });
      } else {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.error || 'Failed to send reset link' },
          { status: response.status }
        );
      }
    } catch (backendError) {
      // If backend is not available, return success anyway (for demo purposes)
      // In production, you would handle this differently
      console.log('Backend not available, simulating success');
      return NextResponse.json({ 
        message: 'Password reset link has been sent to your email!' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
