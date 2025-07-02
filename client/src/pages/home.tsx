import { useState } from "react";
import CubeLogo from "@/components/cube-logo";
import ChatInterface from "@/components/chat-interface";
import FilterSidebar from "@/components/filter-sidebar";
import DataCards from "@/components/data-cards";
import SummaryModal from "@/components/summary-modal";
import { Button } from "@/components/ui/button";
import { Download, User } from "lucide-react";

export default function Home() {
  const [currentView, setCurrentView] = useState<'chat' | 'data'>('chat');
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<{
    categories: string[];
    jurisdictions: string[];
    priorities: string[];
    keywords: string[];
    startDate: string;
    endDate: string;
  }>({
    categories: [],
    jurisdictions: [],
    priorities: [],
    keywords: [],
    startDate: '',
    endDate: ''
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('data');
  };

  const handlePreConfiguredQuery = (category: string) => {
    setSearchQuery(category);
    setCurrentView('data');
  };

  const handleCardSelection = (cardId: number, selected: boolean) => {
    if (selected) {
      setSelectedCards(prev => [...prev, cardId]);
    } else {
      setSelectedCards(prev => prev.filter(id => id !== cardId));
    }
  };

  const handleGenerateSummary = () => {
    if (selectedCards.length > 0) {
      setShowSummaryModal(true);
    }
  };

  const handleExportReport = () => {
    // This would trigger PDF export
    console.log('Exporting report...');
  };

  return (
    <div className="min-h-screen bg-background-grey">
      {/* Header */}
      <header className="bg-primary-white shadow-md border-b border-secondary-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <CubeLogo />
              <h1 className="text-xl font-bold text-primary-black">
                Regulatory Compliance Explorer
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleExportReport}
                className="bg-primary-blue hover:bg-primary-blue/90 text-primary-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <div className="w-8 h-8 bg-primary-grey rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-black" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'chat' ? (
          <div className="lg:col-span-4">
            <ChatInterface 
              onSearch={handleSearch}
              onPreConfiguredQuery={handlePreConfiguredQuery}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <FilterSidebar 
                filters={filters}
                onFiltersChange={setFilters}
                onClose={() => setCurrentView('chat')}
                searchQuery={searchQuery}
              />
            </div>
            <div className="lg:col-span-3">
              <DataCards
                searchQuery={searchQuery}
                filters={filters}
                selectedCards={selectedCards}
                onCardSelection={handleCardSelection}
                onGenerateSummary={handleGenerateSummary}
              />
            </div>
          </div>
        )}
      </div>

      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        selectedCards={selectedCards}
      />
    </div>
  );
}
