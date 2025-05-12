import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Type definitions for our high scores table
export interface HighScore {
  id: number;
  player_name: string;
  score: number;
  words_found: number;
  total_words: number;
  created_at: string;
}

// Function to fetch high scores
export async function getHighScores(limit = 10): Promise<HighScore[]> {
  const { data, error } = await supabase
    .from('high_scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching high scores:', error);
    throw error;
  }
  
  return data || [];
}

// Function to submit a high score
export async function submitHighScore(
  playerName: string,
  score: number,
  wordsFound: number,
  totalWords: number
): Promise<HighScore> {
  const { data, error } = await supabase
    .from('high_scores')
    .insert([
      {
        player_name: playerName,
        score,
        words_found: wordsFound,
        total_words: totalWords
      }
    ])
    .select()
    .single();
  
  if (error) {
    console.error('Error submitting high score:', error);
    throw error;
  }
  
  return data;
}