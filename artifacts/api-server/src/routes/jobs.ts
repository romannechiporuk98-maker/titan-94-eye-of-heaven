import { Router, type IRouter } from "express";
import {
  ListJobsQueryParams,
  GetJobParams,
  CreateJobLinkBody,
} from "@workspace/api-zod";
import {
  getDemoJobs,
  FACTORY_ADDRESS,
  JETTON_FACTORY_ADDRESS,
  DEFAULT_EVALUATOR,
  TONVIEWER_BASE,
  type Job,
} from "../lib/ton";

const router: IRouter = Router();

function filterAndPaginate(
  jobs: Job[],
  state?: string,
  type?: string,
  limit = 20,
  offset = 0
) {
  let filtered = jobs;
  if (state) {
    filtered = filtered.filter((j) => j.state === state);
  }
  if (type) {
    filtered = filtered.filter((j) => j.type === type);
  }
  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);
  return { jobs: page, total, offset, limit };
}

router.get("/jobs", (req, res) => {
  const parseResult = ListJobsQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: "BadRequest", message: parseResult.error.message });
    return;
  }

  const { state, type, limit = 20, offset = 0 } = parseResult.data;
  const allJobs = getDemoJobs();
  const result = filterAndPaginate(allJobs, state, type, limit, offset);
  res.json(result);
});

router.get("/jobs/create-link", (req, res) => {
  res.status(405).json({ error: "MethodNotAllowed", message: "Use POST /api/jobs/create-link" });
});

router.post("/jobs/create-link", (req, res) => {
  const parseResult = CreateJobLinkBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "BadRequest", message: parseResult.error.message });
    return;
  }

  const { evaluator, budgetTon, description, timeoutHours = 24, evalTimeoutHours = 24, jobType = "TON" } = parseResult.data;

  const factoryAddress = jobType === "USDT" ? JETTON_FACTORY_ADDRESS : FACTORY_ADDRESS;

  const budgetNano = BigInt(Math.round(parseFloat(budgetTon) * 1_000_000_000));
  const gasNano = BigInt(30_000_000);
  const totalNano = budgetNano + gasNano;

  const shortDesc = description.slice(0, 120);
  const memo = encodeURIComponent(
    `ENACT Job | eval:${evaluator.slice(0, 10)} | timeout:${timeoutHours}h | evalTimeout:${evalTimeoutHours}h | ${shortDesc}`
  );

  const tonkeeperLink = `https://app.tonkeeper.com/transfer/${factoryAddress}?amount=${totalNano}&text=${memo}`;

  const estimatedGas = "0.03";

  res.json({
    tonkeeperLink,
    factoryAddress,
    estimatedGas,
  });
});

router.get("/jobs/:address", (req, res) => {
  const parseResult = GetJobParams.safeParse(req.params);
  if (!parseResult.success) {
    res.status(400).json({ error: "BadRequest", message: parseResult.error.message });
    return;
  }

  const { address } = parseResult.data;
  const allJobs = getDemoJobs();
  const job = allJobs.find((j) => j.address === address);

  if (!job) {
    const mockJob: Job = {
      address,
      jobId: Math.floor(Math.random() * 1000) + 100,
      state: "OPEN",
      type: "TON",
      client: "EQBGhm1xVcMeDKqMpxnTFqkKhS1hfYvBk2m7Lqs2N4GGPQD",
      provider: null,
      evaluator: DEFAULT_EVALUATOR,
      budgetTon: "2",
      budgetUsdt: null,
      descriptionHash: "0x" + "a".repeat(64),
      descriptionText: null,
      resultHash: null,
      resultType: null,
      timeout: 86400,
      evalTimeout: 86400,
      createdAt: Math.floor(Date.now() / 1000) - 3600,
      submittedAt: null,
      tonviewerUrl: `${TONVIEWER_BASE}/${address}`,
    };
    res.json(mockJob);
    return;
  }

  res.json(job);
});

export default router;
