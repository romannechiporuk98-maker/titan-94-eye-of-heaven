/**
 * Referral / auth routes — persisted to PostgreSQL (users + referrals tables).
 * Implements Legion 10/10: 10 referrals → 10 days ELITE.
 */
import { Router, type IRouter } from "express";
import { db, usersTable, referralsTable, type User } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import * as store from "../services/store";

const router: IRouter = Router();

const TRIAL_HOURS = 72;
const REFERRAL_BONUS_DAYS = 2;
const ELITE_THRESHOLD = 10;
const ELITE_BONUS_DAYS = 10;
const FREE_AUDITS_PER_TRIAL = 3;

async function getOrCreateUser(telegramId: string, username?: string, referredBy?: string): Promise<User> {
  const existing = await db.select().from(usersTable).where(eq(usersTable.telegramId, telegramId)).limit(1);
  if (existing.length) {
    // Update lastActiveAt
    await db.update(usersTable).set({ lastActiveAt: new Date() }).where(eq(usersTable.telegramId, telegramId));
    return existing[0]!;
  }

  const trialExpiresAt = new Date(Date.now() + TRIAL_HOURS * 3600 * 1000);
  const [created] = await db.insert(usersTable).values({
    telegramId, username, tier: "pro", trialExpiresAt,
    referredBy: referredBy || null,
  }).returning();

  // Credit referrer if valid
  if (referredBy) {
    const referrerRows = await db.select().from(usersTable).where(eq(usersTable.telegramId, referredBy)).limit(1);
    if (referrerRows.length) {
      await db.insert(referralsTable).values({
        referrerId: referredBy, referredId: telegramId, bonusDaysGranted: REFERRAL_BONUS_DAYS,
      });
      // Extend new user trial
      const extended = new Date(trialExpiresAt.getTime() + REFERRAL_BONUS_DAYS * 86400 * 1000);
      await db.update(usersTable).set({ trialExpiresAt: extended }).where(eq(usersTable.telegramId, telegramId));
      created!.trialExpiresAt = extended;

      // Check if referrer hit Legion threshold
      const refCountRow = await db.execute(sql`SELECT COUNT(*)::int AS c FROM referrals WHERE referrer_id = ${referredBy}`);
      const refCount = (refCountRow.rows[0] as any).c;
      if (refCount >= ELITE_THRESHOLD) {
        const eliteUntil = new Date(Date.now() + ELITE_BONUS_DAYS * 86400 * 1000);
        await db.update(usersTable)
          .set({ tier: "elite", trialExpiresAt: eliteUntil })
          .where(eq(usersTable.telegramId, referredBy));
        // Mirror to subscribers table for monetization view
        await store.upsertSubscriber({
          telegramId: referredBy, plan: "elite",
          expiresAt: eliteUntil, isActive: true,
        });
        await store.logActivity("LEGION", `${referredBy} unlocked Legion ELITE`, `${refCount} referrals → ${ELITE_BONUS_DAYS}d ELITE bonus`, "success");
      }
    }
  }
  return created!;
}

async function userToResponse(u: User) {
  const now = Date.now();
  const trialExp = u.trialExpiresAt?.getTime() ?? 0;
  const trialActive = trialExp > now;
  const trialHoursLeft = Math.max(0, Math.round((trialExp - now) / 3600000));
  const tier = trialActive ? u.tier : "free";

  const refCountRow = await db.execute(sql`SELECT COUNT(*)::int AS c FROM referrals WHERE referrer_id = ${u.telegramId}`);
  const referralCount = (refCountRow.rows[0] as any).c;

  return {
    telegramId: u.telegramId, username: u.username, tier,
    trialActive, trialHoursLeft, trialExpiresAt: u.trialExpiresAt?.toISOString() ?? null,
    freeAuditsUsed: u.freeAuditsUsed,
    freeAuditsRemaining: Math.max(0, FREE_AUDITS_PER_TRIAL - u.freeAuditsUsed),
    referralCount,
    eliteThreshold: ELITE_THRESHOLD,
    eliteProgress: Math.min(referralCount, ELITE_THRESHOLD),
    reserveFundTon: u.reserveFundTon,
    referralLink: `https://t.me/Titan_94_agent_bot?start=ref_${u.telegramId}`,
    perks: getTierPerks(tier),
  };
}

function getTierPerks(tier: string) {
  if (tier === "elite") return ["∞ contract audits", "Priority alerts", "Arbitrage terminal", "Knowledge Base access", "Bounty Hunter 90%", "ELITE badge"];
  if (tier === "pro")   return ["3 free audits", "Bug bounty alerts", "Arbitrage signals", "72h trial access"];
  return ["1 audit/day", "Basic alerts"];
}

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const { telegram_id, username, ref } = req.body || {};
  if (!telegram_id) return res.status(400).json({ error: "telegram_id required" });

  const user = await getOrCreateUser(String(telegram_id), username, ref);
  await store.logActivity("AUTH", "User registered", `${telegram_id}${ref ? ` (ref: ${ref})` : ""}`, "info");
  res.json({ success: true, user: await userToResponse(user) });
});

// GET /api/auth/me/:telegramId
router.get("/auth/me/:telegramId", async (req, res) => {
  const user = await getOrCreateUser(req.params.telegramId);
  res.json(await userToResponse(user));
});

// POST /api/auth/referral
router.post("/auth/referral", async (req, res) => {
  const { referrer_id, new_user_id, new_username } = req.body || {};
  if (!referrer_id || !new_user_id) return res.status(400).json({ error: "referrer_id and new_user_id required" });

  await getOrCreateUser(String(referrer_id));
  const newUser = await getOrCreateUser(String(new_user_id), new_username, String(referrer_id));

  const referrer = (await db.select().from(usersTable).where(eq(usersTable.telegramId, String(referrer_id))).limit(1))[0];
  const refCountRow = await db.execute(sql`SELECT COUNT(*)::int AS c FROM referrals WHERE referrer_id = ${String(referrer_id)}`);
  const referralCount = (refCountRow.rows[0] as any).c;

  res.json({
    success: true,
    referrer: referrer ? await userToResponse(referrer) : null,
    newUser:  await userToResponse(newUser),
    message:  `${new_user_id} joined via referral. Referrer now has ${referralCount} referral(s).`,
  });
});

// GET /api/auth/referrals/:telegramId
router.get("/auth/referrals/:telegramId", async (req, res) => {
  const id = req.params.telegramId;
  await getOrCreateUser(id);

  const refsRows = await db.execute(sql`
    SELECT r.referred_id AS "telegramId", u.username, u.created_at AS "joinedAt"
    FROM referrals r
    LEFT JOIN users u ON u.telegram_id = r.referred_id
    WHERE r.referrer_id = ${id}
    ORDER BY r.created_at DESC
  `);
  const refs = refsRows.rows as any[];

  const user = (await db.select().from(usersTable).where(eq(usersTable.telegramId, id)).limit(1))[0]!;

  res.json({
    telegramId: id,
    referrals: refs,
    count: refs.length,
    eliteProgress: refs.length,
    eliteThreshold: ELITE_THRESHOLD,
    isElite: user.tier === "elite",
    referralLink: `https://t.me/Titan_94_agent_bot?start=ref_${id}`,
  });
});

// GET /api/stats/platform — platform-wide stats
router.get("/stats/platform", async (_req, res) => {
  const r = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM users)                                  AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE tier = 'elite')             AS elite_users,
      (SELECT COUNT(*)::int FROM referrals)                              AS total_referrals,
      (SELECT COALESCE(SUM(amount_ton::numeric), 0)::text
         FROM billing_ledger WHERE type = 'bounty')                      AS total_bounty_paid,
      (SELECT COALESCE(SUM(reserve_fund_ton::numeric), 0)::text FROM users) AS reserve_fund_ton
  `);
  const row = r.rows[0] as any;

  res.json({
    totalUsers:     row.total_users     || 0,
    eliteUsers:     row.elite_users     || 0,
    totalReferrals: row.total_referrals || 0,
    totalBountyPaid: parseFloat(row.total_bounty_paid).toFixed(2),
    reserveFundTon:  parseFloat(row.reserve_fund_ton || "0").toFixed(2),
    activeSignals: Math.floor(Math.random() * 4) + 1,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
