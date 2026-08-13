# Guia de Desenvolvimento

Guia prático para quem trabalha no `fut19-server`.

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d        # PostgreSQL na porta 5433
npx prisma generate
npx prisma migrate dev      # aplica a migração V0.2 (não destrutiva)
npm run seed
npm run dev                 # servidor com --watch
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor com `node --watch` |
| `npm start` | Sobe o servidor |
| `npm test` | Roda todos os testes (`node --test`, sem banco) |
| `npm run seed` | Popula o banco (usuário `demo`/`admin123`, clube, jogadores, cartas) |
| `npm run prisma:generate` | Gera o client Prisma |
| `npm run prisma:migrate` | Cria/aplica migração (`prisma migrate dev`) |
| `npm run prisma:studio` | Abre o Prisma Studio |
| `npm run fifa:capture` | Cria a captura de exemplo `captures/demo-club.json` |
| `npm run fifa:replay [id]` | Reproduz uma captura (padrão `demo-club`) |

## Fluxo de trabalho para pesquisar o protocolo

1. **Observe** — com `CAPTURE_ENABLED=true` no `.env`, o `CaptureLogger`
   registra requests/responses sob `/fifa` em `captures/` (com redação de
   sensíveis). Use `GET /fifa/captures` para listar.
2. **Confirme** — antes de mapear algo, confirme o comportamento real
   (ex.: como o cliente identifica a rota, headers, payloads). Só informação
   confirmada vai para `docs/protocol-mapping.md`.
3. **Mapeie** — adicione um item em `src/fifa/adapter/mappers.js`
   (`{ id, description, match, map }`).
4. **Implemente/replay** — implemente/ajuste o service e use `npm run
   fifa:replay` (ou `POST /fifa/replay`) para validar contra a captura.

## Convenções

- **Nada especulativo**: não invente rotas, campos ou wire format do FIFA 19.
  O que não é confirmado fica como TODO.
- **Não reescrever**: mudanças incrementais sobre o que existe; não remover
  funcionalidades (ex.: o shape V0.1 de `players[].player` é preservado).
- **Dependências**: não adicionar dependências desnecessárias. Testes usam
  `node:test` nativo.
- **Services com injeção de dependência**: `constructor(db = prisma)` —
  testes passam mocks.
- **Captura nunca grava credenciais**: senhas, tokens e cookies são sempre
  redigidos (`src/fifa/capture/logger.js`).

## Migrações

A migração V0.2 (`20260812220000_v02_fut_layers`) é **não destrutiva**:
adiciona `PlayerCard` e `ClubPlayer.playerCardId`, faz backfill a partir dos
dados existentes e só então remove colunas/constraints legadas.

Ao criar novas migrações, preferir o mesmo padrão: adicionar → backfill →
remover, e validar o estado final com:

```bash
npx prisma migrate diff \
  --from-schema-datamodel <schema-antigo> \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

## Testes sem banco

Os testes (`test/*.test.js`) rodam sem PostgreSQL:

- Services recebem mocks de `db` (ex.: `club.findUnique`, `playerDefinition.findMany`).
- `FifaSessionService` aceita `now` injetável e um `MemorySessionStore`.
- O replay usa um `CaptureRequestStore` em diretório temporário
  (`fs.mkdtemp`) e um adapter com services mock.

Rodar sempre antes de concluir:

```bash
npm test
npx prisma validate
npx prisma generate
```

## O que NÃO fazer

- Não implementar mercado, packs ou SBC.
- Não armazenar credenciais reais do usuário/EA.
- Não incluir arquivos, executáveis ou ativos da EA no repositório.
- Não registrar mapeamentos de protocolo sem confirmação (ver
  `docs/protocol-mapping.md`).
