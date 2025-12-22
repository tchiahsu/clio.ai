import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

console.log({
  PG_USER: process.env.PG_USER,
  PG_DATABASE: process.env.PG_DATABASE,
  PG_PORT: process.env.PG_PORT,
  PG_PASSWORD_present: Boolean(process.env.PG_PASSWORD),
  PG_PASSWORD_len: process.env.PG_PASSWORD?.length,
});

// Use environment variables to configure the PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: "127.0.0.1",
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || '5432', 10),
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