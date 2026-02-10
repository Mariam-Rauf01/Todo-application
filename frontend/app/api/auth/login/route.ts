import { NextResponse } from 'next/server';

let pool: any = null;

function getPool() {
  if (!pool) {
    const { Pool } = require('pg');
    const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

async function queryDB(sql: string, params: any[] = []) {
  try {
    const pg = getPool();
    const result = await pg.query(sql, params);
    return result.rows;
  } catch (err) {
    console.error('Query execution error:', err);
    throw err;
  }
}

function jsonResponse(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse({ error: 'Email and password are required' }, 400);
    }

    const result = await queryDB('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.length === 0) {
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    const user = result[0];

    if (user.password !== password) {
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    return jsonResponse({
      user_id: user.id,
      email: user.email,
      name: user.name,
      access_token: `token-${user.id}-${Date.now()}`,
      message: 'Login successful'
    }, 200);

  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ error: 'Login failed' }, 500);
  }
}
