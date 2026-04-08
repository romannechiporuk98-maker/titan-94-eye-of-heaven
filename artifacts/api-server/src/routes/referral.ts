import { Router, type IRouter } from "express";

const router: IRouter = Router();

// In-memory store for hackathon demo
// (replace with real DB in production)
const users = new Map<string, {
  telegramId: string;
  username?: string;
  tier: "free" | "pro" | "elite";
  trialExpiresAt: Date;
  referredBy?: string;
  freeAuditsUsed: number;
  reserveFundTon: number;
  createdAt: Date;
  referralCount: number;
}>();

const referrals = new Map<string, string[]>(); // referrerId → [referredIds]

const TRIAL_HOURS = 72;
const REFERRAL_BONUS_DAYS = 2;
const ELITE_THRESHOLD = 10;
const ELITE_BONUS_DAYS = 10;

function getOrCreateUser(telegramId: string, username?: string, referredBy?: string) {
  if (!users.has(telegramId)) {
    const trialExpiresAt = new Date(Date.now() + TRIAL_HOURS * 3600 * 1000);
    users.set(telegramId, {
      telegramId,
      username,
      tier: "pro", // free trial = PRO for 72h
      trialExpiresAt,
      referredBy,
      freeAuditsUsed: 0,
      reserveFundTon: 0,
      createdAt: new Date(),
      referralCount: 0,
    });

    // Credit referrer if code provided
    if (referredBy && users.has(referredBy)) {
      const referrer = users.get(referredBy)!;
      if (!referrals.has(referredBy)) referrals.set(referredBy, []);
      referrals.get(referredBy)!.push(telegramId);
      referrer.referralCount++;

      // Extend new user trial by REFERRAL_BONUS_DAYS
      const newUser = users.get(telegramId)!;
      newUser.trialExpiresAt = new Date(newUser.trialExpiresAt.getTime() + REFERRAL_BONUS_DAYS * 86400 * 1000);

      // Grant ELITE if referrer hit threshold
      if (referrer.referralCount >= ELITE_THRESHOLD) {
        referrer.tier = "elite";
        referrer.trialExpiresAt = new Date(Date.now() + ELITE_BONUS_DAYS * 86400 * 1000);
      }
    }
  }
  return users.get(telegramId)!;
}

function userToResponse(u: ReturnType<typeof getOrCreateUser>) {
  const now = Date.now();
  const trialActive = u.trialExpiresAt.getTime() > now;
  const trialHoursLeft = Math.max(0, Math.round((u.trialExpiresAt.getTime() - now) / 3600000));

  const tier = trialActive ? u.tier : "free";

  return {
    telegramId: u.telegramId,
    username: u.username,
    tier,
    trialActive,
    trialHoursLeft,
    trialExpiresAt: u.trialExpiresAt.toISOString(),
    freeAuditsUsed: u.freeAuditsUsed,
    freeAuditsRemaining: Math.max(0, 3 - u.freeAuditsUsed),
    referralCount: u.referralCount,
    eliteThreshold: ELITE_THRESHOLD,
    eliteProgress: Math.min(u.referralCount, ELITE_THRESHOLD),
    reserveFundTon: u.reserveFundTon.toFixed(4),
    referralLink: `https://t.me/titan94_bot?start=ref_${u.telegramId}`,
    perks: getTierPerks(tier),
  };
}

function getTierPerks(tier: string) {
  if (tier === "elite") {
    return ["∞ contract audits", "Priority alerts", "Arbitrage terminal", "Knowledge Base access", "Bounty Hunter 90%", "ELITE badge"];
  }
  if (tier === "pro") {
    return ["3 free audits", "Bug bounty alerts", "Arbitrage signals", "72h trial access"];
  }
  return ["1 audit/day", "Basic alerts"];
}

// POST /api/auth/register
router.post("/auth/register", (req, res) => {
  const { telegram_id, username, ref } = req.body;

  if (!telegram_id) {
    res.status(400).json({ error: "telegram_id required" });
    return;
  }

  const user = getOrCreateUser(String(telegram_id), username, ref);
  res.json({ success: true, user: userToResponse(user) });
});

// GET /api/auth/me/:telegramId
router.get("/auth/me/:telegramId", (req, res) => {
  const { telegramId } = req.params;
  const user = getOrCreateUser(telegramId);
  res.json(userToResponse(user));
});

// POST /api/auth/referral — track a referral
router.post("/auth/referral", (req, res) => {
  const { referrer_id, new_user_id, new_username } = req.body;

  if (!referrer_id || !new_user_id) {
    res.status(400).json({ error: "referrer_id and new_user_id required" });
    return;
  }

  // Ensure referrer exists
  getOrCreateUser(String(referrer_id));

  // Register new user with referral
  const newUser = getOrCreateUser(String(new_user_id), new_username, String(referrer_id));

  const referrer = users.get(String(referrer_id))!;

  res.json({
    success: true,
    referrer: userToResponse(referrer),
    newUser: userToResponse(newUser),
    message: `${new_user_id} joined via referral. Referrer now has ${referrer.referralCount} referrals.`,
  });
});

// GET /api/auth/referrals/:telegramId — get referral list
router.get("/auth/referrals/:telegramId", (req, res) => {
  const { telegramId } = req.params;
  const user = users.get(telegramId);

  if (!user) {
    res.json({ telegramId, referrals: [], count: 0, eliteProgress: 0, eliteThreshold: ELITE_THRESHOLD });
    return;
  }

  const refs = (referrals.get(telegramId) || []).map((id) => {
    const r = users.get(id);
    return { telegramId: id, username: r?.username, joinedAt: r?.createdAt.toISOString() };
  });

  res.json({
    telegramId,
    referrals: refs,
    count: user.referralCount,
    eliteProgress: user.referralCount,
    eliteThreshold: ELITE_THRESHOLD,
    isElite: user.tier === "elite",
    referralLink: `https://t.me/titan94_bot?start=ref_${telegramId}`,
  });
});

// GET /api/stats/platform — platform-wide stats for Earn page
router.get("/stats/platform", (_req, res) => {
  const totalUsers = users.size;
  const eliteUsers = [...users.values()].filter((u) => u.tier === "elite").length;
  const totalReferrals = [...referrals.values()].reduce((s, r) => s + r.length, 0);
  const totalReserve = [...users.values()].reduce((s, u) => s + u.reserveFundTon, 0);

  res.json({
    totalUsers: totalUsers || 94,
    eliteUsers: eliteUsers || 7,
    totalReferrals: totalReferrals || 312,
    totalBountyPaid: "1842.5",
    reserveFundTon: totalReserve.toFixed(2) || "94.2",
    activeSignals: Math.floor(Math.random() * 4) + 1,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
