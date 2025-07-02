import { users, extracts, keywords, summaries, type User, type InsertUser, type Extract, type InsertExtract, type Keyword, type InsertKeyword, type Summary, type InsertSummary } from "@shared/schema";

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
        fullText: "A banking organization must maintain minimum capital ratios as specified in this section. The minimum common equity tier 1 capital ratio is 4.5 percent. The minimum tier 1 capital ratio is 6.0 percent. The minimum total capital ratio is 8.0 percent. These ratios must be calculated in accordance with the definitions and methods set forth in this part."
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
        fullText: "A banking organization must maintain a minimum tier 1 leverage ratio of 4.0 percent. Advanced approaches banking organizations must maintain a minimum supplementary leverage ratio of 3.0 percent, calculated as the ratio of tier 1 capital to total leverage exposure."
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
        fullText: "Banking organizations must maintain a capital conservation buffer of 2.5 percent of common equity tier 1 capital above the minimum capital ratios. Failure to maintain the buffer results in automatic constraints on capital distributions and discretionary bonus payments."
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
        fullText: "A global systemically important bank holding company must comply with total loss-absorbing capacity requirements. The minimum external TLAC amount must equal the greater of 18 percent of the company's risk-weighted assets or 6.75 percent of the company's total leverage exposure."
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
        fullText: "The countercyclical capital buffer is set at 0% for exposures to private sector credit in the United States for the four-quarter period beginning January 1, 2024. This buffer may be increased if systemic risks warrant additional capital protection."
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
        fullText: "A bank holding company with total consolidated assets of $100 billion or more must develop and maintain a capital plan that assesses the company's capital adequacy under baseline and stressed scenarios. The capital plan must include detailed projections of revenues, losses, reserves, and capital levels."
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

export const storage = new MemStorage();
