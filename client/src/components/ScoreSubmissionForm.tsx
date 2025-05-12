import { useState } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from '../lib/queryClient';

interface ScoreSubmissionFormProps {
  score: number;
  wordsFound: number;
  totalWords: number;
  onScoreSubmitted: () => void;
  onCancel: () => void;
}

export default function ScoreSubmissionForm({
  score,
  wordsFound,
  totalWords,
  onScoreSubmitted,
  onCancel
}: ScoreSubmissionFormProps) {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const scoreData = {
        playerName: playerName.trim(),
        score,
        wordsFound,
        totalWords
      };
      
      // Submit score via server API
      try {
        const result = await apiRequest({
          url: '/api/supabase/scores',
          method: 'POST',
          body: scoreData,
          on401: 'throw'
        });
        
        if (result && result.id) {
          console.log('Score submitted to Supabase successfully', result);
          onScoreSubmitted();
          return;
        } else {
          console.warn('Failed to submit score to Supabase (no ID returned), trying fallback');
        }
      } catch (supabaseErr) {
        console.warn('Failed to submit score to Supabase, trying fallback:', supabaseErr);
      }
      
      // Fallback to regular API
      await apiRequest({
        url: '/api/scores',
        method: 'POST',
        body: scoreData,
        on401: 'throw'
      });
      
      console.log('Score submitted to fallback API successfully');
      onScoreSubmitted();
    } catch (err) {
      console.error('Failed to submit score to both APIs:', err);
      setError('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="p-6 bg-secondary rounded-xl neon-border"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold neon-text mb-4">🏆 Save Your Score</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-sm uppercase tracking-wide text-muted-foreground">Score</div>
          <div className="text-3xl font-mono neon-green">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm uppercase tracking-wide text-muted-foreground">Words Found</div>
          <div className="text-3xl font-mono neon-green">{wordsFound}/{totalWords}</div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="playerName" className="block text-sm font-medium mb-1">
            Your Name
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full py-2 px-3 bg-background border border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your crypto alias"
            maxLength={20}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-muted rounded-md hover:bg-muted/50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Saving</span>
                <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
              </>
            ) : (
              'Save Score'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}