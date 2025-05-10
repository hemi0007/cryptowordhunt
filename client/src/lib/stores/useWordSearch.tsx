import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { generateWordSearch } from "../wordSearchGenerator";

type CellPosition = { row: number; col: number };

interface WordSearchState {
  grid: string[][];
  placedWords: string[];
  wordPositions: Record<string, CellPosition[]>;
  foundWords: string[];
  selectedPath: CellPosition[];
  currentHighlight: CellPosition[];
  currentHighlightColor: string;
  
  // Actions
  initializeGame: (size: number, wordList: string[]) => void;
  findWord: (selectedCells: CellPosition[]) => { word: string; path: CellPosition[] } | null;
  resetSelection: () => void;
  highlightPath: (path: CellPosition[], color: string) => void;
}

export const useWordSearch = create<WordSearchState>()(
  subscribeWithSelector((set, get) => ({
    grid: [],
    placedWords: [],
    wordPositions: {},
    foundWords: [],
    selectedPath: [],
    currentHighlight: [],
    currentHighlightColor: "#00ff00",
    
    initializeGame: (size, wordList) => {
      const { grid, placedWords, wordPositions } = generateWordSearch(size, wordList);
      
      set({
        grid,
        placedWords,
        wordPositions,
        foundWords: [],
        selectedPath: [],
        currentHighlight: []
      });
      
      console.log("Game initialized with words:", placedWords);
    },
    
    findWord: (selectedCells) => {
      const { placedWords, wordPositions, foundWords } = get();
      
      // Get the letters from selected cells to form a word
      const { grid } = get();
      const selectedWord = selectedCells
        .map(cell => grid[cell.row][cell.col])
        .join("");
      
      // Check if it's a word in our placed words
      // Also check the reverse since words can be found in any direction
      const wordIndex = placedWords.findIndex(
        word => word === selectedWord || word === selectedWord.split("").reverse().join("")
      );
      
      if (wordIndex !== -1) {
        const foundWord = placedWords[wordIndex];
        
        // Check if the word was already found
        if (foundWords.includes(foundWord)) {
          return null;
        }
        
        // Update state with the found word
        set(state => ({
          foundWords: [...state.foundWords, foundWord],
          selectedPath: selectedCells
        }));
        
        return { word: foundWord, path: selectedCells };
      }
      
      return null;
    },
    
    resetSelection: () => {
      set({
        selectedPath: [],
        currentHighlight: []
      });
    },
    
    highlightPath: (path, color) => {
      set({
        currentHighlight: path,
        currentHighlightColor: color
      });
    }
  }))
);
