// Camada de sessões do cliente FIFA.
//
// A sessão FIFA é DIFERENTE do JWT usado pela API web interna. Este serviço
// apenas modela o conceito (id, userId, platform, gameVersion, createdAt,
// expiresAt, metadata). O mecanismo real de sessão do FIFA 19 ainda não foi
// confirmado — a abstração permite trocar o formato sem reestruturar o domínio.

import { randomUUID } from "node:crypto";
import { MemorySessionStore } from "./session.store.js";

export const DEFAULT_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2h provisórias

export class SessionError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "SessionError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const SESSION_ERROR_CODES = Object.freeze({
  NOT_FOUND: "SESSION_NOT_FOUND",
  EXPIRED: "SESSION_EXPIRED"
});

export class FifaSessionService {
  constructor({ store, sessionTtlMs = DEFAULT_SESSION_TTL_MS, now } = {}) {
    this.store = store ?? new MemorySessionStore();
    this.sessionTtlMs = sessionTtlMs;
    this.now = now ?? (() => new Date());
  }

  async createSession({ userId, platform, gameVersion, metadata = {} }) {
    const createdAt = this.now();
    const expiresAt = new Date(createdAt.getTime() + this.sessionTtlMs);

    const session = {
      id: randomUUID(),
      userId,
      platform: platform ?? null,
      gameVersion: gameVersion ?? null,
      metadata,
      createdAt,
      expiresAt
    };

    await this.store.create(session);
    return session;
  }

  async getSession(id) {
    return this.store.get(id);
  }

  async destroySession(id) {
    return this.store.delete(id);
  }

  async listSessions() {
    return this.store.list();
  }

  async validateSession(id) {
    const session = await this.store.get(id);

    if (!session) {
      throw new SessionError(
        SESSION_ERROR_CODES.NOT_FOUND,
        "Sessão FIFA não encontrada",
        404
      );
    }

    if (this.now().getTime() > new Date(session.expiresAt).getTime()) {
      throw new SessionError(
        SESSION_ERROR_CODES.EXPIRED,
        "Sessão FIFA expirada",
        401
      );
    }

    return session;
  }
}
