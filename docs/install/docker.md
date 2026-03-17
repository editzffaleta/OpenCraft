---
summary: "Setup opcional baseado em Docker e onboarding para OpenCraft"
read_when:
  - You want a containerized gateway instead of local installs
  - You are validating the Docker flow
title: "Docker"
---

# Docker (opcional)

Docker é **opcional**. Use apenas se você quer um gateway containerizado ou para validar o fluxo Docker.

## Docker é certo para mim?

- **Sim**: você quer um ambiente gateway isolado e descartável ou executar OpenCraft em um host sem instalações locais.
- **Não**: você está rodando em sua própria máquina e apenas quer o loop de dev mais rápido. Use o fluxo de instalação normal em vez disso.
- **Nota de sandboxing**: sandboxing de agent também usa Docker, mas **não requer** que o gateway completo rode em Docker. Veja [Sandboxing](/gateway/sandboxing).

Este guia cobre:

- Gateway containerizado (OpenCraft completo em Docker)
- Agent Sandbox por sessão (gateway host + ferramentas de agent isoladas em Docker)

Detalhes de sandboxing: [Sandboxing](/gateway/sandboxing)

## Requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- No mínimo 2 GB RAM para build de imagem (`pnpm install` pode ser OOM-killed em hosts 1 GB com exit 137)
- Disco suficiente para imagens + logs
- Se rodando em host VPS/público, revise [Security hardening for network exposure](/gateway/security#04-network-exposure-bind--port--firewall), especialmente política de firewall Docker `DOCKER-USER`.

## Gateway containerizado (Docker Compose)

### Início rápido (recomendado)

<Note>
Docker defaults aqui assumem bind modes (`lan`/`loopback`), não host aliases. Use valores de bind mode em `gateway.bind` (por exemplo `lan` ou `loopback`), não host aliases como `0.0.0.0` ou `localhost`.
</Note>

De repo root:

```bash
./docker-setup.sh
```

Este script:

- constrói a imagem de gateway localmente (ou puxa uma imagem remota se `OPENCRAFT_IMAGE` está definido)
- executa onboarding
- imprime dicas de configuração de provider opcional
- inicia o gateway via Docker Compose
- gera um token de gateway e escreve para `.env`

Variáveis de ambiente opcionais:

- `OPENCRAFT_IMAGE` — use uma imagem remota em vez de construir localmente (ex. `ghcr.io/editzffaleta/OpenCraft:latest`)
- `OPENCRAFT_DOCKER_APT_PACKAGES` — instala pacotes apt extras durante build
- `OPENCRAFT_EXTENSIONS` — pré-instala dependências de extensão em tempo de build (nomes de extensão separados por espaço, ex. `diagnostics-otel matrix`)
- `OPENCRAFT_EXTRA_MOUNTS` — adiciona bind mounts de host extras
- `OPENCRAFT_HOME_VOLUME` — persiste `/home/node` em um named volume
- `OPENCRAFT_SANDBOX` — opt in a Docker gateway sandbox bootstrap. Apenas valores explicitamente truthy habilitam: `1`, `true`, `yes`, `on`
- `OPENCRAFT_INSTALL_DOCKER_CLI` — passthrough build arg para local image builds (`1` instala Docker CLI na imagem). `docker-setup.sh` define isso automaticamente quando `OPENCRAFT_SANDBOX=1` para builds locais.
- `OPENCRAFT_DOCKER_SOCKET` — sobrescreve caminho de Docker socket (padrão: path `DOCKER_HOST=unix://...`, senão `/var/run/docker.sock`)
- `OPENCRAFT_ALLOW_INSECURE_PRIVATE_WS=1` — break-glass: permite targets `ws://` de private-network confiável para caminhos de cliente CLI/onboarding (padrão é loopback-only)
- `OPENCRAFT_BROWSER_DISABLE_GRAPHICS_FLAGS=0` — desabilita flags de hardening de browser de container `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu` quando você precisa de compatibilidade WebGL/3D.
- `OPENCRAFT_BROWSER_DISABLE_EXTENSIONS=0` — mantém extensões habilitadas quando fluxos de browser requerem (padrão mantém extensões desabilitadas no browser sandbox).
- `OPENCRAFT_BROWSER_RENDERER_PROCESS_LIMIT=<N>` — define limite de processo de renderer Chromium; defina para `0` para pular a flag e usar comportamento padrão Chromium.

Após terminar:

- Abra `http://127.0.0.1:18789/` no seu navegador.
- Cole o token no Control UI (Settings → token).
- Precisa da URL novamente? Execute `docker compose run --rm opencraft-cli dashboard --no-open`.

### Habilitar sandbox de agent para Docker gateway (opt-in)

`docker-setup.sh` também pode bootstrap `agents.defaults.sandbox.*` para deployments Docker.

Habilite com:

```bash
export OPENCRAFT_SANDBOX=1
./docker-setup.sh
```

Caminho de socket customizado (ex. Docker sem root):

```bash
export OPENCRAFT_SANDBOX=1
export OPENCRAFT_DOCKER_SOCKET=/run/user/1000/docker.sock
./docker-setup.sh
```

Notas:

- O script monta `docker.sock` apenas após pré-requisitos de sandbox passarem.
- Se setup de sandbox não puder ser completado, o script reseta `agents.defaults.sandbox.mode` para `off` para evitar config de sandbox stale/quebrado em reruns.
- Se `Dockerfile.sandbox` está faltando, o script imprime um aviso e continua; construa `openclaw-sandbox:bookworm-slim` com `scripts/sandbox-setup.sh` se necessário.
- Para valores não-locais de `OPENCRAFT_IMAGE`, a imagem deve já conter suporte Docker CLI para execução de sandbox.

### Automação/CI (não-interativo, sem TTY noise)

Para scripts e CI, desabilite alocação de pseudo-TTY do Compose com `-T`:

```bash
docker compose run -T --rm opencraft-cli gateway probe
docker compose run -T --rm opencraft-cli devices list --json
```

Se sua automação não exporta variáveis de sessão Claude, deixá-las unset agora resolve para valores vazios por padrão em `docker-compose.yml` para evitar avisos "variable is not set" repetidos.

### Nota de segurança de rede compartilhada (CLI + gateway)

`opencraft-cli` usa `network_mode: "service:opencraft-gateway"` para que comandos CLI possam alcançar o gateway de forma confiável sobre `127.0.0.1` em Docker.

Trate isto como uma fronteira de confiança compartilhada: binding loopback não é isolamento entre estes dois containers. Se você precisa de separação mais forte, execute comandos de um container/host network path separado em vez do serviço `opencraft-cli` empacotado.

Para reduzir impacto se o processo CLI é comprometido, a config de compose descarta `NET_RAW`/`NET_ADMIN` e habilita `no-new-privileges` em `opencraft-cli`.

Escreve config/workspace no host:

- `~/.opencraft/`
- `~/.opencraft/workspace`

Rodando em VPS? Veja [Hetzner (Docker VPS)](/install/hetzner).

### Use uma imagem remota (pule build local)

Imagens pré-compiladas oficiais são publicadas em:

- [Pacote GitHub Container Registry](https://github.com/editzffaleta/OpenCraft/pkgs/container/opencraft)

Use nome de imagem `ghcr.io/editzffaleta/OpenCraft` (não imagens similarmente nomeadas no Docker Hub).

Tags comuns:

- `main` — build latest de `main`
- `<version>` — builds de release tag (por exemplo `2026.2.26`)
- `latest` — latest stable release tag

### Metadados de imagem base

A imagem Docker main usa atualmente:

- `node:24-bookworm`

A imagem docker agora publica anotações OCI de base-image (sha256 é um exemplo, e aponta para a lista de manifest multi-arch fixada para essa tag):

- `org.opencontainers.image.base.name=docker.io/library/node:24-bookworm`
- `org.opencontainers.image.base.digest=sha256:3a09aa6354567619221ef6c45a5051b671f953f0a1924d1f819ffb236e520e6b`
- `org.opencontainers.image.source=https://github.com/editzffaleta/OpenCraft`
- `org.opencontainers.image.url=https://opencraft.ai`
- `org.opencontainers.image.documentation=https://docs.opencraft.ai/install/docker`
- `org.opencontainers.image.licenses=MIT`
- `org.opencontainers.image.title=OpenCraft`
- `org.opencontainers.image.description=OpenCraft gateway and CLI runtime container image`
- `org.opencontainers.image.revision=<git-sha>`
- `org.opencontainers.image.version=<tag-or-main>`
- `org.opencontainers.image.created=<rfc3339 timestamp>`

Referência: [Anotações OCI image](https://github.com/opencontainers/image-spec/blob/main/annotations.md)

Contexto de release: o histórico tagged deste repositório já usa Bookworm em `v2026.2.22` e tags 2026 anteriores (por exemplo `v2026.2.21`, `v2026.2.9`).

Por padrão o script de setup constrói a imagem do source. Para puxar uma imagem pré-compilada em vez disso, defina `OPENCRAFT_IMAGE` antes de executar o script:

```bash
export OPENCRAFT_IMAGE="ghcr.io/editzffaleta/OpenCraft:latest"
./docker-setup.sh
```

O script detecta que `OPENCRAFT_IMAGE` não é o padrão `opencraft:local` e executa `docker pull` em vez de `docker build`. Tudo mais (onboarding, gateway start, token generation) funciona da mesma forma.

`docker-setup.sh` ainda executa do repo root porque usa `docker-compose.yml` local e arquivos helpers. `OPENCRAFT_IMAGE` pula tempo de build de imagem local; não substitui o fluxo de compose/setup.

### Shell Helpers (opcional)

Para gerenciamento Docker mais fácil dia-a-dia, instale `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/editzffaleta/OpenCraft/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
```

**Adicione ao seu config de shell (zsh):**

```bash
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Então use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Execute `clawdock-help` para todos os comandos.

Veja [`ClawDock` Helper README](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/shell-helpers/README.md) para detalhes.

### Fluxo manual (compose)

```bash
docker build -t opencraft:local -f Dockerfile .
docker compose run --rm opencraft-cli onboard
docker compose up -d opencraft-gateway
```

Nota: execute `docker compose ...` do repo root. Se você habilitou `OPENCRAFT_EXTRA_MOUNTS` ou `OPENCRAFT_HOME_VOLUME`, o script de setup escreve `docker-compose.extra.yml`; inclua quando executar Compose em outro lugar:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml <command>
```

### Token Control UI + pairing (Docker)

Se você vê "unauthorized" ou "disconnected (1008): pairing required", busque um link de dashboard fresco e aprove o device browser:

```bash
docker compose run --rm opencraft-cli dashboard --no-open
docker compose run --rm opencraft-cli devices list
docker compose run --rm opencraft-cli devices approve <requestId>
```

Mais detalhes: [Dashboard](/web/dashboard), [Devices](/cli/devices).

### Mounts extras (opcional)

Se você quer montar diretórios de host adicionais nos containers, defina `OPENCRAFT_EXTRA_MOUNTS` antes de executar `docker-setup.sh`. Isto aceita uma lista separada por vírgula de Docker bind mounts e as aplica a ambos `opencraft-gateway` e `opencraft-cli` gerando `docker-compose.extra.yml`.

Exemplo:

```bash
export OPENCRAFT_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

Notas:

- Paths devem ser compartilhados com Docker Desktop em macOS/Windows.
- Cada entrada deve ser `source:target[:options]` sem espaços, abas, ou newlines.
- Se você edita `OPENCRAFT_EXTRA_MOUNTS`, reexecute `docker-setup.sh` para regenerar o arquivo compose extra.
- `docker-compose.extra.yml` é gerado. Não edite manualmente.

### Persista todo o home do container (opcional)

Se você quer `/home/node` persistir entre recreação de container, defina um named volume via `OPENCRAFT_HOME_VOLUME`. Isto cria um volume Docker e monta em `/home/node`, enquanto mantém os bind mounts padrão de config/workspace. Use um named volume aqui (não um bind path); para bind mounts, use `OPENCRAFT_EXTRA_MOUNTS`.

Exemplo:

```bash
export OPENCRAFT_HOME_VOLUME="opencraft_home"
./docker-setup.sh
```

Você pode combinar isto com mounts extras:

```bash
export OPENCRAFT_HOME_VOLUME="opencraft_home"
export OPENCRAFT_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

Notas:

- Named volumes devem corresponder `^[A-Za-z0-9][A-Za-z0-9_.-]*$`.
- Se você muda `OPENCRAFT_HOME_VOLUME`, reexecute `docker-setup.sh` para regenerar o arquivo compose extra.
- O named volume persiste até ser removido com `docker volume rm <name>`.

### Instale pacotes apt extras (opcional)

Se você precisa de pacotes de sistema dentro da imagem (por exemplo, build tools ou bibliotecas de mídia), defina `OPENCRAFT_DOCKER_APT_PACKAGES` antes de executar `docker-setup.sh`. Isto instala os pacotes durante o build de imagem, então persistem mesmo se o container é deletado.

Exemplo:

```bash
export OPENCRAFT_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

Notas:

- Isto aceita uma lista separada por espaço de nomes de pacotes apt.
- Se você muda `OPENCRAFT_DOCKER_APT_PACKAGES`, reexecute `docker-setup.sh` para reconstruir a imagem.

### Pré-instale dependências de extensão (opcional)

Extensões com seu próprio `package.json` (ex. `diagnostics-otel`, `matrix`, `msteams`) instalam suas dependências npm na primeira carga. Para bake essas dependências na imagem em vez, defina `OPENCRAFT_EXTENSIONS` antes de executar `docker-setup.sh`:

```bash
export OPENCRAFT_EXTENSIONS="diagnostics-otel matrix"
./docker-setup.sh
```

Ou quando construindo diretamente:

```bash
docker build --build-arg OPENCRAFT_EXTENSIONS="diagnostics-otel matrix" .
```

Notas:

- Isto aceita uma lista separada por espaço de nomes de diretório de extensão (sob `extensions/`).
- Apenas extensões com um `package.json` são afetadas; plugins leve sem um são ignorados.
- Se você muda `OPENCRAFT_EXTENSIONS`, reexecute `docker-setup.sh` para reconstruir a imagem.

### Power-user / container full-featured (opt-in)

A imagem Docker padrão é **security-first** e roda como usuário não-root `node`. Isto mantém a superfície de ataque pequena, mas significa:

- sem instalações de pacote de sistema em runtime
- sem Homebrew por padrão
- sem Chromium/Playwright browsers empacotados

Se você quer um container mais full-featured, use estes knobs opt-in:

1. **Persista `/home/node`** para que downloads de browser e caches de tool sobrevivam:

```bash
export OPENCRAFT_HOME_VOLUME="opencraft_home"
./docker-setup.sh
```

2. **Bake system deps na imagem** (repetível + persistente):

```bash
export OPENCRAFT_DOCKER_APT_PACKAGES="git curl jq"
./docker-setup.sh
```

3. **Instale Playwright browsers sem `npx`** (evita conflitos override npm):

```bash
docker compose run --rm opencraft-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Se você precisa Playwright instalar system deps, reconstrua a imagem com `OPENCRAFT_DOCKER_APT_PACKAGES` em vez de usar `--with-deps` em runtime.

4. **Persista downloads de Playwright browser**:

- Defina `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` em `docker-compose.yml`.
- Garanta que `/home/node` persista via `OPENCRAFT_HOME_VOLUME`, ou monte `/home/node/.cache/ms-playwright` via `OPENCRAFT_EXTRA_MOUNTS`.

### Permissions + EACCES

A imagem roda como `node` (uid 1000). Se você vê erros de permissão em `/home/node/.opencraft`, certifique-se seus bind mounts de host são owned por uid 1000.

Exemplo (host Linux):

```bash
sudo chown -R 1000:1000 /path/to/opencraft-config /path/to/opencraft-workspace
```

Se você escolhe rodar como root para conveniência, você aceita o tradeoff de segurança.

### Rebuilds mais rápidos (recomendado)

Para acelerar rebuilds, ordene seu Dockerfile para que camadas de dependência sejam cacheadas. Isto evita re-executar `pnpm install` a menos que lockfiles mudem:

```dockerfile
FROM node:24-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Cache dependencies unless package metadata changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

### Setup de channel (opcional)

Use o container CLI para configurar channels, depois reinicie o gateway se necessário.

WhatsApp (QR):

```bash
docker compose run --rm opencraft-cli channels login
```

Telegram (bot token):

```bash
docker compose run --rm opencraft-cli channels add --channel telegram --token "<token>"
```

Discord (bot token):

```bash
docker compose run --rm opencraft-cli channels add --channel discord --token "<token>"
```

Docs: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

### OpenAI Code OAuth (Docker headless)

Se você escolhe OpenAI Code OAuth no wizard, ele abre uma URL de browser e tenta capturar um callback em `http://127.0.0.1:1455/auth/callback`. Em Docker ou setups headless esse callback pode mostrar um erro de browser. Copie a URL de redirect completa que você landing em e cole de volta no wizard para terminar auth.

### Health checks

Endpoints de probe de container (sem auth requerida):

```bash
curl -fsS http://127.0.0.1:18789/healthz
curl -fsS http://127.0.0.1:18789/readyz
```

Aliases: `/health` e `/ready`.

`/healthz` é um probe de liveness raso para "o processo gateway está up".
`/readyz` permanece ready durante startup grace, depois fica `503` apenas se canais managed requeridos ainda estão desconectados após grace ou desconectam depois.

A imagem Docker inclui um `HEALTHCHECK` built-in que faz ping de `/healthz` em background. Em termos simples: Docker continua verificando se OpenCraft ainda está responsivo. Se verificações continuam falhando, Docker marca o container como `unhealthy`, e sistemas de orquestração (política restart Docker Compose, Swarm, Kubernetes, etc.) podem automaticamente reiniciar ou substituir.

Health snapshot autenticado profundo (gateway + channels):

```bash
docker compose exec opencraft-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### E2E smoke test (Docker)

```bash
scripts/e2e/onboard-docker.sh
```

### QR import smoke test (Docker)

```bash
pnpm test:docker:qr
```

### LAN vs loopback (Docker Compose)

`docker-setup.sh` padrão `OPENCRAFT_GATEWAY_BIND=lan` para que acesso de host a `http://127.0.0.1:18789` funcione com publicação de porta Docker.

- `lan` (padrão): browser de host + CLI de host pode alcançar a porta de gateway publicada.
- `loopback`: apenas processos dentro do namespace de rede de container podem alcançar o gateway diretamente; acesso de porta publicada de host pode falhar.

O script de setup também fixa `gateway.mode=local` após onboarding para que comandos Docker CLI resolvam para direcionamento loopback local.

Nota de config legado: use valores de bind mode em `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), não host aliases (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).

Se você vê `Gateway target: ws://172.x.x.x:18789` ou erros `pairing required` repetidos de comandos Docker CLI, execute:

```bash
docker compose run --rm opencraft-cli config set gateway.mode local
docker compose run --rm opencraft-cli config set gateway.bind lan
docker compose run --rm opencraft-cli devices list --url ws://127.0.0.1:18789
```

### Notas

- Gateway bind padrão para `lan` para uso de container (`OPENCRAFT_GATEWAY_BIND`).
- Dockerfile CMD usa `--allow-unconfigured`; config montado com `gateway.mode` não `local` ainda iniciará. Sobrescreva CMD para forçar o guard.
- O container gateway é a source of truth para sessions (`~/.opencraft/agents/<agentId>/sessions/`).

### Modelo de storage

- **Dados de host persistentes:** Docker Compose bind-monta `OPENCRAFT_CONFIG_DIR` para `/home/node/.opencraft` e `OPENCRAFT_WORKSPACE_DIR` para `/home/node/.opencraft/workspace`, para que esses paths sobrevivam à recreação de container.
- **Sandbox tmpfs efêmero:** quando `agents.defaults.sandbox` está habilitado, os containers de sandbox usam `tmpfs` para `/tmp`, `/var/tmp`, e `/run`. Esses mounts são separados da stack Compose top-level e desaparecem com o container de sandbox.
- **Disk growth hotspots:** observe `media/`, `agents/<agentId>/sessions/sessions.json`, arquivos JSONL de transcript, `cron/runs/*.jsonl`, e logs de arquivo rolling sob `/tmp/opencraft/` (ou seu `logging.file` configurado). Se você também executa o app macOS fora de Docker, seus service logs são separados novamente: `~/.opencraft/logs/gateway.log`, `~/.opencraft/logs/gateway.err.log`, e `/tmp/editzffaleta/OpenCraft-gateway.log`.

## Agent Sandbox (host gateway + ferramentas Docker)

Deep dive: [Sandboxing](/gateway/sandboxing)

### O que faz

Quando `agents.defaults.sandbox` está habilitado, **sessões não-main** executam ferramentas dentro de um container Docker. O gateway fica em seu host, mas a execução de ferramenta é isolada:

- scope: `"agent"` por padrão (um container + workspace por agent)
- scope: `"session"` para isolamento por sessão
- pasta de workspace por scope montada em `/workspace`
- acesso opcional de workspace de agent (`agents.defaults.sandbox.workspaceAccess`)
- política de ferramenta allow/deny (deny vence)
- mídia de inbound é copiada no workspace de sandbox ativo (`media/inbound/*`) para que ferramentas possam ler (com `workspaceAccess: "rw"`, isto landing no workspace de agent)

Aviso: `scope: "shared"` desabilita isolamento de cross-session. Todas as sessões compartilham um container e um workspace.

### Perfis de sandbox per-agent (multi-agent)

Se você usa roteamento multi-agent, cada agent pode sobrescrever sandbox + configurações de ferramentas:
`agents.list[].sandbox` e `agents.list[].tools` (mais `agents.list[].tools.sandbox.tools`). Isto permite você rodar níveis de acesso mistos em um gateway:

- Acesso completo (agent pessoal)
- Ferramentas read-only + workspace read-only (agent família/trabalho)
- Sem ferramentas de filesystem/shell (agent público)

Veja [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) para exemplos, precedência, e troubleshooting.

### Comportamento padrão

- Imagem: `openclaw-sandbox:bookworm-slim`
- Um container por agent
- Acesso de workspace de agent: `workspaceAccess: "none"` (padrão) usa `~/.opencraft/sandboxes`
  - `"ro"` mantém workspace de sandbox em `/workspace` e monta workspace de agent read-only em `/agent` (desabilita `write`/`edit`/`apply_patch`)
  - `"rw"` monta workspace de agent read/write em `/workspace`
- Auto-prune: idle > 24h OR idade > 7d
- Network: `none` por padrão (explicitamente opt-in se você precisa egress)
  - `host` é bloqueado.
  - `container:<id>` é bloqueado por padrão (namespace-join risk).
- Allow padrão: `exec`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- Deny padrão: `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`

### Habilite sandboxing

Se você planeja instalar pacotes em `setupCommand`, note:

- Default `docker.network` é `"none"` (sem egress).
- `docker.network: "host"` é bloqueado.
- `docker.network: "container:<id>"` é bloqueado por padrão.
- Break-glass override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.
- `readOnlyRoot: true` bloqueia instalações de pacote.
- `user` deve ser root para `apt-get` (omita `user` ou defina `user: "0:0"`).
  OpenCraft auto-recria containers quando `setupCommand` (ou config docker) muda a menos que o container foi **usado recentemente** (dentro de ~5 minutos). Hot containers registram um aviso com o comando exato `opencraft sandbox recreate ...`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (agent is default)
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.opencraft/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
        },
        prune: {
          idleHours: 24, // 0 disables idle pruning
          maxAgeDays: 7, // 0 disables max-age pruning
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

Hardening knobs vivem sob `agents.defaults.sandbox.docker`:
`network`, `user`, `pidsLimit`, `memory`, `memorySwap`, `cpus`, `ulimits`,
`seccompProfile`, `apparmorProfile`, `dns`, `extraHosts`,
`dangerouslyAllowContainerNamespaceJoin` (break-glass apenas).

Multi-agent: sobrescreva `agents.defaults.sandbox.{docker,browser,prune}.*` por agent via `agents.list[].sandbox.{docker,browser,prune}.*`
(ignorado quando `agents.defaults.sandbox.scope` / `agents.list[].sandbox.scope` é `"shared"`).

### Construa a imagem de sandbox padrão

```bash
scripts/sandbox-setup.sh
```

Isto constrói `openclaw-sandbox:bookworm-slim` usando `Dockerfile.sandbox`.

### Imagem common de sandbox (opcional)

Se você quer uma imagem sandbox com ferramentas comuns de build (Node, Go, Rust, etc.), construa a imagem comum:

```bash
scripts/sandbox-common-setup.sh
```

Isto constrói `openclaw-sandbox-common:bookworm-slim`. Para usá-la:

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } },
    },
  },
}
```

### Imagem de browser de sandbox

Para executar a ferramenta de browser dentro do sandbox, construa a imagem de browser:

```bash
scripts/sandbox-browser-setup.sh
```

Isto constrói `openclaw-sandbox-browser:bookworm-slim` usando `Dockerfile.sandbox-browser`. O container executa Chromium com CDP habilitado e um observador noVNC opcional (headful via Xvfb).

Notas:

- Docker e outros fluxos de browser headless/container ficam em CDP bruto. Chrome MCP `existing-session` é para Chrome local de host, não container takeover.
- Headful (Xvfb) reduz bot blocking vs headless.
- Headless ainda pode ser usado definindo `agents.defaults.sandbox.browser.headless=true`.
- Nenhum ambiente desktop completo (GNOME) é necessário; Xvfb fornece o display.
- Browser containers padrão para um Docker network dedicado (`openclaw-sandbox-browser`) em vez de global `bridge`.
- Opcional `agents.defaults.sandbox.browser.cdpSourceRange` restringe ingresso CDP de edge de container por CIDR (por exemplo `172.21.0.1/32`).
- Acesso de observador noVNC é password-protected por padrão; OpenCraft fornece uma URL de observer token curta que serve uma página bootstrap local e mantém a senha em URL fragment (em vez de URL query).
- Browser container startup padrões são conservadores para workloads compartilhados/container, incluindo:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCRAFT_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-software-rasterizer`
  - `--disable-gpu`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--metrics-recording-only`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--disable-extensions`
  - Se `agents.defaults.sandbox.browser.noSandbox` está definido, `--no-sandbox` e `--disable-setuid-sandbox` também são anexados.
  - Os três flags de hardening de gráficos acima são opcionais. Se sua workload precisa WebGL/3D, defina `OPENCRAFT_BROWSER_DISABLE_GRAPHICS_FLAGS=0` para rodar sem `--disable-3d-apis`, `--disable-software-rasterizer`, e `--disable-gpu`.
  - Comportamento de extensão é controlado por `--disable-extensions` e pode ser desabilitado (habilita extensões) via `OPENCRAFT_BROWSER_DISABLE_EXTENSIONS=0` para páginas extension-dependent ou workloads extension-heavy.
  - `--renderer-process-limit=2` também é configurável com `OPENCRAFT_BROWSER_RENDERER_PROCESS_LIMIT`; defina `0` para deixar Chromium escolher seu limite de processo padrão quando concorrência de browser precisa tuning.

Padrões são aplicados por padrão na imagem empacotada. Se você precisa de diferentes flags Chromium, use uma imagem de browser customizada e forneça seu próprio entrypoint.

Use config:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: { enabled: true },
      },
    },
  },
}
```

Imagem de browser customizada:

```json5
{
  agents: {
    defaults: {
      sandbox: { browser: { image: "my-opencraft-browser" } },
    },
  },
}
```

Quando habilitado, o agent recebe:

- uma URL de controle de browser de sandbox (para a ferramenta `browser`)
- uma URL noVNC (se habilitado e headless=false)

Lembre: se você usa uma allowlist para ferramentas, adicione `browser` (e remova de deny) ou a ferramenta permanece bloqueada.
Regras de prune (`agents.defaults.sandbox.prune`) se aplicam a browser containers também.

### Imagem de sandbox customizada

Construa sua própria imagem e aponte config para ela:

```bash
docker build -t my-opencraft-sbx -f Dockerfile.sandbox .
```

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "my-opencraft-sbx" } },
    },
  },
}
```

### Política de ferramenta (allow/deny)

- `deny` vence sobre `allow`.
- Se `allow` está vazio: todas as ferramentas (exceto deny) estão disponíveis.
- Se `allow` é não-vazio: apenas ferramentas em `allow` estão disponíveis (menos deny).

### Estratégia de pruning

Dois knobs:

- `prune.idleHours`: remove containers não usados em X horas (0 = desabilita)
- `prune.maxAgeDays`: remove containers mais antigos que X dias (0 = desabilita)

Exemplo:

- Mantenha sessões ocupadas mas limpe lifetime:
  `idleHours: 24`, `maxAgeDays: 7`
- Nunca prune:
  `idleHours: 0`, `maxAgeDays: 0`

### Notas de segurança

- Parede dura apenas se aplica a **ferramentas** (exec/read/write/edit/apply_patch).
- Ferramentas apenas-host como browser/camera/canvas são bloqueadas por padrão.
- Permitir `browser` em sandbox **quebra isolamento** (browser roda em host).

## Troubleshooting

- Imagem faltando: construa com [`scripts/sandbox-setup.sh`](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/sandbox-setup.sh) ou defina `agents.defaults.sandbox.docker.image`.
- Container não rodando: vai auto-criar por sessão sob demanda.
- Erros de permissão em sandbox: defina `docker.user` para um UID:GID que corresponde a propriedade de workspace montado (ou chown a pasta workspace).
- Ferramentas customizadas não encontradas: OpenCraft executa comandos com `sh -lc` (login shell), que sourcea `/etc/profile` e pode resetar PATH. Defina `docker.env.PATH` para prepender seus caminhos de ferramenta customizada (ex. `/custom/bin:/usr/local/share/npm-global/bin`), ou adicione um script sob `/etc/profile.d/` em seu Dockerfile.
