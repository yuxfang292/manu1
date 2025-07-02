import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, Search, CheckCircle, FileText, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import cubotIcon from "@assets/CUBOT-Ready_1751471469146.png";
import { useMCP } from "@/hooks/use-mcp";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'thinking';
  content: string;
  timestamp: Date;
  showActionButtons?: boolean;
  userQuery?: string;
  isThinking?: boolean;
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
      // Determine which MCP functions to use based on the query
      const mcpFunctionsToUse = await determineMCPFunctions(userQuery);
      let mcpResults: any = {};

      // Execute MCP functions if needed with natural status messages
      if (mcpFunctionsToUse.length > 0) {
        // Add a thinking message to show CUBOT is researching
        const thinkingMessage: Message = {
          id: (Date.now() - 1).toString(),
          role: 'assistant',
          content: 'Let me research this for you...',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, thinkingMessage]);

        for (const func of mcpFunctionsToUse) {
          try {
            let result;
            let statusMessage = '';
            
            switch (func) {
              case 'query_gen':
                statusMessage = 'Generating optimized search queries...';
                break;
              case 'content_search':
                statusMessage = 'Searching regulatory databases...';
                break;
              case 'keywords_gen':
                statusMessage = 'Analyzing compliance terminology...';
                break;
              case 'summary':
                statusMessage = 'Processing regulatory content...';
                break;
            }

            // Update the thinking message with current step
            setMessages(prev => prev.map(msg => 
              msg.id === thinkingMessage.id 
                ? { ...msg, content: statusMessage }
                : msg
            ));

            switch (func) {
              case 'query_gen':
                result = await mcp.queryGen(userQuery);
                mcpResults.queryGen = result;
                break;
              case 'content_search':
                result = await mcp.contentSearch(userQuery);
                mcpResults.contentSearch = result;
                break;
              case 'keywords_gen':
                result = await mcp.keywordsGen(userQuery, 'banking_regulation');
                mcpResults.keywordsGen = result;
                break;
              case 'summary':
                result = await mcp.summary([userQuery], { style: 'executive' });
                mcpResults.summary = result;
                break;
            }
          } catch (error) {
            console.error(`MCP ${func} error:`, error);
          }
        }

        // Remove thinking message before showing final response
        setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userQuery,
          history: messages.slice(-5),
          mcpResults: mcpResults
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
        showActionButtons: true,
        userQuery: userQuery
      };

      setMessages(prev => [...prev, assistantMessage]);
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
            <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-green-50">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Session Complete</h3>
                </div>
                
                <p className="text-gray-600">
                  You've completed {completedQueries.length} {completedQueries.length === 1 ? 'query' : 'queries'} in this session. Would you like to generate a research summary, continue asking questions, or start a new session?
                </p>
                
                <div className="flex items-center justify-center space-x-3 pt-2">
                  <Button
                    onClick={handleGenerateSummary}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Summary
                  </Button>
                  
                  <Button
                    onClick={() => setShowSessionComplete(false)}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Continue Session
                  </Button>
                  
                  <Button
                    onClick={handleRestartSession}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start New Session
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 pt-2">
                  <p>Your completed queries:</p>
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {completedQueries.map((query, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {query.length > 30 ? `${query.substring(0, 30)}...` : query}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          {!showSessionComplete && (
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about compliance requirements, deadlines, or regulations..."
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}