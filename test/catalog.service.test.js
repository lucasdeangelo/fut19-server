import { test } from "node:test";
import assert from "node:assert/strict";

import { CatalogService } from "../src/services/catalog.service.js";

const PLAYERS = [
  { id: 1003, name: "Cristiano Ronaldo", rating: 94, position: "ST", nation: "Portugal", clubName: "Real Madrid" },
  { id: 1002, name: "Lionel Messi", rating: 94, position: "RW", nation: "Argentina", clubName: "FC Barcelona" },
  { id: 1001, name: "Neymar Jr", rating: 92, position: "LW", nation: "Brazil", clubName: "Paris Saint-Germain" }
];

// Mock do modelo playerDefinition (tabela "Player") do Prisma.
function makeDb() {
  const calls = [];
  return {
    playerDefinition: {
      findMany: async (args) => {
        calls.push(["findMany", args]);
        if (args?.where) {
          const term = args.where.OR[0].name.contains.toLowerCase();
          return PLAYERS.filter((p) => p.name.toLowerCase().includes(term));
        }
        return [...PLAYERS].sort((a, b) => b.rating - a.rating);
      },
      findUnique: async ({ where }) => PLAYERS.find((p) => p.id === where.id) ?? null
    },
    calls
  };
}

test("searchPlayers sem termo devolve todos ordenados por rating", async () => {
  const db = makeDb();
  const service = new CatalogService(db);

  const result = await service.searchPlayers();
  assert.equal(result.length, 3);
  assert.equal(result[0].rating, 94);
});

test("searchPlayers com termo filtra por nome/posição (insensitive)", async () => {
  const db = makeDb();
  const service = new CatalogService(db);

  const result = await service.searchPlayers({ search: "ronaldo" });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Cristiano Ronaldo");
});

test("getPlayer devolve definição por id", async () => {
  const service = new CatalogService(makeDb());
  const player = await service.getPlayer(1002);
  assert.equal(player.name, "Lionel Messi");
  assert.equal(await service.getPlayer(999), null);
});

test("listNations lista nações distintas ordenadas", async () => {
  const db = makeDb();
  const service = new CatalogService(db);
  const nations = await service.listNations();
  assert.deepEqual(nations, ["Argentina", "Brazil", "Portugal"]);
});

test("listPositions lista posições distintas ordenadas", async () => {
  const service = new CatalogService(makeDb());
  const positions = await service.listPositions();
  assert.deepEqual(positions, ["LW", "RW", "ST"]);
});

test("listClubNames lista clubes distintos ordenados", async () => {
  const service = new CatalogService(makeDb());
  const clubs = await service.listClubNames();
  assert.deepEqual(clubs, ["FC Barcelona", "Paris Saint-Germain", "Real Madrid"]);
});
