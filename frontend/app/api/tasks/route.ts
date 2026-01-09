import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest } from '@/app/utils/auth-server';
import { getDemoTasks, addDemoTask } from '@/app/utils/demo-tasks';

export async function GET(request: NextRequest) {
  try {
    console.log('GET all tasks API called');

    // For demo purposes, skip strict authentication
    // const authResult = await verifyTokenFromRequest(request);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Return demo tasks
    const tasks = getDemoTasks();
    console.log('Returning tasks:', tasks.length);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST create task API called');

    // For demo purposes, skip strict authentication
    // const authResult = await verifyTokenFromRequest(request);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    console.log('Create task data:', body);

    const { title, description, due_date, priority, category } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create new demo task
    const newTask = addDemoTask({
      title,
      description: description || null,
      status: 'pending',
      due_date: due_date || null,
      priority: priority || 'medium',
      category: category || null,
    });

    console.log('Task created successfully');
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Create task API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}