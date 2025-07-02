import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface FilterSidebarProps {
  filters: {
    categories: string[];
    jurisdictions: string[];
    priorities: string[];
    keywords: string[];
    startDate: string;
    endDate: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
  searchQuery: string;
}

export default function FilterSidebar({ filters, onFiltersChange, onClose, searchQuery }: FilterSidebarProps) {
  const categories = ["Capital Adequacy", "Leverage Ratio", "Capital Buffer", "TLAC", "Countercyclical Buffer", "Stress Testing"];
  const jurisdictions = ["Federal", "EU", "Basel III", "G-SIB", "State Level"];
  const priorities = ["High Priority", "Medium", "Low"];

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked 
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleJurisdictionChange = (jurisdiction: string) => {
    onFiltersChange({ ...filters, jurisdictions: jurisdiction === "All Jurisdictions" ? [] : [jurisdiction] });
  };

  const handleQuickFilter = (filter: string) => {
    // Toggle quick filter logic
    const isActive = filters.keywords.includes(filter);
    const newKeywords = isActive 
      ? filters.keywords.filter(k => k !== filter)
      : [...filters.keywords, filter];
    
    onFiltersChange({ ...filters, keywords: newKeywords });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      jurisdictions: [],
      priorities: [],
      keywords: [],
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="bg-primary-white rounded-lg shadow-sm border border-secondary-grey p-4 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-primary-black">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4 text-primary-blue" />
        </Button>
      </div>
      
      {/* Breadcrumbs */}
      <div className="mb-4 p-2 bg-background-grey rounded">
        <div className="text-xs text-primary-black opacity-70 mb-1">Current Path:</div>
        <div className="text-sm text-primary-black">
          {searchQuery && (
            <>
              <span className="font-bold">{searchQuery}</span>
              {filters.categories.length > 0 && (
                <span> &gt; {filters.categories.join(', ')}</span>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Search Filter */}
      <div className="mb-4">
        <Label className="block text-sm font-bold text-primary-black mb-2">
          Search within results
        </Label>
        <Input
          type="text"
          placeholder="Filter by keywords..."
          className="w-full text-sm"
        />
      </div>
      
      {/* Category Filters */}
      <div className="mb-4">
        <Label className="block text-sm font-bold text-primary-black mb-2">Categories</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={filters.categories.includes(category)}
                onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
              />
              <Label htmlFor={category} className="text-sm">
                {category} ({Math.floor(Math.random() * 15) + 1})
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Jurisdiction Filters */}
      <div className="mb-4">
        <Label className="block text-sm font-bold text-primary-black mb-2">Jurisdiction</Label>
        <Select onValueChange={handleJurisdictionChange}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="All Jurisdictions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Jurisdictions">All Jurisdictions</SelectItem>
            {jurisdictions.map((jurisdiction) => (
              <SelectItem key={jurisdiction} value={jurisdiction}>
                {jurisdiction}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Date Range */}
      <div className="mb-4">
        <Label className="block text-sm font-bold text-primary-black mb-2">Date Range</Label>
        <div className="space-y-2">
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            className="w-full text-sm"
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            className="w-full text-sm"
          />
        </div>
      </div>
      
      {/* Quick Filters */}
      <div className="mb-4">
        <Label className="block text-sm font-bold text-primary-black mb-2">Quick Filters</Label>
        <div className="flex flex-wrap gap-2">
          {["Recent Changes", "High Priority", "Implementation Due"].map((filter) => (
            <Button
              key={filter}
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(filter)}
              className={`text-xs filter-chip ${
                filters.keywords.includes(filter)
                  ? 'bg-primary-blue text-primary-white'
                  : 'bg-supporting-blue text-primary-black'
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="border-t border-secondary-grey pt-4 space-y-2">
        <Button className="w-full bg-accent-blue text-primary-black hover:bg-accent-blue/80">
          Apply Filters
        </Button>
        <Button
          variant="outline"
          onClick={clearAllFilters}
          className="w-full text-primary-blue border-primary-blue hover:bg-primary-blue hover:text-primary-white"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}
