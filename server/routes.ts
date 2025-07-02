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

  // AI Chat endpoint with Gemini integration
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history, mcpResults } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Build conversation history for context
      const conversationHistory = (history || []).map((msg: any) => {
        return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
      }).join('\n');

      // Build MCP context if available
      let mcpContext = '';
      if (mcpResults && Object.keys(mcpResults).length > 0) {
        mcpContext = '\n\nMCP Research Results (use this information to enhance your response):\n';
        
        if (mcpResults.queryGen) {
          mcpContext += `Query Generation: Generated optimized queries for compliance research\n`;
        }
        
        if (mcpResults.contentSearch) {
          mcpContext += `Content Search: Found ${mcpResults.contentSearch.result.totalResults} relevant regulatory documents\n`;
          mcpContext += `Top sources: ${mcpResults.contentSearch.result.results.map((r: any) => r.title).join(', ')}\n`;
        }
        
        if (mcpResults.keywordsGen) {
          mcpContext += `Keywords Analysis: Identified key compliance terms and categories\n`;
          mcpContext += `Primary keywords: ${mcpResults.keywordsGen.result.keywords.primary.join(', ')}\n`;
        }
        
        if (mcpResults.summary) {
          mcpContext += `Summary Analysis: Processed regulatory content for executive overview\n`;
        }
      }

      // Call Gemini API using standard 2.5 Pro model
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `You are an expert AI compliance assistant specializing in banking and financial regulations. Provide detailed, accurate guidance on regulatory requirements, compliance frameworks, and best practices. Focus on practical, actionable advice for banking professionals. Use clear formatting with bullet points and bold text for key information.

Previous conversation:
${conversationHistory}${mcpContext}

User question: ${message}

${mcpContext ? 'Note: I have conducted MCP research to provide you with current and comprehensive regulatory information. Please incorporate these findings naturally into your response.' : ''}`,
      });

      const responseText = response.text || "I apologize, but I couldn't generate a response. Please try again.";
      
      res.json({ 
        response: responseText
      });
    } catch (error) {
      console.error('AI Chat error:', error);
      res.status(500).json({ message: "Failed to process AI request. Please check your API key." });
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
