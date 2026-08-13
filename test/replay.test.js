import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { FIFA19Adapter } from "../src/fifa/adapter/index.js";
import { CaptureRequestStore } from "../src/fifa/capture/request-store.js";
import { ReplayEngine, compareExpected } from "../src/fifa/capture/replay.js";

function makeAdapter() {
  const services = {
    clubService: {
      getClubInventory: async () => ({
        club: { id: 1, name: "FUT 19 Demo Club", coins: 10000, fifaPoints: 0 },
        playerCards: [{ id: 1 }, { id: 2 }, { id: 3 }],
        playerCount: 3
      })
    }
  };
  return new FIFA19Adapter({ services });
}

async function tempStore() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fut19-test-"));
  return { store: new CaptureRequestStore(dir), dir };
}

test("replay reproduz captura e compara com o esperado", async () => {
  const { store, dir } = await tempStore();

  try {
    await store.save({
      id: "demo-club",
      timestamp: "2026-08-12T12:00:00Z",
      direction: "request",
      method: "GET",
      host: "localhost:3000",
      path: "/dev/fut/club",
      body: { userId: 1 },
      expected: {
        match: {
          status: "ok",
          "data.club.name": "FUT 19 Demo Club",
          "data.club.coins": 10000,
          "data.playerCount": 3
        }
      }
    });

    const engine = new ReplayEngine({ adapter: makeAdapter(), store });
    const result = await engine.replay("demo-club");

    assert.equal(result.matched, true);
    assert.ok(result.checks.length > 0);
    assert.ok(result.checks.every((c) => c.ok));
    assert.equal(result.response.status, "ok");
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("replay registra mismatch quando a resposta difere do esperado", async () => {
  const { store, dir } = await tempStore();

  try {
    await store.save({
      id: "errada",
      timestamp: "2026-08-12T12:00:00Z",
      direction: "request",
      method: "GET",
      host: "localhost:3000",
      path: "/dev/fut/club",
      body: { userId: 1 },
      expected: {
        match: {
          status: "ok",
          "data.club.coins": 999999
        }
      }
    });

    const engine = new ReplayEngine({ adapter: makeAdapter(), store });
    const result = await engine.replay("errada");

    assert.equal(result.matched, false);
    const failed = result.checks.find((c) => !c.ok);
    assert.ok(failed);
    assert.equal(failed.path, "data.club.coins");
    assert.equal(failed.ok, false);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("replay rejeita captura que não seja request", async () => {
  const { store, dir } = await tempStore();

  try {
    await store.save({
      id: "response",
      direction: "response",
      method: "GET",
      host: "h",
      path: "/p"
    });

    const engine = new ReplayEngine({ adapter: makeAdapter(), store });
    await assert.rejects(() => engine.replay("response"), /não é um request/);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("compareExpected retorna lista vazia sem expected.match", () => {
  assert.deepEqual(compareExpected({}, { status: "ok" }), []);
  assert.deepEqual(
    compareExpected({ expected: { match: null } }, { status: "ok" }),
    []
  );
});
