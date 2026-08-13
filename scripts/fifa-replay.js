// CLI de replay: reproduz uma captura através do FIFA19Adapter usando os
// serviços reais (ClubService/CatalogService com Prisma).
//
// Uso:
//   node scripts/fifa-replay.js            # captura "demo-club"
//   node scripts/fifa-replay.js <capturaId>

import { PrismaClient } from "@prisma/client";
import { ClubService } from "../src/services/club.service.js";
import { CatalogService } from "../src/services/catalog.service.js";
import { PlayerService } from "../src/services/player.service.js";
import { FIFA19Adapter } from "../src/fifa/adapter/index.js";
import { FifaSessionService } from "../src/fifa/session/session.service.js";
import { MemorySessionStore } from "../src/fifa/session/session.store.js";
import { CaptureRequestStore } from "../src/fifa/capture/request-store.js";
import { ReplayEngine } from "../src/fifa/capture/replay.js";

const prisma = new PrismaClient();
const captureId = process.argv[2] || "demo-club";

async function main() {
  const services = {
    clubService: new ClubService(prisma),
    catalogService: new CatalogService(prisma),
    playerService: new PlayerService(prisma)
  };

  const sessionService = new FifaSessionService({
    store: new MemorySessionStore()
  });
  const adapter = new FIFA19Adapter({ services, sessionService });
  const store = new CaptureRequestStore();
  const engine = new ReplayEngine({ adapter, store });

  const result = await engine.replay(captureId);

  console.log(JSON.stringify(result.response, null, 2));
  console.log("\n--- Checks ---");
  for (const check of result.checks) {
    console.log(
      `${check.ok ? "PASS" : "FAIL"} ${check.path}: esperado=${JSON.stringify(
        check.expected
      )} obtido=${JSON.stringify(check.actual)}`
    );
  }
  console.log(`\nResultado: ${result.matched ? "MATCH" : "MISMATCH"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
