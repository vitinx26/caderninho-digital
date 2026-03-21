import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';

// Parse DATABASE_URL or use individual env vars
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'caderninho';
  
  if (password) {
    return `mysql://${user}:${password}@${host}:${port}/${database}`;
  }
  return `mysql://${user}@${host}:${port}/${database}`;
};

const databaseUrl = getDatabaseUrl();
console.log('[db-client] Conectando ao banco:', databaseUrl.split('@')[1] || 'usando DATABASE_URL');

// Parse connection string
const url = new URL(databaseUrl);
const poolPromise = mysql.createPool({
  connectionLimit: 10,
  host: url.hostname,
  port: url.port ? parseInt(url.port) : 3306,
  database: url.pathname.slice(1),
  user: url.username,
  password: url.password,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl')!) : undefined,
});

export const db = drizzle(poolPromise, { schema, mode: 'default' }) as any;
