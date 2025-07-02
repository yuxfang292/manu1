import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, User, Bot, FileText, Key, Sparkles, MessageSquare, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatSession {
  question: string;
  answer: string;
  keywords?: any;
  documents?: any[];
  qualityScore?: number;
  timestamp: Date;
  isResearchMode: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EnhancedChatWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedChatWorkspace({ isOpen, onClose }: EnhancedChatWorkspaceProps) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResearchMode, setIsResearchMode] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m CUBOT, your AI compliance assistant. I can help you with questions about regulatory requirements, capital ratios, compliance deadlines, and more. Toggle Research Mode for enhanced analysis with keywords and documents.',
      timestamp: new Date()
    }
  ]);
  const [persistentKeywords, setPersistentKeywords] = useState<any[]>([]);
  const [persistentDocuments, setPersistentDocuments] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!userInput.trim() || isProcessing) return;

    setIsProcessing(true);
    const currentInput = userInput;
    
    // Add user message to chat history
    if (!isResearchMode) {
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'user',
          content: currentInput,
          timestamp: new Date()
        }
      ]);
    }

    try {
      if (isResearchMode) {
        // Research mode - use enhanced workflow
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: currentInput }),
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
                question: currentInput, 
                ...keywordsViz.data, 
                timestamp: new Date() 
              }
            ];
            return newKeywords.slice(-5);
          });
        }
        
        // Add documents to persistent library
        if (documentsViz) {
          setPersistentDocuments(prev => {
            const newDocs = documentsViz.data.documents || [];
            const allDocs = [...prev, ...newDocs];
            const uniqueDocs = allDocs.filter((doc, index, self) => 
              index === self.findIndex(d => d.title === doc.title)
            );
            return uniqueDocs.slice(-20);
          });
        }

        // Save research session
        setChatSessions(prev => [
          ...prev,
          {
            question: currentInput,
            answer: data.response || '',
            keywords: keywordsViz?.data || null,
            documents: documentsViz?.data.documents || [],
            qualityScore: data.workflow?.memory?.qualityScore || 0,
            timestamp: new Date(),
            isResearchMode: true
          }
        ]);

        toast({
          title: "Research Complete",
          description: `Found ${documentsViz?.data.documents?.length || 0} documents and ${keywordsViz?.data.totalKeywords || 0} keywords`,
        });

      } else {
        // Chat mode - use simple chat API
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: currentInput,
            history: chatMessages.slice(-10) // Send last 10 messages for context
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();

        // Add AI response to chat
        setChatMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response || '',
            timestamp: new Date()
          }
        ]);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              CUBOT AI Assistant
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
              <Checkbox 
                checked={isResearchMode}
                onCheckedChange={(checked) => setIsResearchMode(checked === true)}
                className="mx-2"
              />
              <Search className="h-4 w-4" />
              <span>Research</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left Panel - Chat */}
          <div className="flex-1 flex flex-col space-y-4">
            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask about banking regulations and compliance..."
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

            {/* Chat History */}
            <ScrollArea className="flex-1">
              {isResearchMode ? (
                // Research Mode - Show research sessions
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
                // Chat Mode - Show conversation messages
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="flex items-start gap-2">
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 mt-1 text-blue-600" />
                      ) : (
                        <Bot className="h-4 w-4 mt-1 text-green-600" />
                      )}
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Research Library (only show in research mode) */}
          {isResearchMode && (
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