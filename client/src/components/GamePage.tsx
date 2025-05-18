import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGame } from "../lib/stores/useGame";
import { CRYPTO_WORDS, DIFFICULTY_LEVELS } from "../lib/constants";
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
  const [roundNumber, setRoundNumber] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [gameKey, setGameKey] = useState(Date.now()); // Key to force re-render of WordSearchGame
  const intervalRef = useRef(null);

  // Reference to track the last processed score to prevent duplicate updates
  const lastScoreUpdateRef = useRef({ round: 1, found: 0 });

  // Track used words to avoid repetition across rounds
  const usedWordsRef = useRef(new Set());

  // Handle timer countdown - FIXED TIMING LOGIC
  useEffect(() => {
    // Only run timer if we're in playing phase and not paused
    if (phase !== "playing" || timerPaused) {
      return;
    }

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up new timer
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Time's up
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Clean up on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, timerPaused, roundNumber]); // Added roundNumber as dependency to ensure timer restarts

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to get a random set of words for next round
  const getRandomWordsForRound = (count) => {
    const availableWords = CRYPTO_WORDS.filter(
      (word) => !usedWordsRef.current.has(word),
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

  // Update score and found words count from child components
  const handleStatsUpdate = (roundScore, found, total) => {
    console.log(
      `Stats update received: roundScore=${roundScore}, found=${found}, total=${total}, roundNumber=${roundNumber}`,
    );

    // Always update word counts
    setFoundWordsCount(found);
    setTotalWords(total);

    // Make sure roundScore is a number
    const scoreToAdd = typeof roundScore === "number" ? roundScore : 0;

    // Only update score if we have a valid score to add
    if (scoreToAdd > 0) {
      setScore((prevScore) => prevScore + scoreToAdd);
      console.log(`Adding ${scoreToAdd} points to score`);
    }

    // Track this update to prevent duplicates
    lastScoreUpdateRef.current = {
      round: roundNumber,
      found: found,
    };

    // Handle round completion
    if (found === total && total > 0 && found > 0) {
      // Prevent multiple round completion triggers
      if (!roundComplete) {
        console.log(`Round ${roundNumber} completed! Found: ${found}/${total}`);
        setRoundComplete(true);
        setShowModal(true);

        // Pause the timer when round is complete
        setTimerPaused(true);

        // Make sure we stop any running timer interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  };

  // Handle continuing to the next round - FIXED TRANSITION LOGIC
  const handleContinueNextRound = () => {
    // Important: Store current round before incrementing for bonus calculation
    const currentRound = roundNumber;

    // Stop any existing timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset round state first
    setShowModal(false);
    setRoundComplete(false);
    setTimerPaused(false);

    // Reset found words count but NOT the score
    setFoundWordsCount(0);
    setTotalWords(0);

    // Calculate new time for next round
    const baseTime = 60; // One minute base time
    const roundBonus = Math.min(10 + currentRound * 5, 30); // Cap at 30 seconds
    const newTime = baseTime + roundBonus;

    // Set new timer value
    setTimer(newTime);

    // Increment round number
    const nextRound = currentRound + 1;
    setRoundNumber(nextRound);

    // Update last score reference for the new round
    lastScoreUpdateRef.current = {
      round: nextRound,
      found: 0,
    };

    // Force WordSearchGame to re-render with new key
    // Delay slightly to ensure state updates have processed
    setTimeout(() => {
      setGameKey(Date.now());
    }, 50);

    console.log(
      `Starting round ${nextRound} with ${newTime} seconds, current score: ${score}`,
    );
  };

  // Handle timer pause/resume from power-ups
  const handleTimerPause = (isPaused, powerUpStates) => {
    console.log(
      `Timer pause state changed to: ${isPaused ? "PAUSED" : "RUNNING"}`,
    );

    setTimerPaused(isPaused);

    // Handle adding time for FUD Shield
    if (powerUpStates?.addTime) {
      setTimer((prevTime) => prevTime + powerUpStates.addTime);
    }

    // Update mining boost state if provided
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
              className={`text-xl font-mono timer-value ${timerPaused ? "text-amber-500" : timer <= 10 ? "text-red-500" : "neon-blue"}`}
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
          key={gameKey} // Force re-render on new round
          onStatsUpdate={handleStatsUpdate}
          timeRemaining={timer}
          onTimePause={handleTimerPause}
          roundNumber={roundNumber}
          getRandomWords={getRandomWordsForRound}
          currentTotalScore={score} // Pass down current total score
        />
      </motion.div>

      {/* End Game Modal - Shown at game end or when round complete */}
      {(phase === "ended" || timer === 0) && !roundComplete && (
        <EndGameModal
          score={score}
          foundWords={foundWordsCount}
          totalWords={totalWords}
        />
      )}

      {/* Round Complete Modal - Only shown when round is complete but game not ended */}
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
};
