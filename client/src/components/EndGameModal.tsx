import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useGame } from "../lib/stores/useGame";
import ScoreSubmissionForm from "./ScoreSubmissionForm";
import Leaderboard from "./Leaderboard";
import { apiRequest } from "../lib/queryClient";

interface EndGameModalProps {
  score: number;
  foundWords: number;
  totalWords: number;
  onContinueNextRound?: () => void;
  roundComplete?: boolean;
}

const EndGameModal: React.FC<EndGameModalProps> = ({ 
  score, 
  foundWords, 
  totalWords,
  onContinueNextRound,
  roundComplete = false
}) => {
  const { restart } = useGame();
  const [isSuccess, setIsSuccess] = useState(false);
  const [view, setView] = useState<'result' | 'submitScore' | 'leaderboard'>('result');
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [topScores, setTopScores] = useState<any[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);

  // Determine if game result is a success and fetch top scores
  useEffect(() => {
    // Consider it a success if the player found at least 50% of words
    setIsSuccess(foundWords >= Math.ceil(totalWords / 2));

    // Update confetti window size on resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    
    // Fetch top scores for the leaderboard
    const fetchTopScores = async () => {
      try {
        setLoadingScores(true);
        const data = await apiRequest<any[]>({
          url: '/api/scores',
          method: 'GET',
          on401: 'returnNull'
        });
        setTopScores(data?.slice(0, 3) || []);
      } catch (err) {
        console.error('Failed to fetch top scores:', err);
      } finally {
        setLoadingScores(false);
      }
    };

    fetchTopScores();
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [foundWords, totalWords]);

  // Function to calculate the display rank
  const calculateRank = () => {
    const percentage = (foundWords / totalWords) * 100;
    
    if (percentage >= 90) return "Crypto Whale 🐋";
    if (percentage >= 75) return "Diamond Hands 💎";
    if (percentage >= 50) return "HODLer 💰";
    if (percentage >= 30) return "Paper Hands 📄";
    return "Nocoiner 🥲";
  };

  // Handle play again button
  const handlePlayAgain = () => {
    restart();
  };

  // Share result directly on X (Twitter)
  const shareResult = () => {
    // Prepare share text with hashtags and emojis for better visibility
    const shareText = `🚀 I just scored ${score} points finding ${foundWords}/${totalWords} crypto words in ChainWords! 💎🙌 Can you beat my score? 🔥🏆 #ChainWords #CryptoBros #ToTheMoon 🌕 #Bitcoin ${isSuccess ? '📈💰' : '💪😎'}`;
    
    // Always use direct X (Twitter) share URL
    // This will open Twitter's compose tweet page with the pre-filled text
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  // Handle score submission completed
  const handleScoreSubmitted = () => {
    setView('leaderboard');
  };

  // Render the appropriate view
  const renderView = () => {
    switch (view) {
      case 'submitScore':
        return (
          <ScoreSubmissionForm 
            score={score}
            wordsFound={foundWords}
            totalWords={totalWords}
            onScoreSubmitted={handleScoreSubmitted}
            onCancel={() => setView('result')}
          />
        );
      case 'leaderboard':
        return (
          <div className="p-4">
            <Leaderboard />
            <div className="mt-6 flex justify-center">
              <motion.button
                className="bg-primary text-foreground py-2 px-6 rounded-md"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePlayAgain}
              >
                <i className="fas fa-play mr-2"></i> Play Again
              </motion.button>
            </div>
          </div>
        );
      default:
        return (
          <>
            {/* Header with result text */}
            <div className={`p-6 ${isSuccess ? 'bg-green-900/30' : 'bg-amber-900/30'}`}>
              <h2 className="text-3xl font-bold text-center mb-2">
                {isSuccess ? '🚀 Game Complete!' : '⏱️ Time\'s Up!'}
              </h2>
              <p className="text-center text-muted-foreground">
                {isSuccess 
                  ? 'Great job! You\'ve found enough crypto words.'
                  : 'Keep practicing! The crypto market is volatile.'}
              </p>
            </div>
            
            {/* Game statistics */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-sm uppercase tracking-wide text-muted-foreground">Score</div>
                  <div className="text-3xl font-mono neon-green">{score}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm uppercase tracking-wide text-muted-foreground">Words</div>
                  <div className="text-3xl font-mono neon-green">{foundWords}/{totalWords}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm uppercase tracking-wide text-muted-foreground">Rank</div>
                  <div className="text-xl font-mono text-gradient">{calculateRank()}</div>
                </div>
              </div>
              
              {/* Top Crypto Hunters */}
              <div className="mb-6 border rounded-xl p-3 bg-secondary/40">
                <h3 className="text-lg font-semibold neon-text mb-2">🏆 Top Crypto Hunters</h3>
                {loadingScores ? (
                  <div className="flex justify-center py-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : topScores.length > 0 ? (
                  <div className="space-y-2">
                    {topScores.map((score, index) => (
                      <div key={score.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                          <span className="font-medium">{score.playerName}</span>
                        </div>
                        <div className="font-mono neon-green">{score.score.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-2">
                    No scores yet. Be the first to make the leaderboard!
                  </div>
                )}
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {roundComplete && onContinueNextRound ? (
                  <motion.button
                    className="flex-1 bg-green-600 text-foreground py-2 px-4 rounded-md"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onContinueNextRound}
                  >
                    <i className="fas fa-forward mr-2"></i> Continue to Next Round
                  </motion.button>
                ) : (
                  <motion.button
                    className="flex-1 bg-primary text-foreground py-2 px-4 rounded-md"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePlayAgain}
                  >
                    <i className="fas fa-play mr-2"></i> Play Again
                  </motion.button>
                )}
                
                <motion.button
                  className="flex-1 bg-blue-600 text-foreground py-2 px-4 rounded-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={shareResult}
                >
                  <i className="fas fa-share-alt"></i> Share Score on X
                </motion.button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  className="flex-1 bg-amber-600 text-foreground py-2 px-4 rounded-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView('submitScore')}
                >
                  <i className="fas fa-trophy mr-2"></i> Save Score
                </motion.button>
                
                <motion.button
                  className="flex-1 bg-purple-600 text-foreground py-2 px-4 rounded-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView('leaderboard')}
                >
                  <i className="fas fa-list-ol mr-2"></i> Leaderboard
                </motion.button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <>
      {/* Confetti effect for successful games */}
      {isSuccess && view === 'result' && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
          colors={['#FFD700', '#FFB900', '#FFFFFF', '#00FFFF', '#32CD32']}
        />
      )}
      
      {/* Modal overlay */}
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-lg bg-secondary rounded-xl shadow-xl border border-foreground/20 overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default EndGameModal;