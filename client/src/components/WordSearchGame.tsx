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
    
    // Determine word count based on round number (increasing difficulty)
    const baseWordCount = 8;
    const wordCount = Math.min(baseWordCount + Math.floor(roundNumber / 2), 15);
    
    // Get words for this round
    let chosenWords;
    if (getRandomWords) {
      // Use the provided function to get words (avoids repeating words across rounds)
      chosenWords = getRandomWords(wordCount);
    } else {
      // Fallback to random selection from all words
      const shuffledWords = [...CRYPTO_WORDS].sort(() => Math.random() - 0.5);
      chosenWords = shuffledWords.slice(0, wordCount);
    }
    
    // Determine grid size based on round number (increasing difficulty)
    const baseGridSize = 10;
    const gridSize = Math.min(baseGridSize + Math.floor(roundNumber / 3), 15);
    
    console.log(`Initializing Round ${roundNumber} with ${chosenWords.length} words on ${gridSize}x${gridSize} grid`);
    
    // Initialize game with the chosen words and grid size
    initializeGame(gridSize, chosenWords);
    
    // Reset power-up states for new round
    setBoostActive(false);
    setVisionActive(false);
    setMiningActive(false);
    setFudShieldActive(false);
    
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
    if (foundWords.length > 0 && foundWords.length === placedWords.length && !roundScoreCalculated) {
      // Add bonus for remaining time
      const timeBonus = timeRemaining * 10;
      const roundBonus = roundNumber * 50; // Extra bonus for higher rounds
      const finalScore = score + timeBonus + roundBonus;
      
      // Set flag to prevent multiple updates
      setRoundScoreCalculated(true);
      
      // Update score once
      setScore(finalScore);
      
      // Explicitly pause the timer when round completes
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
      // Apply score multiplier if mining boost is active
      const wordScore = result.word.length * 10 * scoreMultiplier;
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
  
  // Handle Boost power-up
  const handleBoost = () => {
    // Check if already used
    if (boostUsed) return;
    
    // Find a random word that hasn't been found yet
    const unsolvedWords = placedWords.filter(word => !foundWords.includes(word));
    
    if (unsolvedWords.length > 0) {
      const randomWord = unsolvedWords[Math.floor(Math.random() * unsolvedWords.length)];
      const wordPath = wordPositions[randomWord];
      
      if (wordPath) {
        setBoostActive(true);
        setBoostUsed(true); // Mark as used (one-time use)
        console.log("Boost activated - showing hint for a word");
        
        // Highlight a portion of the word
        const pathLength = wordPath.length;
        const hintCells = wordPath.slice(0, Math.min(3, Math.ceil(pathLength / 3)));
        
        // Flash the hint for a few seconds
        highlightPath(hintCells, '#FFC107');
        playHit(); // Play sound for feedback
        
        setTimeout(() => {
          setBoostActive(false);
          resetSelection();
          console.log("Boost hint ended");
        }, 2000);
        
        // Set cooldown for UI feedback
        setBoostCooldown(true);
      }
    }
  };
  
  // Handle Diamond Vision power-up (reveal all words briefly)
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
    
    // This is important: The highlightPath function adds to the currentHighlight array
    // which is used in the grid cell rendering to show highlights
    for (const word of unsolvedWords) {
      const wordPath = wordPositions[word];
      if (wordPath) {
        highlightPath(wordPath, '#8A2BE2');
      }
    }
    
    // Turn off after 3 seconds
    setTimeout(() => {
      setVisionActive(false);
      resetSelection();
      console.log("Diamond Vision deactivated");
    }, 3000);
    
    // Set cooldown for UI feedback
    setVisionCooldown(true);
  };
  
  // Handle Mining Boost power-up (increases score multiplier)
  const handleMining = () => {
    // Check if already used
    if (miningUsed) return;
    
    setMiningActive(true);
    setMiningUsed(true); // Mark as used (one-time use)
    // Set score multiplier to 2x
    setScoreMultiplier(2);
    console.log("Mining Boost activated - 2x score multiplier enabled (one-time use)");
    
    // Create visual feedback in the parent component via onTimePause hack
    if (onTimePause) {
      // We're using onTimePause as a generic state updater
      // @ts-ignore - This is intentional to pass along mining state
      onTimePause(false, { miningActive: true });
    }
    
    // Turn off after 30 seconds
    setTimeout(() => {
      setMiningActive(false);
      setScoreMultiplier(1);
      console.log("Mining Boost deactivated - score multiplier reset to 1x");
      
      // Update parent component
      if (onTimePause) {
        // @ts-ignore - This is intentional to pass along mining state
        onTimePause(false, { miningActive: false });
      }
    }, 30000);
    
    // Set cooldown for UI feedback
    setMiningCooldown(true);
  };
  
  // Handle FUD Shield power-up (pauses timer)
  const handleFudShield = () => {
    // Check if already used
    if (fudShieldUsed) return;
    
    setFudShieldActive(true);
    setFudShieldUsed(true); // Mark as used (one-time use)
    console.log("FUD Shield activated - adding 40 seconds");
    playSuccess(); // Play sound effect

    // Add 40 seconds to the timer by momentarily pausing and updating time
    if (onTimePause) {
      onTimePause(true, { addTime: 40 });
    }
    
    // Visual feedback that power-up is active
    setTimeout(() => {
      setFudShieldActive(false);
      console.log("FUD Shield effect applied");
      playHit(); // Play sound effect for deactivation
      // Resume the timer
      if (onTimePause) {
        onTimePause(false);
      }
    }, 1000);
    
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
              
              // Check if cell is part of a found word
              const isFound = foundWords.some(word => {
                const path = wordPositions[word];
                return path && path.some(cell => cell.row === rowIndex && cell.col === colIndex);
              });
              
              // Check if cell is in currently highlighted path (for power-ups)
              const isHighlighted = currentHighlight.some(
                cell => cell.row === rowIndex && cell.col === colIndex
              );
              
              // Set style for highlighted cells
              const highlightStyle = isHighlighted 
                ? { backgroundColor: currentHighlightColor } 
                : {};
              
              return (
                <motion.div 
                  key={`${rowIndex}-${colIndex}`}
                  className={`grid-cell ${isSelected ? 'selected' : ''} ${isFound ? 'found' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                  style={highlightStyle}
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
