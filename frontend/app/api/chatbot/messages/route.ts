import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    const res = await fetch(`${backendUrl}/api/chatbot/messages?limit=50`, {
      headers: { 'Authorization': token || '' }
    });
    
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    
    return NextResponse.json({ error: 'Failed to load messages' }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    const res = await fetch(`${backendUrl}/api/chatbot/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || ''
      },
      body: JSON.stringify(body)
    });
    
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    
    return NextResponse.json({ error: 'Failed to save message' }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const token = new URL(request.url).headers.get('authorization');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    const res = await fetch(`${backendUrl}/api/chatbot/messages`, {
      method: 'DELETE',
      headers: { 'Authorization': token || '' }
    });
    
    if (res.ok) {
      return NextResponse.json({ message: 'Chat cleared' });
    }
    
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
