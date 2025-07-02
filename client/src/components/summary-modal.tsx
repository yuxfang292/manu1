import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, Download, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generatePDF } from "@/lib/pdf-generator";
import type { Extract } from "@shared/schema";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCards: number[];
}

export default function SummaryModal({ isOpen, onClose, selectedCards }: SummaryModalProps) {
  const [overview, setOverview] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [reportId] = useState(`RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);

  const { data: extracts } = useQuery({
    queryKey: ['/api/extracts'],
    enabled: isOpen && selectedCards.length > 0,
  });

  const selectedExtracts = extracts?.filter((extract: Extract) => 
    selectedCards.includes(extract.id)
  ) || [];

  useEffect(() => {
    if (selectedExtracts.length > 0) {
      generateSummary();
    }
  }, [selectedExtracts]);

  const generateSummary = () => {
    // Generate AI-like summary based on selected extracts
    const categories = [...new Set(selectedExtracts.map((e: Extract) => e.category))];
    const jurisdictions = [...new Set(selectedExtracts.map((e: Extract) => e.jurisdiction))];
    
    setOverview(
      `Banking organizations must maintain comprehensive capital requirements under ${categories.includes('Capital Adequacy') ? 'Basel III framework' : 'regulatory frameworks'}, including minimum capital ratios and additional buffers. These regulations ensure financial stability through adequate loss-absorbing capacity during economic stress periods.`
    );

    const points = [];
    selectedExtracts.forEach((extract: Extract) => {
      if (extract.title.includes("Minimum Capital")) {
        points.push("• Minimum common equity tier 1 capital ratio of 4.5% required under Basel III");
      }
      if (extract.title.includes("Conservation Buffer")) {
        points.push("• Capital conservation buffer of 2.5% must be maintained above minimum ratios");
        points.push("• Failure to maintain buffers results in automatic constraints on capital distributions");
      }
      if (extract.title.includes("Countercyclical")) {
        points.push("• Countercyclical capital buffer currently set at 0% for US exposures through 2024");
      }
      if (extract.title.includes("Leverage")) {
        points.push("• Advanced approaches banks subject to additional supplementary leverage ratio requirements");
      }
      if (extract.title.includes("Stress")) {
        points.push("• Stress testing requirements apply to institutions with $100+ billion in assets");
      }
      if (extract.title.includes("TLAC")) {
        points.push("• Total loss-absorbing capacity (TLAC) requirements for global systemically important banks");
      }
    });

    setKeyPoints(points.join('\n'));
    setConclusion(
      "These capital requirements form the foundation of prudential regulation, requiring ongoing monitoring and compliance to ensure banking system resilience and regulatory adherence."
    );
  };

  const handleExportPDF = () => {
    const summaryData = {
      reportId,
      createdDate: new Date().toLocaleDateString(),
      selectedExtracts,
      overview,
      keyPoints: keyPoints.split('\n').filter(point => point.trim()),
      conclusion
    };

    generatePDF(summaryData);
  };

  const handlePreviewPDF = () => {
    // This would open a preview of the PDF
    console.log('Preview PDF functionality would be implemented here');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-primary-black">
                Summary Report Preview
              </DialogTitle>
              <p className="text-sm text-primary-black opacity-70 mt-1">
                Review and edit your summary before exporting
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-primary-black mb-3">
              Selected Extracts ({selectedExtracts.length})
            </h3>
            <div className="space-y-3">
              {selectedExtracts.map((extract: Extract) => (
                <div
                  key={extract.id}
                  className="p-3 bg-supporting-blue rounded border-l-4 border-primary-blue"
                >
                  <h4 className="font-bold text-sm text-primary-black">{extract.title}</h4>
                  <p className="text-xs text-primary-black opacity-70">{extract.source}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-primary-black mb-3">Generated Summary</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-bold text-primary-black mb-2">
                  Overview
                </Label>
                <Textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  className="w-full resize-none border-primary-grey focus:ring-primary-blue focus:border-primary-blue"
                  rows={3}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-bold text-primary-black mb-2">
                  Key Points
                </Label>
                <Textarea
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  className="w-full resize-none border-primary-grey focus:ring-primary-blue focus:border-primary-blue"
                  rows={8}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-bold text-primary-black mb-2">
                  Conclusion
                </Label>
                <Textarea
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className="w-full resize-none border-primary-grey focus:ring-primary-blue focus:border-primary-blue"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between border-t border-secondary-grey pt-4">
          <div className="text-sm text-primary-black opacity-70">
            Generated on: {new Date().toLocaleDateString()} | Report ID: {reportId}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handlePreviewPDF}
              className="border-primary-grey text-primary-black hover:bg-supporting-blue"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview PDF
            </Button>
            <Button
              onClick={handleExportPDF}
              className="bg-primary-blue text-primary-white hover:bg-primary-blue/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
