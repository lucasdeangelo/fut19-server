import { test } from "node:test";
import assert from "node:assert/strict";

import { FifaSessionService, SessionError, SESSION_ERROR_CODES } from "../src/fifa/session/session.service.js";
import { MemorySessionStore } from "../src/fifa/session/session.store.js";

// Base fixa para permitir controle do tempo nos testes.
function fixedNow(iso) {
  const date = new Date(iso);
  return () => date;
}

test("createSession cria sessão com campos e TTL aplicado", async () => {
  const now = fixedNow("2026-08-12T12:00:00Z");
  const service = new FifaSessionService({
    store: new MemorySessionStore(),
    sessionTtlMs: 1000,
    now
  });

  const session = await service.createSession({
    userId: 42,
    platform: "PS4",
    gameVersion: "1.0"
  });

  assert.ok(session.id);
  assert.equal(session.userId, 42);
  assert.equal(session.platform, "PS4");
  assert.equal(session.gameVersion, "1.0");
  assert.deepEqual(session.metadata, {});
  assert.equal(session.createdAt.toISOString(), "2026-08-12T12:00:00.000Z");
  assert.equal(session.expiresAt.toISOString(), "2026-08-12T12:00:01.000Z");
});

test("validateSession devolve sessão válida", async () => {
  const now = fixedNow("2026-08-12T12:00:00Z");
  const service = new FifaSessionService({ now });
  const { id } = await service.createSession({ userId: 1 });
  const session = await service.validateSession(id);
  assert.equal(session.userId, 1);
});

test("validateSession lança SESSION_NOT_FOUND para id inexistente", async () => {
  const service = new FifaSessionService();
  await assert.rejects(
    () => service.validateSession("nao-existe"),
    (error) =>
      error instanceof SessionError &&
      error.code === SESSION_ERROR_CODES.NOT_FOUND &&
      error.statusCode === 404
  );
});

test("validateSession lança SESSION_EXPIRED após o TTL", async () => {
  let current = new Date("2026-08-12T12:00:00Z");
  const service = new FifaSessionService({
    sessionTtlMs: 1000,
    now: () => current
  });

  const { id } = await service.createSession({ userId: 1 });
  assert.equal((await service.validateSession(id)).userId, 1);

  // Avança o relógio para depois do TTL.
  current = new Date("2026-08-12T12:00:02Z");

  await assert.rejects(
    () => service.validateSession(id),
    (error) =>
      error instanceof SessionError &&
      error.code === SESSION_ERROR_CODES.EXPIRED &&
      error.statusCode === 401
  );
});

test("destroySession remove a sessão", async () => {
  const service = new FifaSessionService();
  const { id } = await service.createSession({ userId: 1 });
  assert.equal(await service.destroySession(id), true);
  assert.equal(await service.destroySession(id), false);
});

test("listSessions lista sessões ativas", async () => {
  const service = new FifaSessionService();
  await service.createSession({ userId: 1 });
  await service.createSession({ userId: 2 });
  const sessions = await service.listSessions();
  assert.equal(sessions.length, 2);
});
