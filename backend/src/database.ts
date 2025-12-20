import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Use environment variables to configure the PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
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