import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, response, sender } = body;

    if (!message) {
      return NextResponse.json(
        { detail: 'Message is required' },
        { status: 400 }
      );
    }

    // Get the access token from cookies or localStorage
    const cookieHeader = request.headers.get('cookie') || '';
    const accessTokenMatch = cookieHeader.match(/access_token=([^;]+)/);
    const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

    if (!accessToken) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const apiResponse = await fetch(`${backendUrl}/api/chatbot/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message, response, sender }),
    });

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      return NextResponse.json(data);
    } else if (apiResponse.status === 401) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    } else {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { detail: errorData.detail || 'Failed to save message' },
        { status: apiResponse.status }
      );
    }
  } catch (error) {
    console.error('Save message API error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get the access token from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const accessTokenMatch = cookieHeader.match(/access_token=([^;]+)/);
    const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

    if (!accessToken) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const apiResponse = await fetch(`${backendUrl}/api/chatbot/messages?limit=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { detail: 'Failed to get messages' },
        { status: apiResponse.status }
      );
    }
  } catch (error) {
    console.error('Get messages API error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
