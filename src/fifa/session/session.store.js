// Armazenamento de sessões FIFA.
//
// V0.2: implementação em memória. A interface SessionStore permite substituir
// o armazenamento por Redis (TODO) sem alterar o FifaSessionService.

export class SessionStore {
  // Interface. Implementações devem sobrescrever estes métodos.
  async create() {
    throw new Error("SessionStore.create não implementado");
  }
  async get() {
    throw new Error("SessionStore.get não implementado");
  }
  async delete() {
    throw new Error("SessionStore.delete não implementado");
  }
  async list() {
    throw new Error("SessionStore.list não implementado");
  }
}

export class MemorySessionStore extends SessionStore {
  constructor() {
    super();
    this._sessions = new Map();
  }

  async create(session) {
    this._sessions.set(session.id, session);
    return session;
  }

  async get(id) {
    return this._sessions.get(id) ?? null;
  }

  async delete(id) {
    return this._sessions.delete(id);
  }

  async list() {
    return [...this._sessions.values()];
  }
}

// TODO: RedisSessionStore (ex.: usar ioredis) quando houver necessidade de
// compartilhar sessões entre processos.
