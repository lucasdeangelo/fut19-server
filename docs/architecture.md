# Arquitetura — V0.2

## Visão geral

O `fut19-server` é organizado em camadas com responsabilidades separadas. A
regra central é: **a API interna não sabe como o FIFA 19 fala, e a camada de
protocolo não sabe nada de Fastify, JWT ou PostgreSQL**.

```
┌─────────────────────────────── API interna (REST) ───────────────────────────────┐
│  Fastify + JWT + bcrypt   src/routes/*.js                                          │
│  Endpoints: /auth/*, /club/*, /players/*, /fut/*, /fifa/*                          │
└───────────────┬───────────────────────────────────────────────┬───────────────────┘
                │ chama                                         │ expõe ferramentas
                ▼                                               ▼
┌─────────────────────────── domínio FUT ───────────────┐  ┌─── camada FIFA (pesquisa) ────┐
│  src/services/                                        │  │  src/fifa/                    │
│  • ClubService      clube + inventário (PlayerCard)   │  │  • adapter/  FIFA19Adapter     │
│  • CatalogService   catálogo (PlayerDefinition)       │  │  • protocol/ parser/serializer │
│  • PlayerService    jogadores                         │  │  • session/  sessões FIFA      │
│  • AuthService      usuários/JWT                      │  │  • capture/  captura + replay  │
└───────────────┬───────────────────────────────────────┘  └───────┬────────────────────────┘
                │ injeção de dependência                          │ request → service → response
                ▼                                                  ▼
┌─────────────────────────────── persistência ───────────────────────────────────────────────┐
│  Prisma + PostgreSQL   PlayerDefinition → PlayerCard → ClubPlayer                          │
│  (tabela "Player" preservada via @@map)                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## As camadas

### 1. API interna (`src/routes/`, `src/server.js`)

Endpoints REST para a própria aplicação de pesquisa (navegador/CLI). Usa JWT
para autenticação web. Inclui os endpoints de desenvolvimento `/fifa/*` que
expõem a camada de pesquisa — estes NÃO são endpoints que o FIFA 19 utiliza.

### 2. Domínio FUT (`src/services/`)

Regras de negócio do FUT: inventário do clube, catálogo de jogadores,
elencos, sessões. Os services recebem o client Prisma (ou mocks) via
construtor — é isso que permite testar tudo sem banco.

- `ClubService.getClubInventory()` devolve `{ club, playerCards, playerCount }`
  preservando o shape V0.1 (`players[].player`) e adicionando `playerCard`.
- `CatalogService` opera sobre `PlayerDefinition` (tabela `Player`): busca por
  nome/posição (case-insensitive), listagem de nações/posições/clubes.

### 3. Camada FIFA (`src/fifa/`)

É a camada de pesquisa do protocolo. Nada aqui é especulativo: só existe o que
foi confirmado ou o que serve ao fluxo de captura/replay.

- **`adapter/`** — `FIFA19Adapter` executa o pipeline:
  `request → request mapper → service FUT → response mapper → response`.
  - `mappers.js` registra mapeamentos `{ id, description, match, map }`.
  - Hoje há **um único mapeamento** (`dev.fut.club`, `/dev/fut/club` →
    `clubService.getClubInventory`) que NÃO é protocolo real — existe apenas
    para exercitar o fluxo.
  - Rota não mapeada → `UNMAPPED_ROUTE` (404); serviço desconhecido →
    `UNKNOWN_SERVICE`; método desconhecido → `UNKNOWN_METHOD`.
- **`protocol/`** — `parser.js` (normaliza `{ method, host, path, headers,
  body, query }`, rejeita com `PROTOCOL_PARSE:`), `serializer.js` (envelope de
  resposta `{ status, data | error }`) e `constants.js`.
- **`session/`** — sessões FIFA com `id/userId/platform/gameVersion/
  createdAt/expiresAt/metadata` e TTL (padrão 2h). A store é uma abstração
  (`SessionStore`) — hoje `MemorySessionStore`, trocável por Redis (TODO).
- **`capture/`** — `CaptureLogger` registra requests/responses sob `/fifa`
  quando `CAPTURE_ENABLED=true`, com redação de campos sensíveis;
  `CaptureRequestStore` persiste em `CAPTURE_DIR`; `ReplayEngine` reproduz uma
  captura pelo adapter e compara com o esperado.

### 4. Persistência (Prisma)

Modelos:

- `User` → `Club` (1:1), `Squad`
- `PlayerDefinition` (**tabela `Player`** via `@@map`, preservando dados V0.1)
- `PlayerCard` (instância da carta: `playerDefinitionId`, `ownerClubId`,
  `contracts`, `status`)
- `ClubPlayer` (posse clube ↔ carta, `@@unique([clubId, playerCardId])`)

A migração V0.2 (`prisma/migrations/20260812220000_v02_fut_layers`) é **não
destrutiva**: adiciona `PlayerCard`, adiciona `ClubPlayer.playerCardId`,
faz backfill, e só então remove colunas/constraints legadas. O estado final
foi validado como equivalente ao `prisma migrate diff`.

## Fluxo de uma requisição FUT (mínimo)

1. Cliente (capturado) envia request ao adapter (ex.: via `POST /fifa/adapter/handle`).
2. `FIFA19Adapter.handle()` localiza o request mapper por `match()`.
3. O mapper devolve `{ serviceName, method, args }`.
4. O service (ex.: `ClubService`) consulta o PostgreSQL via Prisma.
5. O response mapper embrulha o resultado no envelope provisório.
6. A resposta é comparada (no replay) com o esperado da captura.

## Decisões

- **Injeção de dependência** nos services → testes unitários sem banco.
- **Nada especulativo**: sem mapeamentos/endpoints/campos de protocolo
  inventados. O que não está confirmado fica como TODO.
- **Envelope de resposta provisório** (`{ status, data | error }`): o wire
  format real do FIFA 19 ainda não é conhecido.
- **Redação obrigatória** na captura: senhas, tokens, cookies nunca são
  gravados em disco.
