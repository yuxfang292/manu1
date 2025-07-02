import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, CheckCircle, AlertCircle, Clock, FileText, Key, BarChart3, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStep {
  step: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  message: string;
}

interface Visualization {
  type: 'keywords' | 'documents' | 'quality';
  title: string;
  data: any;
}

interface WorkflowMemory {
  keywordsCount: number;
  documentsCount: number;
  qualityScore: number;
  attempts: number;
}

interface EnhancedAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedAIChatModal({ isOpen, onClose }: EnhancedAIChatModalProps) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [memory, setMemory] = useState<WorkflowMemory | null>(null);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [currentProgress, setCurrentProgress] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!userInput.trim() || isProcessing) return;

    setIsProcessing(true);
    setSteps([]);
    setVisualizations([]);
    setMemory(null);
    setFinalAnswer('');
    setCurrentProgress(0);

    try {
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
      
      setSteps(data.workflow?.steps || []);
      setVisualizations(data.workflow?.visualizations || []);
      setMemory(data.workflow?.memory || null);
      setFinalAnswer(data.response || '');
      setCurrentProgress(100);

      toast({
        title: "Analysis Complete",
        description: `Generated comprehensive answer with ${data.workflow?.memory?.documentsCount || 0} documents analyzed`,
      });

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

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepProgress = () => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    return (completedSteps / Math.max(steps.length, 1)) * 100;
  };

  const renderKeywordVisualization = (viz: Visualization) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Key className="h-4 w-4" />
          {viz.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-2">Primary Keywords:</p>
          <div className="flex flex-wrap gap-1">
            {viz.data.primary?.map((keyword: string, idx: number) => (
              <Badge key={idx} variant="default" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Secondary Keywords:</p>
          <div className="flex flex-wrap gap-1">
            {viz.data.secondary?.map((keyword: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
        {viz.data.generated?.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">AI Generated:</p>
            <div className="flex flex-wrap gap-1">
              {viz.data.generated?.map((keyword: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDocumentVisualization = (viz: Visualization) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          {viz.title} ({viz.data.totalFound} found)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {viz.data.documents?.map((doc: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium line-clamp-1">{doc.title}</h4>
                  <Badge variant="outline" className="text-xs ml-2">
                    {doc.relevanceScore}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{doc.source}</p>
                <p className="text-xs text-muted-foreground">{doc.excerpt}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {doc.category}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const renderQualityVisualization = (viz: Visualization) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4" />
          {viz.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Overall Score</p>
            <div className="flex items-center gap-2">
              <Progress value={viz.data.score} className="flex-1" />
              <span className="text-sm">{viz.data.score}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Coverage</p>
            <div className="flex items-center gap-2">
              <Progress value={viz.data.coverage} className="flex-1" />
              <span className="text-sm">{viz.data.coverage}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Relevance</p>
            <div className="flex items-center gap-2">
              <Progress value={viz.data.relevance} className="flex-1" />
              <span className="text-sm">{viz.data.relevance}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Completeness</p>
            <div className="flex items-center gap-2">
              <Progress value={viz.data.completeness} className="flex-1" />
              <span className="text-sm">{viz.data.completeness}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge 
            variant={viz.data.recommendation === 'proceed' ? 'default' : 'secondary'}
          >
            {viz.data.recommendation.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Attempts: {viz.data.attempts}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const renderVisualization = (viz: Visualization) => {
    switch (viz.type) {
      case 'keywords':
        return renderKeywordVisualization(viz);
      case 'documents':
        return renderDocumentVisualization(viz);
      case 'quality':
        return renderQualityVisualization(viz);
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            CUBOT Enhanced Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Input Section */}
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

          {/* Progress and Memory Status */}
          {(memory || isProcessing) && (
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {memory?.keywordsCount || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Keywords</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {memory?.documentsCount || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {memory?.qualityScore || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Quality</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {memory?.attempts || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Attempts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            {/* Workflow Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Analysis Workflow</h3>
              
              {steps.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">Progress</span>
                    <Progress value={getStepProgress()} className="flex-1" />
                    <span className="text-sm">{Math.round(getStepProgress())}%</span>
                  </div>
                </div>
              )}

              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {steps.map((step) => (
                    <Card key={step.step} className="p-3">
                      <div className="flex items-start gap-3">
                        {getStepIcon(step.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium">{step.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.message}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Visualizations */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Research Insights</h3>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {visualizations.map((viz, idx) => (
                    <div key={idx}>
                      {renderVisualization(viz)}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Final Answer */}
          {finalAnswer && (
            <div className="space-y-2">
              <Separator />
              <h3 className="font-semibold text-sm">Comprehensive Answer</h3>
              <ScrollArea className="h-48 border rounded-lg p-4">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">
                    {finalAnswer}
                  </pre>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}