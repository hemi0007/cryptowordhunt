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
  const { toggleMute, isMuted, setVolume, volume: audioVolume } = useAudio();
  
  // State for showing settings or help
  const [showSettings, setShowSettings] = useState<'sound' | 'help' | null>(null);

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

      // For round 3, only end when complete or time runs out
      if (roundNumber >= 3 && found === total) {
        console.log("Final round completed! Ending game...");
        setTimeout(() => {
          setRoundComplete(true);
          setShowModal(true);
          setModalDismissed(false);
          setTimerPaused(true);
          if (typeof end === "function") {
            end();
          }
        }, 100);
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

      // Force WordSearchGame to re-render with a new key
      setGameKey(Date.now());

      // Important: Unpause timer AFTER the game has fully rendered
      setTimeout(() => {
        // Double check modal is hidden before unpausing
        setShowModal(false);
        setTimerPaused(false);
        console.log("Timer unpaused, round fully initialized");
      }, 500); // Longer delay to ensure game is fully initialized
    }, 100);
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
        
        {/* Game Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(showSettings === 'help' ? null : 'help')}
            className={`px-3 py-1 rounded-lg text-sm ${
              showSettings === 'help' 
                ? "bg-primary text-primary-foreground" 
                : "bg-background/50 backdrop-blur-sm hover:bg-background/80"
            }`}
          >
            How To Play
          </button>
          <button
            onClick={() => setShowSettings(showSettings === 'sound' ? null : 'sound')}
            className={`px-3 py-1 rounded-lg text-sm ${
              showSettings === 'sound' 
                ? "bg-primary text-primary-foreground" 
                : "bg-background/50 backdrop-blur-sm hover:bg-background/80"
            }`}
          >
            Sound Settings
          </button>
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

      {/* Settings Panel */}
      {showSettings && (
        <motion.div 
          className="bg-background/50 backdrop-blur-md p-4 rounded-lg neon-border mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {showSettings === 'help' && (
            <div className="space-y-2 text-white">
              <h3 className="text-lg font-bold">How To Play:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Find crypto words in the grid by clicking and dragging</li>
                <li>Use power-ups to help find difficult words:</li>
                <ul className="list-disc list-inside ml-6">
                  <li><span className="text-yellow-400">Mining Boost</span>: Reveals hints for a random word</li>
                  <li><span className="text-blue-400">Diamond Vision</span>: Temporarily reveals all words</li>
                  <li><span className="text-green-400">FUD Shield</span>: Adds extra time to the clock</li>
                </ul>
                <li>Complete each round by finding all words before time runs out</li>
                <li>The difficulty increases with each round</li>
                <li>Submit your score to the leaderboard after completing all rounds</li>
              </ul>
            </div>
          )}
          
          {showSettings === 'sound' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Sound Settings:</h3>
                <button 
                  className="px-3 py-1 rounded bg-background/70 hover:bg-background"
                  onClick={toggleMute}
                >
                  {isMuted ? "Unmute 🔊" : "Mute 🔇"}
                </button>
              </div>
              
              {/* Volume Controls */}
              <div className="flex flex-col gap-1">
                <div className="text-sm">Volume: {Math.round(audioVolume * 100)}%</div>
                <div className="flex items-center gap-2">
                  <button 
                    className="px-2 py-1 rounded bg-background/70 hover:bg-background disabled:opacity-50"
                    disabled={isMuted || audioVolume <= 0}
                    onClick={() => {
                      const newVolume = Math.max(0, audioVolume - 0.1);
                      setVolume(newVolume);
                    }}
                  >
                    -
                  </button>
                  <div className="h-2 bg-gray-700 rounded-full flex-1 overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${audioVolume * 100}%` }}
                    ></div>
                  </div>
                  <button 
                    className="px-2 py-1 rounded bg-background/70 hover:bg-background disabled:opacity-50"
                    disabled={isMuted || audioVolume >= 1}
                    onClick={() => {
                      const newVolume = Math.min(1, audioVolume + 0.1);
                      setVolume(newVolume);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

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

      {/* Round Complete Modal - For non-final rounds */}
      {showModal && roundComplete && phase === "playing" && roundNumber < 3 && (
        <EndGameModal
          score={score}
          foundWords={foundWordsCount}
          totalWords={totalWords}
          onContinueNextRound={handleContinueNextRound}
          roundComplete={true}
          finalRound={false}
        />
      )}
    </motion.div>
  );
}

export default GamePage;