import { test } from "node:test";
import assert from "node:assert/strict";

import { parseRequest } from "../src/fifa/protocol/parser.js";

test("parseRequest normaliza um request capturado para a estrutura interna", () => {
  const parsed = parseRequest({
    method: "get",
    host: "localhost:3000",
    path: "/dev/fut/club",
    headers: { "content-type": "application/json" },
    query: {},
    body: { userId: 1 }
  });

  assert.equal(parsed.method, "GET");
  assert.equal(parsed.host, "localhost:3000");
  assert.equal(parsed.path, "/dev/fut/club");
  assert.deepEqual(parsed.headers, { "content-type": "application/json" });
  assert.deepEqual(parsed.body, { userId: 1 });
});

test("parseRequest aceita valores padrão para headers/query/body", () => {
  const parsed = parseRequest({ method: "GET", host: "h", path: "/p" });
  assert.deepEqual(parsed.headers, {});
  assert.deepEqual(parsed.query, {});
  assert.deepEqual(parsed.body, {});
});

test("parseRequest rejeita request sem method/path/host", () => {
  assert.throws(
    () => parseRequest({ method: "GET", path: "/p" }),
    /PROTOCOL_PARSE/
  );
  assert.throws(
    () => parseRequest({ method: "GET", host: "h" }),
    /PROTOCOL_PARSE/
  );
  assert.throws(() => parseRequest(null), /PROTOCOL_PARSE/);
});
