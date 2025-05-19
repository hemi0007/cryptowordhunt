import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGame } from "../lib/stores/useGame";
import { useWordSearch } from "../lib/stores/useWordSearch";
import { useAudio } from "../lib/stores/useAudio";
import { CRYPTO_WORDS } from "../lib/constants";

interface WordSearchGameProps {
  onStatsUpdate: (score: number, foundWordsCount: number, totalWords: number) => void;
  timeRemaining: number;
  onTimePause?: (isPaused: boolean, powerUpStates?: any) => void;
  roundNumber?: number;
  getRandomWords?: (count: number) => string[];
}

const WordSearchGame: React.FC<WordSearchGameProps> = ({ 
  onStatsUpdate, 
  timeRemaining, 
  onTimePause,
  roundNumber = 1,
  getRandomWords 
}) => {
  const { end } = useGame();
  const { playHit, playSuccess } = useAudio();
  const { 
    grid, 
    wordPositions,
    findWord,
    resetSelection,
    highlightPath,
    placedWords,
    foundWords, 
    initializeGame,
    currentHighlight,
    currentHighlightColor
  } = useWordSearch();

  const [selectedCells, setSelectedCells] = useState<{row: number; col: number}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState<{row: number; col: number} | null>(null);
  const [score, setScore] = useState(0);

  // Power-up active states
  const [boostActive, setBoostActive] = useState(false);
  const [visionActive, setVisionActive] = useState(false);
  const [miningActive, setMiningActive] = useState(false);
  const [fudShieldActive, setFudShieldActive] = useState(false);

  // Track if power-ups have been used (one-time use)
  const [boostUsed, setBoostUsed] = useState(false);
  const [visionUsed, setVisionUsed] = useState(false);
  const [miningUsed, setMiningUsed] = useState(false);
  const [fudShieldUsed, setFudShieldUsed] = useState(false);

  // For backward compatibility, keeping these state variables
  const [boostCooldown, setBoostCooldown] = useState(false);
  const [visionCooldown, setVisionCooldown] = useState(false);
  const [miningCooldown, setMiningCooldown] = useState(false);
  const [fudShieldCooldown, setFudShieldCooldown] = useState(false);

  const [scoreMultiplier, setScoreMultiplier] = useState(1);

  const gridRef = useRef<HTMLDivElement>(null);

  // Reference to track if we already initialized this round
  const initializedRoundRef = useRef(0);

  // Initialize game ONLY on component mount or when round number changes
  useEffect(() => {
    // Skip repeated initializations for the same round
    if (initializedRoundRef.current === roundNumber) {
      return;
    }

    // Mark this round as initialized
    initializedRoundRef.current = roundNumber;

    // Only reset the round completion state, not the score
    setRoundScoreCalculated(false);

    // Improved difficulty curve - exponential scaling for more challenging progression
    // Round 1: 8 words, Round 2: 9 words, Round 3: 11 words, Round 4: 13 words, etc.
    const baseWordCount = 8;
    const difficultyFactor = Math.pow(1.15, roundNumber - 1); // Exponential scaling
    const wordCount = Math.min(Math.round(baseWordCount * difficultyFactor), 15);

    // Get words for this round - prioritizing a mix of word lengths for better gameplay
    let chosenWords;
    if (getRandomWords) {
      // Use the provided function to get words (avoids repeating words across rounds)
      chosenWords = getRandomWords(wordCount);
    } else {
      // Improved word selection - ensure a mix of short and long words
      const shuffledWords = [...CRYPTO_WORDS].sort(() => Math.random() - 0.5);
      
      // Split into short, medium, and long words
      const shortWords = shuffledWords.filter(word => word.length <= 4);
      const mediumWords = shuffledWords.filter(word => word.length > 4 && word.length <= 7);
      const longWords = shuffledWords.filter(word => word.length > 7);
      
      // Determine proportions based on round number (later rounds get more long words)
      const longWordPct = Math.min(0.15 + (roundNumber * 0.05), 0.4); // 15-40% long words
      const shortWordPct = Math.max(0.4 - (roundNumber * 0.05), 0.2); // 40-20% short words
      const mediumWordPct = 1 - longWordPct - shortWordPct; // Remaining % medium words
      
      // Calculate counts (ensure at least 1 of each type if possible)
      const longWordCount = Math.max(1, Math.round(wordCount * longWordPct));
      const shortWordCount = Math.max(1, Math.round(wordCount * shortWordPct));
      const mediumWordCount = wordCount - longWordCount - shortWordCount;
      
      // Create balanced word list
      chosenWords = [
        ...longWords.slice(0, longWordCount),
        ...mediumWords.slice(0, mediumWordCount),
        ...shortWords.slice(0, shortWordCount)
      ];
      
      // Ensure we have exactly wordCount items (in case of rounding issues)
      while (chosenWords.length > wordCount) {
        chosenWords.pop();
      }
      
      // Shuffle final selection for variety
      chosenWords.sort(() => Math.random() - 0.5);
    }

    // Balanced grid size calculation - ensures grid is appropriate for word count and round difficulty
    const baseGridSize = 10;
    const gridSize = Math.min(baseGridSize + Math.floor(roundNumber / 2.5), 15);

    console.log(`Initializing Round ${roundNumber} with ${chosenWords.length} words on ${gridSize}x${gridSize} grid`);

    // Initialize game with the chosen words and grid size
    initializeGame(gridSize, chosenWords);

    // Reset power-up states for new round
    setBoostActive(false);
    setVisionActive(false);
    setMiningActive(false);
    setFudShieldActive(false);
    setBoostUsed(false);
    setVisionUsed(false);
    setMiningUsed(false);
    setFudShieldUsed(false);

  }, [initializeGame, roundNumber, getRandomWords]);

  // Update parent about mining boost status for visual feedback
  useEffect(() => {
    if (onTimePause) {
      // This is a bit of a hack to share state with parent - would be better with context
      // @ts-ignore - We're using onTimePause as a generic updater function
      onTimePause(false, { miningActive });
    }
  }, [miningActive, onTimePause]);

  // Track if we've already calculated final score for this round
  const [roundScoreCalculated, setRoundScoreCalculated] = useState(false);

  // Update parent component with stats
  useEffect(() => {
    // Regular stats update during normal gameplay
    if (!roundScoreCalculated) {
      onStatsUpdate(score, foundWords.length, placedWords.length);
    }

    // Game is complete when all words are found
    if (foundWords.length > 0 && placedWords.length > 0 && foundWords.length === placedWords.length && !roundScoreCalculated) {
      // Add bonus for remaining time - ensure values are numbers
      const timeBonus = typeof timeRemaining === 'number' ? timeRemaining * 10 : 0;
      const roundBonus = typeof roundNumber === 'number' ? roundNumber * 50 : 0; // Extra bonus for higher rounds
      const finalScore = score + timeBonus + roundBonus;

      // Set flag to prevent multiple updates
      setRoundScoreCalculated(true);

      // Update score once
      setScore(finalScore);

      // Explicitly pause the timer when round completes - this is critical!
      if (onTimePause) {
        onTimePause(true);
      }

      // Update stats with final score that includes time bonus
      console.log(`Round complete! Final score: ${finalScore} (includes ${timeBonus} time bonus + ${roundBonus} round bonus)`);
      onStatsUpdate(finalScore, foundWords.length, placedWords.length);

      // Play success sound once
      playSuccess();
    }
  }, [foundWords.length, placedWords.length, score, timeRemaining, roundNumber, onStatsUpdate, playSuccess, roundScoreCalculated, onTimePause]);

  // Reset the round score calculation flag when round changes
  useEffect(() => {
    setRoundScoreCalculated(false);
  }, [roundNumber]);

  // Time's up
  useEffect(() => {
    if (timeRemaining === 0) {
      end();
    }
  }, [timeRemaining, end]);

  // Handle mouse/touch down
  const handleCellStart = (row: number, col: number) => {
    setIsDragging(true);
    setStartCell({ row, col });
    setSelectedCells([{ row, col }]);
  };

  // Handle mouse/touch move
  const handleCellMove = (row: number, col: number) => {
    if (!isDragging || !startCell) return;

    // Only handle straight lines (horizontal, vertical, or diagonal)
    const isInLine = (
      row === startCell.row || // horizontal
      col === startCell.col || // vertical
      Math.abs(row - startCell.row) === Math.abs(col - startCell.col) // diagonal
    );

    if (!isInLine) return;

    // Create a path from start to current
    const path: {row: number; col: number}[] = [];

    if (row === startCell.row) { // Horizontal
      const start = Math.min(startCell.col, col);
      const end = Math.max(startCell.col, col);

      for (let c = start; c <= end; c++) {
        path.push({ row, col: c });
      }
    } else if (col === startCell.col) { // Vertical
      const start = Math.min(startCell.row, row);
      const end = Math.max(startCell.row, row);

      for (let r = start; r <= end; r++) {
        path.push({ row: r, col });
      }
    } else { // Diagonal
      const rowStep = startCell.row < row ? 1 : -1;
      const colStep = startCell.col < col ? 1 : -1;
      const steps = Math.abs(row - startCell.row);

      for (let i = 0; i <= steps; i++) {
        path.push({
          row: startCell.row + i * rowStep,
          col: startCell.col + i * colStep
        });
      }
    }

    setSelectedCells(path);
  };

  // Handle mouse/touch up
  const handleCellEnd = () => {
    if (!isDragging) return;

    // Check if selected cells form a word
    const result = findWord(selectedCells);

    if (result) {
      // Word found
      playSuccess();
      // Enhanced scoring system with length and complexity bonuses
      const baseScore = result.word.length * 10;
      // Bonus for words longer than 5 letters
      const lengthBonus = result.word.length > 5 ? (result.word.length - 5) * 5 : 0;
      // Bonus for rare letters (Q, X, Z, J)
      const rareLetterBonus = result.word.split('').reduce((bonus, letter) => {
        return bonus + (['Q', 'X', 'Z', 'J'].includes(letter.toUpperCase()) ? 5 : 0);
      }, 0);
      // Apply multiplier to all score components
      const wordScore = (baseScore + lengthBonus + rareLetterBonus) * scoreMultiplier;
      
      console.log(`Word found: ${result.word} - Score: ${wordScore} (Base: ${baseScore}, Length bonus: ${lengthBonus}, Rare letter bonus: ${rareLetterBonus}, Multiplier: ${scoreMultiplier}x)`);
      
      setScore(prevScore => prevScore + wordScore);
    } else {
      // Word not found
      playHit();
    }

    // Reset selection state
    setIsDragging(false);
    setStartCell(null);
    setSelectedCells([]);
    resetSelection();
  };

  // Enhanced Boost power-up - smarter hint system
  const handleBoost = () => {
    // Check if already used
    if (boostUsed) return;

    // Find unsolved words, prioritizing longer words for better gameplay
    const unsolvedWords = placedWords
      .filter(word => !foundWords.includes(word))
      .sort((a, b) => b.length - a.length); // Prioritize longer words for hints

    if (unsolvedWords.length > 0) {
      // Choose a word - preference given to longer words (80% chance for top half of list)
      const useTopHalf = Math.random() < 0.8;
      const targetPool = useTopHalf 
        ? unsolvedWords.slice(0, Math.ceil(unsolvedWords.length / 2)) 
        : unsolvedWords;
      const randomWord = targetPool[Math.floor(Math.random() * targetPool.length)];
      const wordPath = wordPositions[randomWord];

      if (wordPath) {
        setBoostActive(true);
        setBoostUsed(true); // Mark as used (one-time use)
        console.log(`Boost activated - showing hint for word: ${randomWord}`);

        // Smart hint system - show either the start or middle of the word
        const pathLength = wordPath.length;
        const hintType = Math.random() < 0.5 ? 'start' : 'middle';
        
        let hintCells;
        if (hintType === 'start') {
          // Show the beginning of the word (first ~40%)
          const hintLength = Math.max(2, Math.ceil(pathLength * 0.4));
          hintCells = wordPath.slice(0, hintLength);
          console.log(`Showing ${hintLength} starting letters of "${randomWord}"`);
        } else {
          // Show the middle portion of the word
          const startIndex = Math.floor(pathLength * 0.3);
          const hintLength = Math.max(2, Math.ceil(pathLength * 0.4));
          hintCells = wordPath.slice(startIndex, startIndex + hintLength);
          console.log(`Showing ${hintLength} middle letters of "${randomWord}"`);
        }

        // Animated hint effect - pulsing highlight
        const flashTimes = 3;
        let flashCount = 0;
        
        const flashInterval = setInterval(() => {
          if (flashCount < flashTimes * 2) {
            if (flashCount % 2 === 0) {
              // Flash on with bright color
              highlightPath(hintCells, '#FFC107');
              playHit(); // Play sound for feedback
            } else {
              // Flash off (reset)
              resetSelection();
            }
            flashCount++;
          } else {
            clearInterval(flashInterval);
            setBoostActive(false);
            resetSelection();
            console.log("Boost hint ended");
          }
        }, 300);

        // Safety timeout to ensure everything is reset
        setTimeout(() => {
          clearInterval(flashInterval);
          setBoostActive(false);
          resetSelection();
        }, 3000);

        // Set cooldown for UI feedback
        setBoostCooldown(true);
      }
    }
  };

  // Handle Diamond Vision power-up (reveal all words briefly) - Improved version
  const handleVision = () => {
    // Check if already used
    if (visionUsed) return;

    setVisionActive(true);
    setVisionUsed(true); // Mark as used (one-time use)
    console.log("Diamond Vision activated - revealing all unsolved words (one-time use)");
    playSuccess(); // Play success sound for feedback

    // Show all words for a brief moment
    const unsolvedWords = placedWords.filter(word => !foundWords.includes(word));
    console.log(`Revealing ${unsolvedWords.length} unsolved words`);

    // Enhanced vision effect - progressive reveal of word paths
    let revealIndex = 0;
    const revealInterval = setInterval(() => {
      if (revealIndex < unsolvedWords.length) {
        const word = unsolvedWords[revealIndex];
        const wordPath = wordPositions[word];
        if (wordPath) {
          // Give each word a slightly different highlight color for better visibility
          const colors = ['#8A2BE2', '#9932CC', '#9400D3', '#8B008B', '#800080'];
          const color = colors[revealIndex % colors.length];
          highlightPath(wordPath, color);
          playHit(); // Play a subtle sound for each word reveal
        }
        revealIndex++;
      } else {
        clearInterval(revealInterval);
      }
    }, 300); // Stagger the reveals for a more dynamic effect

    // Turn off after 4 seconds (slightly longer for better gameplay)
    setTimeout(() => {
      setVisionActive(false);
      resetSelection();
      clearInterval(revealInterval); // Ensure interval is cleared
      console.log("Diamond Vision deactivated");
    }, 4000);

    // Set cooldown for UI feedback
    setVisionCooldown(true);
  };

  // Handle Mining Boost power-up (increases score multiplier) - Enhanced version
  const handleMining = () => {
    // Check if already used
    if (miningUsed) return;

    setMiningActive(true);
    setMiningUsed(true); // Mark as used (one-time use)
    
    // Enhanced score multiplier - progressive increase for more excitement
    const multiplierSteps = [1.5, 2, 2.5, 3];
    let currentStep = 0;
    
    // Start with initial multiplier
    setScoreMultiplier(multiplierSteps[0]);
    console.log(`Mining Boost activated - ${multiplierSteps[0]}x score multiplier enabled (one-time use)`);
    playSuccess(); // Play success sound
    
    // Create visual feedback in the parent component
    if (onTimePause) {
      // We're using onTimePause as a generic state updater
      // @ts-ignore - This is intentional to pass along mining state
      onTimePause(false, { miningActive: true });
    }
    
    // Progressive multiplier increase at intervals
    const multiplierInterval = setInterval(() => {
      currentStep++;
      if (currentStep < multiplierSteps.length) {
        setScoreMultiplier(multiplierSteps[currentStep]);
        console.log(`Mining Boost increased - ${multiplierSteps[currentStep]}x score multiplier`);
        playHit(); // Play sound for feedback on multiplier increase
      } else {
        clearInterval(multiplierInterval);
      }
    }, 7500); // Every 7.5 seconds, increase multiplier
    
    // Turn off after 30 seconds
    setTimeout(() => {
      setMiningActive(false);
      setScoreMultiplier(1);
      clearInterval(multiplierInterval); // Ensure interval is cleared
      console.log("Mining Boost deactivated - score multiplier reset to 1x");
      playHit(); // Play sound for feedback

      // Update parent component
      if (onTimePause) {
        // @ts-ignore - This is intentional to pass along mining state
        onTimePause(false, { miningActive: false });
      }
    }, 30000);

    // Set cooldown for UI feedback
    setMiningCooldown(true);
  };

  // Handle FUD Shield power-up (pauses timer) - Enhanced version with gradual time bonus
  const handleFudShield = () => {
    // Check if already used
    if (fudShieldUsed) return;

    setFudShieldActive(true);
    setFudShieldUsed(true); // Mark as used (one-time use)
    
    // Determine time bonus based on round number and how many words are left
    const unsolvedWords = placedWords.length - foundWords.length;
    const baseBonus = 40; // Base time in seconds
    const difficultyMultiplier = typeof roundNumber === 'number' ? Math.min(1.2, 1 + (roundNumber * 0.1)) : 1;
    const extraTime = Math.round(baseBonus * difficultyMultiplier);
    
    console.log(`FUD Shield activated - adding ${extraTime} seconds`);
    playSuccess(); // Play sound effect
    
    // Add time to the timer in increments for dramatic effect
    const timeIncrements = 5; // Add time in 5 chunks
    const timePerIncrement = Math.ceil(extraTime / timeIncrements);
    
    // First pause the timer
    if (onTimePause) {
      onTimePause(true, { fudShieldActive: true });
    }
    
    // Add time in increments
    let currentIncrement = 0;
    const addTimeInterval = setInterval(() => {
      if (currentIncrement < timeIncrements) {
        // Add a chunk of time
        if (onTimePause) {
          onTimePause(true, { 
            addTime: timePerIncrement,
            fudShieldActive: true 
          });
        }
        
        // Play a sound for each increment
        playHit();
        currentIncrement++;
      } else {
        clearInterval(addTimeInterval);
        
        // Resume the timer after all time has been added
        setTimeout(() => {
          setFudShieldActive(false);
          console.log(`FUD Shield effect applied - Added ${extraTime} seconds total`);
          
          // Resume the timer
          if (onTimePause) {
            onTimePause(false);
          }
        }, 500);
      }
    }, 300);
    
    // Safety timeout to ensure timer resumes
    setTimeout(() => {
      clearInterval(addTimeInterval);
      setFudShieldActive(false);
      if (onTimePause) {
        onTimePause(false);
      }
    }, timeIncrements * 300 + 1000);

    // Set cooldown for UI feedback
    setFudShieldCooldown(true);
  };

  // Ensure the grid is always square and responsive
  const gridStyle = {
    gridTemplateColumns: `repeat(${grid.length}, 1fr)`,
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Word search grid */}
      <div className="w-full md:w-2/3">
        <div 
          ref={gridRef}
          className="grid-container p-4 bg-secondary rounded-xl neon-border"
          style={gridStyle}
          onMouseLeave={handleCellEnd}
          onTouchEnd={handleCellEnd}
        >
          {grid.map((row, rowIndex) => (
            row.map((letter, colIndex) => {
              // Check if cell is in selected cells
              const isSelected = selectedCells.some(
                cell => cell.row === rowIndex && cell.col === colIndex
              );

              // Enhanced check for found words - return the word info for color coding
              let foundWordInfo = null;
              for (const word of foundWords) {
                const path = wordPositions[word];
                if (path && path.some(cell => cell.row === rowIndex && cell.col === colIndex)) {
                  foundWordInfo = { word, path };
                  break;
                }
              }
              
              // Check if cell is in currently highlighted path (for power-ups)
              const isHighlighted = currentHighlight.some(
                cell => cell.row === rowIndex && cell.col === colIndex
              );

              // Dynamic styling for visual feedback
              let cellStyle = {};
              let cellClass = "grid-cell";
              
              // Apply styling based on state priority: highlight > found > selected
              if (isHighlighted) {
                // Power-up highlight effect
                cellStyle = { 
                  backgroundColor: currentHighlightColor,
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.7)'
                };
                cellClass += " highlighted";
              } else if (foundWordInfo) {
                // Found word with color based on word length (longer = warmer)
                const wordLength = foundWordInfo.word.length;
                const hue = Math.min(120 + wordLength * 15, 300); // range from green to purple
                cellStyle = { 
                  backgroundColor: `hsl(${hue}, 70%, 40%)`,
                  color: 'white',
                  fontWeight: 'bold',
                  textShadow: '0 0 2px rgba(0, 0, 0, 0.5)'
                };
                cellClass += " found";
              } else if (isSelected) {
                // Currently selected cell
                cellStyle = {
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  transform: 'scale(1.05)'
                };
                cellClass += " selected";
              }

              return (
                <motion.div 
                  key={`${rowIndex}-${colIndex}`}
                  className={cellClass}
                  style={cellStyle}
                  onMouseDown={() => handleCellStart(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellMove(rowIndex, colIndex)}
                  onMouseUp={handleCellEnd}
                  onTouchStart={() => handleCellStart(rowIndex, colIndex)}
                  onTouchMove={(e) => {
                    // Get touch position relative to grid
                    if (!gridRef.current) return;

                    const touch = e.touches[0];
                    const rect = gridRef.current.getBoundingClientRect();
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;

                    // Calculate cell from position
                    const cellWidth = rect.width / grid.length;
                    const cellHeight = rect.height / grid.length;

                    const col = Math.floor(x / cellWidth);
                    const row = Math.floor(y / cellHeight);

                    // Only process if within grid bounds
                    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
                      handleCellMove(row, col);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {letter}
                </motion.div>
              );
            })
          ))}
        </div>

        {/* Power-ups */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <motion.button
            className={`power-up px-4 py-2 rounded-lg flex items-center gap-2 ${boostActive || boostUsed ? 'bg-muted' : 'bg-blue-600'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBoost}
            disabled={boostActive || boostUsed}
          >
            <span role="img" aria-label="Rocket">🚀</span> Boost
            {boostUsed && !boostActive && <span className="text-xs">(used)</span>}
          </motion.button>

          <motion.button
            className={`power-up px-4 py-2 rounded-lg flex items-center gap-2 ${visionActive || visionUsed ? 'bg-muted' : 'bg-purple-600'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVision}
            disabled={visionActive || visionUsed}
          >
            <span role="img" aria-label="Diamond">💎</span> Diamond Vision
            {visionUsed && !visionActive && <span className="text-xs">(used)</span>}
          </motion.button>

          <motion.button
            className={`power-up px-4 py-2 rounded-lg flex items-center gap-2 ${miningActive || miningUsed ? 'bg-muted' : 'bg-amber-600'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMining}
            disabled={miningActive || miningUsed}
          >
            <span role="img" aria-label="Mining">⛏️</span> Mining Boost
            {miningActive && <span className="text-xs ml-1 text-green-400">(2x)</span>}
            {miningUsed && !miningActive && <span className="text-xs">(used)</span>}
          </motion.button>

          <motion.button
            className={`power-up px-4 py-2 rounded-lg flex items-center gap-2 ${fudShieldActive || fudShieldUsed ? 'bg-muted' : 'bg-red-600'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFudShield}
            disabled={fudShieldActive || fudShieldUsed}
          >
            <span role="img" aria-label="Shield">🛡️</span> FUD Shield
            {fudShieldActive && <span className="text-xs ml-1 text-green-400">(active)</span>}
            {fudShieldUsed && !fudShieldActive && <span className="text-xs">(used)</span>}
          </motion.button>
        </div>
      </div>

      {/* Word list */}
      <div className="w-full md:w-1/3 p-4 bg-secondary rounded-xl neon-border">
        <h3 className="text-xl font-bold mb-4 text-center neon-text">
          Crypto Words
        </h3>

        <div className="space-y-2">
          {placedWords.map((word, index) => (
            <div 
              key={index}
              className={`word-item ${foundWords.includes(word) ? 'found' : ''}`}
            >
              <span 
                className={foundWords.includes(word) ? 'neon-green' : ''}
              >
                {foundWords.includes(word) ? '✓ ' : '○ '}
                {word}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-muted">
          <div className="text-sm text-center text-muted-foreground">
            <p>Drag to select words in the grid.</p>
            <p className="mt-2">Words can be horizontal, vertical, or diagonal.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordSearchGame;