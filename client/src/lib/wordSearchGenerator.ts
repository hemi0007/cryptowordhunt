// Word search generator

type CellPosition = { row: number; col: number };

// Directions for word placement
enum Direction {
  RIGHT,
  DOWN,
  RIGHT_DOWN,
  RIGHT_UP,
  LEFT,
  UP,
  LEFT_DOWN,
  LEFT_UP
}

// Represents a placed word
interface PlacedWord {
  word: string;
  positions: CellPosition[];
}

// Generate an empty grid of specified size
function createEmptyGrid(size: number): string[][] {
  return Array(size).fill(null).map(() => Array(size).fill(''));
}

// Check if a word fits at the specified position and direction
function doesWordFit(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction
): boolean {
  const size = grid.length;
  
  for (let i = 0; i < word.length; i++) {
    let r = row;
    let c = col;
    
    switch (direction) {
      case Direction.RIGHT:
        c += i;
        break;
      case Direction.DOWN:
        r += i;
        break;
      case Direction.RIGHT_DOWN:
        r += i;
        c += i;
        break;
      case Direction.RIGHT_UP:
        r -= i;
        c += i;
        break;
      case Direction.LEFT:
        c -= i;
        break;
      case Direction.UP:
        r -= i;
        break;
      case Direction.LEFT_DOWN:
        r += i;
        c -= i;
        break;
      case Direction.LEFT_UP:
        r -= i;
        c -= i;
        break;
    }
    
    // Check if out of bounds
    if (r < 0 || r >= size || c < 0 || c >= size) {
      return false;
    }
    
    // Check if the cell is empty or contains the same letter
    if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
      return false;
    }
  }
  
  return true;
}

// Place a word in the grid
function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction
): CellPosition[] {
  const positions: CellPosition[] = [];
  
  for (let i = 0; i < word.length; i++) {
    let r = row;
    let c = col;
    
    switch (direction) {
      case Direction.RIGHT:
        c += i;
        break;
      case Direction.DOWN:
        r += i;
        break;
      case Direction.RIGHT_DOWN:
        r += i;
        c += i;
        break;
      case Direction.RIGHT_UP:
        r -= i;
        c += i;
        break;
      case Direction.LEFT:
        c -= i;
        break;
      case Direction.UP:
        r -= i;
        break;
      case Direction.LEFT_DOWN:
        r += i;
        c -= i;
        break;
      case Direction.LEFT_UP:
        r -= i;
        c -= i;
        break;
    }
    
    grid[r][c] = word[i];
    positions.push({ row: r, col: c });
  }
  
  return positions;
}

// Fill the remaining empty cells with random letters
function fillEmptyCells(grid: string[][]): void {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === '') {
        const randomIndex = Math.floor(Math.random() * letters.length);
        grid[row][col] = letters[randomIndex];
      }
    }
  }
}

// Generate the word search puzzle
export function generateWordSearch(
  size: number,
  wordList: string[]
): {
  grid: string[][];
  placedWords: string[];
  wordPositions: Record<string, CellPosition[]>;
} {
  // Prepare words (uppercase, no spaces)
  const words = wordList.map(word => word.toUpperCase().replace(/\s/g, ''));
  
  // Sort words by length (longest first for better placement)
  const sortedWords = [...words].sort((a, b) => b.length - a.length);
  
  const grid = createEmptyGrid(size);
  const placedWords: string[] = [];
  const wordPositions: Record<string, CellPosition[]> = {};
  
  // Try to place each word
  for (const word of sortedWords) {
    if (word.length > size) {
      console.warn(`Word "${word}" is too long for the grid size (${size})`);
      continue;
    }
    
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      // Random starting position
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      
      // Random direction
      const direction = Math.floor(Math.random() * Object.keys(Direction).length / 2);
      
      if (doesWordFit(grid, word, row, col, direction)) {
        const positions = placeWord(grid, word, row, col, direction);
        placedWords.push(word);
        wordPositions[word] = positions;
        placed = true;
      }
      
      attempts++;
    }
    
    if (!placed) {
      console.warn(`Could not place word "${word}" after ${maxAttempts} attempts`);
    }
  }
  
  // Fill remaining empty cells
  fillEmptyCells(grid);
  
  return {
    grid,
    placedWords,
    wordPositions
  };
}
