import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Neon PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function to format task from database row
function formatTask(row: any) {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    status: String(row.status),
    priority: String(row.priority),
    category: row.category ? String(row.category) : null,
    due_date: row.due_date ? String(row.due_date) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET task ID:', params.id);

    const taskId = parseInt(params.id);
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = formatTask(result.rows[0]);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Get task API error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT task ID:', params.id);

    const taskId = parseInt(params.id);
    const body = await request.json();

    // Check if task exists
    const check = await pool.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (check.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const { title, description, status, priority, category, due_date } = body;

    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           category = COALESCE($5, category),
           due_date = COALESCE($6, due_date),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, description, status, priority, category, due_date, taskId]
    );

    const updatedTask = formatTask(result.rows[0]);
    console.log('PUT successful:', updatedTask);
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Update task API error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE task ID:', params.id);

    const taskId = parseInt(params.id);

    // Check if task exists
    const check = await pool.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (check.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    console.log('DELETE successful');

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task API error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}
