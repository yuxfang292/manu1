import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSummarySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all extracts
  app.get("/api/extracts", async (req, res) => {
    try {
      const extracts = await storage.getAllExtracts();
      res.json(extracts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch extracts" });
    }
  });

  // Search extracts
  app.get("/api/extracts/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const extracts = await storage.searchExtracts(q);
      res.json(extracts);
    } catch (error) {
      res.status(500).json({ message: "Failed to search extracts" });
    }
  });

  // Filter extracts
  app.post("/api/extracts/filter", async (req, res) => {
    try {
      const filters = req.body;
      const extracts = await storage.filterExtracts(filters);
      res.json(extracts);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter extracts" });
    }
  });

  // Get keywords
  app.get("/api/keywords", async (req, res) => {
    try {
      const keywords = await storage.getAllKeywords();
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  // Get keywords by category
  app.get("/api/keywords/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const keywords = await storage.getKeywordsByCategory(category);
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keywords by category" });
    }
  });

  // Create summary
  app.post("/api/summaries", async (req, res) => {
    try {
      const validatedData = insertSummarySchema.parse(req.body);
      const summary = await storage.createSummary(validatedData);
      res.json(summary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid summary data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create summary" });
      }
    }
  });

  // Get summary by ID
  app.get("/api/summaries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid summary ID" });
      }
      
      const summary = await storage.getSummaryById(id);
      if (!summary) {
        return res.status(404).json({ message: "Summary not found" });
      }
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
