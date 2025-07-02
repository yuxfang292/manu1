import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const extracts = pgTable("extracts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  excerpt: text("excerpt").notNull(),
  category: text("category").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  priority: text("priority").notNull(), // "High Priority", "Medium", "Low"
  effectiveDate: text("effective_date"),
  lastUpdated: text("last_updated").notNull(),
  relevanceScore: integer("relevance_score").notNull(), // 1-100
  keywords: text("keywords").array().notNull(),
  fullText: text("full_text").notNull(),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdDate: text("created_date"),
  updatedDate: text("updated_date"),
});

export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().unique(),
  category: text("category").notNull(),
  usage_count: integer("usage_count").default(0),
});

export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  extractIds: text("extract_ids").array().notNull(),
  overview: text("overview").notNull(),
  keyPoints: text("key_points").array().notNull(),
  conclusion: text("conclusion").notNull(),
  createdAt: text("created_at").notNull(),
  reportId: text("report_id").notNull(),
});

export const insertExtractSchema = createInsertSchema(extracts).omit({
  id: true,
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  usage_count: true,
});

export const insertSummarySchema = createInsertSchema(summaries).omit({
  id: true,
});

export type Extract = typeof extracts.$inferSelect;
export type InsertExtract = z.infer<typeof insertExtractSchema>;
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Summary = typeof summaries.$inferSelect;
export type InsertSummary = z.infer<typeof insertSummarySchema>;

// Users table (existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
