import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";

import { config } from "./config.js";
import { prisma } from "./db.js";

import { ClubService } from "./services/club.service.js";
import { CatalogService } from "./services/catalog.service.js";
import { PlayerService } from "./services/player.service.js";

import { FIFA19Adapter } from "./fifa/adapter/index.js";
import { FifaSessionService } from "./fifa/session/session.service.js";
import { MemorySessionStore } from "./fifa/session/session.store.js";
import { CaptureRequestStore } from "./fifa/capture/request-store.js";
import { CaptureLogger } from "./fifa/capture/logger.js";
import { ReplayEngine } from "./fifa/capture/replay.js";

import authRoutes from "./routes/auth.routes.js";
import clubRoutes from "./routes/club.routes.js";
import playerRoutes from "./routes/player.routes.js";
import futRoutes from "./routes/fut.routes.js";
import fifaRoutes from "./routes/fifa.routes.js";

const app = Fastify({
  logger: true
});

await app.register(cors, {
  origin: config.corsOrigin
});

await app.register(jwt, {
  secret: config.jwtSecret
});

// Services de domínio FUT (com injeção de dependência para testes).
const services = {
  clubService: new ClubService(prisma),
  catalogService: new CatalogService(prisma),
  playerService: new PlayerService(prisma)
};

// Camada FIFA.
const sessionService = new FifaSessionService({ store: new MemorySessionStore() });
const adapter = new FIFA19Adapter({ services, sessionService });
const captureStore = new CaptureRequestStore(config.captureDir);
const captureLogger = new CaptureLogger({
  enabled: config.captureEnabled,
  store: captureStore
});
const replayEngine = new ReplayEngine({ adapter, store: captureStore });

app.get("/health", async () => ({
  status: "ok",
  game: "FIFA 19",
  service: "fut19-server",
  version: "0.2.0"
}));

await app.register(authRoutes);
await app.register(clubRoutes, { clubService: services.clubService });
await app.register(playerRoutes, { playerService: services.playerService });
await app.register(futRoutes, { adapter });
await app.register(fifaRoutes, {
  adapter,
  sessionService,
  captureStore,
  replayEngine,
  captureLogger
});

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  const statusCode = error.statusCode || 500;

  reply.code(statusCode).send({
    error: statusCode === 500 ? "Internal server error" : error.message
  });
});

try {
  await app.listen({
    host: config.host,
    port: config.port
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}