// Clube / Inventário: dados pertencentes ao usuário.
// Responde "qual carta do Neymar pertence ao usuário?" — o catálogo global
// ("quem é Neymar?") fica no CatalogService.

import { prisma } from "../db.js";

export class ClubService {
  constructor(db = prisma) {
    this.db = db;
  }

  async getClub(userId) {
    const club = await this.db.club.findUnique({
      where: { userId },
      include: {
        players: {
          include: { playerCard: { include: { playerDefinition: true } } }
        },
        squads: true
      }
    });

    if (!club) return null;

    return this.#withInventoryShape(club);
  }

  // Formato agregado usado pelo adapter/primeiro fluxo FUT.
  async getClubInventory(userId) {
    const club = await this.getClub(userId);
    if (!club) return null;

    return {
      club: {
        id: club.id,
        name: club.name,
        coins: club.coins,
        fifaPoints: club.fifaPoints
      },
      playerCards: club.players.map((p) => p.playerCard),
      playerCount: club.players.length
    };
  }

  async getClubPlayers(userId) {
    const club = await this.getClub(userId);
    return club?.players ?? [];
  }

  async getClubSquads(userId) {
    const club = await this.db.club.findUnique({
      where: { userId },
      include: { squads: true }
    });
    return club?.squads ?? [];
  }

  // Preserva o formato exposto pela V0.1 (item de inventário com `player`) e
  // adiciona `playerCard` com o mesmo jogador embutido.
  #withInventoryShape(club) {
    return {
      ...club,
      players: club.players.map(({ playerCard, ...item }) => {
        const { playerDefinition, ...cardRest } = playerCard;
        return {
          ...item,
          player: playerDefinition,
          playerCard: { ...cardRest, player: playerDefinition }
        };
      })
    };
  }
}
