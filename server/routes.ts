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

  // Mock AI Chat endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Mock responses based on message content
      let response = "";
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes("capital") || lowerMessage.includes("basel")) {
        response = `Based on Basel III requirements, banks must maintain:\n\n• **Common Equity Tier 1 (CET1) ratio**: Minimum 4.5% of risk-weighted assets\n• **Tier 1 capital ratio**: Minimum 6% of risk-weighted assets\n• **Total capital ratio**: Minimum 8% of risk-weighted assets\n\nAdditionally, systemically important banks may need to maintain higher buffers. The capital conservation buffer adds another 2.5% to these minimums.\n\nWould you like more details about any specific capital requirement?`;
      } else if (lowerMessage.includes("gdpr") || lowerMessage.includes("privacy")) {
        response = `For GDPR compliance in financial services:\n\n• **Data Protection by Design**: Build privacy into systems from the start\n• **Privacy Impact Assessments**: Required for high-risk processing\n• **Consent Management**: Clear, specific, and withdrawable consent\n• **Data Breach Notifications**: Report breaches within 72 hours\n• **Right to be Forgotten**: Process deletion requests promptly\n\nFinancial institutions have specific obligations under Article 9 for processing sensitive financial data. Need help with a specific GDPR requirement?`;
      } else if (lowerMessage.includes("stress") || lowerMessage.includes("testing")) {
        response = `Stress testing requirements include:\n\n• **Annual comprehensive stress tests** for large banks\n• **Climate risk scenarios** as of 2024\n• **Cyber security stress factors** for operational risk\n• **Liquidity stress testing** under various market conditions\n\nThe 2024 guidelines introduce new scenarios including supply chain disruptions and geopolitical risks. Banks must maintain detailed documentation of their stress testing methodology.\n\nWhat specific aspect of stress testing would you like to explore?`;
      } else if (lowerMessage.includes("deadline") || lowerMessage.includes("when")) {
        response = `Upcoming compliance deadlines:\n\n• **Q1 2024**: Basel III implementation updates\n• **March 2024**: Enhanced stress testing guidelines\n• **April 2024**: Climate risk management guidance\n• **June 2024**: Operational resilience principles\n\nRemember to check with your local regulatory authority for jurisdiction-specific timelines. Would you like me to help you prepare for any specific deadline?`;
      } else if (lowerMessage.includes("liquidity") || lowerMessage.includes("lcr")) {
        response = `Liquidity Coverage Ratio (LCR) requirements:\n\n• **Minimum ratio**: 100% (liquid assets ≥ net cash outflows)\n• **Calculation period**: 30-day stress scenario\n• **High-Quality Liquid Assets (HQLA)**: Government bonds, central bank reserves\n• **Reporting frequency**: Daily monitoring required\n\nThe LCR ensures banks can survive short-term liquidity stress. Net Stable Funding Ratio (NSFR) covers longer-term funding stability.\n\nDo you need help calculating LCR or understanding HQLA classifications?`;
      } else {
        response = `I can help you with various compliance topics including:\n\n• **Capital Requirements** (Basel III, CET1, leverage ratios)\n• **Risk Management** (stress testing, operational resilience)\n• **Data Privacy** (GDPR, consumer protection)\n• **Liquidity Requirements** (LCR, NSFR)\n• **AML Compliance** (due diligence, reporting)\n\nPlease ask me about any specific regulation, requirement, or compliance challenge you're facing. I can provide detailed guidance based on current regulatory frameworks.`;
      }

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      res.json({ response });
    } catch (error) {
      console.error('AI Chat error:', error);
      res.status(500).json({ message: "Failed to process AI request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
