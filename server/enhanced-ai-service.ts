import { GoogleGenAI } from "@google/genai";
import { mcpService, type MCPResponse } from "./mcp-service";
import { storage } from "./storage";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface WorkflowStep {
  step: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  message: string;
}

export interface DocumentResult {
  title: string;
  source: string;
  excerpt: string;
  relevanceScore: number;
  category: string;
  keywords: string[];
}

export interface KeywordResult {
  primary: string[];
  secondary: string[];
  generated: string[];
  category: string;
}

export interface QualityCheck {
  score: number;
  coverage: number;
  relevance: number;
  completeness: number;
  recommendation: 'proceed' | 'retry' | 'insufficient';
  issues: string[];
}

export interface WorkflowMemory {
  keywords: Map<string, KeywordResult>;
  documents: Map<string, DocumentResult>;
  qualityChecks: QualityCheck[];
  currentAttempt: number;
  maxAttempts: number;
}

export class EnhancedAIService {
  private memory: WorkflowMemory;

  constructor() {
    this.memory = {
      keywords: new Map(),
      documents: new Map(),
      qualityChecks: [],
      currentAttempt: 0,
      maxAttempts: 2
    };
  }

  async processUserQuestion(
    userQuestion: string, 
    onProgress?: (steps: WorkflowStep[]) => void
  ): Promise<{
    answer: string;
    steps: WorkflowStep[];
    memory: WorkflowMemory;
    visualizations: any[];
  }> {
    
    const steps: WorkflowStep[] = [
      { step: 1, name: "Keyword Generation", status: 'pending', message: "Preparing to analyze question and generate keywords..." },
      { step: 2, name: "Document Retrieval", status: 'pending', message: "Ready to search for relevant documents..." },
      { step: 3, name: "Quality Assessment", status: 'pending', message: "Waiting to evaluate document quality..." },
      { step: 4, name: "Answer Generation", status: 'pending', message: "Ready to compile comprehensive answer..." }
    ];

    const visualizations: any[] = [];

    try {
      // Step 1: Generate keywords using MCP
      steps[0].status = 'processing';
      steps[0].message = "Analyzing question and generating targeted keywords...";
      onProgress?.(steps);

      const keywordResponse = await this.generateKeywords(userQuestion);
      steps[0].status = 'completed';
      steps[0].result = keywordResponse;
      steps[0].message = `Generated ${keywordResponse.primary.length} primary keywords and ${keywordResponse.secondary.length} secondary keywords`;
      
      // Store in memory
      this.memory.keywords.set(userQuestion, keywordResponse);
      
      // Create keyword visualization
      visualizations.push({
        type: 'keywords',
        title: 'Generated Keywords',
        data: {
          primary: keywordResponse.primary,
          secondary: keywordResponse.secondary,
          generated: keywordResponse.generated,
          category: keywordResponse.category
        }
      });

      onProgress?.(steps);

      // Step 2: Document retrieval
      steps[1].status = 'processing';
      steps[1].message = "Searching for relevant regulatory documents...";
      onProgress?.(steps);

      const documentsResponse = await this.retrieveDocuments(keywordResponse);
      steps[1].status = 'completed';
      steps[1].result = documentsResponse;
      steps[1].message = `Found ${documentsResponse.length} relevant documents`;

      // Store documents in memory
      documentsResponse.forEach(doc => {
        this.memory.documents.set(doc.title, doc);
      });

      // Create document visualization
      visualizations.push({
        type: 'documents',
        title: 'Retrieved Documents',
        data: {
          totalFound: documentsResponse.length,
          documents: documentsResponse.map(doc => ({
            title: doc.title,
            source: doc.source,
            category: doc.category,
            relevanceScore: doc.relevanceScore,
            excerpt: doc.excerpt.substring(0, 150) + '...'
          }))
        }
      });

      onProgress?.(steps);

      // Step 3: Quality assessment
      steps[2].status = 'processing';
      steps[2].message = "Evaluating document quality and relevance...";
      onProgress?.(steps);

      const qualityCheck = await this.assessQuality(userQuestion, keywordResponse, documentsResponse);
      this.memory.qualityChecks.push(qualityCheck);
      this.memory.currentAttempt++;

      // If quality is insufficient and we haven't reached max attempts, retry
      if (qualityCheck.recommendation === 'retry' && this.memory.currentAttempt < this.memory.maxAttempts) {
        steps[2].message = "Quality insufficient, generating alternative keywords and retrying...";
        onProgress?.(steps);

        // Generate alternative keywords
        const alternativeKeywords = await this.generateAlternativeKeywords(userQuestion, keywordResponse);
        this.memory.keywords.set(`${userQuestion}_retry`, alternativeKeywords);

        // Retry document retrieval
        const retryDocuments = await this.retrieveDocuments(alternativeKeywords);
        retryDocuments.forEach(doc => {
          this.memory.documents.set(doc.title, doc);
        });

        // Re-assess quality
        const retryQuality = await this.assessQuality(userQuestion, alternativeKeywords, retryDocuments);
        this.memory.qualityChecks.push(retryQuality);
        this.memory.currentAttempt++;

        steps[2].result = retryQuality;
        steps[2].message = `Quality assessment complete (attempt ${this.memory.currentAttempt}). Score: ${retryQuality.score}/100`;
      } else {
        steps[2].result = qualityCheck;
        steps[2].message = `Quality assessment complete. Score: ${qualityCheck.score}/100`;
      }

      steps[2].status = 'completed';

      // Create quality visualization
      visualizations.push({
        type: 'quality',
        title: 'Quality Assessment',
        data: {
          score: this.memory.qualityChecks[this.memory.qualityChecks.length - 1].score,
          coverage: this.memory.qualityChecks[this.memory.qualityChecks.length - 1].coverage,
          relevance: this.memory.qualityChecks[this.memory.qualityChecks.length - 1].relevance,
          completeness: this.memory.qualityChecks[this.memory.qualityChecks.length - 1].completeness,
          attempts: this.memory.currentAttempt,
          recommendation: this.memory.qualityChecks[this.memory.qualityChecks.length - 1].recommendation
        }
      });

      onProgress?.(steps);

      // Step 4: Generate comprehensive answer
      steps[3].status = 'processing';
      steps[3].message = "Compiling comprehensive answer using all collected information...";
      onProgress?.(steps);

      const answer = await this.generateAnswer(userQuestion, this.memory);
      steps[3].status = 'completed';
      steps[3].result = { answer };
      steps[3].message = "Comprehensive answer generated successfully";

      onProgress?.(steps);

      return {
        answer,
        steps,
        memory: this.memory,
        visualizations
      };

    } catch (error) {
      // Mark current step as failed
      const currentStep = steps.find(s => s.status === 'processing');
      if (currentStep) {
        currentStep.status = 'failed';
        currentStep.message = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      throw error;
    }
  }

  private async generateKeywords(userQuestion: string): Promise<KeywordResult> {
    // First get existing keywords from MCP
    const mcpKeywordsResponse = await mcpService.keywordsGen(userQuestion);
    
    // Then generate additional keywords using AI
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Analyze this banking/financial regulation question and generate comprehensive keywords:

Question: "${userQuestion}"

Existing relevant keywords from database: ${JSON.stringify(mcpKeywordsResponse.result.keywords)}

Generate additional keywords in this JSON format:
{
  "primary": ["keyword1", "keyword2", ...],
  "secondary": ["related1", "related2", ...],
  "generated": ["new1", "new2", ...],
  "category": "category_name"
}

Focus on:
- Banking regulatory terms
- Compliance frameworks  
- Legal terminology
- Industry-specific jargon
- Synonyms and variations

Generate 5-8 primary keywords, 8-12 secondary keywords, and 3-5 new generated keywords.`
    });

    const generatedKeywords = JSON.parse(response.text || '{}');
    
    return {
      primary: [...(mcpKeywordsResponse.result.keywords.primary || []), ...(generatedKeywords.primary || [])],
      secondary: [...(mcpKeywordsResponse.result.keywords.secondary || []), ...(generatedKeywords.secondary || [])],
      generated: generatedKeywords.generated || [],
      category: generatedKeywords.category || 'General Compliance'
    };
  }

  private async retrieveDocuments(keywords: KeywordResult): Promise<DocumentResult[]> {
    const allKeywords = [...keywords.primary, ...keywords.secondary, ...keywords.generated];
    const searchQuery = allKeywords.slice(0, 8).join(' '); // Use top 8 keywords
    
    // Use MCP content search
    const mcpSearchResponse = await mcpService.contentSearch(searchQuery);
    
    // Also search local storage
    const localExtracts = await storage.searchExtracts(searchQuery);
    
    // Combine and format results
    const documents: DocumentResult[] = [];
    
    // Add MCP results
    if (mcpSearchResponse.result.results) {
      mcpSearchResponse.result.results.forEach((result: any) => {
        documents.push({
          title: result.title,
          source: result.source || 'Regulatory Database',
          excerpt: result.excerpt || result.summary || '',
          relevanceScore: result.relevanceScore || 85,
          category: result.category || keywords.category,
          keywords: result.keywords || keywords.primary.slice(0, 3)
        });
      });
    }
    
    // Add local extracts
    localExtracts.forEach(extract => {
      documents.push({
        title: extract.title,
        source: extract.source,
        excerpt: extract.excerpt,
        relevanceScore: extract.relevanceScore || 75,
        category: extract.category,
        keywords: extract.keywords || []
      });
    });
    
    // Remove duplicates and sort by relevance
    const uniqueDocuments = documents.filter((doc, index, self) => 
      index === self.findIndex(d => d.title === doc.title)
    );
    
    return uniqueDocuments.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 15);
  }

  private async assessQuality(
    userQuestion: string, 
    keywords: KeywordResult, 
    documents: DocumentResult[]
  ): Promise<QualityCheck> {
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Assess the quality of this document collection for answering a banking compliance question:

Question: "${userQuestion}"
Keywords Used: ${JSON.stringify(keywords)}
Documents Found: ${documents.length}

Document Titles and Relevance Scores:
${documents.map(doc => `- ${doc.title} (Score: ${doc.relevanceScore}, Category: ${doc.category})`).join('\n')}

Evaluate and return JSON:
{
  "score": 0-100,
  "coverage": 0-100,
  "relevance": 0-100, 
  "completeness": 0-100,
  "recommendation": "proceed|retry|insufficient",
  "issues": ["issue1", "issue2"]
}

Scoring criteria:
- Coverage: How well do documents cover the question topic?
- Relevance: How relevant are documents to the specific question?
- Completeness: Can the question be fully answered with these documents?
- Overall score: Average of the above

Recommend "retry" if score < 70, "proceed" if >= 70, "insufficient" if < 40.`
    });

    try {
      const quality = JSON.parse(response.text || '{}');
      return {
        score: quality.score || 50,
        coverage: quality.coverage || 50,
        relevance: quality.relevance || 50,
        completeness: quality.completeness || 50,
        recommendation: quality.recommendation || 'proceed',
        issues: quality.issues || []
      };
    } catch {
      return {
        score: 60,
        coverage: 60,
        relevance: 60,
        completeness: 60,
        recommendation: 'proceed',
        issues: ['Unable to parse quality assessment']
      };
    }
  }

  private async generateAlternativeKeywords(
    userQuestion: string, 
    originalKeywords: KeywordResult
  ): Promise<KeywordResult> {
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", 
      contents: `The initial keyword search didn't yield sufficient results. Generate alternative keywords for this banking regulation question:

Question: "${userQuestion}"
Original Keywords: ${JSON.stringify(originalKeywords)}

Generate alternative approaches using:
- Broader regulatory terms
- Different regulatory frameworks
- Alternative legal terminology
- Related compliance areas
- Industry synonyms

Return JSON format:
{
  "primary": ["alternative1", "alternative2", ...],
  "secondary": ["broader1", "broader2", ...], 
  "generated": ["creative1", "creative2", ...],
  "category": "category_name"
}`
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch {
      return {
        primary: ["banking regulation", "compliance framework", "regulatory requirements"],
        secondary: ["financial services", "risk management", "regulatory guidance"],
        generated: ["supervisory expectations", "regulatory interpretation"],
        category: "Alternative Search"
      };
    }
  }

  private async generateAnswer(userQuestion: string, memory: WorkflowMemory): Promise<string> {
    const allDocuments = Array.from(memory.documents.values());
    const allKeywords = Array.from(memory.keywords.values());
    const qualityInfo = memory.qualityChecks[memory.qualityChecks.length - 1];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `You are an expert banking compliance consultant. Answer this question using the research conducted:

QUESTION: "${userQuestion}"

RESEARCH SUMMARY:
- Search Attempts: ${memory.currentAttempt}
- Documents Found: ${allDocuments.length}
- Quality Score: ${qualityInfo.score}/100
- Keywords Used: ${allKeywords.map(k => k.primary.join(', ')).join('; ')}

RELEVANT DOCUMENTS:
${allDocuments.map(doc => `
Title: ${doc.title}
Source: ${doc.source}
Category: ${doc.category}
Relevance: ${doc.relevanceScore}%
Content: ${doc.excerpt}
---`).join('\n')}

INSTRUCTIONS:
1. Provide a comprehensive, authoritative answer
2. Use specific regulatory references from the documents
3. Include practical implementation guidance
4. Highlight key compliance requirements
5. Use clear formatting with bullet points and bold text
6. Cite relevant document sources
7. If information is incomplete, acknowledge limitations

Format your response professionally for banking compliance professionals.`
    });

    return response.text || 'Unable to generate comprehensive answer with available information.';
  }
}

export const enhancedAIService = new EnhancedAIService();