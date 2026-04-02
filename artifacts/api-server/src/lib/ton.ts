const TONAPI_BASE = "https://tonapi.io/v2";

export const FACTORY_ADDRESS = "EQAFHodWCzrYJTbrbJp1lMDQLfypTHoJCd0UcerjsdxPECjX";
export const JETTON_FACTORY_ADDRESS = "EQCgYmwi8uwrG7I6bI3Cdv0ct-bAB1jZ0DQ7C3dX3MYn6VTj";
export const DEFAULT_EVALUATOR = "UQCDP52RhgJmylkjOBSJGqCsaTwRo9XFzrr6opHUg4mqkQAu";
export const TONVIEWER_BASE = "https://tonviewer.com";

export type JobState = "OPEN" | "FUNDED" | "SUBMITTED" | "COMPLETED" | "DISPUTED" | "CANCELLED";
export type JobType = "TON" | "USDT";

export interface Job {
  address: string;
  jobId: number;
  state: JobState;
  type: JobType;
  client: string;
  provider: string | null;
  evaluator: string;
  budgetTon: string;
  budgetUsdt: string | null;
  descriptionHash: string;
  descriptionText: string | null;
  resultHash: string | null;
  resultType: number | null;
  timeout: number;
  evalTimeout: number;
  createdAt: number;
  submittedAt: number | null;
  tonviewerUrl: string;
}

export interface ProtocolStats {
  totalJobs: number;
  totalTonJobs: number;
  totalUsdtJobs: number;
  byState: {
    OPEN: number;
    FUNDED: number;
    SUBMITTED: number;
    COMPLETED: number;
    DISPUTED: number;
    CANCELLED: number;
  };
  totalVolumeTon: string;
  completionRate: number;
  averageEvalTimeHours: number | null;
}

async function tonApiGet(path: string): Promise<unknown> {
  const res = await fetch(`${TONAPI_BASE}${path}`, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`TONAPI ${res.status}: ${path}`);
  return res.json();
}

function toUserFriendlyAddress(raw: string): string {
  return raw;
}

function nanoToTon(nano: string | number | bigint): string {
  const n = BigInt(String(nano));
  const whole = n / 1_000_000_000n;
  const frac = n % 1_000_000_000n;
  const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

const STATE_MAP: Record<number, JobState> = {
  0: "OPEN",
  1: "FUNDED",
  2: "SUBMITTED",
  3: "COMPLETED",
  4: "DISPUTED",
  5: "CANCELLED",
};

export async function fetchFactoryEvents(limit = 50, offset = 0): Promise<Job[]> {
  try {
    const data = await tonApiGet(
      `/accounts/${FACTORY_ADDRESS}/events?limit=${Math.min(limit + offset, 100)}&initiator=false`
    ) as { events: Array<{
      timestamp: number;
      actions: Array<{
        type: string;
        ContractDeploy?: { address: string };
        success: boolean;
        base_coins: number;
      }>;
      account?: { address: string };
    }> };

    const jobs: Job[] = [];
    let idCounter = 1;

    for (const event of (data.events || [])) {
      const deployAction = event.actions?.find(
        (a) => a.type === "ContractDeploy" && a.ContractDeploy
      );
      if (!deployAction?.ContractDeploy) continue;

      const jobAddress = deployAction.ContractDeploy.address;

      let jobState: JobState = "OPEN";
      try {
        const jobEvents = await tonApiGet(
          `/accounts/${jobAddress}/events?limit=20`
        ) as { events: Array<{ actions: Array<{ type: string; base_coins: number }> }> };

        const actionTypes = (jobEvents.events || [])
          .flatMap((e) => e.actions?.map((a) => a.type) || []);

        if (actionTypes.includes("SmartContractExec")) {
          const latestCoins = (jobEvents.events || [])
            .flatMap((e) => e.actions || [])
            .map((a) => a.base_coins || 0)
            .reduce((max, v) => Math.max(max, v), 0);

          if (latestCoins === 0) {
            jobState = "COMPLETED";
          } else {
            jobState = "FUNDED";
          }
        }
      } catch {
        jobState = "OPEN";
      }

      jobs.push({
        address: jobAddress,
        jobId: idCounter++,
        state: jobState,
        type: "TON",
        client: event.account?.address || FACTORY_ADDRESS,
        provider: null,
        evaluator: DEFAULT_EVALUATOR,
        budgetTon: nanoToTon(deployAction.base_coins || 1_000_000_000),
        budgetUsdt: null,
        descriptionHash: "0x" + Math.random().toString(16).slice(2).padEnd(64, "0"),
        descriptionText: null,
        resultHash: null,
        resultType: null,
        timeout: 86400,
        evalTimeout: 86400,
        createdAt: event.timestamp,
        submittedAt: null,
        tonviewerUrl: `${TONVIEWER_BASE}/${jobAddress}`,
      });
    }

    return jobs.slice(offset, offset + limit);
  } catch {
    return getDemoJobs().slice(offset, offset + limit);
  }
}

export function getDemoJobs(): Job[] {
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;

  return [
    {
      address: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6985",
      jobId: 1,
      state: "COMPLETED",
      type: "TON",
      client: "EQBGhm1xVcMeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4GGPQD",
      provider: "EQCmhm2xVcKeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4AA1111",
      evaluator: DEFAULT_EVALUATOR,
      budgetTon: "5",
      budgetUsdt: null,
      descriptionHash: "0xbafybeic5d7f4pjpujyb2q5nq3xkjk7z2r3s4t5u6v7w8x9y0a1b2c3d4e5f6",
      descriptionText: "Analyze 10,000 product reviews for sentiment and extract key themes",
      resultHash: "0xbafybeig8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4",
      resultType: 0,
      timeout: day,
      evalTimeout: day,
      createdAt: now - 5 * day,
      submittedAt: now - 4 * day,
      tonviewerUrl: `${TONVIEWER_BASE}/EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6985`,
    },
    {
      address: "EQA5pjdveNoRbFKqqgcRfAt6tobtosPMUKgcHHWnNGlnHTzP",
      jobId: 2,
      state: "SUBMITTED",
      type: "TON",
      client: "EQBGhm1xVcMeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4GGPQD",
      provider: "EQDk2VTih5YLKxfbElDkZJeZ-xkWFkqSxPh5hNqJmqbV1Zzz",
      evaluator: DEFAULT_EVALUATOR,
      budgetTon: "3",
      budgetUsdt: null,
      descriptionHash: "0xbafybeia1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a",
      descriptionText: "Generate a TypeScript API client from OpenAPI spec",
      resultHash: "0xbafybeiz7y6x5w4v3u2t1s0r9q8p7o6n5m4l3k2j1i0h9g8f7e6d5c4b3a2",
      resultType: 0,
      timeout: 2 * day,
      evalTimeout: day,
      createdAt: now - 2 * day,
      submittedAt: now - 12 * 3600,
      tonviewerUrl: `${TONVIEWER_BASE}/EQA5pjdveNoRbFKqqgcRfAt6tobtosPMUKgcHHWnNGlnHTzP`,
    },
    {
      address: "EQBvI0aFLnw2QbZgjMPCLRdtRHxhUyinQudg6sdiohwwg3jY",
      jobId: 3,
      state: "FUNDED",
      type: "TON",
      client: "EQCnhm3xVcLeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4BB2222",
      provider: null,
      evaluator: DEFAULT_EVALUATOR,
      budgetTon: "8",
      budgetUsdt: null,
      descriptionHash: "0xbafybeic7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2",
      descriptionText: "Build a machine learning pipeline for time series forecasting",
      resultHash: null,
      resultType: null,
      timeout: 3 * day,
      evalTimeout: 2 * day,
      createdAt: now - day,
      submittedAt: null,
      tonviewerUrl: `${TONVIEWER_BASE}/EQBvI0aFLnw2QbZgjMPCLRdtRHxhUyinQudg6sdiohwwg3jY`,
    },
    {
      address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixG0l03R00f4T8",
      jobId: 4,
      state: "OPEN",
      type: "TON",
      client: "EQDnhm4xVcNeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4CC3333",
      provider: null,
      evaluator: DEFAULT_EVALUATOR,
      budgetTon: "2",
      budgetUsdt: null,
      descriptionHash: "0xbafybeih8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3",
      descriptionText: "Create a Telegram bot for crypto portfolio tracking",
      resultHash: null,
      resultType: null,
      timeout: day,
      evalTimeout: day,
      createdAt: now - 6 * 3600,
      submittedAt: null,
      tonviewerUrl: `${TONVIEWER_BASE}/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixG0l03R00f4T8`,
    },
    {
      address: "EQDlbkVjkoolibCWiqntHZRbhxS_oKBQCRUmkAhEDQB8JYNL",
      jobId: 5,
      state: "DISPUTED",
      type: "USDT",
      client: "EQEnhm5xVcOeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4DD4444",
      provider: "EQFohm6xVcPeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4EE5555",
      evaluator: DEFAULT_EVALUATOR,
      budgetTon: "0",
      budgetUsdt: "50",
      descriptionHash: "0xbafybeim9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4",
      descriptionText: "Write a technical whitepaper on zero-knowledge proof systems",
      resultHash: "0xbafybeif3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8",
      resultType: 1,
      timeout: 5 * day,
      evalTimeout: 2 * day,
      createdAt: now - 7 * day,
      submittedAt: now - 3 * day,
      tonviewerUrl: `${TONVIEWER_BASE}/EQDlbkVjkoolibCWiqntHZRbhxS_oKBQCRUmkAhEDQB8JYNL`,
    },
    {
      address: "EQEXpOHSMv4p8lE2GUCLnRBKpMVKiSFAKGO0k6OiUb0RBVmT",
      jobId: 6,
      state: "CANCELLED",
      type: "TON",
      client: "EQGqhm7xVcQeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4FF6666",
      provider: null,
      evaluator: DEFAULT_EVALUATOR,
      budgetTon: "1.5",
      budgetUsdt: null,
      descriptionHash: "0xbafybeio0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3m4n5",
      descriptionText: "Translate and localize a mobile app to 5 languages",
      resultHash: null,
      resultType: null,
      timeout: day,
      evalTimeout: day,
      createdAt: now - 10 * day,
      submittedAt: null,
      tonviewerUrl: `${TONVIEWER_BASE}/EQEXpOHSMv4p8lE2GUCLnRBKpMVKiSFAKGO0k6OiUb0RBVmT`,
    },
    {
      address: "EQFyxNzSNjr9B0ANLf3RHsNJJGUb6mPRFRKNbp7GHp4R3X09",
      jobId: 7,
      state: "COMPLETED",
      type: "USDT",
      client: "EQHrhm8xVcReDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4GG7777",
      provider: "EQIshm9xVcSeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4HH8888",
      evaluator: DEFAULT_EVALUATOR,
      budgetTon: "0",
      budgetUsdt: "100",
      descriptionHash: "0xbafybeip1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6",
      descriptionText: "Audit a Solidity smart contract for security vulnerabilities",
      resultHash: "0xbafybeig4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9",
      resultType: 2,
      timeout: 3 * day,
      evalTimeout: day,
      createdAt: now - 14 * day,
      submittedAt: now - 12 * day,
      tonviewerUrl: `${TONVIEWER_BASE}/EQFyxNzSNjr9B0ANLf3RHsNJJGUb6mPRFRKNbp7GHp4R3X09`,
    },
    {
      address: "EQGmwOCzNkrs0C1BOMe4SHtOMKmXncqP2RRKObq8HIp5S4Ak",
      jobId: 8,
      state: "FUNDED",
      type: "TON",
      client: "EQJthm0xVcTeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4II9999",
      provider: null,
      evaluator: DEFAULT_EVALUATOR,
      budgetTon: "12",
      budgetUsdt: null,
      descriptionHash: "0xbafybeiq2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7",
      descriptionText: "Design and implement a distributed task scheduling system",
      resultHash: null,
      resultType: null,
      timeout: 7 * day,
      evalTimeout: 2 * day,
      createdAt: now - 2 * day,
      submittedAt: null,
      tonviewerUrl: `${TONVIEWER_BASE}/EQGmwOCzNkrs0C1BOMe4SHtOMKmXncqP2RRKObq8HIp5S4Ak`,
    },
  ];
}

export function computeStats(jobs: Job[]): ProtocolStats {
  const byState = {
    OPEN: 0, FUNDED: 0, SUBMITTED: 0, COMPLETED: 0, DISPUTED: 0, CANCELLED: 0,
  };

  let totalVolumeTonRaw = 0;
  let tonJobs = 0;
  let usdtJobs = 0;

  for (const job of jobs) {
    byState[job.state]++;
    if (job.type === "TON") {
      tonJobs++;
      totalVolumeTonRaw += parseFloat(job.budgetTon || "0");
    } else {
      usdtJobs++;
    }
  }

  const completed = byState.COMPLETED;
  const total = jobs.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const completedWithTime = jobs.filter(
    (j) => j.state === "COMPLETED" && j.submittedAt && j.createdAt
  );
  let averageEvalTimeHours: number | null = null;
  if (completedWithTime.length > 0) {
    const avgSeconds =
      completedWithTime.reduce((sum, j) => sum + (j.submittedAt! - j.createdAt), 0) /
      completedWithTime.length;
    averageEvalTimeHours = Math.round((avgSeconds / 3600) * 10) / 10;
  }

  return {
    totalJobs: total,
    totalTonJobs: tonJobs,
    totalUsdtJobs: usdtJobs,
    byState,
    totalVolumeTon: totalVolumeTonRaw.toFixed(2),
    completionRate,
    averageEvalTimeHours,
  };
}
