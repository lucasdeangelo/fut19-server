import { test } from "node:test";
import assert from "node:assert/strict";

import { serialize, serializeError } from "../src/fifa/protocol/serializer.js";

test("serialize converte envelope em JSON string", () => {
  const json = serialize({ status: "ok", requestId: "r1", data: { coins: 10 } });
  assert.equal(typeof json, "string");
  assert.deepEqual(JSON.parse(json), {
    status: "ok",
    requestId: "r1",
    data: { coins: 10 }
  });
});

test("serializeError gera envelope de erro", () => {
  const error = new Error("boom");
  error.code = "X";
  const json = serializeError(error);
  assert.deepEqual(JSON.parse(json), {
    status: "error",
    error: { code: "X", message: "boom" }
  });
});

test("serializeError usa valores padrão quando não há code/message", () => {
  const json = serializeError(new Error());
  assert.deepEqual(JSON.parse(json), {
    status: "error",
    error: { code: "INTERNAL", message: "Erro interno" }
  });
});
