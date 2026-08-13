// Constantes do protocolo/serviços FIFA 19.
//
// IMPORTANTE: nada aqui deve ser inventado. Apenas informações confirmadas
// por observação do cliente real devem ser adicionadas (ver docs/protocol-mapping.md).
// Enquanto uma informação não estiver confirmada, mantenha a estrutura vazia
// com um TODO — não crie "fatos" especulativos.

export const GAME_ID = "fifa19";
export const PRODUCT_FUT = "FUT";

// TODO: plataformas confirmadas do cliente (ex.: PS4, XB1, PC) — nenhuma confirmada ainda.
export const CONFIRMED_PLATFORMS = [];

// TODO: endpoints/serviços reais usados pelo cliente — nenhum confirmado ainda.
// Quando confirmado, registrar em docs/protocol-mapping.md e refletir aqui.
export const CONFIRMED_ENDPOINTS = [];

// Nomes internos dos serviços FUT (não fazem parte do protocolo FIFA).
export const INTERNAL_SERVICE_NAMES = Object.freeze([
  "clubService",
  "catalogService",
  "playerService"
]);
