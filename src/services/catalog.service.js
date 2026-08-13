// Catálogo: dados globais do FUT, separados dos dados pertencentes ao usuário.
// Responde "quem é Neymar?" — não "qual carta do Neymar pertence ao usuário?".
// (Essa última responsabilidade é do ClubService/inventário.)

import { prisma } from "../db.js";

export class CatalogService {
  constructor(db = prisma) {
    this.db = db;
  }

  async searchPlayers({ search } = {}) {
    const term = String(search ?? "").trim();

    return this.db.playerDefinition.findMany({
      where: term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { position: { contains: term, mode: "insensitive" } }
            ]
          }
        : undefined,
      orderBy: { rating: "desc" },
      take: 100
    });
  }

  async getPlayer(id) {
    return this.db.playerDefinition.findUnique({ where: { id } });
  }

  async listPlayerDefinitions() {
    return this.db.playerDefinition.findMany({ orderBy: { rating: "desc" } });
  }

  async listNations() {
    const rows = await this.db.playerDefinition.findMany({
      distinct: ["nation"],
      select: { nation: true }
    });
    return rows.map((r) => r.nation).filter(Boolean).sort();
  }

  async listPositions() {
    const rows = await this.db.playerDefinition.findMany({
      distinct: ["position"],
      select: { position: true }
    });
    return rows.map((r) => r.position).filter(Boolean).sort();
  }

  async listClubNames() {
    const rows = await this.db.playerDefinition.findMany({
      distinct: ["clubName"],
      select: { clubName: true }
    });
    return rows.map((r) => r.clubName).filter(Boolean).sort();
  }
}
