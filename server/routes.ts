import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSummarySchema } from "@shared/schema";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

  // AI Chat endpoint with Gemini integration
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Call Gemini API with thinking mode using direct REST API
      const requestBody = {
        contents: [{
          parts: [{
            text: `You are an expert AI compliance assistant specializing in banking and financial regulations. Provide detailed, accurate guidance on regulatory requirements, compliance frameworks, and best practices. Focus on practical, actionable advice for banking professionals. Use clear formatting with bullet points and bold text for key information.

User question: ${message}`
          }]
        }],
        generationConfig: {
          thinkingConfig: {
            includeThoughts: true,
            thinkingBudget: 2048
          }
        }
      };

      const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.statusText}`);
      }

      const apiData = await apiResponse.json();
      
      // Extract thinking and response from Gemini
      let responseText = "I apologize, but I couldn't generate a response. Please try again.";
      let thinkingText = null;

      if (apiData.candidates?.[0]?.content?.parts) {
        for (const part of apiData.candidates[0].content.parts) {
          if (part.thought && part.text) {
            thinkingText = part.text;
          } else if (!part.thought && part.text) {
            responseText = part.text;
          }
        }
      }
      
      res.json({ 
        response: responseText,
        thinking: thinkingText
      });
    } catch (error) {
      console.error('AI Chat error:', error);
      res.status(500).json({ message: "Failed to process AI request. Please check your API key." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
