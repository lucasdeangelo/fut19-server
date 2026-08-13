-- V0.2: separação conceitual PlayerDefinition → PlayerCard → ClubPlayer/Inventory.
--
-- Migração NÃO destrutiva:
--   1. cria a tabela PlayerCard (catálogo continua em "Player");
--   2. adiciona ClubPlayer.playerCardId (nullable);
--   3. faz backfill: cria uma PlayerCard por ClubPlayer existente e vincula;
--   4. remove colunas legadas (playerId, contracts) e restaura as constraints.
--
-- O estado final é equivalente ao gerado por `prisma migrate diff`.

-- 1) CreateTable PlayerCard
CREATE TABLE "PlayerCard" (
    "id" SERIAL NOT NULL,
    "playerDefinitionId" INTEGER NOT NULL,
    "ownerClubId" INTEGER NOT NULL,
    "contracts" INTEGER NOT NULL DEFAULT 7,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerCard_pkey" PRIMARY KEY ("id")
);

-- 2) ClubPlayer passa a referenciar a carta (coluna nullable durante o backfill)
ALTER TABLE "ClubPlayer" ADD COLUMN "playerCardId" INTEGER;

-- 3) Backfill: uma carta por registro de inventário existente.
--    @@unique([clubId, playerId]) garante um par (clube, jogador) único,
--    então cada ClubPlayer existente gera exatamente uma PlayerCard.
INSERT INTO "PlayerCard" ("playerDefinitionId", "ownerClubId", "contracts", "status", "createdAt")
SELECT "playerId", "clubId", "contracts", 'active', now()
FROM "ClubPlayer"
ORDER BY "id";

UPDATE "ClubPlayer" cp
SET "playerCardId" = pc.id
FROM "PlayerCard" pc
WHERE pc."playerDefinitionId" = cp."playerId"
  AND pc."ownerClubId" = cp."clubId"
  AND pc."contracts" = cp."contracts";

-- 4) Remover colunas/constraints legadas e consolidar
ALTER TABLE "ClubPlayer" DROP CONSTRAINT "ClubPlayer_playerId_fkey";
DROP INDEX "ClubPlayer_clubId_playerId_key";
ALTER TABLE "ClubPlayer" DROP COLUMN "contracts";
ALTER TABLE "ClubPlayer" DROP COLUMN "playerId";
ALTER TABLE "ClubPlayer" ALTER COLUMN "playerCardId" SET NOT NULL;

-- Índices
CREATE INDEX "PlayerCard_ownerClubId_idx" ON "PlayerCard"("ownerClubId");
CREATE INDEX "PlayerCard_playerDefinitionId_idx" ON "PlayerCard"("playerDefinitionId");
CREATE UNIQUE INDEX "ClubPlayer_clubId_playerCardId_key" ON "ClubPlayer"("clubId", "playerCardId");

-- Foreign keys
ALTER TABLE "PlayerCard" ADD CONSTRAINT "PlayerCard_playerDefinitionId_fkey" FOREIGN KEY ("playerDefinitionId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerCard" ADD CONSTRAINT "PlayerCard_ownerClubId_fkey" FOREIGN KEY ("ownerClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClubPlayer" ADD CONSTRAINT "ClubPlayer_playerCardId_fkey" FOREIGN KEY ("playerCardId") REFERENCES "PlayerCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
