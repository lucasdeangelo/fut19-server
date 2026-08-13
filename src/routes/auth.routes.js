import { authenticateUser, registerUser } from "../services/auth.service.js";

export default async function authRoutes(app) {
  app.post("/auth/register", async (request, reply) => {
    const { username, password } = request.body ?? {};

    if (!username || !password || password.length < 6) {
      return reply.code(400).send({
        error: "username e password (mínimo 6 caracteres) são obrigatórios"
      });
    }

    const user = await registerUser(username, password);

    return reply.code(201).send({
      user: {
        id: user.id,
        username: user.username
      },
      club: user.club
    });
  });

  app.post("/auth/login", async (request, reply) => {
    const { username, password } = request.body ?? {};

    if (!username || !password) {
      return reply.code(400).send({
        error: "username e password são obrigatórios"
      });
    }

    const user = await authenticateUser(username, password);

    const token = await app.jwt.sign({
      sub: user.id,
      username: user.username
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username
      },
      club: user.club
    };
  });
}