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

// Initialize database tables
async function initDB() {
  try {
    console.log('Initializing database...');
    
    // Create users table
    await queryDB(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Users table ready');
    
    // Create tasks table
    await queryDB(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        category VARCHAR(100),
        due_date TIMESTAMP,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('DB init error:', err);
  }
}

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
    console.log('GET all tasks');
    
    // Get user_id from headers or query params
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }
    
    const tasks = await queryDB(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [parseInt(userId)]
    );
    const formattedTasks = tasks.map(formatTask);
    
    console.log('Returning tasks:', formattedTasks.length);
    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json(
      { error: 'Database error: ' + String(error).slice(0, 200) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST create task');

    const body = await request.json();
    const { title, description, due_date, priority, category, status, user_id } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const result = await queryDB(
      `INSERT INTO tasks (title, description, status, priority, category, due_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description || null, status || 'pending', priority || 'medium', category || null, due_date || null, user_id]
    );

    const newTask = formatTask(result[0]);
    console.log('Task created successfully:', newTask);
    
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Create task API error:', error);
    return NextResponse.json(
      { error: 'Database error: ' + String(error).slice(0, 200) },
      { status: 500 }
    );
  }
}
