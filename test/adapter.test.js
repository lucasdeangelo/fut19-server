import { test } from "node:test";
import assert from "node:assert/strict";

import { FIFA19Adapter } from "../src/fifa/adapter/index.js";
import { ProtocolError, ERROR_CODES } from "../src/fifa/adapter/errors.js";

function makeServices() {
  return {
    clubService: {
      getClubInventory: async ({ userId }) => ({
        club: { id: 1, name: "Demo", coins: 10000, fifaPoints: 0 },
        playerCards: [],
        playerCount: 0,
        userId
      })
    }
  };
}

const CLUB_REQUEST = {
  method: "GET",
  host: "localhost:3000",
  path: "/dev/fut/club",
  body: { userId: 7 }
};

test("handle executa serviço mapeado e devolve envelope ok", async () => {
  const adapter = new FIFA19Adapter({ services: makeServices() });
  const response = await adapter.handle(CLUB_REQUEST);

  assert.equal(response.status, "ok");
  assert.ok(response.requestId);
  assert.equal(response.data.club.coins, 10000);
  assert.equal(response.data.userId, 7);
});

test("handle lança ProtocolError para rota sem mapeamento", async () => {
  const adapter = new FIFA19Adapter({ services: makeServices() });
  await assert.rejects(
    () => adapter.handle({ method: "GET", host: "h", path: "/sem/rota" }),
    (error) =>
      error instanceof ProtocolError &&
      error.code === ERROR_CODES.UNMAPPED_ROUTE &&
      error.statusCode === 404
  );
});

test("handle lança ProtocolError para serviço desconhecido", async () => {
  const adapter = new FIFA19Adapter({
    services: { outro: { foo: async () => null } },
    requestMapper: [
      {
        id: "t.unknown.service",
        match: () => true,
        map: () => ({ serviceName: "inexistente", method: "foo" })
      }
    ]
  });

  await assert.rejects(
    () => adapter.handle(CLUB_REQUEST),
    (error) =>
      error instanceof ProtocolError &&
      error.code === ERROR_CODES.UNKNOWN_SERVICE
  );
});

test("handle lança ProtocolError para método desconhecido", async () => {
  const adapter = new FIFA19Adapter({
    services: { clubService: { foo: async () => null } },
    requestMapper: [
      {
        id: "t.unknown.method",
        match: () => true,
        map: () => ({ serviceName: "clubService", method: "naoExiste" })
      }
    ]
  });

  await assert.rejects(
    () => adapter.handle(CLUB_REQUEST),
    (error) =>
      error instanceof ProtocolError &&
      error.code === ERROR_CODES.UNKNOWN_METHOD
  );
});

test("addMapper permite registrar novos mapeamentos", async () => {
  const adapter = new FIFA19Adapter({ services: makeServices() });
  adapter.addMapper({
    id: "t.ping",
    description: "teste",
    match: (request) => request.path === "/dev/ping",
    map: () => ({ serviceName: "clubService", method: "getClubInventory", args: [{ userId: 1 }] })
  });

  const response = await adapter.handle({
    method: "GET",
    host: "h",
    path: "/dev/ping"
  });
  assert.equal(response.status, "ok");
});

test("listMappedRoutes retorna descrição dos mapeamentos", () => {
  const adapter = new FIFA19Adapter({ services: makeServices() });
  const routes = adapter.listMappedRoutes();
  assert.ok(routes.some((r) => r.id === "dev.fut.club"));
  assert.ok(routes.every((r) => typeof r.description === "string"));
});
