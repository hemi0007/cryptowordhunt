import { sql } from 'drizzle-orm';

export async function up() {
  return sql`
    CREATE TABLE IF NOT EXISTS high_scores (
      id SERIAL PRIMARY KEY,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      words_found INTEGER NOT NULL,
      total_words INTEGER NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create an index on score for faster leaderboard queries
    CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores (score DESC);
  `;
}

export async function down() {
  return sql`
    DROP TABLE IF EXISTS high_scores;
  `;
}