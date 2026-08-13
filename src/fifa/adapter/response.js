// Transforma a resposta interna de um serviço FUT no formato esperado pelo
// protocolo (envelope). V0.2: envelope JSON provisório — o formato real do
// protocolo será implementado em protocol/serializer.js quando confirmado.

export class ResponseMapper {
  wrap(result, request) {
    return {
      status: "ok",
      requestId: request?.id ?? null,
      data: result
    };
  }

  wrapError(error, request) {
    return {
      status: "error",
      requestId: request?.id ?? null,
      error: {
        code: error?.code || "INTERNAL",
        message: error?.message || "Erro interno"
      }
    };
  }
}
