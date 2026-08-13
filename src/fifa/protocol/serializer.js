// Serializer do protocolo FIFA 19.
//
// V0.2: formato JSON provisório e controlado. NÃO é o formato real do FIFA 19
// (ainda não confirmado). Quando o formato real for descoberto, a implementação
// deve ser trocada aqui sem afetar a camada de adapter.
//
// TODO: formato real do protocolo (compatibilidade binária/compressão).

export function serialize(envelope) {
  return JSON.stringify(envelope);
}

export function serializeError(error) {
  return JSON.stringify({
    status: "error",
    error: {
      code: error?.code || "INTERNAL",
      message: error?.message || "Erro interno"
    }
  });
}
