import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { List, LayoutGrid, FileText } from "lucide-react";
import { useExtracts } from "@/hooks/use-extracts";
import type { Extract } from "@shared/schema";

interface DataCardsProps {
  searchQuery: string;
  filters: {
    categories: string[];
    jurisdictions: string[];
    priorities: string[];
    keywords: string[];
    startDate: string;
    endDate: string;
  };
  selectedCards: number[];
  onCardSelection: (cardId: number, selected: boolean) => void;
  onGenerateSummary: () => void;
}

export default function DataCards({ 
  searchQuery, 
  filters, 
  selectedCards, 
  onCardSelection, 
  onGenerateSummary 
}: DataCardsProps) {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: extracts, isLoading, error } = useExtracts(searchQuery, filters);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High Priority':
        return 'bg-supporting-blue text-primary-black';
      case 'Medium':
        return 'bg-accent-blue text-primary-black';
      case 'Low':
        return 'bg-primary-grey text-primary-black';
      default:
        return 'bg-secondary-grey text-primary-black';
    }
  };

  const paginatedExtracts = extracts?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  const totalPages = Math.ceil((extracts?.length || 0) / itemsPerPage);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-primary-white rounded-lg shadow-sm border border-secondary-grey p-4 animate-pulse">
            <div className="h-4 bg-secondary-grey rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-secondary-grey rounded w-1/2 mb-3"></div>
            <div className="h-3 bg-secondary-grey rounded w-full mb-2"></div>
            <div className="h-3 bg-secondary-grey rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary-white rounded-lg shadow-sm border border-secondary-grey p-6 text-center">
        <p className="text-red-500">Error loading extracts: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-black">
            {searchQuery} Results
          </h2>
          <p className="text-sm text-primary-black opacity-70">
            {extracts?.length || 0} regulatory extracts found
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-primary-blue text-primary-white' : 'bg-supporting-blue text-primary-black'}
          >
            <List className="w-4 h-4 mr-1" />
            List View
          </Button>
          <Button
            variant={viewMode === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('card')}
            className={viewMode === 'card' ? 'bg-primary-blue text-primary-white' : 'bg-supporting-blue text-primary-black'}
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            Card View
          </Button>
          <span className="text-primary-black opacity-50">|</span>
          <Button
            size="sm"
            onClick={onGenerateSummary}
            disabled={selectedCards.length === 0}
            className="bg-accent-blue text-primary-black hover:bg-accent-blue/80"
          >
            <FileText className="w-4 h-4 mr-1" />
            Generate Summary ({selectedCards.length} selected)
          </Button>
        </div>
      </div>
      
      <div className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
        {paginatedExtracts.map((extract: Extract) => (
          <div
            key={extract.id}
            className={`bg-primary-white rounded-lg shadow-sm border border-secondary-grey p-4 card-hover cursor-pointer ${
              selectedCards.includes(extract.id) ? 'selected-card' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <Checkbox
                  checked={selectedCards.includes(extract.id)}
                  onCheckedChange={(checked) => onCardSelection(extract.id, checked as boolean)}
                  className="mr-3"
                />
                <div>
                  <h3 className="font-bold text-primary-black text-sm">{extract.title}</h3>
                  <p className="text-xs text-primary-black opacity-70">{extract.source}</p>
                </div>
              </div>
              <Badge className={getPriorityColor(extract.priority)}>
                {extract.priority}
              </Badge>
            </div>
            
            <p className="text-sm text-primary-black mb-3 line-clamp-3">
              {extract.excerpt}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="bg-background-grey text-primary-black">
                {extract.category}
              </Badge>
              <Badge variant="secondary" className="bg-background-grey text-primary-black">
                {extract.jurisdiction}
              </Badge>
              {extract.effectiveDate && (
                <Badge variant="secondary" className="bg-background-grey text-primary-black">
                  Effective: {extract.effectiveDate}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-primary-black opacity-70">
              <span>Last updated: {extract.lastUpdated}</span>
              <span>Relevance: {extract.relevanceScore}%</span>
            </div>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-primary-black opacity-70">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, extracts?.length || 0)} of {extracts?.length || 0} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="text-primary-black border-primary-grey hover:bg-supporting-blue"
            >
              Previous
            </Button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={
                    currentPage === page
                      ? 'bg-primary-blue text-primary-white'
                      : 'text-primary-black border-primary-grey hover:bg-supporting-blue'
                  }
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="text-primary-black border-primary-grey hover:bg-supporting-blue"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
