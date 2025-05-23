import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGame } from "../lib/stores/useGame";
import { useAudio } from "../lib/stores/useAudio";
import { CRYPTO_WORDS } from "../lib/constants";
import WordSearchGame from "./WordSearchGame";
import EndGameModal from "./EndGameModal";

// Define the GamePage component
function GamePage() {
  // Get game phase from the store
  const { phase, end } = useGame();

  // Track words used across rounds to avoid repetition - inside component body
  const usedWordsRef = useRef<Set<string>>(new Set());

  // Game state
  const [timer, setTimer] = useState(300); // 5 minutes = 300 seconds
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

  // New state to track modal dismissal
  const [modalDismissed, setModalDismissed] = useState(false);

  // Reset modal dismissed state when round changes
  useEffect(() => {
    setModalDismissed(false);
  }, [roundNumber]);

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

    // Double check that modal is hidden when timer starts
    if (roundNumber > 1) {
      setShowModal(false);
      setModalDismissed(true);
    }

    // Set up new timer
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        // When timer reaches zero
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          // End the game if time runs out, regardless of round number
          if (typeof end === "function") {
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
  }, [phase, timerPaused, roundNumber, end]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to get a random set of words for the next round
  const getRandomWordsForRound = (count: number): string[] => {
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

  // Update score and found words count from game component
  const handleStatsUpdate = (
    roundScore: number,
    found: number,
    total: number,
  ): void => {
    // Always update word counts
    setFoundWordsCount(found);
    setTotalWords(total);

    // Update score
    setScore(roundScore);

    // Check for round completion condition
    if (found === total && total > 0 && found > 0) {
      console.log(`Round ${roundNumber} completed! Found: ${found}/${total}`);

      // For round 3, only show completion but don't auto-end
      if (roundNumber >= 3) {
        console.log("Round 3 in progress, completion: " + found + "/" + total);
        if (found === total) {
          console.log("Final round completed! Showing completion modal...");
          setTimeout(() => {
            setRoundComplete(true);
            setShowModal(true);
            setModalDismissed(false);
            setTimerPaused(true);
            // Don't automatically end the game, let the modal handle it
          }, 100);
        }
      
      } else {
        // Normal round completion for rounds 1-2
        setRoundComplete(true);
        setShowModal(true);
        setModalDismissed(false);
        setTimerPaused(true);

        // Stop the timer for intermediate rounds
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  };

  // Get base time for a specific round
  const getBaseTimeForRound = (round: number): number => {
    // Base time increases with round number
    const baseTime = 300; // 5 minutes base
    const additionalTime = Math.min(10 + (round - 1) * 5, 30); // Cap at 30 seconds additional
    return baseTime + additionalTime;
  };

  // Handle continuing to the next round
  const handleContinueNextRound = () => {
    // Store current round number before updating
    const currentRound = roundNumber;

    // CRITICAL: Explicitly hide modal first
    setShowModal(false);
    setModalDismissed(true);

    // Stop any existing timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Ensure round is marked as not complete
    setRoundComplete(false);

    // Important: Set timer to paused state during transition
    setTimerPaused(true);

    // Reset all round-specific state
    setFoundWordsCount(0);
    setTotalWords(0);

    // Calculate new time for next round BEFORE updating round number
    const newTime = getBaseTimeForRound(currentRound + 1);

    // First update the timer
    setTimer(newTime);

    console.log("Modal hidden, round state reset, preparing next round");

    // Then after a small delay, update round number and gameKey
    setTimeout(() => {
      console.log(`Starting round ${currentRound + 1} with ${newTime} seconds`);
      setRoundNumber(currentRound + 1);

      // Force WordSearchGame to re-render with a new key and ensure all state is reset
      const newGameKey = Date.now();
      setGameKey(newGameKey);
      console.log(`New game key created: ${newGameKey} for round ${currentRound + 1}`);

      // Important: Unpause timer AFTER the game has fully rendered
      setTimeout(() => {
        // Double check modal is hidden before unpausing
        setShowModal(false);
        setTimerPaused(false);
        console.log("Timer unpaused, round fully initialized");
      }, 800); // Longer delay to ensure game is fully initialized

      // Additional check after a longer delay to make sure the next round is properly started
      if (currentRound + 1 >= 3) {
        console.log("Preparing final round with extra initialization time");
        setTimeout(() => {
          // Force another re-render if needed for the final round
          if (foundWordsCount === 0 && totalWords === 0) {
            console.log("Final round needs re-initialization");
            setGameKey(Date.now());
          }
          console.log("Final round initialization complete");
        }, 1200);
      }
    }, 200); // Slightly longer delay for better round transition
  };

  // Enhanced timer pause/resume with better handling for round completion
  const handleTimerPause = (isPaused: boolean, powerUpStates?: any): void => {
    console.log(
      `Timer pause state changed to: ${isPaused ? "PAUSED" : "RUNNING"}`,
    );

    // Only update pause state if we're not at round completion
    if (!roundComplete || !showModal) {
      setTimerPaused(isPaused);
    } else {
      // Ensure timer stays paused during round completion
      setTimerPaused(true);
    }

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
      {/* We've removed the hamburger menu */}
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

      {/* End Game Modal - Time ran out or game ended */}
      {phase === "ended" && (
        <EndGameModal
          score={score}
          foundWords={foundWordsCount}
          totalWords={totalWords}
          onContinueNextRound={
            roundNumber < 3 ? handleContinueNextRound : undefined
          }
          roundComplete={true}
          finalRound={roundNumber >= 3}
        />
      )}

      {/* Round Complete Modal - For all rounds including final round */}
      {showModal && roundComplete && phase === "playing" && (
        <EndGameModal
          score={score}
          foundWords={foundWordsCount}
          totalWords={totalWords}
          onContinueNextRound={roundNumber < 3 ? handleContinueNextRound : undefined}
          roundComplete={true}
          finalRound={roundNumber >= 3}
        />
      )}
    </motion.div>
  );
}

export default GamePage;