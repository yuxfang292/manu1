import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  Star,
  Eye,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useExtracts } from "@/hooks/use-extracts";
import type { Extract } from "@shared/schema";
import cubotIcon from "@assets/CUBOT-Ready_1751471469146.png";
import EnhancedAIChatModal from "@/components/enhanced-ai-chat-modal";

interface RegulatoryTableProps {
  searchQuery?: string;
  filters?: any;
  selectedCards: number[];
  onCardSelection: (cardId: number, selected: boolean) => void;
  onContinueChat?: () => void;
}

export default function RegulatoryTable({ 
  searchQuery, 
  filters, 
  selectedCards, 
  onCardSelection,
  onContinueChat 
}: RegulatoryTableProps) {
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEnhancedChatOpen, setIsEnhancedChatOpen] = useState(false);

  const { data: extracts, isLoading } = useExtracts(searchQuery, filters);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="w-3 h-3" /> : 
            <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'High Priority': 'bg-red-100 text-red-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 mb-2"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 mb-1"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header section matching the screenshot */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Regulatory Groups</h1>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setIsEnhancedChatOpen(true)}
              size="sm"
              className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-2"
            >
              <img 
                src={cubotIcon} 
                alt="CUBOT AI Assistant" 
                className="w-5 h-5 mr-2 object-contain" 
              />
              Ask CUBOT
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Select View
            </Button>
          </div>
        </div>
        
        {/* Search and filter bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search RegGroup"
                className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm"
                defaultValue={searchQuery}
              />
            </div>
            <span className="text-sm text-gray-600">{extracts?.length || 0} Results</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Prepublish
            </Button>
            <Button variant="outline" size="sm">
              To RegGroup
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
              Create RegGroup
            </Button>
            <Button variant="outline" size="sm">
              Create Workflow
            </Button>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 w-8">
                <Checkbox />
              </th>
              <th className="px-4 py-3 w-8">
                Status
              </th>
              <SortHeader field="title">Name</SortHeader>
              <SortHeader field="version">Version</SortHeader>
              <SortHeader field="createdBy">Created By</SortHeader>
              <SortHeader field="createdDate">Created Date</SortHeader>
              <SortHeader field="updatedBy">Updated By</SortHeader>
              <SortHeader field="updatedDate">Updated Date</SortHeader>
              <SortHeader field="regBooks">RegBooks</SortHeader>
              <SortHeader field="sections">Sections</SortHeader>
              <SortHeader field="extracts">Extracts</SortHeader>
              <SortHeader field="narratives">Narratives</SortHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {extracts?.map((extract: Extract, index: number) => (
              <tr 
                key={extract.id} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Checkbox 
                    checked={selectedCards.includes(extract.id)}
                    onCheckedChange={(checked) => onCardSelection(extract.id, checked as boolean)}
                  />
                </td>
                <td className="px-4 py-3">
                  {extract.priority === "High Priority" ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : extract.priority === "Medium" ? (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                    {extract.title}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  1
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {extract.createdBy || 'Unknown'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {extract.createdDate ? new Date(extract.createdDate).toLocaleDateString() : new Date(extract.lastUpdated).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {extract.updatedBy || 'Unknown'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {extract.updatedDate ? new Date(extract.updatedDate).toLocaleDateString() : new Date(extract.lastUpdated).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-900">
                  {Math.floor(Math.random() * 10) + 1}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-900">
                  {Math.floor(Math.random() * 5) + 1}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-900">
                  {Math.floor(Math.random() * 15) + 1}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-900">
                  0
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-[var(--table-border)]">
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-blue-600 text-white" : ""}
            >
              {page}
            </Button>
          ))}
        </div>
      </div>

      {/* Enhanced AI Chat Modal */}
      <EnhancedAIChatModal
        isOpen={isEnhancedChatOpen}
        onClose={() => setIsEnhancedChatOpen(false)}
      />
    </div>
  );
}