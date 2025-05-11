import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGame } from "../lib/stores/useGame";
import { useWordSearch } from "../lib/stores/useWordSearch";
import { useAudio } from "../lib/stores/useAudio";
import { CRYPTO_WORDS } from "../lib/constants";

interface WordSearchGameProps {
  onStatsUpdate: (score: number, foundWordsCount: number, totalWords: number) => void;
  timeRemaining: number;
  onTimePause?: (isPaused: boolean) => void;
}

const WordSearchGame: React.FC<WordSearchGameProps> = ({ onStatsUpdate, timeRemaining, onTimePause }) => {
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
    initializeGame
  } = useWordSearch();
  
  const [selectedCells, setSelectedCells] = useState<{row: number; col: number}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState<{row: number; col: number} | null>(null);
  const [score, setScore] = useState(0);
  const [boostActive, setBoostActive] = useState(false);
  const [boostCooldown, setBoostCooldown] = useState(false);
  const [visionActive, setVisionActive] = useState(false);
  const [visionCooldown, setVisionCooldown] = useState(false);
  const [miningActive, setMiningActive] = useState(false);
  const [miningCooldown, setMiningCooldown] = useState(false);
  const [fudShieldActive, setFudShieldActive] = useState(false);
  const [fudShieldCooldown, setFudShieldCooldown] = useState(false);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Initialize game on component mount
  useEffect(() => {
    initializeGame(10, CRYPTO_WORDS);
  }, [initializeGame]);
  
  // Update parent about mining boost status for visual feedback
  useEffect(() => {
    if (onTimePause) {
      // This is a bit of a hack to share state with parent - would be better with context
      // @ts-ignore - We're using onTimePause as a generic updater function
      onTimePause(false, { miningActive });
    }
  }, [miningActive, onTimePause]);
  
  // Update parent component with stats
  useEffect(() => {
    onStatsUpdate(score, foundWords.length, placedWords.length);
    
    // Game is complete when all words are found
    if (foundWords.length > 0 && foundWords.length === placedWords.length) {
      const finalScore = score + timeRemaining * 10; // Bonus for remaining time
      setScore(finalScore);
      onStatsUpdate(finalScore, foundWords.length, placedWords.length);
      
      // End the game
      end();
      playSuccess();
    }
  }, [foundWords.length, placedWords.length, score, timeRemaining, onStatsUpdate, end, playSuccess]);
  
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
    if (boostCooldown) return;
    
    // Find a random word that hasn't been found yet
    const unsolvedWords = placedWords.filter(word => !foundWords.includes(word));
    
    if (unsolvedWords.length > 0) {
      const randomWord = unsolvedWords[Math.floor(Math.random() * unsolvedWords.length)];
      const wordPath = wordPositions[randomWord];
      
      if (wordPath) {
        setBoostActive(true);
        
        // Highlight a portion of the word
        const pathLength = wordPath.length;
        const hintCells = wordPath.slice(0, Math.min(3, Math.ceil(pathLength / 3)));
        
        // Flash the hint for a few seconds
        highlightPath(hintCells, '#FFC107');
        
        setTimeout(() => {
          setBoostActive(false);
          resetSelection();
        }, 2000);
        
        // Set cooldown
        setBoostCooldown(true);
        setTimeout(() => setBoostCooldown(false), 10000); // 10 sec cooldown
      }
    }
  };
  
  // Handle Diamond Vision power-up (reveal all words briefly)
  const handleVision = () => {
    if (visionCooldown) return;
    
    setVisionActive(true);
    
    // Temporarily pause the timer (would need to coordinate with parent)
    // Show all words for a brief moment
    const unsolvedWords = placedWords.filter(word => !foundWords.includes(word));
    
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
    }, 3000);
    
    // Set cooldown
    setVisionCooldown(true);
    setTimeout(() => setVisionCooldown(false), 30000); // 30 sec cooldown
  };
  
  // Handle Mining Boost power-up (increases score multiplier)
  const handleMining = () => {
    if (miningCooldown) return;
    
    setMiningActive(true);
    // Set score multiplier to 2x
    setScoreMultiplier(2);
    
    // Create visual feedback (glowing effect on score)
    // This would be handled in the parent component
    
    // Turn off after 30 seconds
    setTimeout(() => {
      setMiningActive(false);
      setScoreMultiplier(1);
    }, 30000);
    
    // Set cooldown
    setMiningCooldown(true);
    setTimeout(() => setMiningCooldown(false), 60000); // 60 sec cooldown
  };
  
  // Handle FUD Shield power-up (pauses timer)
  const handleFudShield = () => {
    if (fudShieldCooldown) return;
    
    setFudShieldActive(true);
    
    // Pause the timer by notifying parent component
    if (onTimePause) {
      onTimePause(true);
    }
    
    // Turn off after 10 seconds
    setTimeout(() => {
      setFudShieldActive(false);
      // Resume the timer
      if (onTimePause) {
        onTimePause(false);
      }
    }, 10000);
    
    // Set cooldown
    setFudShieldCooldown(true);
    setTimeout(() => setFudShieldCooldown(false), 45000); // 45 sec cooldown
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
              
              return (
                <motion.div 
                  key={`${rowIndex}-${colIndex}`}
                  className={`grid-cell ${isSelected ? 'selected' : ''} ${isFound ? 'found' : ''}`}
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
            className={`power-up px-4 py-2 rounded-lg flex items-center gap-2 ${boostActive || boostCooldown ? 'bg-muted' : 'bg-blue-600'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBoost}
            disabled={boostActive || boostCooldown}
          >
            <span role="img" aria-label="Rocket">🚀</span> Boost
            {boostCooldown && <span className="text-xs">(cooldown)</span>}
          </motion.button>
          
          <motion.button
            className={`power-up px-4 py-2 rounded-lg flex items-center gap-2 ${visionActive || visionCooldown ? 'bg-muted' : 'bg-purple-600'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVision}
            disabled={visionActive || visionCooldown}
          >
            <span role="img" aria-label="Diamond">💎</span> Diamond Vision
            {visionCooldown && <span className="text-xs">(cooldown)</span>}
          </motion.button>
          
          <motion.button
            className={`power-up px-4 py-2 rounded-lg flex items-center gap-2 ${miningActive || miningCooldown ? 'bg-muted' : 'bg-amber-600'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMining}
            disabled={miningActive || miningCooldown}
          >
            <span role="img" aria-label="Mining">⛏️</span> Mining Boost
            {miningActive && <span className="text-xs ml-1 text-green-400">(2x)</span>}
            {miningCooldown && !miningActive && <span className="text-xs">(cooldown)</span>}
          </motion.button>
          
          <motion.button
            className={`power-up px-4 py-2 rounded-lg flex items-center gap-2 ${fudShieldActive || fudShieldCooldown ? 'bg-muted' : 'bg-red-600'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFudShield}
            disabled={fudShieldActive || fudShieldCooldown}
          >
            <span role="img" aria-label="Shield">🛡️</span> FUD Shield
            {fudShieldActive && <span className="text-xs ml-1 text-green-400">(active)</span>}
            {fudShieldCooldown && !fudShieldActive && <span className="text-xs">(cooldown)</span>}
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
