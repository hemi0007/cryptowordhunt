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
      // Check if the high_scores table exists
      const { error } = await supabase.from('high_scores').select('id').limit(1);
      
      if (error) {
        // Most likely table doesn't exist yet - try to create it
        log('Creating high_scores table in Supabase', 'database');
        try {
          await this.createHighScoresTable();
        } catch (createError) {
          // If creation fails, log but don't throw - we'll try to continue anyway
          console.warn('Table creation error:', createError);
        }
      } else {
        log('Connected to Supabase high_scores table', 'database');
      }
    } catch (err) {
      console.warn('Error initializing Supabase - will attempt to continue:', err);
      // We'll continue anyway and try operations as needed
    }
  }

  private async createHighScoresTable() {
    // Creating the table directly with Supabase's interface
    try {
      // Create the table directly using Supabase's create API
      const { error } = await supabase
        .from('high_scores')
        .insert([
          {
            player_name: 'CryptoBro',
            score: 1250,
            words_found: 12,
            total_words: 15,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error && error.code !== '23505') { // Ignore unique violation errors
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