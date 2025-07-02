import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, Eye, Scale, Lock, Flag, TrendingUp } from "lucide-react";

interface ChatInterfaceProps {
  onSearch: (query: string) => void;
  onPreConfiguredQuery: (category: string) => void;
}

export default function ChatInterface({ onSearch, onPreConfiguredQuery }: ChatInterfaceProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const preConfiguredQuestions = [
    {
      icon: Shield,
      title: "Capital Requirements",
      description: "Basel III compliance and capital adequacy",
      category: "Capital Requirements"
    },
    {
      icon: Eye,
      title: "Risk Management",
      description: "Operational and credit risk frameworks",
      category: "Risk Management"
    },
    {
      icon: Scale,
      title: "Consumer Protection",
      description: "Fair lending and consumer rights",
      category: "Consumer Protection"
    },
    {
      icon: Lock,
      title: "Data Privacy",
      description: "GDPR and data protection requirements",
      category: "Data Privacy"
    },
    {
      icon: Flag,
      title: "AML Compliance",
      description: "Anti-money laundering obligations",
      category: "AML Compliance"
    },
    {
      icon: TrendingUp,
      title: "Stress Testing",
      description: "Regulatory stress test requirements",
      category: "Stress Testing"
    }
  ];

  return (
    <div className="welcome-container bg-white rounded-lg border border-gray-200 p-8 relative overflow-hidden h-full">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-50/50 to-indigo-50/30 rounded-full translate-y-24 -translate-x-24"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-8">
          <h2 className="welcome-title text-3xl font-bold mb-3">
            Welcome to Regulatory Compliance Explorer
          </h2>
          <p className="welcome-subtitle text-primary-black opacity-80 text-lg max-w-2xl mx-auto">
            Discover and explore banking regulations with our intelligent search system
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
            <div className="w-2 h-2 bg-supporting-blue rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="search-container mb-8">
          <div className="relative bg-white rounded-xl shadow-lg">
            <Input
              type="text"
              placeholder="Ask about regulations, compliance requirements, or specific obligations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-6 py-4 text-lg border-2 border-primary-grey/30 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-blue/20 focus:border-primary-blue pr-16 bg-white/50 backdrop-blur-sm"
            />
            <Button
              type="submit"
              size="lg"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary-blue to-accent-blue hover:from-primary-blue/90 hover:to-accent-blue/90 text-primary-white rounded-lg pulse-glow"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </form>
        
        <div className="category-grid">
          <h3 className="text-xl font-bold text-primary-black mb-4 text-center">
            Popular Compliance Areas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preConfiguredQuestions.map((question, index) => {
              const IconComponent = question.icon;
              return (
                <Button
                  key={question.category}
                  variant="outline"
                  className="category-button p-4 bg-gradient-to-br from-supporting-blue to-accent-blue/50 text-primary-black rounded-xl hover:from-accent-blue hover:to-supporting-blue text-left h-auto flex flex-col items-start space-y-2 border-2 border-primary-grey/20"
                  onClick={() => onPreConfiguredQuery(question.category)}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 bg-primary-blue/10 rounded-lg">
                      <IconComponent className="w-5 h-5 text-primary-blue icon-bounce" />
                    </div>
                    <span className="font-bold text-lg">{question.title}</span>
                  </div>
                  <p className="text-sm opacity-80 leading-relaxed">{question.description}</p>
                </Button>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-primary-black opacity-60">
            AI-powered regulatory intelligence • Real-time compliance data • Professional reports
          </p>
        </div>
      </div>
    </div>
  );
}
