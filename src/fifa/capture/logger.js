// Logger de captura: registra requests/responses observados durante a pesquisa.
//
// V0.2: apenas tráfego sob o prefixo /fifa (ponto de observação atual). A
// captura é habilitada por configuração (CAPTURE_ENABLED) e armazena em disco
// via CaptureRequestStore.
//
// REDACTION: campos sensíveis (senhas, tokens, cookies, etc.) nunca são
// gravados — ver SENSITIVE_HEADERS / redact().

import { randomUUID } from "node:crypto";

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "proxy-authorization",
  "x-auth-token",
  "x-ea-token",
  "x-session-id",
  "sessionid"
]);

// Chaves de corpo consideradas sensíveis (match por substring, case-insensitive).
const SENSITIVE_BODY_KEYS = [
  "password",
  "pass",
  "token",
  "secret",
  "credential",
  "session",
  "auth"
];

export function redact(value, key = "") {
  const lower = String(key).toLowerCase();

  if (SENSITIVE_BODY_KEYS.some((k) => lower.includes(k))) {
    return "[REDACTED]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, key));
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = redact(v, k);
    }
    return out;
  }

  return value;
}

export function redactHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    out[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }
  return out;
}

function tryParsePayload(payload) {
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload);
    } catch {
      return payload;
    }
  }
  return payload;
}

export class CaptureLogger {
  constructor({ enabled = false, store, prefix = "/fifa" } = {}) {
    this.enabled = enabled;
    this.store = store;
    this.prefix = prefix;
    this._pending = new Map();
  }

  shouldCapture(request) {
    return this.enabled && (request?.url ?? "").startsWith(this.prefix);
  }

  // Chamado no hook onRequest: guarda a parte de request da captura.
  begin(request) {
    if (!this.shouldCapture(request)) return null;

    const id = request.id || randomUUID();

    this._pending.set(id, {
      id,
      timestamp: new Date().toISOString(),
      direction: "request",
      method: request.method,
      host: request.hostname,
      path: request.url,
      headers: redactHeaders(request.headers)
    });

    return id;
  }

  // Chamado no hook onSend: registra o payload da resposta (antes do redact).
  setResponsePayload(requestId, payload) {
    const pending = this._pending.get(requestId);
    if (pending) {
      pending._responseBody = tryParsePayload(payload);
    }
  }

  // Chamado no hook onResponse: completa e grava a captura.
  async finalize(request, reply) {
    const pending = this._pending.get(request.id);
    if (!pending) return;

    this._pending.delete(request.id);

    const responseBody = pending._responseBody ?? {};
    delete pending._responseBody;

    pending.statusCode = reply.statusCode;
    pending.body = redact(request.body ?? {});
    pending.response = redact(responseBody);

    await this.store?.save(pending);
  }
}
