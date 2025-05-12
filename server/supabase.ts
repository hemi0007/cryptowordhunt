import { createClient } from '@supabase/supabase-js';
import { log } from './vite';

// Environment variable validation
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for server-side operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Type definitions
export interface HighScore {
  id?: number;
  player_name: string;
  score: number;
  words_found: number;
  total_words: number;
  created_at?: string;
}

export interface SupabaseStorage {
  // High Scores
  saveHighScore(data: Omit<HighScore, 'id' | 'created_at'>): Promise<HighScore>;
  getTopScores(limit?: number): Promise<HighScore[]>;
}

export class SupabaseStorageImpl implements SupabaseStorage {
  constructor() {
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    try {
      // Check if the high_scores table exists, if not create it
      const { error } = await supabase.from('high_scores').select('id').limit(1);
      
      if (error && error.code === '42P01') { // Table doesn't exist
        log('Creating high_scores table in Supabase', 'database');
        await this.createHighScoresTable();
      } else if (error) {
        console.error('Error checking high_scores table:', error);
      } else {
        log('Connected to Supabase high_scores table', 'database');
      }
    } catch (err) {
      console.error('Failed to initialize Supabase:', err);
    }
  }

  private async createHighScoresTable() {
    // Note: This is a simplified approach - in a production app,
    // you would use Supabase migrations or the dashboard UI
    try {
      // Using Postgres SQL through Supabase's SQL API
      const { error } = await supabase.rpc('create_high_scores_table');
      
      if (error) {
        console.error('Error creating high_scores table:', error);
        throw error;
      }
      
      log('High scores table created successfully', 'database');
    } catch (err) {
      console.error('Failed to create high_scores table:', err);
      throw err;
    }
  }

  async saveHighScore(data: Omit<HighScore, 'id' | 'created_at'>): Promise<HighScore> {
    const { data: savedScore, error } = await supabase
      .from('high_scores')
      .insert([data])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving high score to Supabase:', error);
      throw error;
    }
    
    return savedScore;
  }

  async getTopScores(limit: number = 10): Promise<HighScore[]> {
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching high scores from Supabase:', error);
      throw error;
    }
    
    return data || [];
  }
}