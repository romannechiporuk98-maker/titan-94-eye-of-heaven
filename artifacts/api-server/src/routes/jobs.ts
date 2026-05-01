import { Router, type IRouter } from "express";
import {
  ListJobsQueryParams,
  GetJobParams,
  CreateJobLinkBody,
} from "@workspace/api-zod";
import {
  fetchFactoryEvents,
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
  if (state) filtered = filtered.filter((j) => j.state === state);
  if (type)  filtered = filtered.filter((j) => j.type  === type);
  const total = filtered.length;
  const page  = filtered.slice(offset, offset + limit);
  return { jobs: page, total, offset, limit };
}

router.get("/jobs", async (req, res) => {
  const parseResult = ListJobsQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: "BadRequest", message: parseResult.error.message });
    return;
  }

  const { state, type, limit = 20, offset = 0 } = parseResult.data;
  const allJobs = await fetchFactoryEvents(100, 0);
  const result  = filterAndPaginate(allJobs, state, type, limit, offset);
  res.json({ ...result, source: allJobs.length > 0 ? "live" : "empty" });
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

router.get("/jobs/:address", async (req, res) => {
  const parseResult = GetJobParams.safeParse(req.params);
  if (!parseResult.success) {
    res.status(400).json({ error: "BadRequest", message: parseResult.error.message });
    return;
  }

  const { address } = parseResult.data;
  const allJobs = await fetchFactoryEvents(100, 0);
  const job = allJobs.find((j) => j.address === address);

  if (!job) {
    return res.status(404).json({ error: "Job not found", address, tonviewerUrl: `${TONVIEWER_BASE}/${address}` });
  }

  res.json(job);
});

export default router;
