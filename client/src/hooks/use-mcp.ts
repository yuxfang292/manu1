import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

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

export interface MCPProcess {
  step: string;
  progress: number;
  message: string;
  completed: boolean;
}

const PROCESS_STEPS = {
  'query_gen': [
    { step: 'analyzing', message: 'Analyzing your query...', duration: 500 },
    { step: 'generating', message: 'Generating optimized search queries...', duration: 800 },
    { step: 'validating', message: 'Validating query strategies...', duration: 200 }
  ],
  'content_search': [
    { step: 'indexing', message: 'Searching regulatory databases...', duration: 800 },
    { step: 'filtering', message: 'Applying filters and relevance scoring...', duration: 900 },
    { step: 'ranking', message: 'Ranking results by compliance relevance...', duration: 800 }
  ],
  'keywords_gen': [
    { step: 'analyzing', message: 'Analyzing content structure...', duration: 400 },
    { step: 'extracting', message: 'Extracting key regulatory terms...', duration: 600 },
    { step: 'categorizing', message: 'Categorizing compliance keywords...', duration: 200 }
  ],
  'summary': [
    { step: 'processing', message: 'Processing regulatory content...', duration: 1000 },
    { step: 'analyzing', message: 'Analyzing compliance implications...', duration: 1200 },
    { step: 'synthesizing', message: 'Synthesizing executive summary...', duration: 800 }
  ]
};

export function useMCP() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcess, setCurrentProcess] = useState<MCPProcess | null>(null);
  const [result, setResult] = useState<MCPResponse | null>(null);

  const simulateProgress = async (functionName: keyof typeof PROCESS_STEPS) => {
    const steps = PROCESS_STEPS[functionName];
    let totalProgress = 0;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progressIncrement = 100 / steps.length;
      
      setCurrentProcess({
        step: step.step,
        progress: Math.min(totalProgress + progressIncrement, 100),
        message: step.message,
        completed: false
      });
      
      await new Promise(resolve => setTimeout(resolve, step.duration));
      totalProgress += progressIncrement;
    }

    setCurrentProcess({
      step: 'completed',
      progress: 100,
      message: 'Process completed successfully!',
      completed: true
    });
  };

  const callMCPFunction = async (
    functionName: keyof typeof PROCESS_STEPS,
    endpoint: string,
    payload: any
  ): Promise<MCPResponse> => {
    setIsProcessing(true);
    setResult(null);
    setCurrentProcess(null);

    try {
      // Start progress simulation
      const progressPromise = simulateProgress(functionName);
      
      // Make API call
      const responsePromise = fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }).then(res => res.json());

      // Wait for both to complete
      const [response] = await Promise.all([responsePromise, progressPromise]);
      
      setResult(response);
      
      // Keep completed state visible for a moment
      setTimeout(() => {
        setCurrentProcess(null);
      }, 1500);
      
      return response;
    } catch (error) {
      setCurrentProcess({
        step: 'error',
        progress: 0,
        message: 'Failed to process request. Please try again.',
        completed: false
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const queryGen = async (userQuery: string, context?: string) => {
    return callMCPFunction('query_gen', '/api/mcp/query-gen', { userQuery, context });
  };

  const contentSearch = async (query: string, filters?: any) => {
    return callMCPFunction('content_search', '/api/mcp/content-search', { query, filters });
  };

  const keywordsGen = async (content: string, category?: string) => {
    return callMCPFunction('keywords_gen', '/api/mcp/keywords-gen', { content, category });
  };

  const summary = async (content: string[], options?: any) => {
    return callMCPFunction('summary', '/api/mcp/summary', { content, options });
  };

  return {
    isProcessing,
    currentProcess,
    result,
    queryGen,
    contentSearch,
    keywordsGen,
    summary
  };
}