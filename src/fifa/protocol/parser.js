// Parser de mensagens do protocolo FIFA 19.
//
// V0.2: NENHUM formato real de payload do FIFA 19 foi confirmado ainda.
// Este parser faz apenas uma normalização defensiva de um request capturado
// para a estrutura interna usada pelas demais camadas.
//
// TODO: quando o formato real (binário, compressão, campos específicos, etc.)
// for observado no cliente, implementar a decodificação aqui SEM quebrar a
// estrutura interna resultante (method, host, path, headers, query, body).

export function parseRequest(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("PROTOCOL_PARSE: request deve ser um objeto");
  }

  const method = typeof raw.method === "string" ? raw.method.toUpperCase() : "";
  const path = typeof raw.path === "string" ? raw.path : "";
  const host = typeof raw.host === "string" ? raw.host : "";

  if (!method || !path || !host) {
    throw new Error("PROTOCOL_PARSE: method, path e host são obrigatórios");
  }

  return {
    method,
    host,
    path,
    headers: raw.headers ?? {},
    query: raw.query ?? {},
    body: raw.body ?? {}
  };
}
