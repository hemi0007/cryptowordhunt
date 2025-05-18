import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGame } from "../lib/stores/useGame";
import { CRYPTO_WORDS, DIFFICULTY_LEVELS } from "../lib/constants";
import WordSearchGame from "./WordSearchGame";
import EndGameModal from "./EndGameModal";

const GamePage = () => {
  // Get phase and methods from useGame hook
  const { phase, start, end, restart } = useGame();
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
  const intervalRef = useRef(null);

  const lastScoreUpdateRef = useRef({ round: 1, found: 0, score: 0 });
  const usedWordsRef = useRef(new Set());

  /** Timer Management Effect */
  useEffect(() => {
    if (phase !== "playing" || timerPaused) {
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set new interval to decrement timer
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          // Only set phase to ended if the round isn't complete
          if (!roundComplete) {
            setPhase("ended");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup interval on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, timerPaused, roundNumber, roundComplete, setPhase]);

  /** Format time in MM:SS */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  /** Get random words for the round */
  const getRandomWordsForRound = (count) => {
    const availableWords = CRYPTO_WORDS.filter(
      (word) => !usedWordsRef.current.has(word),
    );

    if (availableWords.length < count) {
      usedWordsRef.current.clear();
      return CRYPTO_WORDS.sort(() => Math.random() - 0.5).slice(0, count);
    }

    const selectedWords = availableWords
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    selectedWords.forEach((word) => usedWordsRef.current.add(word));

    return selectedWords;
  };

  /** Handle stats updates from WordSearchGame */
  const handleStatsUpdate = (roundScore, found, total) => {
    const lastUpdate = lastScoreUpdateRef.current;

    const isNewRound = lastUpdate.round !== roundNumber;
    const isNewWordFound = found > lastUpdate.found;

    if ((isNewRound || isNewWordFound) && !roundComplete) {
      const scoreToAdd = roundScore;

      if (isNewRound) {
        console.log(
          `New round ${roundNumber}: Setting base score to ${scoreToAdd}`,
        );
      } else if (isNewWordFound) {
        console.log(
          `Round ${roundNumber}: Found new word(s): ${found - lastUpdate.found}, adding score: ${scoreToAdd}`,
        );
        setScore((prevScore) => prevScore + scoreToAdd);
      }

      lastScoreUpdateRef.current = {
        round: roundNumber,
        found: found,
        score: isNewRound ? lastUpdate.score : lastUpdate.score + scoreToAdd,
      };
    }

    setFoundWordsCount(found);
    setTotalWords(total);

    // Check if round is complete
    if (found === total && total > 0 && found > 0) {
      if (!roundComplete) {
        console.log(
          `Round ${roundNumber} completed! Found: ${found}/${total}, Current Score: ${score}`,
        );
        setRoundComplete(true);
        setShowModal(true);
        setTimerPaused(true);

        // Make sure we pause the timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  };

  /** Handle transition to next round */
  const handleContinueNextRound = () => {
    const currentRound = roundNumber;
    const currentScore = score;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset round state
    setShowModal(false);
    setRoundComplete(false);
    setTimerPaused(false);
    setFoundWordsCount(0);
    setTotalWords(0);

    // Calculate new timer value
    const baseTime = 60;
    const roundBonus = Math.min(10 + currentRound * 5, 30);
    const newTime = baseTime + roundBonus;

    // Reset the game phase to "playing" to prevent the "time's up" modal from persisting
    start();

    // Update state in the correct order
    setTimer(newTime);
    setRoundNumber((prevRound) => prevRound + 1);

    // Update last score reference
    const nextRound = currentRound + 1;
    lastScoreUpdateRef.current = {
      round: nextRound,
      found: 0,
      score: currentScore,
    };

    // Force WordSearchGame to re-render with a new key
    setGameKey(Date.now());

    // Debug log to confirm new round setup
    console.log(
      `Starting round ${nextRound} with ${newTime} seconds, current score: ${currentScore}, phase: "playing"`,
    );
  };

  /** Handle timer pause and power-up effects */
  const handleTimerPause = (isPaused, powerUpStates) => {
    console.log(
      `Timer pause state changed to: ${isPaused ? "PAUSED" : "RUNNING"}`,
    );

    setTimerPaused(isPaused);

    if (powerUpStates?.addTime) {
      setTimer((prevTime) => prevTime + powerUpStates.addTime);
    }

    if (powerUpStates && typeof powerUpStates.miningActive !== "undefined") {
      setMiningActive(powerUpStates.miningActive);
    }
  };

  // Additional effect to properly handle game phase transitions
  useEffect(() => {
    if (timer === 0 && !roundComplete && phase !== "ended") {
      end();
    }
  }, [timer, roundComplete, phase, setPhase]);

  return (
    <motion.div
      className="container mx-auto px-4 py-6 max-w-5xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
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
          currentTotalScore={score}
        />
      </motion.div>

      {/* End of game modal */}
      {phase === "ended" && !roundComplete && (
        <EndGameModal
          score={score}
          foundWords={foundWordsCount}
          totalWords={totalWords}
        />
      )}

      {/* Round completion modal */}
      {showModal && roundComplete && (
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

export default GamePage;
