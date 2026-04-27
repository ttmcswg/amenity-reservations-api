import { getPool, query } from '../config/db';
import { initializeDatabase } from '../config/initDb';

export async function ensureTestDatabaseReady(): Promise<void> {
  await initializeDatabase();
}

export async function truncateUsersTable(): Promise<void> {
  await query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
}

export async function closeTestDatabase(): Promise<void> {
  await getPool().end();
}
