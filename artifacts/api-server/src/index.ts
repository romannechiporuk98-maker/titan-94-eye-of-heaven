import app from "./app";
import { logger } from "./lib/logger";
import { startHeartbeat } from "./services/heartbeat";
import { ensureLoaded as loadSecrets } from "./services/secrets";

const rawPort = process.env["PORT"];

if (!rawPort) {
  logger.error("PORT env var missing — defaulting to 8080");
}

const port = Number(rawPort || "8080");

// ── Watchdog: keep process alive forever ──────────────────────────────────
// If something somehow unregisters all listeners, this prevents Node from exiting.
setInterval(() => {}, 1_000 * 60 * 60).unref();

function startServer(attempt = 1): void {
  const server = app.listen(port, () => {
    logger.info({ port }, "TITAN-94 API Server listening");
    loadSecrets()
      .then(() => startHeartbeat())
      .catch((e) => {
        logger.error({ err: e }, "secrets load failed — starting heartbeat anyway");
        startHeartbeat();
      });
  });

  server.on("error", (err: any) => {
    // EADDRINUSE on first attempt — wait 2s and retry (Replit sometimes reuses port)
    if (err.code === "EADDRINUSE" && attempt <= 5) {
      logger.warn({ port, attempt }, "Port busy — retrying in 2s");
      setTimeout(() => startServer(attempt + 1), 2000);
    } else {
      // Log but NEVER exit — sentinel will keep cycles running
      logger.error({ err: err.message, attempt }, "Server listen error — STAYING ALIVE");
    }
  });
}

startServer();
