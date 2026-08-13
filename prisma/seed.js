// Seed da V0.2: catálogo (PlayerDefinition), usuário demo, clube, cartas
// (PlayerCard) e posse/inventário (ClubPlayer).
//
// Observação: o modelo do catálogo é PlayerDefinition, mas a tabela continua
// sendo "Player" (via @@map) para preservar os dados da V0.1.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const players = [
  { id: 1001, name: "Neymar Jr", rating: 92, position: "LW", nation: "Brazil", clubName: "Paris Saint-Germain" },
  { id: 1002, name: "Lionel Messi", rating: 94, position: "RW", nation: "Argentina", clubName: "FC Barcelona" },
  { id: 1003, name: "Cristiano Ronaldo", rating: 94, position: "ST", nation: "Portugal", clubName: "Real Madrid" },
  { id: 1004, name: "Kylian Mbappe", rating: 84, position: "ST", nation: "France", clubName: "Paris Saint-Germain" },
  { id: 1005, name: "Luka Modric", rating: 91, position: "CM", nation: "Croatia", clubName: "Real Madrid" }
];

async function main() {
  // Catálogo global: "quem é Neymar?" (PlayerDefinition → tabela "Player").
  for (const player of players) {
    await prisma.playerDefinition.upsert({
      where: { id: player.id },
      update: player,
      create: player
    });
  }

  const passwordHash = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      username: "demo",
      passwordHash
    }
  });

  const club = await prisma.club.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: "FUT 19 Demo Club",
      coins: 10000
    }
  });

  // Cartas + inventário: para cada jogador de exemplo, garante uma PlayerCard
  // do clube e o registro de posse (ClubPlayer).
  for (const player of players.slice(0, 3)) {
    const existingCard = await prisma.playerCard.findFirst({
      where: {
        playerDefinitionId: player.id,
        ownerClubId: club.id
      }
    });

    const playerCard =
      existingCard ??
      (await prisma.playerCard.create({
        data: {
          playerDefinitionId: player.id,
          ownerClubId: club.id,
          contracts: 7,
          status: "active"
        }
      }));

    await prisma.clubPlayer.upsert({
      where: {
        clubId_playerCardId: {
          clubId: club.id,
          playerCardId: playerCard.id
        }
      },
      update: {},
      create: {
        clubId: club.id,
        playerCardId: playerCard.id
      }
    });
  }

  await prisma.squad.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      clubId: club.id,
      name: "Elenco Principal"
    }
  });

  console.log("Seed concluído.");
  console.log("Usuário demo: demo / admin123");
  console.log(`Clube: ${club.name} (userId=${user.id}, clubId=${club.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
