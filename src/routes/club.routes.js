async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Não autenticado" });
  }
}

export default async function clubRoutes(app, opts) {
  const { clubService } = opts;

  app.get("/club", { onRequest: authenticate }, async (request, reply) => {
    const userId = Number(request.user.sub);

    const club = await clubService.getClub(userId);

    if (!club) {
      return reply.code(404).send({ error: "Clube não encontrado" });
    }

    return club;
  });

  app.get("/club/players", { onRequest: authenticate }, async (request) => {
    const userId = Number(request.user.sub);
    return clubService.getClubPlayers(userId);
  });

  app.get("/club/squads", { onRequest: authenticate }, async (request) => {
    const userId = Number(request.user.sub);
    return clubService.getClubSquads(userId);
  });
}
