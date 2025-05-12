import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from '../lib/queryClient';

interface HighScore {
  id: number;
  playerName: string;
  score: number;
  wordsFound: number;
  totalWords: number;
  completedAt: string;
}

export function HighScoreCard() {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        // Try to fetch from Supabase first
        const data = await apiRequest({
          url: '/api/supabase/scores',
          method: 'GET',
        });
        
        if (Array.isArray(data) && data.length > 0) {
          setScores(data);
        } else {
          // Fall back to regular API
          const fallbackData = await apiRequest({
            url: '/api/scores',
            method: 'GET',
          });
          setScores(fallbackData || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch high scores:', err);
        try {
          // Try fallback API
          const fallbackData = await apiRequest({
            url: '/api/scores',
            method: 'GET',
          });
          setScores(fallbackData || []);
          setError(null);
        } catch (fallbackErr) {
          setError('Failed to load high scores. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchScores();
  }, []);
  
  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="p-4 bg-secondary rounded-xl neon-border text-center">
        <h2 className="text-xl font-bold neon-text mb-2">🏆 Top Crypto Hunters</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-secondary rounded-xl neon-border">
        <h2 className="text-xl font-bold neon-text mb-2">🏆 Top Crypto Hunters</h2>
        <p className="text-red-500 text-center text-sm">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-secondary rounded-xl neon-border">
      <h2 className="text-xl font-bold mb-3 text-center neon-text">🏆 Top Crypto Hunters</h2>
      
      {scores.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm p-2">
          No scores yet. Be the first to join the leaderboard!
        </div>
      ) : (
        <ul className="space-y-2">
          {scores.slice(0, 5).map((score, index) => (
            <motion.li 
              key={score.id}
              className="flex justify-between items-center border-b border-muted py-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center">
                <span className="mr-2">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🔹"}
                </span>
                <span className="truncate max-w-32">{score.playerName}</span>
              </div>
              <span className="font-mono neon-green">{score.score} pts</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}