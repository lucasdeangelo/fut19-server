# Mapeamento de Protocolo — FIFA 19 (Pesquisa)

Este documento é a **fonte da verdade** para o que foi confirmado sobre o
protocolo do FIFA 19. Ele é intencionalmente mantido conservador: **somente
informação confirmada** (observada do cliente/servidor real) entra aqui.

> Regra do projeto: **nada especulativo**. Se um serviço, rota, cabeçalho ou
> campo de payload não foi confirmado, ele NÃO aparece neste documento nem no
> código. Itens em investigação ficam listados na seção "Em investigação" como
> TODO.

## Estado atual

**Nenhum endpoint do protocolo real do FIFA 19 foi confirmado até o momento.**

O que existe hoje é um mapeamento de desenvolvimento local (`/dev/fut/club`)
usado exclusivamente para exercitar o pipeline adapter/captura/replay. Ele não
representa comportamento do jogo.

| Confirmação | Status |
| --- | --- |
| Endpoints de serviços (ex.: PUTC, auth, UT store) | Pendente |
| Wire format de requests/responses | Pendente (envelope provisório `{ status, data \| error }`) |
| Fluxo de autenticação/sessão do cliente | Pendente |
| Cabeçalhos de request (ex.: PHISHING, X-UT-SID, tokens) | Pendente |
| Estrutura de payloads (ex.: item data, player cards) | Pendente |

## Tabela de mapeamento request → serviço

Preenchida somente com informação confirmada.

| Request (method + path) | Serviço FUT | Método | Notas |
| --- | --- | --- | --- |
| — | — | — | (vazio — sem confirmações) |

### Mapeamentos de desenvolvimento (NÃO protocolo real)

| Request | Serviço | Método | Notas |
| --- | --- | --- | --- |
| `GET /dev/fut/club` | `clubService` | `getClubInventory` | Usado por capture/replay. Só existe para pesquisa local. |

## Formato de captura

Uma captura de request salva em `captures/*.json` tem o shape:

```json
{
  "id": "demo-club",
  "timestamp": "2026-08-12T12:00:00Z",
  "direction": "request",
  "method": "GET",
  "host": "localhost:3000",
  "path": "/dev/fut/club",
  "headers": {},
  "query": {},
  "body": { "userId": 1 },
  "expected": {
    "match": {
      "status": "ok",
      "data.club.coins": 10000
    }
  }
}
```

- `direction`: `"request"` ou `"response"` — o replay só aceita `"request"`.
- `expected.match`: pares `caminho.pontilhado → valor` para comparação.
- Campos sensíveis já chegam redigidos como `[REDACTED]`.

## Em investigação (TODO)

- Autenticação/sessão oficial do cliente FIFA 19 (não confundir com a sessão
  FIFA interna deste projeto).
- Serviços de clube/inventário realmente usados pelo cliente.
- Formato real dos payloads de jogador/carta.
- Como o cliente identifica versão de jogo/plataforma.

Quando algo for confirmado, registre aqui (com evidência) e adicione o
mapeamento correspondente em `src/fifa/adapter/mappers.js`.
