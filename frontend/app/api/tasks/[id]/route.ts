import { NextRequest, NextResponse } from 'next/server';

// Simple pool variable - will be initialized lazily
let pool: any = null;

function getPool() {
  if (!pool) {
    const { Pool } = require('pg');
    
    const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    
    console.log('Creating DB pool with URL:', dbUrl.substring(0, 50) + '...');
    
    try {
      const connTimeout = parseInt(process.env.DB_CONN_TIMEOUT || '10000');
      pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: connTimeout,
      });
      
      pool.on('error', (err: any) => {
        console.error('Pool error:', err);
      });
      
      console.log('DB pool created successfully');
    } catch (err) {
      console.error('Failed to create pool:', err);
      throw err;
    }
  }
  return pool;
}

async function queryDB(sql: string, params: any[] = []) {
  let retryCount = 0;
  const maxRetries = 1;
  
  while (retryCount <= maxRetries) {
    try {
      const pg = getPool();
      console.log('Executing query:', sql.substring(0, 100) + '...', 'with params:', params);
      const result = await pg.query(sql, params);
      console.log('Query result rows:', result.rows.length);
      return result.rows;
    } catch (err: any) {
      console.error(`Query execution error (attempt ${retryCount + 1}):`, err);
      
      // Check if it's a connection error
      if ((err?.message?.includes('timeout') || err?.message?.includes('terminated')) && retryCount < maxRetries) {
        console.log('Connection timeout/terminated, resetting pool and retrying...');
        if (pool) {
          await pool.end().catch(() => {});
          pool = null;
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        retryCount++;
        continue;
      }
      
      throw err;
    }
  }
}

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
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET task ID:', params.id);

    const taskId = parseInt(params.id);
    const result = await queryDB('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = formatTask(result[0]);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Get task API error:', error);
    return NextResponse.json(
      { error: 'Database error: ' + String(error).slice(0, 200) },
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
    const check = await queryDB('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (check.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const { title, description, status, priority, category, due_date } = body;

    const result = await queryDB(
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

    const updatedTask = formatTask(result[0]);
    console.log('PUT successful:', updatedTask);
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Update task API error:', error);
    return NextResponse.json(
      { error: 'Database error: ' + String(error).slice(0, 200) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE task ID:', params.id);

    const taskId = parseInt(params.id);

    // Check if task exists
    const check = await queryDB('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (check.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    await queryDB('DELETE FROM tasks WHERE id = $1', [taskId]);
    console.log('DELETE successful');

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task API error:', error);
    return NextResponse.json(
      { error: 'Database error: ' + String(error).slice(0, 200) },
      { status: 500 }
    );
  }
}
