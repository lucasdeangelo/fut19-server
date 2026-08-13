// Gera uma captura de exemplo ("demo-club") usada pelo replay.
//
// A captura representa o request do primeiro fluxo FUT mapeado no adapter:
//   GET /dev/fut/club  →  clubService.getClubInventory(userId)
//
// O userId é resolvido dinamicamente a partir do usuário "demo" do seed,
// para que o replay funcione independente do id atribuído pelo banco.
//
// Uso: npm run fifa:capture

import { PrismaClient } from "@prisma/client";
import { CaptureRequestStore } from "../src/fifa/capture/request-store.js";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { username: "demo" } });

  if (!user) {
    throw new Error(
      'Usuário "demo" não encontrado. Execute "npm run seed" antes de capturar.'
    );
  }

  const store = new CaptureRequestStore();
  const capture = {
    id: "demo-club",
    timestamp: new Date().toISOString(),
    direction: "request",
    method: "GET",
    host: "localhost:3000",
    path: "/dev/fut/club",
    headers: {},
    query: {},
    body: { userId: user.id },
    expected: {
      match: {
        status: "ok",
        "data.club.name": "FUT 19 Demo Club",
        "data.club.coins": 10000,
        "data.playerCount": 3
      }
    }
  };

  const saved = await store.save(capture);
  console.log(`Captura demo gravada em ${saved.filePath}`);
  console.log("Para reproduzir: npm run fifa:replay");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
