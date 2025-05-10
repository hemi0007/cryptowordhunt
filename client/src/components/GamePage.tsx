import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGame } from "../lib/stores/useGame";
import WordSearchGame from "./WordSearchGame";
import EndGameModal from "./EndGameModal";

const GamePage = () => {
  const { phase } = useGame();
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [foundWordsCount, setFoundWordsCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  
  // Handle timer countdown
  useEffect(() => {
    if (phase !== "playing") return;
    
    // Set up timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Time's up
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Clean up on unmount
    return () => clearInterval(interval);
  }, [phase]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Update score and found words count from child components
  const handleStatsUpdate = (newScore: number, found: number, total: number) => {
    setScore(newScore);
    setFoundWordsCount(found);
    setTotalWords(total);
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-6 max-w-5xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Game Header */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-6">
        <motion.h1 
          className="text-3xl font-bold neon-text"
          initial={{ x: -50 }}
          animate={{ x: 0 }}
        >
          ChainWords
        </motion.h1>
        
        {/* Game Stats */}
        <motion.div 
          className="flex space-x-6 mt-4 md:mt-0"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Score</div>
            <div className="text-xl font-mono neon-green">{score}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Words</div>
            <div className="text-xl font-mono neon-green">{foundWordsCount}/{totalWords}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Time</div>
            <div className={`text-xl font-mono ${timer <= 10 ? "text-red-500" : "neon-blue"}`}>
              {formatTime(timer)}
            </div>
          </div>
        </motion.div>
      </header>

      {/* Game Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <WordSearchGame 
          onStatsUpdate={handleStatsUpdate} 
          timeRemaining={timer}
        />
      </motion.div>

      {/* End Game Modal */}
      {(phase === "ended" || timer === 0) && (
        <EndGameModal 
          score={score} 
          foundWords={foundWordsCount} 
          totalWords={totalWords} 
        />
      )}
    </motion.div>
  );
};

export default GamePage;
