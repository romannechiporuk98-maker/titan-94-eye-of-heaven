import {
  pgTable, text, serial, timestamp, integer,
  decimal, boolean, pgEnum, jsonb,
} from "drizzle-orm/pg-core";

export * from "./users";

// ── Enums ────────────────────────────────────────────────────────────
export const severityEnum = pgEnum("severity", ["critical", "high", "medium", "low", "info"]);
export const statusEnum   = pgEnum("status",   ["active", "healing", "healed", "false_positive"]);
export const planEnum     = pgEnum("plan",      ["free", "pro", "elite"]);

// ── Vulnerabilities ──────────────────────────────────────────────────
export const vulnerabilitiesTable = pgTable("vulnerabilities", {
  id:              serial("id").primaryKey(),
  externalId:      text("external_id").unique(),
  title:           text("title").notNull(),
  severity:        severityEnum("severity").notNull().default("medium"),
  protocol:        text("protocol"),
  contractAddress: text("contract_address"),
  tvlAtRisk:       decimal("tvl_at_risk", { precision: 18, scale: 2 }),
  status:          statusEnum("status").notNull().default("active"),
  category:        text("category"),
  healingPlan:     text("healing_plan"),
  discoveredAt:    timestamp("discovered_at").defaultNow().notNull(),
  healedAt:        timestamp("healed_at"),
});

// ── Activity log ─────────────────────────────────────────────────────
export const activityTable = pgTable("activity", {
  id:        serial("id").primaryKey(),
  type:      text("type").notNull(),
  title:     text("title").notNull(),
  message:   text("message").notNull(),
  severity:  text("severity").notNull().default("info"),
  metadata:  jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Competitors ───────────────────────────────────────────────────────
export const competitorsTable = pgTable("competitors", {
  id:          serial("id").primaryKey(),
  name:        text("name").notNull(),
  description: text("description"),
  tvl:         decimal("tvl", { precision: 18, scale: 2 }),
  chain:       text("chain").notNull().default("TON"),
  threatLevel: text("threat_level").notNull().default("medium"),
  website:     text("website"),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

// ── AI Knowledge base ────────────────────────────────────────────────
export const knowledgeTable = pgTable("knowledge", {
  id:          serial("id").primaryKey(),
  category:    text("category").notNull(),
  pattern:     text("pattern").notNull(),
  description: text("description"),
  confidence:  decimal("confidence", { precision: 5, scale: 4 }).notNull().default("0.5"),
  occurrences: integer("occurrences").notNull().default(1),
  source:      text("source").notNull().default("heartbeat"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ── Subscribers ───────────────────────────────────────────────────────
export const subscribersTable = pgTable("subscribers", {
  id:         serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username:   text("username"),
  plan:       planEnum("plan").notNull().default("free"),
  tonAddress: text("ton_address"),
  expiresAt:  timestamp("expires_at"),
  isActive:   boolean("is_active").notNull().default(true),
  referredBy: text("referred_by"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

// ── Agent state (singleton row id=1) ─────────────────────────────────
export const agentStateTable = pgTable("agent_state", {
  id:            serial("id").primaryKey(),
  cycles:        integer("cycles").notNull().default(0),
  healingCycles: integer("healing_cycles").notNull().default(0),
  learnCycles:   integer("learn_cycles").notNull().default(0),
  financeCycles: integer("finance_cycles").notNull().default(0),
  accuracy:      decimal("accuracy", { precision: 5, scale: 4 }).notNull().default("0.847"),
  threatsHealed: integer("threats_healed").notNull().default(0),
  knowledgeSize: integer("knowledge_size").notNull().default(0),
  lastScan:      timestamp("last_scan"),
  lastHeal:      timestamp("last_heal"),
  lastLearn:     timestamp("last_learn"),
  lastFinance:   timestamp("last_finance"),
  lastBlockSeqno: integer("last_block_seqno"),
  startedAt:     timestamp("started_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
});

// ── Blocked addresses ─────────────────────────────────────────────────
export const blockedAddressesTable = pgTable("blocked_addresses", {
  id:        serial("id").primaryKey(),
  address:   text("address").notNull().unique(),
  reason:    text("reason").notNull(),
  severity:  text("severity").notNull().default("high"),
  source:    text("source").notNull().default("titan94"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Billing ledger (CPA / bounty / withdrawals) ──────────────────────
export const billingLedgerTable = pgTable("billing_ledger", {
  id:          serial("id").primaryKey(),
  telegramId:  text("telegram_id").notNull(),
  type:        text("type").notNull(), // 'cpa' | 'bounty' | 'withdrawal' | 'subscription' | 'adjustment'
  amountTon:   decimal("amount_ton", { precision: 18, scale: 9 }).notNull(),
  description: text("description").notNull(),
  txHash:      text("tx_hash"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ── Verified TON payments ─────────────────────────────────────────────
export const tonPaymentsTable = pgTable("ton_payments", {
  id:             serial("id").primaryKey(),
  txHash:         text("tx_hash").notNull().unique(),
  fromAddress:    text("from_address").notNull(),
  toAddress:      text("to_address").notNull(),
  amountNano:     text("amount_nano").notNull(),
  amountTon:      decimal("amount_ton", { precision: 18, scale: 9 }).notNull(),
  comment:        text("comment"),
  telegramId:     text("telegram_id"),
  planActivated:  text("plan_activated"),
  verified:       boolean("verified").notNull().default(false),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

// ── Type exports ──────────────────────────────────────────────────────
export type Vulnerability    = typeof vulnerabilitiesTable.$inferSelect;
export type Activity         = typeof activityTable.$inferSelect;
export type Competitor       = typeof competitorsTable.$inferSelect;
export type Knowledge        = typeof knowledgeTable.$inferSelect;
export type Subscriber       = typeof subscribersTable.$inferSelect;
export type AgentState       = typeof agentStateTable.$inferSelect;
export type BlockedAddress   = typeof blockedAddressesTable.$inferSelect;
export type BillingLedger    = typeof billingLedgerTable.$inferSelect;
export type TonPayment       = typeof tonPaymentsTable.$inferSelect;
