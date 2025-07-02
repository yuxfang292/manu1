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
    <div className="min-h-screen bg-gradient-to-br from-background-grey to-supporting-blue/30">
      {/* Enhanced Header */}
      <header className="bg-primary-white/90 backdrop-blur-md shadow-xl border-b-2 border-primary-blue/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-blue/5 to-accent-blue/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <CubeLogo />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-blue to-accent-blue bg-clip-text text-transparent">
                  Regulatory Compliance Explorer
                </h1>
                <p className="text-sm text-primary-black opacity-60">
                  Banking Intelligence Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleExportReport}
                className="bg-gradient-to-r from-primary-blue to-accent-blue hover:from-primary-blue/90 hover:to-accent-blue/90 text-primary-white shadow-lg hover:shadow-xl transition-all duration-300 pulse-glow"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-accent-blue rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <User className="w-5 h-5 text-primary-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'chat' ? (
          <div className="flex justify-center">
            <div className="w-full max-w-6xl">
              <ChatInterface 
                onSearch={handleSearch}
                onPreConfiguredQuery={handlePreConfiguredQuery}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
