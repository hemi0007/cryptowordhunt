import { createClient } from '@supabase/supabase-js';

// Initialize with empty values first
let supabaseClient = createClient('https://placeholder-url.supabase.co', 'placeholder-key');

// Function to initialize with the correct credentials
export async function initializeSupabase() {
  try {
    // Fetch the configuration from the server
    const response = await fetch('/api/config/supabase');
    const { supabaseUrl, supabaseKey } = await response.json();
    
    if (supabaseUrl && supabaseKey) {
      // Re-create the client with the correct credentials
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully');
    } else {
      console.error('Missing Supabase credentials');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Call the initialization function
initializeSupabase();

// Export the client for use in the application
export const supabase = supabaseClient;

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
  console.log('Client-side: Attempting to fetch high scores from Supabase');
  
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Client-side: Error fetching high scores from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error hint:', error.hint);
      console.error('Error details:', error.details);
      throw error;
    }
    
    console.log('Client-side: Successfully fetched high scores from Supabase:', data?.length || 0, 'records');
    return data || [];
  } catch (err) {
    console.error('Client-side: Exception when fetching scores:', err);
    return [];
  }
}

// Function to submit a high score
export async function submitHighScore(
  playerName: string,
  score: number,
  wordsFound: number,
  totalWords: number
): Promise<HighScore> {
  console.log('Client-side: Attempting to submit high score to Supabase:', {
    playerName, score, wordsFound, totalWords
  });
  
  try {
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
      console.error('Client-side: Error submitting high score to Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error hint:', error.hint);
      console.error('Error details:', error.details);
      throw error;
    }
    
    console.log('Client-side: Successfully submitted high score to Supabase:', data);
    return data;
  } catch (err) {
    console.error('Client-side: Exception when submitting score:', err);
    throw err;
  }
}