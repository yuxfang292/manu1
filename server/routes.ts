import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSummarySchema } from "@shared/schema";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { mcpService, type MCPResponse } from "./mcp-service";

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

  // Enhanced AI Chat endpoint with comprehensive workflow
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Use enhanced AI service for comprehensive workflow
      const { enhancedAIService } = await import("./enhanced-ai-service");
      
      const result = await enhancedAIService.processUserQuestion(message);

      res.json({
        response: result.answer,
        workflow: {
          steps: result.steps,
          visualizations: result.visualizations,
          memory: {
            keywordsCount: result.memory.keywords.size,
            documentsCount: result.memory.documents.size,
            qualityScore: result.memory.qualityChecks[result.memory.qualityChecks.length - 1]?.score || 0,
            attempts: result.memory.currentAttempt
          }
        }
      });
    } catch (error) {
      console.error('Enhanced AI Chat Error:', error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  // Workflow progress endpoint for real-time updates
  app.post("/api/ai/chat-stream", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const { enhancedAIService } = await import("./enhanced-ai-service");
      
      const result = await enhancedAIService.processUserQuestion(
        message,
        (steps) => {
          // Send progress update
          res.write(`data: ${JSON.stringify({ type: 'progress', steps })}\n\n`);
        }
      );

      // Send final result
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        answer: result.answer,
        workflow: {
          steps: result.steps,
          visualizations: result.visualizations,
          memory: {
            keywordsCount: result.memory.keywords.size,
            documentsCount: result.memory.documents.size,
            qualityScore: result.memory.qualityChecks[result.memory.qualityChecks.length - 1]?.score || 0,
            attempts: result.memory.currentAttempt
          }
        }
      })}\n\n`);

      res.end();
    } catch (error) {
      console.error('Enhanced AI Chat Stream Error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to process request' })}\n\n`);
      res.end();
    }
  });

  // MCP Function endpoints
  app.post("/api/mcp/query-gen", async (req, res) => {
    try {
      const { userQuery, context } = req.body;
      if (!userQuery) {
        return res.status(400).json({ message: "userQuery is required" });
      }
      
      const result = await mcpService.queryGen(userQuery, context);
      res.json(result);
    } catch (error) {
      console.error('MCP Query Gen error:', error);
      res.status(500).json({ message: "Failed to generate queries" });
    }
  });

  app.post("/api/mcp/content-search", async (req, res) => {
    try {
      const { query, filters } = req.body;
      if (!query) {
        return res.status(400).json({ message: "query is required" });
      }
      
      const result = await mcpService.contentSearch(query, filters);
      res.json(result);
    } catch (error) {
      console.error('MCP Content Search error:', error);
      res.status(500).json({ message: "Failed to search content" });
    }
  });

  app.post("/api/mcp/keywords-gen", async (req, res) => {
    try {
      const { content, category } = req.body;
      if (!content) {
        return res.status(400).json({ message: "content is required" });
      }
      
      const result = await mcpService.keywordsGen(content, category);
      res.json(result);
    } catch (error) {
      console.error('MCP Keywords Gen error:', error);
      res.status(500).json({ message: "Failed to generate keywords" });
    }
  });

  app.post("/api/mcp/summary", async (req, res) => {
    try {
      const { content, options } = req.body;
      if (!content || !Array.isArray(content)) {
        return res.status(400).json({ message: "content array is required" });
      }
      
      const result = await mcpService.summary(content, options);
      res.json(result);
    } catch (error) {
      console.error('MCP Summary error:', error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  // Get available MCP functions
  app.get("/api/mcp/functions", async (req, res) => {
    try {
      const functions = mcpService.getFunctions();
      res.json(functions);
    } catch (error) {
      console.error('MCP Functions error:', error);
      res.status(500).json({ message: "Failed to get MCP functions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
