import { test } from "node:test";
import assert from "node:assert/strict";

import { ClubService } from "../src/services/club.service.js";

// Clube com o shape que o Prisma devolveria (relations resolvidas).
function makeClub() {
  return {
    id: 10,
    userId: 1,
    name: "FUT 19 Demo Club",
    coins: 10000,
    fifaPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    players: [
      {
        id: 1,
        clubId: 10,
        playerCardId: 100,
        playerCard: {
          id: 100,
          playerDefinitionId: 1001,
          ownerClubId: 10,
          contracts: 7,
          status: "active",
          createdAt: new Date(),
          playerDefinition: {
            id: 1001,
            name: "Neymar Jr",
            rating: 92,
            position: "LW",
            nation: "Brazil",
            clubName: "Paris Saint-Germain"
          }
        }
      },
      {
        id: 2,
        clubId: 10,
        playerCardId: 101,
        playerCard: {
          id: 101,
          playerDefinitionId: 1002,
          ownerClubId: 10,
          contracts: 7,
          status: "active",
          createdAt: new Date(),
          playerDefinition: {
            id: 1002,
            name: "Lionel Messi",
            rating: 94,
            position: "RW",
            nation: "Argentina",
            clubName: "FC Barcelona"
          }
        }
      }
    ],
    squads: [{ id: 1, clubId: 10, name: "Elenco Principal" }]
  };
}

function makeDb(club = makeClub()) {
  return {
    club: {
      findUnique: async () => club
    }
  };
}

test("getClub devolve clube com formato V0.1 preservado + playerCard", async () => {
  const service = new ClubService(makeDb());
  const club = await service.getClub(1);

  assert.equal(club.name, "FUT 19 Demo Club");
  assert.equal(club.players.length, 2);

  const item = club.players[0];
  // Formato V0.1: cada item tem `.player` (playerDefinition).
  assert.equal(item.player.name, "Neymar Jr");
  // Formato novo: `.playerCard` também expõe o jogador embutido.
  assert.equal(item.playerCard.player.name, "Neymar Jr");
  assert.equal(item.playerCard.contracts, 7);
});

test("getClub devolve null quando clube não existe", async () => {
  const service = new ClubService(makeDb(null));
  assert.equal(await service.getClub(999), null);
});

test("getClubInventory agrega clube e cartas", async () => {
  const service = new ClubService(makeDb());
  const inventory = await service.getClubInventory(1);

  assert.deepEqual(inventory.club, {
    id: 10,
    name: "FUT 19 Demo Club",
    coins: 10000,
    fifaPoints: 0
  });
  assert.equal(inventory.playerCount, 2);
  assert.equal(inventory.playerCards.length, 2);
  assert.equal(inventory.playerCards[0].id, 100);
});

test("getClubPlayers devolve lista de itens do inventário", async () => {
  const service = new ClubService(makeDb());
  const players = await service.getClubPlayers(1);
  assert.equal(players.length, 2);
  assert.equal(players[0].player.name, "Neymar Jr");
});

test("getClubSquads devolve elencos do clube", async () => {
  const service = new ClubService(makeDb());
  const squads = await service.getClubSquads(1);
  assert.equal(squads.length, 1);
  assert.equal(squads[0].name, "Elenco Principal");
});
