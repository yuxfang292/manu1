import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Loader2, Settings } from 'lucide-react';
import { useExtracts } from '@/hooks/use-extracts';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FinalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCards: number[];
  keywords?: string[];
  searchQuery?: string;
  mcpDocuments?: any[];
}

interface ReportStyle {
  value: string;
  label: string;
  description: string;
}

const reportStyles: ReportStyle[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Formal business report with executive summary'
  },
  {
    value: 'regulatory',
    label: 'Regulatory Compliance',
    description: 'Compliance-focused with regulatory citations'
  },
  {
    value: 'technical',
    label: 'Technical Analysis',
    description: 'Detailed technical analysis with data points'
  },
  {
    value: 'executive',
    label: 'Executive Summary',
    description: 'High-level overview for senior management'
  },
  {
    value: 'comprehensive',
    label: 'Comprehensive Research',
    description: 'In-depth analysis with multiple perspectives'
  }
];

export default function FinalReportModal({ 
  isOpen, 
  onClose, 
  selectedCards, 
  keywords = [],
  searchQuery = '',
  mcpDocuments = []
}: FinalReportModalProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>(selectedCards);
  const [reportStyle, setReportStyle] = useState<string>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const { data: extracts } = useExtracts();
  const { toast } = useToast();
  
  // Initialize selections when modal opens - SELECT ALL BY DEFAULT
  useEffect(() => {
    if (isOpen) {
      setSelectedDocuments(selectedCards);
      setSelectedKeywords(keywords); // Select ALL keywords by default
    }
  }, [isOpen, selectedCards, keywords]);

  const selectedExtracts = extracts?.filter((extract: any) => 
    selectedDocuments.includes(extract.id)
  ) || [];

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleDocumentToggle = (documentId: number) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleGenerateReport = async () => {
    // Create default documents if none found
    const documentsToUse = mcpDocuments.length > 0 ? mcpDocuments : [
      {
        title: "Research Analysis",
        content: `Based on the search query: ${searchQuery}`,
        summary: "Regulatory compliance analysis based on research findings",
        category: "Research",
        source: "CUBOT Analysis"
      }
    ];

    setIsGenerating(true);
    try {
      console.log('Generating report with:', {
        mcpDocuments: mcpDocuments.length,
        keywords: selectedKeywords.length,
        style: reportStyle,
        searchQuery
      });

      const response = await apiRequest('/api/reports/generate', 'POST', {
        mcpDocuments: documentsToUse, // Send documents (MCP or default)
        keywords: selectedKeywords,
        style: reportStyle,
        searchQuery
      });

      console.log('Report generation response:', response);
      
      const reportId = response.reportId;
      
      toast({
        title: "Report Generated",
        description: "Your final report has been generated successfully!"
      });

      // Auto-download the PDF
      handleDownloadPDF(reportId);
      
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: `Failed to generate report: ${error.message || error}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (reportId?: string) => {
    if (!reportId && selectedDocuments.length === 0) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch('/api/reports/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportId: reportId || 'latest',
          documentIds: selectedDocuments,
          keywords: selectedKeywords,
          style: reportStyle
        })
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `regulatory-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: "Your report has been downloaded successfully!"
      });

      onClose();
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Final Report
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            
            {/* Report Style Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <h3 className="font-semibold">Report Style</h3>
              </div>
              <Select value={reportStyle} onValueChange={setReportStyle}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select report style" />
                </SelectTrigger>
                <SelectContent>
                  {reportStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div>
                        <div className="font-medium">{style.label}</div>
                        <div className="text-sm text-gray-500">{style.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Keywords Selection */}
            {keywords.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Keywords to Include</h3>
                <p className="text-sm text-gray-600">
                  Select keywords to focus the report analysis (optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {keywords.slice(0, 15).map((keyword) => (
                    <Badge
                      key={keyword}
                      variant={selectedKeywords.includes(keyword) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        selectedKeywords.includes(keyword)
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleKeywordToggle(keyword)}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {selectedKeywords.length} of {keywords.length} keywords selected
                </p>
              </div>
            )}

            <Separator />

            {/* Documents Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold">Documents to Include</h3>
              <p className="text-sm text-gray-600">
                Select specific documents for the report ({mcpDocuments.length} found by research)
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mcpDocuments.map((doc: any, index: number) => (
                  <Card key={`mcp-doc-${index}`} className="p-0">
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={true} // All documents selected by default
                          onCheckedChange={() => {}} // Documents are always selected
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {doc.title || `Document ${index + 1}`}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                            {doc.excerpt || doc.summary || doc.content || 'Regulatory compliance document'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {doc.category || 'Regulatory'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {doc.source || 'Research'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {mcpDocuments.length} documents, {selectedKeywords.length} keywords selected
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating || isDownloading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || isDownloading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : isDownloading ? (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate & Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}