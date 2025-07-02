// Type definitions for CSV-based storage
export interface User {
  id: number;
  username: string;
  passwordHash: string;
}

export interface InsertUser {
  username: string;
  passwordHash: string;
}

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

export interface InsertExtract {
  title: string;
  source: string;
  excerpt: string;
  category: string;
  jurisdiction: string;
  priority: string;
  effectiveDate?: string | null;
  lastUpdated: string;
  relevanceScore: number;
  keywords: string[];
  fullText: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface Keyword {
  id: number;
  term: string;
  category: string;
  usage_count: number;
}

export interface InsertKeyword {
  term: string;
  category: string;
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

export interface InsertSummary {
  title: string;
  content: string;
  extractIds: number[];
  keywords: string[];
}
import { CSVReader, type CSVRow } from "./csv-reader";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Extract operations
  getAllExtracts(): Promise<Extract[]>;
  getExtractById(id: number): Promise<Extract | undefined>;
  searchExtracts(query: string): Promise<Extract[]>;
  filterExtracts(filters: {
    categories?: string[];
    jurisdictions?: string[];
    priorities?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<Extract[]>;
  createExtract(extract: InsertExtract): Promise<Extract>;
  
  // Keyword operations
  getAllKeywords(): Promise<Keyword[]>;
  getKeywordsByCategory(category: string): Promise<Keyword[]>;
  searchKeywords(query: string): Promise<Keyword[]>;
  
  // Summary operations
  createSummary(summary: InsertSummary): Promise<Summary>;
  getSummaryById(id: number): Promise<Summary | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private extracts: Map<number, Extract>;
  private keywords: Map<number, Keyword>;
  private summaries: Map<number, Summary>;
  private currentUserId: number;
  private currentExtractId: number;
  private currentKeywordId: number;
  private currentSummaryId: number;

  constructor() {
    this.users = new Map();
    this.extracts = new Map();
    this.keywords = new Map();
    this.summaries = new Map();
    this.currentUserId = 1;
    this.currentExtractId = 1;
    this.currentKeywordId = 1;
    this.currentSummaryId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Seed extracts with realistic regulatory data
    const sampleExtracts: InsertExtract[] = [
      {
        title: "Basel III: Minimum Capital Requirements",
        source: "Federal Register, 12 CFR Part 3",
        excerpt: "A banking organization must maintain minimum capital ratios as specified in this section. The minimum common equity tier 1 capital ratio is 4.5 percent. The minimum tier 1 capital ratio is 6.0 percent...",
        category: "Capital Adequacy",
        jurisdiction: "Federal",
        priority: "High Priority",
        effectiveDate: "2019-01-01",
        lastUpdated: "Dec 15, 2023",
        relevanceScore: 95,
        keywords: ["capital requirements", "basel iii", "tier 1", "common equity"],
        fullText: "A banking organization must maintain minimum capital ratios as specified in this section. The minimum common equity tier 1 capital ratio is 4.5 percent. The minimum tier 1 capital ratio is 6.0 percent. The minimum total capital ratio is 8.0 percent. These ratios must be calculated in accordance with the definitions and methods set forth in this part.",
        createdBy: "Sarah Martinez",
        updatedBy: "Michael Chen",
        createdDate: "2019-01-01",
        updatedDate: "Dec 15, 2023"
      },
      {
        title: "Tier 1 Leverage Ratio Requirements",
        source: "12 CFR Part 217, Section 217.10",
        excerpt: "A banking organization must maintain a minimum tier 1 leverage ratio of 4.0 percent. Advanced approaches banking organizations must maintain a minimum supplementary leverage ratio...",
        category: "Leverage Ratio",
        jurisdiction: "Federal",
        priority: "Medium",
        effectiveDate: "2018-01-01",
        lastUpdated: "Nov 28, 2023",
        relevanceScore: 87,
        keywords: ["leverage ratio", "tier 1", "supplementary", "advanced approaches"],
        fullText: "A banking organization must maintain a minimum tier 1 leverage ratio of 4.0 percent. Advanced approaches banking organizations must maintain a minimum supplementary leverage ratio of 3.0 percent, calculated as the ratio of tier 1 capital to total leverage exposure.",
        createdBy: "David Kim",
        updatedBy: "Jennifer Wilson",
        createdDate: "2018-01-01",
        updatedDate: "Nov 28, 2023"
      },
      {
        title: "Capital Conservation Buffer",
        source: "Basel III Implementation Guidelines",
        excerpt: "Banking organizations must maintain a capital conservation buffer of 2.5 percent of common equity tier 1 capital above the minimum capital ratios. Failure to maintain the buffer results in constraints...",
        category: "Capital Buffer",
        jurisdiction: "Basel III",
        priority: "High Priority",
        effectiveDate: "2019-01-01",
        lastUpdated: "Dec 10, 2023",
        relevanceScore: 92,
        keywords: ["capital conservation", "buffer", "constraints", "distributions"],
        fullText: "Banking organizations must maintain a capital conservation buffer of 2.5 percent of common equity tier 1 capital above the minimum capital ratios. Failure to maintain the buffer results in automatic constraints on capital distributions and discretionary bonus payments.",
        createdBy: "Amanda Rodriguez",
        updatedBy: "Robert Thompson",
        createdDate: "2019-01-01",
        updatedDate: "Dec 10, 2023"
      },
      {
        title: "TLAC Holdings Requirements",
        source: "12 CFR Part 252, Subpart P",
        excerpt: "A global systemically important bank holding company must comply with total loss-absorbing capacity requirements. The minimum external TLAC amount must equal...",
        category: "TLAC",
        jurisdiction: "G-SIB",
        priority: "Low",
        effectiveDate: "2022-01-01",
        lastUpdated: "Oct 15, 2023",
        relevanceScore: 78,
        keywords: ["tlac", "loss absorbing", "g-sib", "systemically important"],
        fullText: "A global systemically important bank holding company must comply with total loss-absorbing capacity requirements. The minimum external TLAC amount must equal the greater of 18 percent of the company's risk-weighted assets or 6.75 percent of the company's total leverage exposure.",
        createdBy: "Lisa Zhang",
        updatedBy: "Carlos Mendez",
        createdDate: "2022-01-01",
        updatedDate: "Oct 15, 2023"
      },
      {
        title: "Countercyclical Capital Buffer",
        source: "Federal Register Notice 2023-15847",
        excerpt: "The countercyclical capital buffer is set at 0% for exposures to private sector credit in the United States for the four-quarter period beginning January 1, 2024...",
        category: "Countercyclical Buffer",
        jurisdiction: "Federal",
        priority: "Medium",
        effectiveDate: "2024-01-01",
        lastUpdated: "Dec 20, 2023",
        relevanceScore: 85,
        keywords: ["countercyclical", "buffer", "private sector", "credit exposures"],
        fullText: "The countercyclical capital buffer is set at 0% for exposures to private sector credit in the United States for the four-quarter period beginning January 1, 2024. This buffer may be increased if systemic risks warrant additional capital protection.",
        createdBy: "Thomas Anderson",
        updatedBy: "Rachel Green",
        createdDate: "2024-01-01",
        updatedDate: "Dec 20, 2023"
      },
      {
        title: "Stress Testing Capital Planning",
        source: "12 CFR Part 252, Subpart F",
        excerpt: "A bank holding company with total consolidated assets of $100 billion or more must develop and maintain a capital plan that assesses the company's capital adequacy under baseline and stressed scenarios...",
        category: "Stress Testing",
        jurisdiction: "Federal",
        priority: "High Priority",
        effectiveDate: "2020-10-01",
        lastUpdated: "Nov 30, 2023",
        relevanceScore: 90,
        keywords: ["stress testing", "capital planning", "scenarios", "adequacy"],
        fullText: "A bank holding company with total consolidated assets of $100 billion or more must develop and maintain a capital plan that assesses the company's capital adequacy under baseline and stressed scenarios. The capital plan must include detailed projections of revenues, losses, reserves, and capital levels.",
        createdBy: "Emily Johnson",
        updatedBy: "Kevin Park",
        createdDate: "2020-10-01",
        updatedDate: "Nov 30, 2023"
      }
    ];

    sampleExtracts.forEach(extract => {
      this.createExtract(extract);
    });

    // Seed keywords
    const sampleKeywords: InsertKeyword[] = [
      { term: "capital requirements", category: "Capital" },
      { term: "basel iii", category: "Regulation" },
      { term: "leverage ratio", category: "Ratios" },
      { term: "stress testing", category: "Testing" },
      { term: "risk management", category: "Risk" },
      { term: "consumer protection", category: "Consumer" },
      { term: "data privacy", category: "Privacy" },
      { term: "aml compliance", category: "AML" },
      { term: "tier 1", category: "Capital" },
      { term: "buffer", category: "Capital" },
      { term: "tlac", category: "Capital" },
      { term: "g-sib", category: "Regulation" }
    ];

    sampleKeywords.forEach(keyword => {
      const id = this.currentKeywordId++;
      this.keywords.set(id, { ...keyword, id, usage_count: 0 });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllExtracts(): Promise<Extract[]> {
    return Array.from(this.extracts.values());
  }

  async getExtractById(id: number): Promise<Extract | undefined> {
    return this.extracts.get(id);
  }

  async searchExtracts(query: string): Promise<Extract[]> {
    const searchTerms = query.toLowerCase().split(' ');
    return Array.from(this.extracts.values()).filter(extract => {
      const searchText = `${extract.title} ${extract.excerpt} ${extract.fullText} ${extract.keywords.join(' ')}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    });
  }

  async filterExtracts(filters: {
    categories?: string[];
    jurisdictions?: string[];
    priorities?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<Extract[]> {
    return Array.from(this.extracts.values()).filter(extract => {
      if (filters.categories && !filters.categories.includes(extract.category)) return false;
      if (filters.jurisdictions && !filters.jurisdictions.includes(extract.jurisdiction)) return false;
      if (filters.priorities && !filters.priorities.includes(extract.priority)) return false;
      if (filters.keywords && !filters.keywords.some(keyword => 
        extract.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase())))) return false;
      // Add date filtering logic if needed
      return true;
    });
  }

  async createExtract(extract: InsertExtract): Promise<Extract> {
    const id = this.currentExtractId++;
    const newExtract: Extract = { ...extract, id };
    this.extracts.set(id, newExtract);
    return newExtract;
  }

  async getAllKeywords(): Promise<Keyword[]> {
    return Array.from(this.keywords.values());
  }

  async getKeywordsByCategory(category: string): Promise<Keyword[]> {
    return Array.from(this.keywords.values()).filter(k => k.category === category);
  }

  async searchKeywords(query: string): Promise<Keyword[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.keywords.values()).filter(k => 
      k.term.toLowerCase().includes(searchTerm) || k.category.toLowerCase().includes(searchTerm)
    );
  }

  async createSummary(summary: InsertSummary): Promise<Summary> {
    const id = this.currentSummaryId++;
    const newSummary: Summary = { ...summary, id };
    this.summaries.set(id, newSummary);
    return newSummary;
  }

  async getSummaryById(id: number): Promise<Summary | undefined> {
    return this.summaries.get(id);
  }
}

export class CSVStorage implements IStorage {
  private extractsPath = 'data/extracts.csv';
  private keywordsPath = 'data/keywords.csv'; 
  private usersPath = 'data/users.csv';
  private summariesPath = 'data/summaries.csv';

  private csvRowToExtract(row: CSVRow): Extract {
    return {
      id: parseInt(row.id) || 0,
      title: row.title || '',
      source: row.source || '',
      excerpt: row.excerpt || '',
      category: row.category || '',
      jurisdiction: row.jurisdiction || '',
      priority: row.priority || '',
      effectiveDate: row.effectiveDate || null,
      lastUpdated: row.lastUpdated || '',
      relevanceScore: parseInt(row.relevanceScore) || 0,
      keywords: row.keywords ? row.keywords.split(',').map(k => k.trim()) : [],
      fullText: row.fullText || '',
      createdBy: row.createdBy || null,
      updatedBy: row.updatedBy || null,
      createdDate: row.createdDate || null,
      updatedDate: row.updatedDate || null
    };
  }

  private csvRowToKeyword(row: CSVRow): Keyword {
    return {
      id: parseInt(row.id) || 0,
      term: row.term || '',
      category: row.category || '',
      usage_count: parseInt(row.frequency) || 0
    };
  }

  private csvRowToUser(row: CSVRow): User {
    return {
      id: parseInt(row.id) || 0,
      username: row.username || '',
      passwordHash: row.passwordHash || ''
    };
  }

  private csvRowToSummary(row: CSVRow): Summary {
    return {
      id: parseInt(row.id) || 0,
      title: row.title || '',
      content: row.content || '',
      extractIds: row.extractIds ? row.extractIds.split(',').map(id => parseInt(id.trim())) : [],
      keywords: row.keywords ? row.keywords.split(',').map(k => k.trim()) : [],
      createdAt: new Date(row.createdAt || Date.now()),
      updatedAt: new Date(row.updatedAt || Date.now())
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    const users = CSVReader.readCSV(this.usersPath);
    const userRow = users.find(row => parseInt(row.id) === id);
    return userRow ? this.csvRowToUser(userRow) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = CSVReader.readCSV(this.usersPath);
    const userRow = users.find(row => row.username === username);
    return userRow ? this.csvRowToUser(userRow) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = CSVReader.readCSV(this.usersPath);
    const maxId = Math.max(0, ...users.map(row => parseInt(row.id) || 0));
    const newUser: User = {
      id: maxId + 1,
      username: insertUser.username,
      passwordHash: insertUser.passwordHash
    };
    
    users.push({
      id: newUser.id.toString(),
      username: newUser.username,
      passwordHash: newUser.passwordHash
    });
    
    CSVReader.writeCSV(this.usersPath, users);
    return newUser;
  }

  async getAllExtracts(): Promise<Extract[]> {
    const extractRows = CSVReader.readCSV(this.extractsPath);
    return extractRows.map(row => this.csvRowToExtract(row));
  }

  async getExtractById(id: number): Promise<Extract | undefined> {
    const extractRows = CSVReader.readCSV(this.extractsPath);
    const extractRow = extractRows.find(row => parseInt(row.id) === id);
    return extractRow ? this.csvRowToExtract(extractRow) : undefined;
  }

  async searchExtracts(query: string): Promise<Extract[]> {
    const extractRows = CSVReader.readCSV(this.extractsPath);
    const searchLower = query.toLowerCase();
    
    const filteredRows = extractRows.filter(row => 
      row.title?.toLowerCase().includes(searchLower) ||
      row.excerpt?.toLowerCase().includes(searchLower) ||
      row.fullText?.toLowerCase().includes(searchLower)
    );
    
    return filteredRows.map(row => this.csvRowToExtract(row));
  }

  async filterExtracts(filters: {
    categories?: string[];
    jurisdictions?: string[];
    priorities?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<Extract[]> {
    const extractRows = CSVReader.readCSV(this.extractsPath);
    
    const filteredRows = extractRows.filter(row => {
      if (filters.categories?.length && !filters.categories.includes(row.category)) return false;
      if (filters.jurisdictions?.length && !filters.jurisdictions.includes(row.jurisdiction)) return false;
      if (filters.priorities?.length && !filters.priorities.includes(row.priority)) return false;
      
      if (filters.keywords?.length) {
        const rowKeywords = row.keywords ? row.keywords.split(',').map(k => k.trim().toLowerCase()) : [];
        const hasKeyword = filters.keywords.some(keyword => 
          rowKeywords.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }
      
      return true;
    });
    
    return filteredRows.map(row => this.csvRowToExtract(row));
  }

  async createExtract(extract: InsertExtract): Promise<Extract> {
    const extractRows = CSVReader.readCSV(this.extractsPath); 
    const maxId = Math.max(0, ...extractRows.map(row => parseInt(row.id) || 0));
    
    const newExtract: Extract = {
      id: maxId + 1,
      ...extract,
      effectiveDate: extract.effectiveDate || null,
      updatedDate: extract.updatedDate || null
    };
    
    extractRows.push({
      id: newExtract.id.toString(),
      title: newExtract.title,
      source: newExtract.source,
      excerpt: newExtract.excerpt,
      category: newExtract.category,
      jurisdiction: newExtract.jurisdiction,
      priority: newExtract.priority,
      effectiveDate: newExtract.effectiveDate || '',
      lastUpdated: newExtract.lastUpdated,
      relevanceScore: newExtract.relevanceScore.toString(),
      keywords: newExtract.keywords.join(','),
      fullText: newExtract.fullText,
      createdBy: newExtract.createdBy,
      updatedBy: newExtract.updatedBy,
      createdDate: newExtract.createdDate,
      updatedDate: newExtract.updatedDate || ''
    });
    
    CSVReader.writeCSV(this.extractsPath, extractRows);
    return newExtract;
  }

  async getAllKeywords(): Promise<Keyword[]> {
    const keywordRows = CSVReader.readCSV(this.keywordsPath);
    return keywordRows.map(row => this.csvRowToKeyword(row));
  }

  async getKeywordsByCategory(category: string): Promise<Keyword[]> {
    const keywordRows = CSVReader.readCSV(this.keywordsPath);
    const filteredRows = keywordRows.filter(row => row.category === category);
    return filteredRows.map(row => this.csvRowToKeyword(row));
  }

  async searchKeywords(query: string): Promise<Keyword[]> {
    const keywordRows = CSVReader.readCSV(this.keywordsPath);
    const searchLower = query.toLowerCase();
    const filteredRows = keywordRows.filter(row => 
      row.term?.toLowerCase().includes(searchLower)
    );
    return filteredRows.map(row => this.csvRowToKeyword(row));
  }

  async createSummary(summary: InsertSummary): Promise<Summary> {
    const summaryRows = CSVReader.readCSV(this.summariesPath);
    const maxId = Math.max(0, ...summaryRows.map(row => parseInt(row.id) || 0));
    
    const newSummary: Summary = {
      id: maxId + 1,
      ...summary,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    summaryRows.push({
      id: newSummary.id.toString(),
      title: newSummary.title,
      content: newSummary.content,
      extractIds: newSummary.extractIds.join(','),
      keywords: newSummary.keywords.join(','),
      createdAt: newSummary.createdAt.toISOString(),
      updatedAt: newSummary.updatedAt.toISOString()
    });
    
    CSVReader.writeCSV(this.summariesPath, summaryRows);
    return newSummary;
  }

  async getSummaryById(id: number): Promise<Summary | undefined> {
    const summaryRows = CSVReader.readCSV(this.summariesPath);
    const summaryRow = summaryRows.find(row => parseInt(row.id) === id);
    return summaryRow ? this.csvRowToSummary(summaryRow) : undefined;
  }
}

export const storage = new CSVStorage();
