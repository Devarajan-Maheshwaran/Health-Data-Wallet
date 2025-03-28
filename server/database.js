import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Create a PostgreSQL connection function
export function createConnection() {
  // Get the connection string from environment variables
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    throw new Error('Database configuration error: Missing DATABASE_URL');
  }
  
  try {
    const client = postgres(connectionString);
    const db = drizzle(client, { schema });
    
    console.log('Database connection established successfully');
    return db;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

// Create connection singleton
let dbInstance = null;

export function getDbConnection() {
  if (!dbInstance) {
    dbInstance = createConnection();
  }
  return dbInstance;
}

// Export for direct use
export const db = getDbConnection();