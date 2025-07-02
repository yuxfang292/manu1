import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, User, Bot, FileText, Key, Sparkles, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMCP } from '@/hooks/use-mcp';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'thinking';
  content: string;
  timestamp: Date;
  showActionButtons?: boolean;
  userQuery?: string;
  isThinking?: boolean;
}

interface ChatSession {
  question: string;
  answer: string;
  keywords: any;
  documents: any[];
  qualityScore: number;
  timestamp: Date;
}

interface UnifiedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  onGenerateSummary?: () => void;
}

export default function UnifiedChatModal({ isOpen, onClose, onSearch, onGenerateSummary }: UnifiedChatModalProps) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'research'>('chat');
  
  // Chat Mode States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m CUBOT, your AI compliance assistant. I can help you with questions about regulatory requirements, capital ratios, compliance deadlines, and more. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  
  // Research Mode States
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [persistentKeywords, setPersistentKeywords] = useState<any[]>([]);
  const [persistentDocuments, setPersistentDocuments] = useState<any[]>([]);
  
  const { toast } = useToast();
  const mcp = useMCP();

  const exampleQuestions = [
    "What are the capital requirements for my banking group?",
    "Tell me about Basel III minimum ratios",
    "What are the GDPR requirements for financial services?",
    "When are the next stress testing deadlines?",
    "How do liquidity coverage ratios work?"
  ];

  const handleSubmit = async () => {
    if (!userInput.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      if (chatMode === 'research') {
        // Research Mode - Enhanced AI workflow
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userInput }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();

        // Extract keywords and documents from workflow
        const keywordsViz = data.workflow?.visualizations?.find((v: any) => v.type === 'keywords');
        const documentsViz = data.workflow?.visualizations?.find((v: any) => v.type === 'documents');
        
        // Add keywords to persistent library
        if (keywordsViz) {
          setPersistentKeywords(prev => {
            const newKeywords = [
              ...prev,
              { 
                question: userInput, 
                ...keywordsViz.data, 
                timestamp: new Date() 
              }
            ];
            return newKeywords.slice(-5); // Keep last 5 keyword sets
          });
        }
        
        // Add documents to persistent library
        if (documentsViz) {
          setPersistentDocuments(prev => {
            const newDocs = documentsViz.data.documents || [];
            const allDocs = [...prev, ...newDocs];
            // Remove duplicates by title
            const uniqueDocs = allDocs.filter((doc, index, self) => 
              index === self.findIndex(d => d.title === doc.title)
            );
            return uniqueDocs.slice(-20); // Keep last 20 unique documents
          });
        }

        // Save complete chat session
        setChatSessions(prev => [
          ...prev,
          {
            question: userInput,
            answer: data.response || '',
            keywords: keywordsViz?.data || null,
            documents: documentsViz?.data.documents || [],
            qualityScore: data.workflow?.memory?.qualityScore || 0,
            timestamp: new Date()
          }
        ]);

        toast({
          title: "Research Complete",
          description: `Found ${documentsViz?.data.documents?.length || 0} documents and ${keywordsViz?.data.totalKeywords || 0} keywords`,
        });
      } else {
        // Chat Mode - Regular conversation
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: userInput,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);

        const mcpResponse = await mcp.queryGen(userInput, 'banking regulations');
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: mcpResponse.result.response || 'I apologize, but I encountered an issue processing your request. Please try again.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

      setUserInput(''); // Clear input

    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setUserInput(question);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${chatMode === 'research' ? 'max-w-6xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            CUBOT AI Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col space-y-4">
            {/* Input */}
            <div className="flex gap-2">
              <Select value={chatMode} onValueChange={(value: 'chat' | 'research') => setChatMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Quick Chat</SelectItem>
                  <SelectItem value="research">Research Mode</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={chatMode === 'research' ? 
                  "Ask about banking regulations for deep research..." : 
                  "Ask about banking regulations and compliance..."
                }
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                disabled={isProcessing}
              />
              <Button 
                onClick={handleSubmit} 
                disabled={isProcessing || !userInput.trim()}
                size="sm"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Chat Content */}
            <ScrollArea className="flex-1">
              {chatMode === 'research' ? (
                // Research Mode View
                chatSessions.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    Ask a question to start building your research workspace
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatSessions.map((session, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-1 text-blue-600" />
                            <p className="text-sm font-medium">{session.question}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Bot className="h-4 w-4 mt-1 text-green-600" />
                            <div className="flex-1">
                              <div className="text-xs text-muted-foreground mb-2">
                                Quality: {session.qualityScore}% • {session.timestamp.toLocaleTimeString()}
                              </div>
                              <div className="text-sm">
                                {session.answer.substring(0, 400)}
                                {session.answer.length > 400 && '...'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                // Chat Mode View
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">
                          {message.role === 'user' ? 'You' : 'CUBOT'} • {message.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Example Questions (only in chat mode) */}
            {chatMode === 'chat' && messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {exampleQuestions.slice(0, 3).map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleExampleClick(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Research Library (only in research mode) */}
          {chatMode === 'research' && (
            <div className="w-80 flex flex-col space-y-4">
              {/* Keywords Library */}
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Keywords ({persistentKeywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40">
                    {persistentKeywords.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        Keywords from your research will appear here
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {persistentKeywords.map((keywordSet, idx) => (
                          <div key={idx} className="border rounded p-2">
                            <div className="text-xs font-medium mb-1 truncate">
                              {keywordSet.question}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {keywordSet.primary?.slice(0, 4).map((kw: string, i: number) => (
                                <Badge key={i} variant="default" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                            {keywordSet.secondary?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {keywordSet.secondary?.slice(0, 3).map((kw: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Documents Library */}
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents ({persistentDocuments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-60">
                    {persistentDocuments.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        Documents from your research will appear here
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {persistentDocuments.map((doc, idx) => (
                          <div key={idx} className="p-2 border rounded hover:bg-gray-50">
                            <div className="text-xs font-medium line-clamp-2 mb-1">
                              {doc.title}
                            </div>
                            <div className="text-xs text-blue-600 mb-1">
                              {doc.source}
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {doc.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {Math.round((doc.relevanceScore || 0) * 100)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}