import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { rateLimitMiddleware, armSentinel } from "./services/sentinel";
import { isKillSwitched } from "./services/mirror";

armSentinel();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Anti-DDoS rate limiter for /api routes (creator can flip kill-switch)
app.use("/api", (req, res, next) => {
  if (isKillSwitched() && !req.path.startsWith("/mirror")) {
    return res.status(503).json({ error: "Protocol-94 kill-switch active — creator-only mode" });
  }
  next();
});
app.use("/api", rateLimitMiddleware);

app.use("/api", router);

export default app;
