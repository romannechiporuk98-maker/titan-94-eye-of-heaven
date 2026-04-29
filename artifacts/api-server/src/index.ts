import app from "./app";
import { logger } from "./lib/logger";
import { startHeartbeat } from "./services/heartbeat";
import { ensureLoaded as loadSecrets } from "./services/secrets";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "TITAN-94 API Server listening");
  loadSecrets()
    .then(() => startHeartbeat())
    .catch((e) => { logger.error({ err: e }, "secrets load failed"); startHeartbeat(); });
});
