import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Filter,
  Download,
  Eye,
  Settings
} from "lucide-react";

interface MainHeaderProps {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export default function MainHeader({ 
  title, 
  subtitle, 
  searchPlaceholder = "Search...",
  onSearch,
  showCreateButton = true,
  onCreateClick
}: MainHeaderProps) {
  return (
    <div className="bg-[var(--header-bg)] border-b border-[var(--table-border)] px-6 py-4">
      {/* Title Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            {title}
            <Button variant="ghost" size="sm" className="ml-2 text-blue-600">
              <Eye className="w-4 h-4 mr-1" />
              Select View
            </Button>
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-1" />
            Prepublish
          </Button>
          <Button variant="outline" size="sm">
            To RegGroup
          </Button>
          {showCreateButton && (
            <Button 
              onClick={onCreateClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create RegGroup
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Create Workflow
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Search className="w-4 h-4 mr-1" />
            Search
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          244 Results
        </div>
      </div>
    </div>
  );
}