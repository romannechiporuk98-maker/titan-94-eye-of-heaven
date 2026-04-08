import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userTierEnum = pgEnum("user_tier", ["free", "pro", "elite"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  tier: userTierEnum("tier").notNull().default("free"),
  trialExpiresAt: timestamp("trial_expires_at"),
  referredBy: text("referred_by"),
  walletAddress: text("wallet_address"),
  freeAuditsUsed: integer("free_audits_used").notNull().default(0),
  reserveFundTon: text("reserve_fund_ton").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
});

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: text("referrer_id").notNull(),
  referredId: text("referred_id").notNull(),
  bonusDaysGranted: integer("bonus_days_granted").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, lastActiveAt: true });
export const insertReferralSchema = createInsertSchema(referralsTable).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referralsTable.$inferSelect;
