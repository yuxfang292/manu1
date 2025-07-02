import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSummarySchema } from "@shared/schema";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { mcpService, type MCPResponse } from "./mcp-service";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Research workflow function
async function executeResearchWorkflow(userQuery: string): Promise<string> {
  let retryAttempt = 0;
  const maxRetries = 1;
  let qualityGood = false;
  let foundDocuments: any[] = [];
  let allKeywords: string[] = [];

  try {
    while (!qualityGood && retryAttempt <= maxRetries) {
      // Step 1: Generate keywords using MCP
      const keywordsResult = await mcpService.keywordsGen(userQuery, 'banking_regulation');
      let generatedKeywords = [];
      
      // Handle the keywords result structure from MCP
      if (keywordsResult.result?.keywords) {
        if (Array.isArray(keywordsResult.result.keywords)) {
          generatedKeywords = keywordsResult.result.keywords;
        } else if (typeof keywordsResult.result.keywords === 'object') {
          // Extract all keywords from primary, secondary, emerging arrays
          const keywordObj = keywordsResult.result.keywords;
          generatedKeywords = [
            ...(keywordObj.primary || []),
            ...(keywordObj.secondary || []),
            ...(keywordObj.emerging || [])
          ].filter(k => typeof k === 'string');
        }
      }
      
      // Add additional keywords based on the topic
      const additionalKeywords = extractAdditionalKeywords(userQuery);
      allKeywords = [...generatedKeywords, ...additionalKeywords];

      // Step 2: Document retrieval using keywords
      const searchResults = await mcpService.contentSearch(allKeywords.join(' '), { keywords: allKeywords });
      foundDocuments = searchResults.result?.documents || [];

      // Step 3: Quality check
      qualityGood = assessDocumentQuality(foundDocuments, userQuery);
      
      if (!qualityGood && retryAttempt < maxRetries) {
        // Generate different keywords for retry
        allKeywords = generateAlternativeKeywords(userQuery, allKeywords);
        retryAttempt++;
      } else {
        break;
      }
    }

    // Step 4: Generate comprehensive answer using all collected data
    const summaryResult = await mcpService.summary(
      foundDocuments.map(doc => doc.content || doc.excerpt || ''), 
      { style: 'comprehensive', length: 'detailed' }
    );

    // Build comprehensive research display for user
    const keywordsDisplay = allKeywords.slice(0, 12).map(k => `\`${k}\``).join(', ');
    const documentsDisplay = foundDocuments.slice(0, 8).map((doc, idx) => 
      `${idx + 1}. **${doc.title || 'Regulatory Document'}** - ${doc.excerpt || doc.summary || 'Compliance analysis'}`
    ).join('\n');

    const researchDisplay = `
## 🔍 Research Process Complete

### **Step 1: Keywords Generated**
${keywordsDisplay}

### **Step 2: Documents Found (${foundDocuments.length} total)**
${documentsDisplay}

### **Step 3: Quality Assessment**
${qualityGood ? '✅ High relevance achieved' : '⚠️ Maximum search attempts completed'}

### **Step 4: Comprehensive Analysis**
`;

    // Generate final comprehensive response
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `You are CUBOT, an expert AI compliance assistant. I have conducted comprehensive research using MCP functions. Present the research findings and provide a detailed answer.

Research Data:
- Keywords: ${allKeywords.join(', ')}
- Documents: ${foundDocuments.length} regulatory documents found
- Quality: ${qualityGood ? 'High relevance' : 'Standard coverage'}

User Question: ${userQuery}

Instructions:
- Start your response with a brief summary of what research was conducted
- Provide a comprehensive answer based on the research findings
- Include specific regulatory references when available
- Structure your response with clear sections and bullet points
- Make the response practical and actionable for banking professionals
- Be authoritative but acknowledge any limitations`,
    });

    const finalResponse = researchDisplay + (response.text || "I apologize, but I couldn't generate a comprehensive response based on the research. Please try again.");
    
    return finalResponse;

  } catch (error) {
    console.error('Research workflow error:', error);
    return `I encountered an error during the research process: ${error}. Please try your question again.`;
  }
}

function extractAdditionalKeywords(query: string): string[] {
  const queryLower = query.toLowerCase();
  const additionalKeywords: string[] = [];

  if (queryLower.includes('basel')) additionalKeywords.push('Basel III', 'capital requirements', 'regulatory framework');
  if (queryLower.includes('capital')) additionalKeywords.push('tier 1', 'common equity', 'capital adequacy');
  if (queryLower.includes('liquidity')) additionalKeywords.push('LCR', 'liquidity coverage ratio', 'NSFR');
  if (queryLower.includes('stress')) additionalKeywords.push('stress testing', 'CCAR', 'scenario analysis');
  if (queryLower.includes('risk')) additionalKeywords.push('risk management', 'credit risk', 'operational risk');

  return additionalKeywords;
}

function generateAlternativeKeywords(query: string, previousKeywords: string[]): string[] {
  const alternatives = extractAdditionalKeywords(query);
  const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 3);
  
  return [...alternatives, ...queryWords, 'compliance', 'regulatory', 'banking'].filter(
    keyword => !previousKeywords.includes(keyword)
  );
}

function assessDocumentQuality(documents: any[], query: string): boolean {
  if (documents.length === 0) return false;
  
  const queryWords = query.toLowerCase().split(' ');
  let relevanceScore = 0;
  
  documents.forEach(doc => {
    const docText = (doc.content + ' ' + doc.title + ' ' + doc.excerpt).toLowerCase();
    const matchingWords = queryWords.filter(word => docText.includes(word));
    relevanceScore += matchingWords.length / queryWords.length;
  });
  
  const avgRelevance = relevanceScore / documents.length;
  return avgRelevance > 0.3; // Threshold for good quality
}

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
      const { message, history, mode = 'chat' } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Build conversation history for context
      const conversationHistory = (history || []).map((msg: any) => {
        return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
      }).join('\n');

      let responseContent = '';
      
      if (mode === 'research') {
        // Execute research workflow
        const researchResult = await executeResearchWorkflow(message);
        responseContent = researchResult;
      } else {
        // Simple chat mode
        const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: `You are CUBOT, a helpful AI compliance assistant specializing in banking and financial regulations. Provide clear, concise answers about regulatory requirements, compliance frameworks, and best practices.

Previous conversation:
${conversationHistory}

User question: ${message}`,
        });

        const responseText = response.text || "I apologize, but I couldn't generate a response. Please try again.";
        responseContent = responseText;
      }
      
      res.json({ 
        response: responseContent
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
