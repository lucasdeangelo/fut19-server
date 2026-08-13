// Replay: reproduz uma captura sem executar o FIFA 19.
//
// Fluxo:
//   1. carregar uma captura (CaptureRequestStore);
//   2. reconstruir o request (createFifaRequest);
//   3. passar pelo FIFA19Adapter;
//   4. executar o serviço interno;
//   5. gerar a resposta;
//   6. comparar com a resposta esperada registrada na captura.

import { createFifaRequest } from "../adapter/request.js";

export class ReplayEngine {
  constructor({ adapter, store }) {
    this.adapter = adapter;
    this.store = store;
  }

  async replay(captureId) {
    const capture = await this.store.load(captureId);

    if (capture.direction !== "request") {
      throw new Error(
        `Captura ${capture.id ?? captureId} não é um request (direction=${capture.direction})`
      );
    }

    const request = createFifaRequest(capture);

    let response;
    try {
      response = await this.adapter.handle(request);
    } catch (error) {
      response = this.adapter.responseMapper.wrapError(error, request);
    }

    const checks = compareExpected(capture.expected, response);

    return {
      capture: {
        id: capture.id ?? captureId,
        timestamp: capture.timestamp,
        method: capture.method,
        path: capture.path
      },
      request,
      response,
      checks,
      matched: checks.every((c) => c.ok)
    };
  }
}

// Compara a resposta produzida com a esperada usando checks por caminho
// (ex.: "data.club.coins"). O formato esperado é uma lista de verificações —
// intencionalmente tolerante a campos voláteis como timestamps/ids.
export function compareExpected(expected, response) {
  if (!expected?.match || typeof expected.match !== "object") {
    return [];
  }

  return Object.entries(expected.match).map(([path, expectedValue]) => {
    const actualValue = getPath(response, path);
    return {
      path,
      expected: expectedValue,
      actual: actualValue,
      ok: deepEqual(actualValue, expectedValue)
    };
  });
}

function getPath(obj, dottedPath) {
  return dottedPath.split(".").reduce(
    (acc, key) => (acc == null ? undefined : acc[key]),
    obj
  );
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
