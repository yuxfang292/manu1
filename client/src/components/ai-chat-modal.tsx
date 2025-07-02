import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, Search, CheckCircle, FileText, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  showActionButtons?: boolean;
  userQuery?: string;
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
      content: 'Hello! I\'m your AI Compliance Assistant. I can help you with questions about regulatory requirements, capital ratios, compliance deadlines, and more. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [completedQueries, setCompletedQueries] = useState<string[]>([]);
  const { toast } = useToast();

  const exampleQuestions = [
    "What are the capital requirements for my banking group?",
    "Tell me about Basel III minimum ratios",
    "What are the GDPR requirements for financial services?",
    "When are the next stress testing deadlines?",
    "How do liquidity coverage ratios work?"
  ];

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          history: messages.slice(-5) // Send last 5 messages for context
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
        userQuery: input.trim()
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
    
    // Add a system message confirming the query is complete
    const doneMessage: Message = {
      id: Date.now().toString(),
      role: 'system',
      content: 'Query marked as complete. Feel free to ask another question!',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, doneMessage]);

    // Check if user has completed multiple queries to show session completion options
    const newCompletedCount = completedQueries.length + 1;
    if (newCompletedCount >= 2) {
      setShowSessionComplete(true);
    }
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
        content: 'Hello! I\'m your AI Compliance Assistant. I can help you with questions about regulatory requirements, capital ratios, compliance deadlines, and more. What would you like to know?',
        timestamp: new Date()
      }
    ]);
    setCompletedQueries([]);
    setShowSessionComplete(false);
    setInput('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <span>AI Compliance Assistant</span>
          </DialogTitle>
          <DialogDescription>
            Ask questions about regulatory requirements, compliance deadlines, and banking regulations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Messages Area */}
          <ScrollArea className="flex-1 border rounded-lg p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`p-2 rounded-full ${
                        message.role === 'user' ? 'bg-blue-100' : 
                        message.role === 'system' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-blue-600" />
                        ) : message.role === 'system' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Bot className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className={`p-3 rounded-lg ${
                          message.role === 'user' ? 'bg-blue-600 text-white' : 
                          message.role === 'system' ? 'bg-green-50 text-green-900 border border-green-200' : 
                          'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                  You've completed {completedQueries.length} queries in this session. Would you like to generate a research summary or start a new session?
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