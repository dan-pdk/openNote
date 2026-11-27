import { Pool } from 'pg';

const globalForPg = globalThis as unknown as { pool: Pool | undefined };

const pool =
  globalForPg.pool ??
  new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 5432,
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pool = pool;
}

type QueryResultObject = {
  text: string;
  values: any[];
};

type QueryCommand = {
  insert: (table: string) => QueryCommand;
  values: (valuesData: Record<string, any>) => QueryCommand;
  returning: (columns?: string) => QueryCommand;
  resolve: () => QueryResultObject;
  query: string;
  params: any[];
};

function createQueryCommand(): QueryCommand {
  const command: QueryCommand = {
    query: '',
    params: [],
    insert(table: string) {
      command.query += `INSERT INTO ${table} `;
      return command;
    },
    values(valuesData: Record<string, any>) {
      const entries = Object.entries(valuesData).filter(
        ([_, val]) => val !== undefined
      );
      const keys = entries.map(([key]) => key);
      const vals = entries.map(([_, val]) => val);

      const placeholders = vals.map((_, index) => `$${index + 1}`);

      command.query += `(${keys.join(', ')}) VALUES (${placeholders.join(', ')})`;
      command.params = vals;
      return command;
    },
    returning(columns = '*') {
      command.query += ` RETURNING ${columns}`;
      return command;
    },
    resolve() {
      return {
        text: `${command.query};`,
        values: command.params,
      };
    },
  };

  return command;
}

async function runQuery<T = any>(
  query: string | QueryResultObject,
  values?: Array<any>
): Promise<T[]> {
  if (typeof query === 'object') {
    const { rows } = await pool.query(query.text, query.values);
    return rows;
  }

  const { rows } = values
    ? await pool.query(query, values)
    : await pool.query(query);
  return rows;
}

async function runInTransaction<T>(
  transactionCallback: (
    queryExecutor: <RowType = Record<string, unknown>>(
      queryText: string,
      queryValues?: unknown[]
    ) => Promise<RowType[]>
  ) => Promise<T>
): Promise<T> {
  const databaseClient = await pool.connect();
  try {
    await databaseClient.query('BEGIN');
    const transactionResult = await transactionCallback(
      async <RowType = Record<string, unknown>>(
        queryText: string,
        queryValues?: unknown[]
      ) => {
        const { rows } = queryValues
          ? await databaseClient.query(queryText, queryValues)
          : await databaseClient.query(queryText);
        return rows as RowType[];
      }
    );
    await databaseClient.query('COMMIT');
    return transactionResult;
  } catch (transactionError) {
    await databaseClient.query('ROLLBACK');
    throw transactionError;
  } finally {
    databaseClient.release();
  }
}

const controller = {
  createQueryCommand,
  runQuery,
  runInTransaction,
};

export default controller;