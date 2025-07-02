import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Extract } from "@shared/schema";

export function useExtracts(searchQuery?: string, filters?: any) {
  return useQuery({
    queryKey: ['/api/extracts', searchQuery, filters],
    queryFn: async () => {
      if (searchQuery) {
        const response = await fetch(`/api/extracts/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to search extracts');
        }
        return response.json();
      }
      
      if (filters && (filters.categories.length > 0 || filters.jurisdictions.length > 0 || filters.priorities.length > 0)) {
        const response = await apiRequest('POST', '/api/extracts/filter', filters);
        return response.json();
      }
      
      const response = await fetch('/api/extracts');
      if (!response.ok) {
        throw new Error('Failed to fetch extracts');
      }
      return response.json();
    },
    enabled: true,
  });
}

export function useKeywords() {
  return useQuery({
    queryKey: ['/api/keywords'],
    queryFn: async () => {
      const response = await fetch('/api/keywords');
      if (!response.ok) {
        throw new Error('Failed to fetch keywords');
      }
      return response.json();
    },
  });
}
