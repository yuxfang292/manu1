import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bot, User, Sparkles, Search, CheckCircle, FileText, RotateCcw, Brain, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import cubotIcon from "@assets/CUBOT-Ready_1751471469146.png";
import { useMCP } from "@/hooks/use-mcp";
import FinalReportModal from './final-report-modal';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'thinking';
  content: string;
  timestamp: Date;
  showActionButtons?: boolean;
  userQuery?: string;
  isThinking?: boolean;
  mcpData?: {
    keywords?: string[];
    documents?: any[];
  };
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  onGenerateSummary?: () => void;
}

export default function AIChatModal({ isOpen, onClose, onSearch, onGenerateSummary }: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m CUBOT, your AI compliance assistant. I can help you with questions about regulatory requirements, capital ratios, compliance deadlines, and more. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [completedQueries, setCompletedQueries] = useState<string[]>([]);
  const [chatMode, setChatMode] = useState<'chat' | 'research'>('chat');
  const [showFinalReportModal, setShowFinalReportModal] = useState(false);
  const [finalReportQuery, setFinalReportQuery] = useState<string>('');
  const [finalReportKeywords, setFinalReportKeywords] = useState<string[]>([]);
  const { toast } = useToast();
  const mcp = useMCP();

  const exampleQuestions = [
    "What are the capital requirements for my banking group?",
    "Tell me about Basel III minimum ratios",
    "What are the GDPR requirements for financial services?",
    "When are the next stress testing deadlines?",
    "How do liquidity coverage ratios work?"
  ];

  const handleMCPFunction = async (functionType: 'query_gen' | 'content_search' | 'keywords_gen' | 'summary') => {
    try {
      let result;
      const sampleContent = "Banking regulatory compliance frameworks including Basel III capital requirements, liquidity coverage ratios, and stress testing methodologies.";
      
      switch (functionType) {
        case 'query_gen':
          result = await mcp.queryGen("Basel III capital requirements");
          break;
        case 'content_search':
          result = await mcp.contentSearch("Basel III liquidity coverage ratio");
          break;
        case 'keywords_gen':
          result = await mcp.keywordsGen(sampleContent, "banking_regulation");
          break;
        case 'summary':
          result = await mcp.summary([sampleContent], { style: 'executive', length: 'detailed' });
          break;
      }

      // Add result as a message
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**MCP ${functionType.replace('_', ' ').toUpperCase()} Results:**\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
        timestamp: new Date(),
        showActionButtons: false
      };

      setMessages(prev => [...prev, resultMessage]);
      
      toast({
        title: "MCP Function Complete",
        description: `Successfully executed ${functionType.replace('_', ' ')} function`,
      });
    } catch (error) {
      console.error('MCP Function error:', error);
      toast({
        title: "MCP Error",
        description: "Failed to execute MCP function. Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userQuery = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      if (chatMode === 'research') {
        await handleResearchMode(userQuery);
      } else {
        await handleChatMode(userQuery);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatMode = async (userQuery: string) => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userQuery,
        history: messages.slice(-5),
        mode: 'chat'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.response,
      timestamp: new Date(),
      showActionButtons: false
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleResearchMode = async (userQuery: string) => {
    // Step 1: Generate keywords
    const step1Message: Message = {
      id: `step1-${Date.now()}`,
      role: 'system',
      content: '🔍 **Step 1:** Generating keywords from your question...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, step1Message]);

    try {
      const keywordsResult = await fetch('/api/mcp/keywords-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userQuery, category: 'banking_regulation' })
      }).then(res => res.json());

      const keywords = [
        ...(keywordsResult.result?.keywords?.primary || []),
        ...(keywordsResult.result?.keywords?.secondary || []),
        ...(keywordsResult.result?.keywords?.emerging || [])
      ];

      setMessages(prev => prev.map(msg => 
        msg.id === step1Message.id 
          ? { 
              ...msg, 
              content: `✅ **Step 1 Complete:** Found ${keywords.length} keywords`,
              mcpData: { keywords: keywords.slice(0, 12) }
            }
          : msg
      ));

      // Step 2: Search documents
      const step2Message: Message = {
        id: `step2-${Date.now()}`,
        role: 'system',
        content: '📚 **Step 2:** Searching regulatory documents...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, step2Message]);

      const searchResult = await fetch('/api/mcp/content-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keywords.join(' '), filters: { keywords } })
      }).then(res => res.json());

      const documents = searchResult.result?.documents || [];

      setMessages(prev => prev.map(msg => 
        msg.id === step2Message.id 
          ? { 
              ...msg, 
              content: `✅ **Step 2 Complete:** Found ${documents.length} regulatory documents`,
              mcpData: { documents: documents.slice(0, 6) }
            }
          : msg
      ));

      // Step 3: Quality assessment (silent)
      const qualityGood = documents.length > 0;

      // Step 4: Generate comprehensive response (silently)

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuery,
          history: messages.slice(-5),
          mode: 'research',
          researchData: { keywords, documents }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Add final response
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        showActionButtons: true,
        userQuery: userQuery
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Research mode error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error during research. Please try again.',
        timestamp: new Date()
      }]);
    }
  };

  // Determine which MCP functions to use based on user query
  const determineMCPFunctions = async (query: string): Promise<string[]> => {
    const queryLower = query.toLowerCase();
    const functions: string[] = [];

    // Use query_gen for search-related queries
    if (queryLower.includes('search') || queryLower.includes('find') || queryLower.includes('what') || queryLower.includes('how')) {
      functions.push('query_gen');
    }

    // Use content_search for specific regulatory topics
    if (queryLower.includes('basel') || queryLower.includes('capital') || queryLower.includes('liquidity') || 
        queryLower.includes('regulation') || queryLower.includes('compliance') || queryLower.includes('requirement')) {
      functions.push('content_search');
    }

    // Use keywords_gen for broad topics
    if (queryLower.includes('overview') || queryLower.includes('about') || queryLower.includes('explain')) {
      functions.push('keywords_gen');
    }

    // Use summary for complex or multi-part questions
    if (queryLower.includes('summary') || queryLower.includes('overview') || query.split(' ').length > 8) {
      functions.push('summary');
    }

    return functions;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  const handleSearchResults = (query: string) => {
    if (onSearch) {
      onSearch(query);
      onClose();
    }
  }

  const handleFinalReport = (query: string) => {
    console.log('Looking for MCP data for query:', query);
    console.log('All messages:', messages.map(m => ({ id: m.id, query: m.userQuery, hasMCP: !!m.mcpData })));
    
    // Find all messages with MCP data for this query to get keywords and documents
    const mcpMessages = messages.filter(msg => 
      msg.userQuery === query && msg.mcpData && 
      (msg.mcpData.keywords || msg.mcpData.documents)
    );
    
    console.log('Found MCP messages:', mcpMessages.length);
    
    // Collect all keywords and documents from MCP results
    const allKeywords: string[] = [];
    const allDocuments: any[] = [];
    
    mcpMessages.forEach(msg => {
      console.log('Processing message:', msg.id, msg.mcpData);
      if (msg.mcpData?.keywords) {
        allKeywords.push(...msg.mcpData.keywords);
      }
      if (msg.mcpData?.documents) {
        allDocuments.push(...msg.mcpData.documents);
      }
    });
    
    console.log('Found keywords:', allKeywords.length);
    console.log('Found documents:', allDocuments.length);
    
    // Remove duplicates
    const uniqueKeywords = allKeywords.filter((keyword, index) => 
      allKeywords.indexOf(keyword) === index
    );
    
    setFinalReportQuery(query);
    setFinalReportKeywords(uniqueKeywords);
    setShowFinalReportModal(true);
  };

  const handleMarkDone = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message?.userQuery) {
      setCompletedQueries(prev => [...prev, message.userQuery!]);
    }

    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, showActionButtons: false }
        : msg
    ));
    
    // Check if user has completed any queries to show session completion options
    const newCompletedCount = completedQueries.length + 1;
    setShowSessionComplete(true);
  };

  const handleGenerateSummary = () => {
    if (onGenerateSummary) {
      onGenerateSummary();
    }
    onClose();
  };

  const handleRestartSession = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m CUBOT, your AI compliance assistant. I can help you with questions about regulatory requirements, capital ratios, compliance deadlines, and more. What would you like to know?',
        timestamp: new Date()
      }
    ]);
    setCompletedQueries([]);
    setShowSessionComplete(false);
    setInput('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[90vw] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <img 
                src={cubotIcon} 
                alt="CUBOT AI Assistant" 
                className="w-6 h-6 object-contain" 
              />
            </div>
            <span>CUBOT</span>
          </DialogTitle>
          <DialogDescription>
            Ask questions about regulatory requirements, compliance deadlines, and banking regulations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">

          
          {/* Messages Area */}
          <ScrollArea className="flex-1 border rounded-lg p-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`p-2 rounded-full ${
                        message.role === 'user' ? 'bg-blue-100' : 
                        message.role === 'system' ? 'bg-green-100' : 
                        message.role === 'thinking' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-blue-600" />
                        ) : message.role === 'system' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : message.role === 'thinking' ? (
                          <div className="animate-spin">
                            <img 
                              src={cubotIcon} 
                              alt="CUBOT AI Assistant" 
                              className="w-4 h-4 object-contain" 
                            />
                          </div>
                        ) : (
                          <img 
                            src={cubotIcon} 
                            alt="CUBOT AI Assistant" 
                            className="w-4 h-4 object-contain" 
                          />
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className={`p-3 rounded-lg ${
                          message.role === 'user' ? 'bg-blue-600 text-white' : 
                          message.role === 'system' ? 'bg-green-50 text-green-900 border border-green-200' : 
                          message.role === 'thinking' ? 'bg-purple-50 text-purple-900 border border-purple-200' :
                          'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="text-sm prose prose-sm max-w-none">
                            {message.role === 'thinking' ? (
                              <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                                <div className="text-purple-700 italic">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            ) : (
                              <div className={`prose-sm ${
                                message.role === 'user' ? 'prose-invert' : 'prose-gray'
                              }`}>
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                    ul: ({ children }) => <ul className="mb-3 list-disc list-outside ml-4 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-3 list-decimal list-outside ml-4 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1 pl-1">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    code: ({ children }) => (
                                      <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                        message.role === 'user' 
                                          ? 'bg-blue-500 text-blue-100' 
                                          : 'bg-gray-200 text-gray-800'
                                      }`}>
                                        {children}
                                      </code>
                                    ),
                                    pre: ({ children }) => (
                                      <pre className={`p-3 rounded mt-2 mb-2 text-xs overflow-x-auto font-mono ${
                                        message.role === 'user' 
                                          ? 'bg-blue-500 text-blue-100' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {children}
                                      </pre>
                                    ),
                                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>,
                                    blockquote: ({ children }) => (
                                      <blockquote className="border-l-4 border-gray-300 pl-3 ml-2 italic my-2 bg-gray-50 py-2 rounded-r">
                                        {children}
                                      </blockquote>
                                    )
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )}
                            
                            {/* MCP Data Visualization */}
                            {message.mcpData && (
                              <div className="mt-3 space-y-3">
                                {/* Keywords Display */}
                                {message.mcpData.keywords && (
                                  <div className="bg-blue-50 rounded-lg p-3">
                                    <div className="flex flex-wrap gap-1">
                                      {message.mcpData.keywords.map((keyword: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Documents Display */}
                                {message.mcpData.documents && (
                                  <div className="space-y-2">
                                    {message.mcpData.documents.map((doc: any, idx: number) => (
                                      <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <h4 className="font-medium text-sm text-gray-900">{doc.title}</h4>
                                            <p className="text-xs text-gray-600 mt-1">{doc.source || 'Regulatory Source'}</p>
                                            <p className="text-xs text-gray-700 mt-1">{doc.excerpt?.substring(0, 120)}...</p>
                                          </div>
                                          <div className="ml-2">
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                              {Math.round((doc.relevanceScore || 0.8) * 100)}% match
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                

                              </div>
                            )}
                          </div>
                          <p className={`text-xs mt-1 opacity-70`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        
                        {/* Action Buttons for Assistant Messages */}
                        {message.role === 'assistant' && message.showActionButtons && message.userQuery && (
                          <div className="flex items-center space-x-2 pl-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSearchResults(message.userQuery!)}
                              className="text-xs"
                            >
                              <Search className="w-3 h-3 mr-1" />
                              Show Related Results
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkDone(message.id)}
                              className="text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark as Done
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="flex items-start space-x-2">
                      <div className="p-2 rounded-full bg-gray-100">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="p-3 rounded-lg bg-gray-100">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 animate-pulse text-blue-600" />
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Example Questions */}
          {messages.length === 1 && (
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Try asking:</h4>
              <div className="flex flex-wrap gap-2">
                {exampleQuestions.map((question, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 text-xs p-2"
                    onClick={() => handleExampleClick(question)}
                  >
                    {question}
                  </Badge>
                ))}
              </div>
            </div>
          )}



          {/* Session Completion Options */}
          {showSessionComplete && (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Session Complete</h3>
                  <span className="text-sm text-gray-600">({completedQueries.length} {completedQueries.length === 1 ? 'query' : 'queries'})</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => {
                      // Get the most recent query data for Final Report
                      const lastQuery = completedQueries[completedQueries.length - 1];
                      if (lastQuery) {
                        handleFinalReport(lastQuery);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Final Report
                  </Button>
                  
                  <Button
                    onClick={() => setShowSessionComplete(false)}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Continue
                  </Button>
                  
                  <Button
                    onClick={handleRestartSession}
                    variant="outline"
                    className="border-gray-300"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    New Session
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          {!showSessionComplete && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Select value={chatMode} onValueChange={(value: 'chat' | 'research') => setChatMode(value)}>
                  <SelectTrigger className="w-44 whitespace-nowrap">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat Mode</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="research">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4" />
                        <span>Research Mode</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={chatMode === 'research' 
                    ? "Ask a question for deep research analysis..."
                    : "Ask about compliance requirements, deadlines, or regulations..."
                  }
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                {chatMode === 'research' 
                  ? "Research mode: Uses MCP to find keywords, search documents, and provide comprehensive analysis"
                  : "Chat mode: Direct conversation without document research"
                }
              </p>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Final Report Modal */}
      <FinalReportModal
        isOpen={showFinalReportModal}
        onClose={() => setShowFinalReportModal(false)}
        selectedCards={[]} // Will be populated from MCP documents
        keywords={finalReportKeywords}
        searchQuery={finalReportQuery}
        mcpDocuments={messages.filter(msg => 
          msg.userQuery === finalReportQuery && msg.mcpData?.documents
        ).flatMap(msg => msg.mcpData?.documents || [])}
      />
    </Dialog>
  );
}