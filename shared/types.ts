// Type definitions for the regulatory compliance application
export interface Extract {
  id: number;
  title: string;
  source: string;
  excerpt: string;
  category: string;
  jurisdiction: string;
  priority: string;
  effectiveDate: string | null;
  lastUpdated: string;
  relevanceScore: number;
  keywords: string[];
  fullText: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdDate: string | null;
  updatedDate: string | null;
}

export interface Keyword {
  id: number;
  term: string;
  category: string;
  usage_count: number;
}

export interface Summary {
  id: number;
  title: string;
  content: string;
  extractIds: number[];
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}