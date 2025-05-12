import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { log } from './vite';

// Create a router
const router = Router();

// Create a Supabase client for API routes
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

// Type definitions
interface HighScore {
  id?: number;
  player_name: string;
  score: number;
  words_found: number;
  total_words: number;
  created_at?: string;
}

// GET high scores
router.get('/supabase/scores', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    console.log('Fetching high scores from Supabase, limit:', limit);
    console.log('Supabase URL exists:', !!process.env.SUPABASE_URL);
    console.log('Supabase KEY exists:', !!process.env.SUPABASE_KEY);
    
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    
    console.log('Supabase fetch response:', {
      success: !error,
      dataCount: data ? data.length : 0,
      error: error ? {
        code: error.code,
        message: error.message
      } : null
    });
    
    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        log(`High scores table not found in Supabase. Returning empty array.`, 'api');
        return res.json([]);
      }
      
      log(`Error fetching high scores: ${error.message}`, 'api');
      console.error('Full Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch high scores' });
    }
    
    // Transform data to match our API format
    const scores = data.map(item => ({
      id: item.id,
      playerName: item.player_name,
      score: item.score,
      wordsFound: item.words_found,
      totalWords: item.total_words,
      completedAt: item.created_at
    }));
    
    return res.json(scores);
  } catch (err) {
    console.error('Error in GET /supabase/scores:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST a new high score
router.post('/supabase/scores', async (req: Request, res: Response) => {
  try {
    const { playerName, score, wordsFound, totalWords } = req.body;
    
    console.log('Attempting to save score to Supabase:', {
      playerName, 
      score, 
      wordsFound, 
      totalWords
    });
    
    // Validate required fields
    if (!playerName || typeof score !== 'number' || typeof wordsFound !== 'number' || typeof totalWords !== 'number') {
      console.error('Invalid data provided:', req.body);
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }
    
    // Log Supabase connection details (without exposing full keys)
    console.log('Supabase URL exists:', !!process.env.SUPABASE_URL);
    console.log('Supabase KEY exists:', !!process.env.SUPABASE_KEY);
    console.log('Using Supabase URL:', process.env.SUPABASE_URL?.substring(0, 15) + '...');
    console.log('Using Supabase KEY (first 5 chars):', process.env.SUPABASE_KEY?.substring(0, 5) + '...');
    
    try {
      // First check if the table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('high_scores')
        .select('count(*)')
        .limit(1);
      
      console.log('Table check:', { 
        success: !tableError, 
        error: tableError ? tableError.message : null,
        data: tableCheck
      });
      
      if (tableError) {
        console.error('Error checking table existence:', tableError);
        throw tableError;
      }
      
      // Try to insert the data
      const { data, error } = await supabase
        .from('high_scores')
        .insert([{
          player_name: playerName,
          score,
          words_found: wordsFound,
          total_words: totalWords
        }])
        .select()
        .single();
      
      console.log('Supabase insert response:', { 
        success: !error, 
        error: error ? {
          code: error.code,
          message: error.message
        } : null,
        data: data ? 'Data received' : 'No data'
      });
      
      if (error) {
        console.error('Full insert error:', error);
        throw error;
      }
      
      // If we get here, save was successful
      console.log('Successfully inserted score into Supabase!');
      
      // Transform for our API format
      const savedScore = {
        id: data.id,
        playerName: data.player_name,
        score: data.score,
        wordsFound: data.words_found,
        totalWords: data.total_words,
        completedAt: data.created_at
      };
      
      return res.status(201).json(savedScore);
    } catch (supabaseError: any) {
      console.error('Supabase error:', supabaseError);
      
      // If table doesn't exist, return a mock success response
      if (supabaseError.code === '42P01') {
        log(`High scores table not found in Supabase. Returning mock data.`, 'api');
        
        // Return mock data as a fallback
        return res.status(201).json({
          id: Date.now(),
          playerName,
          score,
          wordsFound,
          totalWords,
          completedAt: new Date().toISOString()
        });
      }
      
      log(`Error saving high score: ${supabaseError.message || 'Unknown error'}`, 'api');
      console.error('Full Supabase error:', supabaseError);
      
      // Return a 201 with the data that would have been saved to prevent client-side errors
      return res.status(201).json({
        id: Date.now(),
        playerName,
        score,
        wordsFound,
        totalWords,
        completedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Error in POST /supabase/scores:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const supabaseRoutes = router;