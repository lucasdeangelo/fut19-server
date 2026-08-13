import bcrypt from "bcryptjs";
import { prisma } from "../db.js";

export async function registerUser(username, password) {
  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    const error = new Error("Usuário já existe");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      username,
      passwordHash,
      club: {
        create: {
          name: `${username}'s Club`,
          coins: 10000
        }
      }
    },
    include: { club: true }
  });
}

export async function authenticateUser(username, password) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { club: true }
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error("Credenciais inválidas");
    error.statusCode = 401;
    throw error;
  }

  return user;
}