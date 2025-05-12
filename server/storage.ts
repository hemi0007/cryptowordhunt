import { 
  highScores,
  type HighScore,
  type InsertHighScore
} from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

// Simple storage interface just for high scores
export interface IStorage {
  // High Scores
  saveHighScore(highScore: InsertHighScore): Promise<HighScore>;
  getTopScores(limit?: number): Promise<HighScore[]>;
}

// Database storage implementation
export class DbStorage implements IStorage {
  // Save a high score to the database
  async saveHighScore(data: InsertHighScore): Promise<HighScore> {
    const result = await db.insert(highScores)
      .values(data)
      .returning();
    
    return result[0];
  }
  
  // Get top scores from the database, ordered by score
  async getTopScores(limit: number = 10): Promise<HighScore[]> {
    return db.select()
      .from(highScores)
      .orderBy(desc(highScores.score))
      .limit(limit);
  }
}

// Memory-based storage implementation (fallback/testing)
export class MemStorage implements IStorage {
  private highScores: Map<number, HighScore>;
  private highScoreIdCounter: number;

  constructor() {
    this.highScores = new Map();
    this.highScoreIdCounter = 1;
    
    // Add some initial sample scores
    this.saveHighScore({
      playerName: "CryptoBro",
      score: 1200,
      wordsFound: 12,
      totalWords: 15
    });
    
    this.saveHighScore({
      playerName: "DiamondHands",
      score: 950,
      wordsFound: 10,
      totalWords: 15
    });
    
    this.saveHighScore({
      playerName: "HODLer",
      score: 820,
      wordsFound: 9,
      totalWords: 15
    });
  }
  
  // High Scores
  async saveHighScore(data: InsertHighScore): Promise<HighScore> {
    const id = this.highScoreIdCounter++;
    const now = new Date();
    const highScore: HighScore = {
      ...data,
      id,
      completedAt: now
    };
    this.highScores.set(id, highScore);
    return highScore;
  }
  
  async getTopScores(limit: number = 10): Promise<HighScore[]> {
    return Array.from(this.highScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
