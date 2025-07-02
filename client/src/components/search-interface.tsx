import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus,
  Sparkles,
  FileText,
  Scale,
  Shield,
  TrendingUp,
  Eye,
  Lock
} from "lucide-react";
import AIChatModal from "./ai-chat-modal";

interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  onExploreCategory: (category: string) => void;
}

export default function SearchInterface({ onSearch, onExploreCategory }: SearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const complianceAreas = [
    {
      icon: Shield,
      title: "Capital Requirements",
      description: "Basel III compliance and capital adequacy ratios",
      count: "24 groups",
      color: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      icon: Eye,
      title: "Risk Management", 
      description: "Operational and credit risk frameworks",
      count: "18 groups",
      color: "bg-green-50 text-green-700 border-green-200"
    },
    {
      icon: Scale,
      title: "Consumer Protection",
      description: "Fair lending and consumer rights",
      count: "12 groups", 
      color: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      icon: Lock,
      title: "Data Privacy",
      description: "GDPR and data protection requirements",
      count: "8 groups",
      color: "bg-orange-50 text-orange-700 border-orange-200"
    },
    {
      icon: TrendingUp,
      title: "Stress Testing",
      description: "Regulatory stress test requirements",
      count: "15 groups",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    {
      icon: FileText,
      title: "AML Compliance",
      description: "Anti-money laundering obligations",
      count: "22 groups",
      color: "bg-red-50 text-red-700 border-red-200"
    }
  ];

  const quickFilters = [
    "Recent Changes", "High Priority", "Implementation Due", 
    "Basel III", "GDPR", "Stress Tests"
  ];

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Regulatory Compliance Search
            </h1>
            <p className="text-gray-600">
              Find and explore regulatory groups, requirements, and compliance frameworks
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create RegGroup
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for regulatory groups, requirements, or compliance topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-24 py-4 text-lg border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                className="text-gray-600"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
              </Button>
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Search className="w-4 h-4 mr-1" />
                Search
              </Button>
            </div>
          </div>
        </form>

        {/* Quick Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">Quick filters:</span>
          {quickFilters.map((filter) => (
            <Badge
              key={filter}
              variant={selectedFilters.includes(filter) ? "default" : "secondary"}
              className={`cursor-pointer transition-colors ${
                selectedFilters.includes(filter) 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => toggleFilter(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>
      </div>

      {/* AI Assistant */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-2">AI Compliance Assistant</h3>
            <p className="text-gray-600 mb-3">
              Get intelligent insights and recommendations for your regulatory compliance needs. 
              Ask about specific requirements, deadlines, or compliance strategies.
            </p>
            <Button 
              variant="outline" 
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() => setIsChatModalOpen(true)}
            >
              Ask AI Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Compliance Areas */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Explore Compliance Areas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complianceAreas.map((area) => {
            const IconComponent = area.icon;
            return (
              <div
                key={area.title}
                onClick={() => onExploreCategory(area.title)}
                className={`cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${area.color}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-2">{area.title}</h3>
                    <p className="text-sm opacity-80 mb-3 leading-relaxed">
                      {area.description}
                    </p>
                    <Badge variant="secondary" className="bg-white/50">
                      {area.count}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div>
                <h4 className="font-medium text-gray-900">Basel III Capital Requirements Updated</h4>
                <p className="text-sm text-gray-600">New minimum capital ratios effective Q1 2024</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Updated</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div>
                <h4 className="font-medium text-gray-900">GDPR Compliance Review</h4>
                <p className="text-sm text-gray-600">Annual review scheduled for next month</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div>
                <h4 className="font-medium text-gray-900">Stress Testing Framework</h4>
                <p className="text-sm text-gray-600">2024 scenarios published by regulators</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">New</Badge>
            </div>
          </div>
        </div>
      </div>

      <AIChatModal 
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />
    </div>
  );
}