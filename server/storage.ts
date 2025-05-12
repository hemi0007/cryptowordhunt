import { 
  highScores,
  type HighScore,
  type InsertHighScore
} from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
import { SupabaseStorageImpl, HighScore as SupabaseHighScore } from "./supabase";
import { log } from "./vite";

// Simple storage interface just for high scores
export interface IStorage {
  // High Scores
  saveHighScore(highScore: InsertHighScore): Promise<HighScore>;
  getTopScores(limit?: number): Promise<HighScore[]>;
}

// Supabase storage implementation
export class SupabaseStorage implements IStorage {
  private supabaseClient: SupabaseStorageImpl;

  constructor() {
    this.supabaseClient = new SupabaseStorageImpl();
  }

  // Save a high score to Supabase
  async saveHighScore(data: InsertHighScore): Promise<HighScore> {
    // Convert from Drizzle schema to Supabase schema
    const supabaseData = {
      player_name: data.playerName,
      score: data.score,
      words_found: data.wordsFound,
      total_words: data.totalWords
    };
    
    const result = await this.supabaseClient.saveHighScore(supabaseData);
    
    // Convert back to Drizzle schema format
    return {
      id: result.id!,
      playerName: result.player_name,
      score: result.score,
      wordsFound: result.words_found,
      totalWords: result.total_words,
      completedAt: new Date(result.created_at!)
    };
  }
  
  // Get top scores from Supabase, ordered by score
  async getTopScores(limit: number = 10): Promise<HighScore[]> {
    const results = await this.supabaseClient.getTopScores(limit);
    
    // Convert from Supabase schema to Drizzle schema
    return results.map(item => ({
      id: item.id!,
      playerName: item.player_name,
      score: item.score,
      wordsFound: item.words_found,
      totalWords: item.total_words,
      completedAt: new Date(item.created_at!)
    }));
  }
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

// Choose storage implementation in order of preference:
// 1. Supabase (if configured)
// 2. PostgreSQL DB (if Supabase not configured)
// 3. Memory Storage (if both fail)
let storageImpl: IStorage;

try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    storageImpl = new SupabaseStorage();
    log("Using Supabase storage for high scores", "database");
  } else {
    storageImpl = new DbStorage();
    log("Using PostgreSQL database storage for high scores", "database");
  }
} catch (error) {
  console.warn("Failed to initialize primary storage, falling back to memory storage:", error);
  storageImpl = new MemStorage();
  log("Using in-memory storage for high scores", "database");
}

export const storage = storageImpl;
