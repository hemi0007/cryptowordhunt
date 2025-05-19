import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGame } from "../lib/stores/useGame";
import { CRYPTO_WORDS } from "../lib/constants";
import WordSearchGame from "./WordSearchGame";
import EndGameModal from "./EndGameModal";
import GameMenu from "./GameMenu";

function GamePage() {
  // Get game phase from the store
  const { phase, end } = useGame();
  
  // Game state
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [foundWordsCount, setFoundWordsCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [miningActive, setMiningActive] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [gameKey, setGameKey] = useState(Date.now());
  
  // Reference to timer interval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Track words used across rounds to avoid repetition
  const usedWordsRef = useRef<Set<string>>(new Set());

  // Handle timer countdown
  useEffect(() => {
    // Only run timer if we're in playing phase and not paused
    if (phase !== "playing" || timerPaused) {
      return;
    }

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new timer
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        // When timer reaches zero
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          // End the game if round is not complete
          if (!roundComplete && typeof end === 'function') {
            end();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Clean up on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [phase, timerPaused, roundNumber, roundComplete, end]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to get a random set of words for the next round
  const getRandomWordsForRound = (count: number): string[] => {
    const availableWords = CRYPTO_WORDS.filter(
      (word) => !usedWordsRef.current.has(word)
    );

    // If we've used most words, reset the used words to allow reuse
    if (availableWords.length < count) {
      usedWordsRef.current.clear();
      return CRYPTO_WORDS.sort(() => Math.random() - 0.5).slice(0, count);
    }

    // Select random words from available words
    const selectedWords = availableWords
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    // Add to used words set
    selectedWords.forEach((word) => usedWordsRef.current.add(word));

    return selectedWords;
  };

  // Update score and found words count from game component
  const handleStatsUpdate = (
    roundScore: number,
    found: number, 
    total: number
  ): void => {
    // Always update word counts
    setFoundWordsCount(found);
    setTotalWords(total);
    
    // Update score
    setScore(roundScore);

    // Handle round completion
    if (found === total && total > 0 && found > 0 && !roundComplete) {
      console.log(`Round ${roundNumber} completed! Found: ${found}/${total}`);
      setRoundComplete(true);
      setShowModal(true);
      setTimerPaused(true);

      // Stop the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  // Handle continuing to the next round
  const handleContinueNextRound = () => {
    // Store current round before incrementing
    const currentRound = roundNumber;

    // Stop any existing timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset round state
    setShowModal(false);
    setRoundComplete(false);
    setFoundWordsCount(0);
    setTotalWords(0);

    // Calculate new time for next round
    const baseTime = 60;
    const roundBonus = Math.min(10 + (currentRound * 5), 30);
    const newTime = baseTime + roundBonus;
    
    // Set new timer value and increment round
    setTimer(newTime);
    setRoundNumber(currentRound + 1);
    
    // Force WordSearchGame to re-render
    setGameKey(Date.now());
    
    console.log(`Starting round ${currentRound + 1} with ${newTime} seconds`);
    
    // Unpause timer after slight delay to ensure state updates
    setTimeout(() => {
      setTimerPaused(false);
    }, 200);
  };

  // Handle timer pause/resume and power-ups
  const handleTimerPause = (
    isPaused: boolean, 
    powerUpStates?: any
  ): void => {
    console.log(`Timer pause state changed to: ${isPaused ? "PAUSED" : "RUNNING"}`);
    setTimerPaused(isPaused);

    // Handle adding time for FUD Shield
    if (powerUpStates?.addTime) {
      setTimer((prevTime) => prevTime + powerUpStates.addTime);
    }

    // Update mining boost state
    if (powerUpStates && typeof powerUpStates.miningActive !== "undefined") {
      setMiningActive(powerUpStates.miningActive);
    }
  };

  return (
    <motion.div
      className="container mx-auto px-4 py-6 max-w-5xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Hamburger Menu */}
      <GameMenu />
      {/* Game Header */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex flex-col items-center md:items-start">
          <motion.h1
            className="text-3xl font-bold neon-text"
            initial={{ x: -50 }}
            animate={{ x: 0 }}
          >
            ChainWords
          </motion.h1>
          {roundNumber > 1 && (
            <motion.div
              className="text-sm text-primary/80 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Round {roundNumber}
            </motion.div>
          )}
        </div>

        {/* Game Stats */}
        <motion.div
          className="flex space-x-6 mt-4 md:mt-0"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className={`text-center ${miningActive ? "mining-active" : ""}`}>
            <div className="text-sm uppercase tracking-wide text-muted-foreground">
              Score
            </div>
            <div className="text-xl font-mono neon-green score-value">
              {score}
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">
              Words
            </div>
            <div className="text-xl font-mono neon-green">
              {foundWordsCount}/{totalWords}
            </div>
          </div>

          <div
            className={`text-center ${timerPaused ? "fud-shield-active" : ""}`}
          >
            <div className="text-sm uppercase tracking-wide text-muted-foreground">
              Time
            </div>
            <div
              className={`text-xl font-mono timer-value ${
                timerPaused 
                  ? "text-amber-500" 
                  : timer <= 10 
                    ? "text-red-500" 
                    : "neon-blue"
              }`}
            >
              {formatTime(timer)}{" "}
              {timerPaused && <span className="text-xs">(paused)</span>}
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
          key={gameKey}
          onStatsUpdate={handleStatsUpdate}
          timeRemaining={timer}
          onTimePause={handleTimerPause}
          roundNumber={roundNumber}
          getRandomWords={getRandomWordsForRound}
        />
      </motion.div>

      {/* End Game Modal - Time ran out */}
      {(phase === "ended" || timer === 0) && !roundComplete && (
        <EndGameModal
          score={score}
          foundWords={foundWordsCount}
          totalWords={totalWords}
          onContinueNextRound={handleContinueNextRound}
          roundComplete={true}
        />
      )}

      {/* Round Complete Modal */}
      {showModal && roundComplete && phase === "playing" && (
        <EndGameModal
          score={score}
          foundWords={foundWordsCount}
          totalWords={totalWords}
          onContinueNextRound={handleContinueNextRound}
          roundComplete={true}
        />
      )}
    </motion.div>
  );
}

export default GamePage;