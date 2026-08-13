// Registro de mapeamentos request → serviço interno (Request Mapper).
//
// V0.2: contém APENAS um mapeamento de desenvolvimento local usado para o
// fluxo de captura/replay. NENHUM endpoint real do FIFA 19 foi confirmado —
// não adicione mapeamentos especulativos aqui.
//
// Quando um serviço/rota real do cliente for confirmado (docs/protocol-mapping.md),
// registre o mapeamento correspondente neste array.

export function createDefaultRequestMapper() {
  return [
    {
      id: "dev.fut.club",
      description:
        "Rota de desenvolvimento local (/dev/fut/club) usada por capture/replay. NÃO é um endpoint do protocolo FIFA 19.",
      match: (request) => request.method === "GET" && request.path === "/dev/fut/club",
      map: (request) => ({
        serviceName: "clubService",
        method: "getClubInventory",
        args: [{ userId: Number(request.body?.userId) }]
      })
    }
    // TODO: adicionar mapeamentos conforme o protocolo real for confirmado.
  ];
}
