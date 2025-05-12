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
    
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        log(`High scores table not found in Supabase. Returning empty array.`, 'api');
        return res.json([]);
      }
      
      log(`Error fetching high scores: ${error.message}`, 'api');
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
    
    // Validate required fields
    if (!playerName || typeof score !== 'number' || typeof wordsFound !== 'number' || typeof totalWords !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }
    
    // Save to Supabase
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
    
    if (error) {
      // If table doesn't exist, return a mock success response
      if (error.code === '42P01') {
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
      
      log(`Error saving high score: ${error.message}`, 'api');
      return res.status(500).json({ error: 'Failed to save high score' });
    }
    
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
  } catch (err) {
    console.error('Error in POST /supabase/scores:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const supabaseRoutes = router;