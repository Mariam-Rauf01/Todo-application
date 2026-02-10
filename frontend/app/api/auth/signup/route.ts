import { NextRequest, NextResponse } from 'next/server';

let pool: any = null;

function getPool() {
  if (!pool) {
    const { Pool } = require('pg');
    const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      // Increase connection timeout to allow transient network latency
      connectionTimeoutMillis: process.env.DB_CONN_TIMEOUT ? parseInt(process.env.DB_CONN_TIMEOUT, 10) : 10000,
    });
  }
  return pool;
}

async function queryDB(sql: string, params: any[] = []) {
  // Basic query wrapper with a single reconnect attempt on timeout/connection errors
  let attemptedReconnect = false;
  while (true) {
    try {
      const pg = getPool();
      const result = await pg.query(sql, params);
      return result.rows;
    } catch (err: any) {
      console.error('Query execution error:', err && err.message ? err.message : err);
      // if this looks like a connection timeout or terminated connection, try once to recreate pool
      const msg = (err && err.message) ? String(err.message).toLowerCase() : '';
      const isConnErr = msg.includes('timeout') || msg.includes('terminated') || msg.includes('connect') || msg.includes('ecanceled');
      if (isConnErr && !attemptedReconnect) {
        attemptedReconnect = true;
        try {
          console.warn('Attempting to reset DB pool after connection error');
          if (pool && typeof pool.end === 'function') {
            try { await pool.end(); } catch (e) { console.warn('Error ending pool', e); }
          }
        } catch (e) {
          console.warn('Error while cleaning up pool', e);
        }
        pool = null;
        // small delay before retry
        await new Promise(res => setTimeout(res, 500));
        continue; // retry
      }
      throw err;
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    // Inspect users table columns to adapt to existing schema (email vs username, password_hash vs password)
    const cols = await queryDB("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
    const colNames = cols.map((r: any) => String(r.column_name).toLowerCase());

    const emailCol = colNames.includes('email') ? 'email' : (colNames.includes('username') ? 'username' : null);
    const passwordCols = ['password_hash', 'hashed_password', 'password', 'passwordhash'];
    const passwordCol = passwordCols.find(c => colNames.includes(c)) || null;
    const nameCol = colNames.includes('name') ? 'name' : (colNames.includes('full_name') ? 'full_name' : null);

    if (!emailCol) {
      return NextResponse.json({ error: 'No suitable email/username column found in users table' }, { status: 500 });
    }
    if (!passwordCol) {
      return NextResponse.json({ error: 'No suitable password column found in users table' }, { status: 500 });
    }

    // Check if user already exists (use chosen email/username column)
    const existing = await queryDB(`SELECT id FROM users WHERE ${emailCol} = $1`, [email]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    // Hash password using Node crypto (scrypt) and store as salt:hash
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    const storedPassword = `${salt}:${derived}`;

    // Build insert dynamically based on available columns
    const insertCols = [emailCol, passwordCol];
    const insertVals = [email, storedPassword];
    if (nameCol) {
      insertCols.push(nameCol);
      insertVals.push(name || 'User');
    }

    const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(', ');
    const insertSql = `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING id, ${emailCol}${nameCol ? ', ' + nameCol : ''}`;

    const result = await queryDB(insertSql, insertVals);
    const user = result[0];

    return NextResponse.json({
      user_id: user.id,
      email: user[emailCol],
      name: nameCol ? user[nameCol] : (name || null),
      message: 'Account created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed: ' + String(error).slice(0, 200) },
      { status: 500 }
    );
  }
}
