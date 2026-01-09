import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest } from '@/app/utils/auth-server';
import { getDemoTask, updateDemoTask, deleteDemoTask } from '@/app/utils/demo-tasks';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET API called for task ID:', params.id);

    // For demo purposes, skip strict authentication
    // const authResult = await verifyTokenFromRequest(request);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const taskId = parseInt(params.id);
    const task = getDemoTask(taskId);

    if (!task) {
      console.log('GET failed: Task not found');
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log('GET successful');
    return NextResponse.json(task);
  } catch (error) {
    console.error('Get task API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT API called for task ID:', params.id);

    // For demo purposes, skip strict authentication
    // const authResult = await verifyTokenFromRequest(request);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const taskId = parseInt(params.id);
    const body = await request.json();
    console.log('Update data:', body);

    const updatedTask = updateDemoTask(taskId, body);
    if (!updatedTask) {
      console.log('PUT failed: Task not found');
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log('PUT successful');
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Update task API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE API called for task ID:', params.id);

    // For demo purposes, skip strict authentication
    // const authResult = await verifyTokenFromRequest(request);
    // if (!authResult.success) {
    //   console.log('DELETE failed: Unauthorized');
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const taskId = parseInt(params.id);
    console.log('Parsed task ID:', taskId);

    const success = deleteDemoTask(taskId);
    console.log('Delete result:', success);

    if (!success) {
      console.log('DELETE failed: Task not found');
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log('DELETE successful');
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}