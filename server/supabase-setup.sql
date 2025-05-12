-- This SQL function will be executed to create the high_scores table if it doesn't exist
CREATE OR REPLACE FUNCTION create_high_scores_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create high_scores table if it doesn't exist
  CREATE TABLE IF NOT EXISTS high_scores (
    id SERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    words_found INTEGER NOT NULL,
    total_words INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );

  -- Create an index on the score column for faster sorting/querying
  CREATE INDEX IF NOT EXISTS high_scores_score_idx ON high_scores(score DESC);
END;
$$;