const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export interface MCPFunction {
  name: string;
  description: string;
  parameters: any;
}

export interface MCPResponse {
  function: string;
  result: any;
  metadata?: {
    processingTime: number;
    confidence?: number;
    sources?: string[];
  };
}

export class MCPService {
  private async simulateProcessing(duration: number = 2000): Promise<void> {
    await delay(duration);
  }

  async queryGen(userQuery: string, context: string = ''): Promise<MCPResponse> {
    await this.simulateProcessing(1500);
    
    const queries = [
      `${userQuery} regulatory framework analysis`,
      `${userQuery} compliance requirements banking`,
      `${userQuery} regulatory updates recent changes`,
      `${userQuery} implementation guidelines best practices`
    ];

    return {
      function: 'query_gen',
      result: {
        originalQuery: userQuery,
        generatedQueries: queries.slice(0, 3),
        searchStrategy: 'comprehensive_regulatory_search',
        priorityAreas: ['compliance', 'regulatory', 'banking']
      },
      metadata: {
        processingTime: 1500,
        confidence: 0.92
      }
    };
  }

  async contentSearch(query: string, filters?: any): Promise<MCPResponse> {
    await this.simulateProcessing(2500);
    
    const mockResults = [
      {
        id: 'reg_001',
        title: 'Basel III Capital Requirements Update',
        excerpt: 'Banking organizations must maintain minimum capital ratios: common equity tier 1 capital ratio of 4.5%, tier 1 capital ratio of 6.0%, and total capital ratio of 8.0%.',
        content: 'Detailed framework for capital adequacy requirements under Basel III including buffer mechanisms, conservation measures, and supervisory review processes for internationally active banks.',
        source: 'BIS Regulatory Guidelines',
        relevanceScore: 0.95,
        lastUpdated: '2024-12-15'
      },
      {
        id: 'reg_002', 
        title: 'Liquidity Coverage Ratio Implementation',
        excerpt: 'Banks must maintain sufficient high-quality liquid assets to survive a 30-day stressed funding scenario with LCR minimum of 100%.',
        content: 'Comprehensive guidelines on calculating LCR including eligible HQLA categories, cash outflow calculations, and regulatory reporting requirements for liquidity risk management.',
        source: 'Federal Reserve Bulletin',
        relevanceScore: 0.88,
        lastUpdated: '2024-12-10'
      },
      {
        id: 'reg_003',
        title: 'Stress Testing Methodologies',
        excerpt: 'Annual stress testing scenarios must include baseline, adverse, and severely adverse economic conditions with capital adequacy assessments.',
        content: 'Detailed methodology for conducting bank stress tests including scenario design, capital projection models, risk-weighted asset calculations, and supervisory evaluation criteria.',
        source: 'ECB Banking Supervision',
        relevanceScore: 0.82,
        lastUpdated: '2024-12-08'
      },
      {
        id: 'reg_004',
        title: 'Operational Risk Management Framework',
        excerpt: 'Standardised approach for operational risk capital requirements based on business indicator component and internal loss multiplier.',
        content: 'Framework for identifying, assessing, monitoring and controlling operational risk including governance structures, risk appetite statements, and business continuity planning requirements.',
        source: 'Basel Committee Guidelines',
        relevanceScore: 0.79,
        lastUpdated: '2024-12-05'
      }
    ];

    return {
      function: 'content_search',
      result: {
        query,
        totalResults: mockResults.length,
        documents: mockResults, // Add documents key for backend compatibility
        results: mockResults,
        searchMetrics: {
          processingTime: '2.5s',
          indexesSearched: ['regulatory_docs', 'compliance_updates', 'banking_guidelines'],
          filtersApplied: filters || {}
        }
      },
      metadata: {
        processingTime: 2500,
        sources: ['BIS', 'Federal Reserve', 'ECB']
      }
    };
  }

  async keywordsGen(content: string, category?: string): Promise<MCPResponse> {
    await this.simulateProcessing(1200);
    
    const keywords = {
      primary: ['basel III', 'capital requirements', 'regulatory compliance', 'banking supervision'],
      secondary: ['risk management', 'liquidity coverage', 'stress testing', 'prudential regulation'],
      emerging: ['digital banking', 'fintech regulation', 'ESG compliance', 'cyber risk']
    };

    return {
      function: 'keywords_gen',
      result: {
        inputContent: content.substring(0, 100) + '...',
        category: category || 'banking_regulation',
        keywords,
        totalKeywords: Object.values(keywords).flat().length,
        confidence: 0.89
      },
      metadata: {
        processingTime: 1200,
        confidence: 0.89
      }
    };
  }

  async summary(content: string[], options?: { style?: string; length?: string }): Promise<MCPResponse> {
    await this.simulateProcessing(3000);
    
    const summary = {
      overview: "The regulatory landscape for banking continues to evolve with enhanced capital requirements, liquidity standards, and stress testing frameworks. Key developments include Basel III implementation, digital banking regulations, and ESG compliance mandates.",
      keyPoints: [
        "Basel III capital requirements are being phased in with stricter minimum ratios",
        "Liquidity Coverage Ratio (LCR) implementation varies by jurisdiction but maintains core principles", 
        "Stress testing methodologies are becoming more sophisticated and frequent",
        "Digital banking regulations are emerging to address fintech and cryptocurrency risks",
        "ESG factors are increasingly integrated into regulatory frameworks"
      ],
      implications: [
        "Banks need to maintain higher capital buffers",
        "Enhanced liquidity management processes required",
        "Regular stress testing and scenario planning mandatory",
        "Investment in compliance technology and reporting systems"
      ],
      recommendations: [
        "Develop comprehensive compliance monitoring systems",
        "Enhance risk management frameworks",
        "Invest in regulatory technology solutions",
        "Maintain close dialogue with regulatory authorities"
      ]
    };

    return {
      function: 'summary',
      result: {
        inputSources: content.length,
        style: options?.style || 'executive',
        length: options?.length || 'detailed',
        summary,
        wordCount: 180
      },
      metadata: {
        processingTime: 3000,
        confidence: 0.94,
        sources: ['Multiple regulatory documents', 'Banking guidelines', 'Compliance frameworks']
      }
    };
  }

  // Get available functions
  getFunctions(): MCPFunction[] {
    return [
      {
        name: 'query_gen',
        description: 'Generate optimized search queries for regulatory compliance research',
        parameters: {
          userQuery: 'string',
          context: 'string (optional)'
        }
      },
      {
        name: 'content_search',
        description: 'Search regulatory content across multiple databases and sources',
        parameters: {
          query: 'string',
          filters: 'object (optional)'
        }
      },
      {
        name: 'keywords_gen',
        description: 'Generate relevant keywords and tags for regulatory content',
        parameters: {
          content: 'string',
          category: 'string (optional)'
        }
      },
      {
        name: 'summary',
        description: 'Create comprehensive summaries of regulatory content',
        parameters: {
          content: 'string[]',
          options: 'object (optional)'
        }
      }
    ];
  }
}

export const mcpService = new MCPService();