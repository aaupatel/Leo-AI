import { pool, closePool, sanitizeErrorMessage } from './index';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function ensureSchemaMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
  } finally {
    client.release();
  }
}

interface MigrationRecord {
  name: string;
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const client = await pool.connect();
  try {
    const result = await client.query<MigrationRecord>('SELECT name FROM schema_migrations');
    return new Set(result.rows.map((row) => row.name));
  } finally {
    client.release();
  }
}

function getMigrationFiles(): string[] {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith('.sql'));
  return files.sort();
}

async function runMigration(name: string, filePath: string): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`Applied: ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    client.release();
  }
}

async function runMigrations(): Promise<void> {
  console.log('Starting migration runner...');

  await ensureSchemaMigrations();
  console.log('Migration tracking table ensured.');

  const applied = await getAppliedMigrations();
  const files = getMigrationFiles();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  let pendingCount = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipped: ${file} (already applied)`);
    } else {
      const filePath = path.join(MIGRATIONS_DIR, file);
      console.log(`Applying: ${file}`);
      await runMigration(file, filePath);
      pendingCount++;
    }
  }

  if (pendingCount === 0) {
    console.log('No pending migrations.');
  } else {
    console.log(`${pendingCount} migration(s) applied.`);
  }
}

runMigrations()
  .then(() => {
    console.log('Migrations complete.');
    return closePool();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Migration failed: ${sanitizeErrorMessage(error)}`);
    return closePool()
      .catch(() => undefined)
      .then(() => process.exit(1));
  });
