// Rotas de ferramentas de desenvolvimento para a camada FIFA.
//
// IMPORTANTE: estes endpoints NÃO são endpoints que o FIFA 19 utiliza. São
// ferramentas para observar, registrar e reproduzir o comportamento do cliente
// durante a pesquisa. O protocolo real será mapeado incrementalmente conforme
// confirmações (docs/protocol-mapping.md).

import { serialize } from "../fifa/protocol/serializer.js";

export default async function fifaRoutes(app, opts) {
  const { adapter, sessionService, captureStore, replayEngine, captureLogger } =
    opts;

  // Captura de tráfego de observação (apenas quando habilitada por config).
  if (captureLogger.enabled) {
    app.addHook("onRequest", async (request) => {
      captureLogger.begin(request);
    });
    app.addHook("onSend", async (request, reply, payload) => {
      captureLogger.setResponsePayload(request.id, payload);
    });
    app.addHook("onResponse", async (request, reply) => {
      await captureLogger.finalize(request, reply);
    });
  }

  // ---------- Sessões FIFA (diferentes do JWT da API web) ----------

  app.get("/fifa/session/status", async () => {
    const sessions = await sessionService.listSessions();
    return {
      store: "memory", // TODO: Redis
      sessions: sessions.length,
      sessionTtlMs: sessionService.sessionTtlMs
    };
  });

  app.post("/fifa/session", async (request, reply) => {
    const { userId, platform, gameVersion, metadata } = request.body ?? {};

    if (!userId) {
      return reply.code(400).send({
        error: "userId é obrigatório para criar uma sessão FIFA"
      });
    }

    return sessionService.createSession({ userId, platform, gameVersion, metadata });
  });

  app.delete("/fifa/session/:id", async (request, reply) => {
    const removed = await sessionService.destroySession(request.params.id);

    if (!removed) {
      return reply.code(404).send({ error: "Sessão não encontrada" });
    }

    return { removed: true, id: request.params.id };
  });

  // ---------- Adapter ----------

  app.get("/fifa/adapter/status", async () => {
    return {
      implemented: true,
      format: "json (provisional)", // TODO: formato real do protocolo
      mappedRoutes: adapter.listMappedRoutes()
    };
  });

  // Ferramenta de desenvolvimento: envia uma requisição "fifa-like" normalizada
  // { method, host, path, headers, body } para o FIFA19Adapter.
  app.post("/fifa/adapter/handle", async (request, reply) => {
    try {
      const envelope = await adapter.handle(request.body);
      return reply.type("application/json").send(serialize(envelope));
    } catch (error) {
      const envelope = adapter.responseMapper.wrapError(error, request.body);
      return reply
        .code(error.statusCode || 500)
        .type("application/json")
        .send(serialize(envelope));
    }
  });

  // ---------- Captura e replay ----------

  app.get("/fifa/captures", async () => captureStore.list());

  app.post("/fifa/replay", async (request, reply) => {
    const { captureId } = request.body ?? {};

    if (!captureId) {
      return reply.code(400).send({ error: "captureId é obrigatório" });
    }

    return replayEngine.replay(captureId);
  });
}
