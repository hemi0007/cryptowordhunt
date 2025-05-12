import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHighScoreSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get top scores
  app.get("/api/scores", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const scores = await storage.getTopScores(limit);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching scores:", error);
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  // Save a high score
  app.post("/api/scores", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const result = insertHighScoreSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid score data", 
          details: result.error.format() 
        });
      }
      
      const newScore = await storage.saveHighScore(result.data);
      res.status(201).json(newScore);
    } catch (error) {
      console.error("Error saving score:", error);
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
