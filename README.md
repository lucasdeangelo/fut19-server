# FUT19 Server — V0.2

Base experimental de um servidor local para pesquisa e reimplementação dos
serviços do **FIFA 19 Ultimate Team**. A V0.2 organiza o código em camadas
separadas (API interna × domínio FUT × protocolo FIFA × persistência) e
introduz as fundações para o mapeamento incremental do protocolo: adapter,
sessão FIFA, captura e replay.

> ⚠️ **Aviso**: este projeto é uma base de pesquisa/engenharia reversa para uso
> local. Não contém arquivos, executáveis ou ativos proprietários da EA, e não
> tenta fingir ser os servidores oficiais. Nenhum endpoint do protocolo real do
> FIFA 19 foi confirmado ainda — tudo que não está confirmado está marcado como
> TODO (ver `docs/protocol-mapping.md`).

## O que existe nesta versão

- Fastify + PostgreSQL + Prisma + JWT + bcrypt (herdado da V0.1)
- Cadastro/login, clube, coins, jogadores e elencos
- **Camada `src/fifa/`** com:
  - `adapter/` — `FIFA19Adapter`: request → request mapper → serviço FUT → response mapper
  - `protocol/` — parser, serializer e constantes (não especulativos)
  - `session/` — sessões FIFA (diferentes do JWT da API web), com store substituível (memory hoje, Redis como TODO)
  - `capture/` — captura de requests/responses com redação de campos sensíveis e replay
- **Modelo de dados**: `PlayerDefinition` (catálogo) → `PlayerCard` (instância) → `ClubPlayer` (inventário/posse)
- **Catalog Service** separado do Club/Inventory
- **Primeiro fluxo FUT mínimo**: sessão → requisição → adapter → ClubService → PostgreSQL → resposta
- Endpoints internos de desenvolvimento (`/fifa/*`, `/fut/*`)
- 33 testes unitários (`node --test`, sem banco)

## Estrutura

```
src/
  server.js              # bootstrap Fastify
  config.js              # configuração a partir de env
  routes/                # API interna (REST)
    auth.routes.js       # POST /auth/register, /auth/login
    club.routes.js       # GET /club, /club/players, /club/squads
    player.routes.js     # GET /players, /players/:id
    fut.routes.js        # GET /fut/status, /fut/adapter/status
    fifa.routes.js       # ferramentas de dev: /fifa/*
  services/              # domínio FUT
    auth.service.js
    club.service.js      # clube + inventário (PlayerCard/ClubPlayer)
    catalog.service.js   # catálogo (PlayerDefinition)
    player.service.js
  fifa/                  # camada do protocolo FIFA 19 (pesquisa)
    adapter/             # FIFA19Adapter, mappers, envelope de resposta
    protocol/            # parser/serializer/constants
    session/             # sessões FIFA
    capture/             # captura + replay
```

Detalhes em `docs/architecture.md`.

## Requisitos

- Node.js 20+ (testado com Node 22)
- Docker + Docker Compose (para PostgreSQL)

## Instalação

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

O `docker compose up -d` sobe o PostgreSQL na porta `5433` (ver
`docker-compose.yml`). A migração `prisma migrate dev` aplica a migração
V0.2 (`20260812220000_v02_fut_layers`) que é **não destrutiva** — preserva os
dados existentes da V0.1.

## Testes rápidos

Health:

```bash
curl http://localhost:3000/health
```

Status FUT e do adapter:

```bash
curl http://localhost:3000/fut/status
curl http://localhost:3000/fut/adapter/status
```

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"admin123"}'
```

Depois use o token retornado:

```bash
curl http://localhost:3000/club \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Ferramentas de desenvolvimento FIFA

### Sessão FIFA

```bash
curl -X POST http://localhost:3000/fifa/session \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"platform":"PS4","gameVersion":"1.0"}'

curl http://localhost:3000/fifa/session/status
```

Sessões FIFA são diferentes do JWT da API web: têm `id`, `userId`, `platform`,
`gameVersion`, `createdAt`, `expiresAt` e `metadata`. O armazenamento atual é
em memória (`store: "memory"`); a troca por Redis está marcada como TODO no
código.

### Adapter

```bash
curl http://localhost:3000/fifa/adapter/status

# Envia uma requisição "fifa-like" normalizada para o FIFA19Adapter:
curl -X POST http://localhost:3000/fifa/adapter/handle \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","host":"localhost:3000","path":"/dev/fut/club","body":{"userId":1}}'
```

> O único mapeamento registrado hoje é de desenvolvimento local (`/dev/fut/club`
> → `clubService.getClubInventory`), usado para exercitar o fluxo de
> captura/replay. Ele **NÃO** é um endpoint do protocolo FIFA 19.

### Captura

A captura registra requests/responses sob `/fifa` em arquivos JSON em
`CAPTURE_DIR` (padrão `./captures`), com **redação de campos sensíveis**
(senhas, tokens, cookies — ver `SENSITIVE_HEADERS`/`redact()` em
`src/fifa/capture/logger.js`). Para habilitar:

```bash
# .env
CAPTURE_ENABLED=true
```

### Replay

Gerar a captura de exemplo e reproduzi-la:

```bash
npm run fifa:capture    # cria captures/demo-club.json
npm run fifa:replay      # roda o replay da captura demo-club
npm run fifa:replay outro-id
```

Ou pela API:

```bash
curl -X POST http://localhost:3000/fifa/replay \
  -H "Content-Type: application/json" \
  -d '{"captureId":"demo-club"}'
```

O replay carrega a captura, reconstrói o request, passa pelo adapter, executa o
serviço interno contra o PostgreSQL e compara a resposta com o esperado
registrado na captura (comparação por caminho pontilhado, ex.:
`data.club.coins`). O resultado lista checks PASS/FAIL e o veredito
MATCH/MISMATCH.

## Testes

```bash
npm test
```

Rodam com `node --test` (runner nativo), sem precisar de banco — os services
recebem mocks via injeção de dependência.

## Documentação

- `docs/architecture.md` — arquitetura em camadas
- `docs/protocol-mapping.md` — tabela de mapeamento request/response do protocolo (somente info confirmada)
- `docs/development.md` — guia de desenvolvimento

## Não implementado (deliberadamente)

- Protocolo real do FIFA 19 (endpoints, wire format, autenticação EA)
- Mercado de transferências, packs, SBC
- Autenticação/sessão oficial da EA
- Redes de cooperação/multijogador

Esses itens só devem ser trabalhados após confirmação de como o cliente se
comporta (ver `docs/protocol-mapping.md`).
