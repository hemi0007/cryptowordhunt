import { 
  users, 
  highScores, 
  gameConfigs, 
  playerStats, 
  wordCollections,
  type User, 
  type InsertUser,
  type HighScore,
  type GameConfig,
  type PlayerStat,
  type WordCollection
} from "@shared/schema";

// Comprehensive storage interface for all game data
export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // High Scores
  saveHighScore(highScore: Omit<HighScore, 'id' | 'completedAt'>): Promise<HighScore>;
  getTopScores(limit?: number): Promise<HighScore[]>;
  getUserHighScores(userId: number, limit?: number): Promise<HighScore[]>;
  
  // Game Configuration
  getGameConfigs(): Promise<GameConfig[]>;
  getActiveGameConfig(): Promise<GameConfig | undefined>;
  createGameConfig(config: Omit<GameConfig, 'id' | 'createdAt'>): Promise<GameConfig>;
  
  // Player Statistics
  getPlayerStats(userId: number): Promise<PlayerStat | undefined>;
  updatePlayerStats(userId: number, stats: Partial<PlayerStat>): Promise<PlayerStat>;
  
  // Word Collections
  getWordCollections(): Promise<WordCollection[]>;
  getWordCollectionByCategory(category: string): Promise<WordCollection[]>;
  createWordCollection(collection: Omit<WordCollection, 'id' | 'createdAt'>): Promise<WordCollection>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private highScores: Map<number, HighScore>;
  private gameConfigs: Map<number, GameConfig>;
  private playerStats: Map<number, PlayerStat>;
  private wordCollections: Map<number, WordCollection>;
  
  private userIdCounter: number;
  private highScoreIdCounter: number;
  private gameConfigIdCounter: number;
  private playerStatIdCounter: number;
  private wordCollectionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.highScores = new Map();
    this.gameConfigs = new Map();
    this.playerStats = new Map();
    this.wordCollections = new Map();
    
    this.userIdCounter = 1;
    this.highScoreIdCounter = 1;
    this.gameConfigIdCounter = 1;
    this.playerStatIdCounter = 1;
    this.wordCollectionIdCounter = 1;
    
    // Initialize with default game config
    this.createGameConfig({
      name: "Standard",
      gridSize: 10,
      timeLimit: 60,
      maxWords: 15,
      wordCategories: ["crypto"],
      isActive: true
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }
  
  // High Scores
  async saveHighScore(data: Omit<HighScore, 'id' | 'completedAt'>): Promise<HighScore> {
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
  
  async getUserHighScores(userId: number, limit: number = 5): Promise<HighScore[]> {
    return Array.from(this.highScores.values())
      .filter(score => score.userId === userId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  // Game Configuration
  async getGameConfigs(): Promise<GameConfig[]> {
    return Array.from(this.gameConfigs.values());
  }
  
  async getActiveGameConfig(): Promise<GameConfig | undefined> {
    return Array.from(this.gameConfigs.values()).find(config => config.isActive);
  }
  
  async createGameConfig(config: Omit<GameConfig, 'id' | 'createdAt'>): Promise<GameConfig> {
    const id = this.gameConfigIdCounter++;
    const now = new Date();
    const gameConfig: GameConfig = {
      ...config,
      id,
      createdAt: now
    };
    this.gameConfigs.set(id, gameConfig);
    return gameConfig;
  }
  
  // Player Statistics
  async getPlayerStats(userId: number): Promise<PlayerStat | undefined> {
    return Array.from(this.playerStats.values()).find(stat => stat.userId === userId);
  }
  
  async updatePlayerStats(userId: number, stats: Partial<PlayerStat>): Promise<PlayerStat> {
    const existingStats = await this.getPlayerStats(userId);
    
    if (existingStats) {
      // Update existing stats
      const updatedStats: PlayerStat = {
        ...existingStats,
        ...stats,
        updatedAt: new Date()
      };
      this.playerStats.set(existingStats.id, updatedStats);
      return updatedStats;
    } else {
      // Create new stats record
      const id = this.playerStatIdCounter++;
      const now = new Date();
      const defaultStats: PlayerStat = {
        id,
        userId,
        gamesPlayed: 0,
        totalScore: 0,
        totalWordsFound: 0,
        powerUpsUsed: 0,
        bestScore: 0,
        updatedAt: now
      };
      
      const newStats: PlayerStat = {
        ...defaultStats,
        ...stats,
        updatedAt: now
      };
      
      this.playerStats.set(id, newStats);
      return newStats;
    }
  }
  
  // Word Collections
  async getWordCollections(): Promise<WordCollection[]> {
    return Array.from(this.wordCollections.values());
  }
  
  async getWordCollectionByCategory(category: string): Promise<WordCollection[]> {
    return Array.from(this.wordCollections.values())
      .filter(collection => collection.category === category);
  }
  
  async createWordCollection(collection: Omit<WordCollection, 'id' | 'createdAt'>): Promise<WordCollection> {
    const id = this.wordCollectionIdCounter++;
    const now = new Date();
    const wordCollection: WordCollection = {
      ...collection,
      id,
      createdAt: now
    };
    this.wordCollections.set(id, wordCollection);
    return wordCollection;
  }
}

export const storage = new MemStorage();
