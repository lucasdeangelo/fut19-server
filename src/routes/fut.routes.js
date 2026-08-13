export default async function futRoutes(app, opts) {
  const { adapter } = opts ?? {};

  app.get("/fut/status", async () => {
    return {
      game: "FIFA 19",
      mode: "FUT",
      server: "private",
      version: "0.2.0",
      status: "experimental"
    };
  });

  // Status do adapter específico do cliente FIFA 19.
  app.get("/fut/adapter/status", async () => {
    return adapter
      ? {
          implemented: true,
          format: "json (provisional)",
          mappedRoutes: adapter.listMappedRoutes(),
          note: "FIFA19Adapter ativo. Formato de protocolo ainda não confirmado — apenas mapeamentos de desenvolvimento."
        }
      : {
          implemented: false,
          message: "FIFA 19 protocol adapter ainda não implementado"
        };
  });
}
