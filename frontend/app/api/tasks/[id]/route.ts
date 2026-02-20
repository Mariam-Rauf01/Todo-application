import { NextRequest, NextResponse } from 'next/server';

// Frontend API proxy to backend - NO direct database access
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Helper function to format task from backend response
function formatTask(task: any) {
  return {
    id: Number(task.id),
    title: String(task.title),
    description: task.description ? String(task.description) : null,
    status: String(task.status),
    priority: String(task.priority),
    category: task.category ? String(task.category) : null,
    due_date: task.due_date ? String(task.due_date) : null,
    created_at: String(task.created_at),
    updated_at: String(task.updated_at)
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${params.id}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Backend error' }));
      return NextResponse.json({ error: error.detail || 'Task not found' }, { status: response.status });
    }
    
    const task = await response.json();
    return NextResponse.json(formatTask(task));
  } catch (error) {
    console.error('Get task API proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/tasks/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Backend error' }));
      return NextResponse.json({ error: error.detail || 'Failed to update task' }, { status: response.status });
    }
    
    const task = await response.json();
    return NextResponse.json(formatTask(task));
  } catch (error) {
    console.error('Update task API proxy error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${params.id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Backend error' }));
      return NextResponse.json({ error: error.detail || 'Failed to delete task' }, { status: response.status });
    }
    
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task API proxy error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
