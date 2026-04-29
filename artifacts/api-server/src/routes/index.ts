import { Router, type IRouter } from "express";
import healthRouter        from "./health";
import jobsRouter          from "./jobs";
import statsRouter         from "./stats";
import arbitrageRouter     from "./arbitrage";
import referralRouter      from "./referral";
import billingRouter       from "./billing";
import agentRouter         from "./agent";
import analyzeRouter       from "./analyze";
import vulnerabilitiesRouter from "./vulnerabilities";
import activityRouter      from "./activity";
import monetizationRouter  from "./monetization";
import tonRouter           from "./ton-routes";
import aiEvolutionRouter   from "./ai-evolution";
import webhookRouter       from "./webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jobsRouter);
router.use(statsRouter);
router.use(arbitrageRouter);
router.use(referralRouter);
router.use(billingRouter);
router.use(agentRouter);
router.use(analyzeRouter);
router.use(vulnerabilitiesRouter);
router.use(activityRouter);
router.use(monetizationRouter);
router.use(tonRouter);
router.use(aiEvolutionRouter);
router.use(webhookRouter);

export default router;
