import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool({
  connectionString: config.databaseUrl || undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

async function closePool(): Promise<void> {
  await pool.end();
}

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/postgresql:\/\/[^\s]+/g, '[connection string omitted]');
  }
  return 'Unknown error';
}

export { pool, testConnection, closePool, sanitizeErrorMessage };
