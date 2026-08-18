# FUT19 Revival — Stack de borda (DNS + TLS + Proxy)

Como fazer o cliente do FIFA 19 (PC) conversar com o `fut19-server`.

## Arquitetura

```
FIFA 19 (PC)
   │  1. resolve utas.*.fut.ea.com
   ▼
dnsmasq (container :53)  ── responde com o IP do servidor
   │
   ▼  2. abre TLS na 443
Caddy (container :443)   ── apresenta cert da SUA CA, loga a request
   │
   ▼  3. reverse_proxy
fut19-server (Node)      ── suas rotas atuais
```

## Estrutura de pastas

```
fut19-server/
├── docker-compose.fut19-edge.yml
├── Caddyfile              ← renomeie o Caddyfile.txt para Caddyfile
├── caddy/
│   └── certs/             ← gerados no passo 2
│       ├── fut19-ea.pem
│       └── fut19-ea-key.pem
└── dns/
    ├── dnsmasq.conf
    └── logs/
```

## Passo 1 — Ajustar o IP

Edite `dns/dnsmasq.conf` e troque `192.168.0.10` pelo IP da máquina que roda o Docker.

## Passo 2 — Gerar a CA e o certificado (mkcert)

Na máquina do servidor (ou em qualquer máquina — o que importa é distribuir a CA):

```bash
mkcert -install

mkcert -cert-file caddy/certs/fut19-ea.pem \
       -key-file  caddy/certs/fut19-ea-key.pem \
       utas.external.s2.fut.ea.com \
       utas.s2.fut.ea.com \
       utas.fut.ea.com \
       utas.external.fut.ea.com \
       easo.ea.com

mkcert -CAROOT   # mostra onde está o rootCA.pem
```

## Passo 3 — Confiar na CA no PC do jogo (Windows)

Copie o `rootCA.pem` para o PC do jogo e instale como Autoridade Raiz:

```powershell
# PowerShell como administrador
Import-Certificate -FilePath rootCA.pem -CertStoreLocation Cert:\LocalMachine\Root
```

(ou `certmgr.msc` → Autoridades de Certificação Raiz Confiáveis → Importar)

## Passo 4 — Subir a stack

```bash
docker compose -f docker-compose.fut19-edge.yml up -d
```

Se o app Node roda fora do Docker na mesma máquina, o default `APP_UPSTREAM=host.docker.internal:3000` já funciona. Para outro cenário:

```bash
APP_UPSTREAM=192.168.0.15:3000 docker compose -f docker-compose.fut19-edge.yml up -d
```

## Passo 5 — Apontar o DNS do PC do jogo

- **Jogo em outra máquina da LAN:** configure o DNS dela para o IP do servidor (onde o dnsmasq está).
- **Jogo na mesma máquina do Docker:** o Windows aceita `127.0.0.1` como DNS, mas é instável — prefira editar `C:\Windows\System32\drivers\etc\hosts` com as mesmas entradas do dnsmasq.conf apontando para `127.0.0.1`.

Libere no firewall do servidor: `53/udp`, `53/tcp`, `80`, `443`.

## Passo 6 — Validar antes de abrir o jogo

No PC do jogo:

```powershell
nslookup utas.fut.ea.com          # deve responder o IP do servidor
curl -v https://utas.fut.ea.com/ut/game/fifa19/user/accountinfo
```

O curl deve chegar no seu Node (mesmo que retorne erro da sua API — o que importa é o TLS completar e a request aparecer em `docker logs fut19-edge`).

## Passo 7 — Abrir o jogo e mapear endpoints

Entre no Ultimate Team e observe:

- `docker logs fut19-edge` e o volume `caddy_data` (`access.log`) → paths, métodos e headers reais que o cliente chama;
- `dns/logs/dnsmasq.log` → qualquer domínio extra que o jogo tente resolver (adicione no dnsmasq.conf e regenere o cert incluindo-o).

Como os servidores oficiais foram desligados em nov/2023, esse log é a sua fonte primária de descoberta. Use os paths observados para montar a camada de compatibilidade `/ut/game/fifa19/*` sobre suas rotas.

## Se o TLS falhar mesmo com a CA instalada

O jogo pode estar fazendo certificate pinning. Teste rodando o jogo através do mitmproxy (CA dele instalada no Windows): se as requests aparecerem, não há pinning e o problema é configuração; se o handshake morrer, será preciso patch no executável (SSL bypass) antes que qualquer servidor funcione.

## Não redirecione (por enquanto)

- `accounts.ea.com`, `signin.ea.com`, `gateway.ea.com` — login/DRM do EA App precisa continuar indo para a EA de verdade;
- `gosredirector.ea.com` e hosts Blaze — matchmaking/partidas são outro protocolo (TCP binário), fase posterior do projeto.
