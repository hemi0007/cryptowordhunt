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

export default function Leaderboard() {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<HighScore[]>({
          url: '/api/scores',
          method: 'GET',
        });
        setScores(data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard data. Please try again later.');
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
      <div className="p-6 bg-secondary rounded-xl neon-border text-center">
        <h2 className="text-2xl font-bold neon-text mb-4">⚡ Leaderboard</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-secondary rounded-xl neon-border">
        <h2 className="text-2xl font-bold neon-text mb-4">⚡ Leaderboard</h2>
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-secondary rounded-xl neon-border">
      <h2 className="text-2xl font-bold neon-text mb-4">⚡ Crypto Champions</h2>
      
      {scores.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No scores yet. Be the first to make the leaderboard!
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted">
                <th className="text-left py-2 px-2">Rank</th>
                <th className="text-left py-2 px-2">Player</th>
                <th className="text-right py-2 px-2">Score</th>
                <th className="text-right py-2 px-2 hidden sm:table-cell">Words</th>
                <th className="text-right py-2 px-2 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <motion.tr
                  key={score.id}
                  className="border-b border-muted hover:bg-muted/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="py-2 px-2">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </td>
                  <td className="py-2 px-2 font-medium">
                    {score.playerName}
                  </td>
                  <td className="py-2 px-2 text-right font-mono neon-green">
                    {score.score.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right hidden sm:table-cell">
                    {score.wordsFound}/{score.totalWords}
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground text-sm hidden md:table-cell">
                    {formatDate(score.completedAt)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}