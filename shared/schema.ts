import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Simple high scores table with player name
export const highScores = pgTable("high_scores", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  wordsFound: integer("words_found").notNull(),
  totalWords: integer("total_words").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Create insert schema
export const insertHighScoreSchema = createInsertSchema(highScores).pick({
  playerName: true,
  score: true,
  wordsFound: true,
  totalWords: true,
});

// Export types
export type HighScore = typeof highScores.$inferSelect;
export type InsertHighScore = z.infer<typeof insertHighScoreSchema>;
