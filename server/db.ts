import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Apply migrations function
export async function runMigrations() {
  console.log("Running database migrations...");
  
  try {
    // Dynamically import the migrations
    const migrations = await Promise.all([
      import('../migrations/0001_create_high_scores')
    ]);
    
    // Run the 'up' function for each migration
    for (const migration of migrations) {
      await migration.up();
    }
    
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}