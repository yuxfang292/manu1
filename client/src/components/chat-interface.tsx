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
    <div className="bg-primary-white rounded-lg shadow-sm border border-secondary-grey p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary-black mb-2">
          Welcome to Regulatory Compliance Explorer
        </h2>
        <p className="text-primary-black opacity-70">
          Enter your compliance query or select from common questions below
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Ask about regulations, compliance requirements, or specific obligations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 border border-primary-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent pr-12"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-blue hover:bg-primary-blue/90 text-primary-white"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </form>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {preConfiguredQuestions.map((question) => {
          const IconComponent = question.icon;
          return (
            <Button
              key={question.category}
              variant="outline"
              className="p-3 bg-supporting-blue text-primary-black rounded-lg hover:bg-accent-blue transition-colors text-left h-auto flex flex-col items-start space-y-1"
              onClick={() => onPreConfiguredQuery(question.category)}
            >
              <div className="flex items-center space-x-2">
                <IconComponent className="w-4 h-4 text-primary-blue" />
                <span className="font-bold">{question.title}</span>
              </div>
              <p className="text-sm opacity-70">{question.description}</p>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
