import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Basic user accounts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// High scores leaderboard
export const highScores = pgTable("high_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  score: integer("score").notNull(),
  wordsFound: integer("words_found").notNull(),
  totalWords: integer("total_words").notNull(),
  difficulty: text("difficulty").notNull(), // easy, normal, hard
  timeSpent: integer("time_spent").notNull(), // in seconds
  completedAt: timestamp("completed_at").defaultNow(),
});

// Game configurations
export const gameConfigs = pgTable("game_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gridSize: integer("grid_size").notNull(),
  timeLimit: integer("time_limit").notNull(),
  maxWords: integer("max_words").notNull(),
  wordCategories: json("word_categories").notNull(), // ['crypto', 'defi', etc.]
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player statistics
export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  gamesPlayed: integer("games_played").default(0),
  totalScore: integer("total_score").default(0),
  totalWordsFound: integer("total_words_found").default(0),
  powerUpsUsed: integer("power_ups_used").default(0),
  bestScore: integer("best_score").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Word collections for the game
export const wordCollections = pgTable("word_collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  words: json("words").notNull(), // array of words in this collection
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
});

export const insertHighScoreSchema = createInsertSchema(highScores).pick({
  userId: true,
  score: true,
  wordsFound: true,
  totalWords: true,
  difficulty: true,
  timeSpent: true,
});

export const insertGameConfigSchema = createInsertSchema(gameConfigs).pick({
  name: true,
  gridSize: true,
  timeLimit: true,
  maxWords: true,
  wordCategories: true,
  isActive: true,
});

export const insertWordCollectionSchema = createInsertSchema(wordCollections).pick({
  name: true,
  category: true,
  words: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type HighScore = typeof highScores.$inferSelect;
export type GameConfig = typeof gameConfigs.$inferSelect;
export type PlayerStat = typeof playerStats.$inferSelect;
export type WordCollection = typeof wordCollections.$inferSelect;
