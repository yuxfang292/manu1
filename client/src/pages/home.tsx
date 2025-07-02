import { useState } from "react";
import Sidebar from "@/components/sidebar";
import MainHeader from "@/components/main-header";
import RegulatoryTable from "@/components/regulatory-table";
import ChatInterface from "@/components/chat-interface";
import SearchInterface from "@/components/search-interface";
import SummaryModal from "@/components/summary-modal";

export default function Home() {
  const [currentView, setCurrentView] = useState<string>('search');
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

  const renderMainContent = () => {
    switch (currentView) {
      case 'search':
        return (
          <div className="flex-1 flex flex-col">
            <MainHeader
              title="Regulatory Groups"
              searchPlaceholder="Search RegGroup"
              onSearch={handleSearch}
              showCreateButton={true}
            />
            <div className="flex-1">
              {searchQuery ? (
                <div className="p-6">
                  <RegulatoryTable
                    searchQuery={searchQuery}
                    filters={filters}
                    selectedCards={selectedCards}
                    onCardSelection={handleCardSelection}
                  />
                </div>
              ) : (
                <SearchInterface
                  onSearch={handleSearch}
                  onExploreCategory={handleSearch}
                />
              )}
            </div>
          </div>
        );
      case 'explorer':
        return (
          <div className="flex-1 flex flex-col">
            <MainHeader
              title="Compliance Explorer"
              subtitle="Interactive regulatory guidance and exploration"
              searchPlaceholder="Ask about regulations..."
              onSearch={handleSearch}
              showCreateButton={false}
            />
            <div className="flex-1 p-6">
              <ChatInterface 
                onSearch={handleSearch}
                onPreConfiguredQuery={handleSearch}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)} Module
              </h3>
              <p className="text-gray-600">
                This module is under development.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-[var(--main-bg)]">
      {/* Sidebar */}
      <Sidebar 
        activeView={currentView}
        onViewChange={setCurrentView}
      />
      
      {/* Main Content */}
      {renderMainContent()}

      {/* Summary Modal */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        selectedCards={selectedCards}
      />
    </div>
  );
}
