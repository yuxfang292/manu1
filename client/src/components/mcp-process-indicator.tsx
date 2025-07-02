import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { MCPProcess } from "@/hooks/use-mcp";

interface MCPProcessIndicatorProps {
  process: MCPProcess | null;
  isVisible: boolean;
}

export default function MCPProcessIndicator({ process, isVisible }: MCPProcessIndicatorProps) {
  if (!isVisible || !process) return null;

  const getStatusIcon = () => {
    if (process.step === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (process.completed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  };

  const getStatusColor = () => {
    if (process.step === 'error') return 'destructive';
    if (process.completed) return 'default';
    return 'secondary';
  };

  return (
    <Card className="w-full mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          MCP Processing
          <Badge variant={getStatusColor()} className="ml-auto">
            {process.step === 'error' ? 'Error' : process.completed ? 'Complete' : 'Processing'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{process.message}</span>
            <span className="text-gray-500 font-mono">{Math.round(process.progress)}%</span>
          </div>
          
          <Progress 
            value={process.progress} 
            className="h-2"
          />
          
          {process.completed && (
            <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
              <CheckCircle className="h-3 w-3" />
              Ready to view results
            </div>
          )}
          
          {process.step === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
              <AlertCircle className="h-3 w-3" />
              Please try again or contact support
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}