import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // For demo purposes, accept any signup data
    if (body.email && body.password && body.name) {
      return NextResponse.json({
        message: 'User created successfully',
        user: {
          id: 1,
          email: body.email,
          name: body.name
        }
      });
    }

    return NextResponse.json(
      { detail: 'Invalid signup data' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}