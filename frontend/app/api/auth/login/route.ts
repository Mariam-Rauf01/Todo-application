import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // For demo purposes, accept any credentials
    if (body.email && body.password) {
      // Create a demo JWT token
      const demoToken = 'demo-jwt-token-' + Date.now();

      return NextResponse.json({
        access_token: demoToken,
        token_type: 'bearer',
        user: {
          id: 1,
          email: body.email,
          name: 'Demo User'
        }
      });
    }

    return NextResponse.json(
      { detail: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
