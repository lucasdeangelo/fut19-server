// Service de jogadores (definições de catálogo) usado pelos endpoints REST.
// Delega para o CatalogService para evitar duplicação de consultas.

import { prisma } from "../db.js";
import { CatalogService } from "./catalog.service.js";

export class PlayerService {
  constructor(db = prisma, catalog = new CatalogService(db)) {
    this.db = db;
    this.catalog = catalog;
  }

  async searchPlayers({ search } = {}) {
    return this.catalog.searchPlayers({ search });
  }

  async getPlayer(id) {
    return this.catalog.getPlayer(id);
  }
}
