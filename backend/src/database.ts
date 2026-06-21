import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file (no-op in hosted envs where the
// platform injects vars directly into process.env).
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

// Managed Postgres (e.g. Render) requires SSL. Enable it when PG_SSL=true or a
// Render-style connection string is detected; locally it stays off.
const connectionString = process.env.DATABASE_URL;
const useSsl =
  process.env.PG_SSL === 'true' ||
  Boolean(connectionString && /render\.com/.test(connectionString));
const ssl = useSsl ? { rejectUnauthorized: false } : undefined;

// Prefer a single DATABASE_URL (Render injects this when a DB is linked); fall
// back to discrete PG_* vars for local development.
const pool = new Pool(
  connectionString
    ? { connectionString, ssl }
    : {
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: parseInt(process.env.PG_PORT || '5432', 10),
        ssl,
      }
);

// Set the schema per-connection instead of via the `options` startup parameter:
// Neon's pooled endpoint (PgBouncer) rejects startup params and errors with
// "unsupported startup parameter in options: search_path". Running it as a query
// on each new pooled connection works on both pooled and direct endpoints.
pool.on('connect', (client) => {
  client.query('SET search_path TO clio, public');
});

// Verify the PostgreSQL connection.
async function verifyConnection() {
  try {
    // Attempt to get a client from the pool
    const client = await pool.connect();
    console.log('PostgreSQL connection verified successfully');
    // Release the client back to the pool
    client.release();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

// Verify the connection when the module loads
verifyConnection();

// Export the pool to be used in the application
export default pool;