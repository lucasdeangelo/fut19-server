export default async function playerRoutes(app, opts) {
  const { playerService } = opts;

  app.get("/players", async (request) => {
    const search = String(request.query?.search ?? "").trim();
    return playerService.searchPlayers({ search });
  });

  app.get("/players/:id", async (request, reply) => {
    const player = await playerService.getPlayer(Number(request.params.id));

    if (!player) {
      return reply.code(404).send({ error: "Jogador não encontrado" });
    }

    return player;
  });
}
