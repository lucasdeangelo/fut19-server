// Normalização de um request específico do cliente em um envelope interno.
// Usa o parser do protocolo para a decodificação e adiciona metadados do envelope.

import { randomUUID } from "node:crypto";
import { parseRequest } from "../protocol/parser.js";

export function createFifaRequest(raw) {
  const parsed = parseRequest(raw);

  return {
    id: raw.id || randomUUID(),
    timestamp: raw.timestamp || new Date().toISOString(),
    ...parsed
  };
}
