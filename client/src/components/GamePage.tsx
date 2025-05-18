import { useState, useEffect, useRef } from "react";
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
  const [timerPaused, setTimerPaused] = useState(false);
  const [miningActive, setMiningActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle timer countdown
  useEffect(() => {
    if (phase !== "playing") return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up timer only if not paused
    if (!timerPaused) {
      console.log("Timer running - not paused");
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            // Time's up
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      console.log("Timer paused by FUD Shield");
    }

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, timerPaused]);

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

  // Handle timer pause/resume from power-ups and other power-up states
  const handleTimerPause = (isPaused: boolean, powerUpStates?: any) => {
    console.log(`Timer pause state changed to: ${isPaused ? "PAUSED" : "RUNNING"}`);
    setTimerPaused(isPaused);

    // Handle adding time for FUD Shield
    if (powerUpStates?.addTime) {
      setTimer(prevTime => prevTime + powerUpStates.addTime);
    }

    // Update mining boost state if provided
    if (powerUpStates && typeof powerUpStates.miningActive !== 'undefined') {
      setMiningActive(powerUpStates.miningActive);
    }
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
          <div className={`text-center ${miningActive ? 'mining-active' : ''}`}>
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Score</div>
            <div className="text-xl font-mono neon-green score-value">{score}</div>
          </div>

          <div className="text-center">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Words</div>
            <div className="text-xl font-mono neon-green">{foundWordsCount}/{totalWords}</div>
          </div>

          <div className={`text-center ${timerPaused ? 'fud-shield-active' : ''}`}>
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Time</div>
            <div className={`text-xl font-mono timer-value ${timerPaused ? "text-amber-500" : timer <= 10 ? "text-red-500" : "neon-blue"}`}>
              {formatTime(timer)} {timerPaused && <span className="text-xs">(paused)</span>}
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
          onTimePause={handleTimerPause}
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