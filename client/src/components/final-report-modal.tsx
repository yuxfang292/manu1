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

      const response = await apiRequest('POST', '/api/reports/generate', {
        mcpDocuments: documentsToUse, // Send documents (MCP or default)
        keywords: selectedKeywords,
        style: reportStyle,
        searchQuery
      });

      const responseData = await response.json();
      console.log('Report generation response:', responseData);
      
      const reportId = responseData.reportId;
      
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
            


            {/* Modern Bubble Keywords Selection */}
            {keywords.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Research Keywords</h3>
                  <p className="text-sm text-gray-500">
                    Select keywords to focus your report analysis
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {keywords.slice(0, 15).map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => handleKeywordToggle(keyword)}
                      className={`
                        px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 
                        shadow-sm hover:shadow-md transform hover:scale-105 border
                        ${selectedKeywords.includes(keyword)
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 shadow-blue-200'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                        }
                      `}
                    >
                      <span className="flex items-center gap-2">
                        {keyword}
                        {selectedKeywords.includes(keyword) && (
                          <span className="text-blue-100 text-xs">✓</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {selectedKeywords.length} of {keywords.length} keywords selected
                </div>
              </div>
            )}

            <Separator />

            {/* Research Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-800">Research Foundation</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Your report will be generated using CUBOT's research findings for: <span className="font-medium text-blue-700">"{searchQuery}"</span>
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Analysis includes regulatory documents, compliance guidelines, and best practices</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {mcpDocuments.length || 'AI'} Sources
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Ready to generate report with {selectedKeywords.length} selected keywords
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