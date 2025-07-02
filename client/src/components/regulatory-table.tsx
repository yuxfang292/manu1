import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  Star,
  Eye
} from "lucide-react";
import { useExtracts } from "@/hooks/use-extracts";
import type { Extract } from "@shared/schema";

interface RegulatoryTableProps {
  searchQuery?: string;
  filters?: any;
  selectedCards: number[];
  onCardSelection: (cardId: number, selected: boolean) => void;
}

export default function RegulatoryTable({ 
  searchQuery, 
  filters, 
  selectedCards, 
  onCardSelection 
}: RegulatoryTableProps) {
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

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
    <div className="bg-white">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--table-border)]">
          <thead className="bg-[var(--table-header)]">
            <tr>
              <th className="px-4 py-3 w-8">
                <Checkbox />
              </th>
              <th className="px-4 py-3 w-8">
                <Star className="w-4 h-4 text-gray-400" />
              </th>
              <SortHeader field="title">Title</SortHeader>
              <SortHeader field="category">Category</SortHeader>
              <SortHeader field="source">Source</SortHeader>
              <SortHeader field="jurisdiction">Jurisdiction</SortHeader>
              <SortHeader field="priority">Priority</SortHeader>
              <SortHeader field="lastUpdated">Last Updated</SortHeader>
              <SortHeader field="effectiveDate">Effective Date</SortHeader>
              <SortHeader field="relevanceScore">Relevance</SortHeader>
              <th className="px-4 py-3 w-8">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[var(--table-border)]">
            {extracts?.map((extract: Extract, index: number) => (
              <tr 
                key={extract.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onCardSelection(extract.id, !selectedCards.includes(extract.id))}
              >
                <td className="px-4 py-4">
                  <Checkbox 
                    checked={selectedCards.includes(extract.id)}
                    onCheckedChange={(checked) => onCardSelection(extract.id, checked as boolean)}
                  />
                </td>
                <td className="px-4 py-4">
                  <Star className="w-4 h-4 text-gray-400 hover:text-yellow-400 cursor-pointer" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-blue-800">
                        {extract.category.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {extract.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {extract.excerpt.substring(0, 60)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="secondary" className="text-xs">
                    {extract.category}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {extract.source}
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline" className="text-xs">
                    {extract.jurisdiction}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <Badge className={getPriorityBadge(extract.priority)}>
                    {extract.priority}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {new Date(extract.lastUpdated).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {extract.effectiveDate ? new Date(extract.effectiveDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${extract.relevanceScore * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {Math.round(extract.relevanceScore * 100)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
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
    </div>
  );
}