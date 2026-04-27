import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from './env';

const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export function getPool(): Pool {
  return pool;
}
