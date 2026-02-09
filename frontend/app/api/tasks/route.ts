import { NextRequest, NextResponse } from 'next/server';

// Use dynamic import for pg to avoid type issues
let Pool: any;

async function getPool() {
  if (!Pool) {
    const pg = await import('pg');
    Pool = pg.Pool;
  }
  return Pool;
}

// Neon PostgreSQL connection
const getConnectionString = () => {
  return process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
};

async function queryDB(sql: string, params: any[] = []) {
  const PoolClass = await getPool();
  const pool = new PoolClass({
    connectionString: getConnectionString(),
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } finally {
    await pool.end();
  }
}

// Initialize database tables
async function initDB() {
  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        category VARCHAR(100),
        due_date TIMESTAMP,
        user_id INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('DB init error:', err);
  }
}

// Initialize on first request
initDB();

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

export async function GET(request: NextRequest) {
  try {
    console.log('GET all tasks - from Neon database');
    
    const tasks = await queryDB('SELECT * FROM tasks ORDER BY created_at DESC');
    const formattedTasks = tasks.map(formatTask);
    
    console.log('Returning tasks:', formattedTasks.length);
    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST create task - to Neon database');

    const body = await request.json();
    const { title, description, due_date, priority, category, status } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const result = await queryDB(
      `INSERT INTO tasks (title, description, status, priority, category, due_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, 1)
       RETURNING *`,
      [title, description || null, status || 'pending', priority || 'medium', category || null, due_date || null]
    );

    const newTask = formatTask(result[0]);
    console.log('Task created successfully:', newTask);
    
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Create task API error:', error);
    return NextResponse.json(
      { error: 'Database error: ' + String(error) },
      { status: 500 }
    );
  }
}
