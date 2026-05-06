import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

function getDatabaseUrlHost() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    return new URL(process.env.DATABASE_URL).hostname;
  } catch {
    return null;
  }
}

function requirePostgresEnv() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const requiredEnv = ['PGHOST', 'PGUSER', 'PGDATABASE'];
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing PostgreSQL env value(s): ${missing.join(', ')}`);
  }
}

function shouldUseSsl() {
  if (process.env.PGSSL === 'false') {
    return false;
  }

  return Boolean(process.env.DATABASE_URL);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE,
  max: Number(process.env.PG_CONNECTION_LIMIT || 10),
  ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false,
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trips (
      id BIGSERIAL PRIMARY KEY,
      place VARCHAR(255) NOT NULL,
      start_date VARCHAR(32) NOT NULL,
      end_date VARCHAR(32) NOT NULL,
      budget NUMERIC(12, 2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id BIGSERIAL PRIMARY KEY,
      trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      spent_at VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      expense_date VARCHAR(32) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id)');
}

export async function connectDB() {
  requirePostgresEnv();

  try {
    const client = await pool.connect();
    client.release();
  } catch (error) {
    const host = getDatabaseUrlHost();

    if (error.code === 'ENOTFOUND' && host?.startsWith('dpg-') && !host.includes('.render.com')) {
      throw new Error(
        'Render internal PostgreSQL hostname is not reachable from this machine. In Render, open your PostgreSQL database, click Connect, choose External, and paste the External Database URL into DATABASE_URL.',
      );
    }

    throw error;
  }

  await ensureSchema();
  console.log('PostgreSQL connected');
}
