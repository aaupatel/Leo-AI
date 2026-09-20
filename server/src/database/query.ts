import { pool, QueryResultRow } from './index';

export interface QueryResult<T extends QueryResultRow = QueryResultRow> {
  rows: T[];
  rowCount: number | null;
  command: string;
  oid: number;
  fields: unknown[];
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, values);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', {
      text: text.substring(0, 100),
      duration,
      rows: result.rowCount,
    });
  }
  return result;
}
