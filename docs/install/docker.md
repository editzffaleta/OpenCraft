---
summary: "Configuração opcional do Docker e onboarding para o OpenCraft"
read_when:
  - Você quer um gateway em contêiner em vez de instalações locais
  - Você está validando o fluxo do Docker
title: "Docker"
---

# Docker (opcional)

O Docker é **opcional**. Use-o apenas se quiser um gateway em contêiner ou para validar o fluxo do Docker.

## O Docker é certo para mim?

- **Sim**: você quer um ambiente de gateway isolado e descartável ou executar o OpenCraft em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e só quer o loop de desenvolvimento mais rápido. Use o fluxo de instalação normal.
- **Nota sobre sandboxing**: o sandboxing do agente também usa Docker, mas ele **não** exige que o gateway completo execute no Docker. Veja [Sandboxing](/gateway/sandboxing).

Este guia cobre:

- Gateway em Contêiner (OpenCraft completo no Docker)
- Sandbox de Agente por Sessão (gateway no host + ferramentas do agente isoladas no Docker)

Detalhes de sandboxing: [Sandboxing](/gateway/sandboxing)

## Requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para build da imagem (`pnpm install` pode ser morto por OOM em hosts com 1 GB com exit 137)
- Espaço em disco suficiente para imagens + logs
- Se executando em um VPS/host público, revise
  [Hardening de segurança para exposição de rede](/gateway/security#04-network-exposure-bind--port--firewall),
  especialmente a política de firewall `DOCKER-USER` do Docker.

## Gateway em Contêiner (Docker Compose)

### Início rápido (recomendado)

<Note>
Os padrões do Docker aqui assumem modos bind (`lan`/`loopback`), não aliases de host. Use
valores de modo bind em `gateway.bind` (por exemplo `lan` ou `loopback`), não aliases de host como
`0.0.0.0` ou `localhost`.
</Note>

A partir da raiz do repositório:

```bash
./docker-setup.sh
```

Este script:

- compila a imagem do gateway localmente (ou puxa uma imagem remota se `OPENCLAW_IMAGE` estiver definido)
- executa o assistente de onboarding
- imprime dicas opcionais de configuração de provedor
- inicia o gateway via Docker Compose
- gera um token do gateway e o escreve em `.env`

Variáveis de ambiente opcionais:

- `OPENCLAW_IMAGE` — usar uma imagem remota em vez de compilar localmente (ex.: `ghcr.io/openclaw/openclaw:latest`)
- `OPENCLAW_DOCKER_APT_PACKAGES` — instalar pacotes apt extras durante o build
- `OPENCLAW_EXTENSIONS` — pré-instalar dependências de extensão no momento do build (nomes de extensão separados por espaço, ex.: `diagnostics-otel matrix`)
- `OPENCLAW_EXTRA_MOUNTS` — adicionar bind mounts de host extras
- `OPENCLAW_HOME_VOLUME` — persistir `/home/node` em um volume nomeado
- `OPENCLAW_SANDBOX` — optar pelo bootstrap de sandbox do gateway Docker. Apenas valores truthy explícitos o habilitam: `1`, `true`, `yes`, `on`
- `OPENCLAW_INSTALL_DOCKER_CLI` — passagem de build arg para builds de imagem local (`1` instala o Docker CLI na imagem). `docker-setup.sh` define isso automaticamente quando `OPENCLAW_SANDBOX=1` para builds locais.
- `OPENCLAW_DOCKER_SOCKET` — sobrescrever o caminho do socket Docker (padrão: caminho `DOCKER_HOST=unix://...`, caso contrário `/var/run/docker.sock`)
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — break-glass: permitir alvos `ws://` de rede privada confiável
  para caminhos de cliente CLI/onboarding (o padrão é apenas loopback)
- `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` — desabilitar flags de hardening do navegador do contêiner
  `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu` quando você precisa
  de compatibilidade com WebGL/3D.
- `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` — manter extensões habilitadas quando fluxos do navegador
  as requerem (o padrão mantém extensões desabilitadas no navegador sandbox).
- `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` — definir limite de processo de renderização do Chromium;
  definir como `0` para pular a flag e usar o comportamento padrão do Chromium.

Após concluir:

- Abra `http://127.0.0.1:18789/` no seu navegador.
- Cole o token na UI de Controle (Configurações → token).
- Precisa da URL novamente? Execute `docker compose run --rm openclaw-cli dashboard --no-open`.

### Habilitar sandbox de agente para gateway Docker (opt-in)

`docker-setup.sh` também pode fazer o bootstrap de `agents.defaults.sandbox.*` para implantações
Docker.

Habilite com:

```bash
export OPENCLAW_SANDBOX=1
./docker-setup.sh
```

Caminho de socket personalizado (por exemplo Docker rootless):

```bash
export OPENCLAW_SANDBOX=1
export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
./docker-setup.sh
```

Notas:

- O script monta `docker.sock` apenas após os pré-requisitos de sandbox passarem.
- Se a configuração do sandbox não puder ser concluída, o script redefine
  `agents.defaults.sandbox.mode` para `off` para evitar config de sandbox obsoleta/quebrada
  em reexecuções.
- Se `Dockerfile.sandbox` estiver ausente, o script imprime um aviso e continua;
  compile `openclaw-sandbox:bookworm-slim` com `scripts/sandbox-setup.sh` se
  necessário.
- Para valores `OPENCLAW_IMAGE` não locais, a imagem já deve conter
  suporte ao Docker CLI para execução de sandbox.

### Automação/CI (não interativo, sem ruído de TTY)

Para scripts e CI, desabilite a alocação de pseudo-TTY do Compose com `-T`:

```bash
docker compose run -T --rm openclaw-cli gateway probe
docker compose run -T --rm openclaw-cli devices list --json
```

Se sua automação não exportar variáveis de sessão Claude, deixá-las indefinidas agora resolve para
valores vazios por padrão em `docker-compose.yml` para evitar avisos repetidos de "variável não definida".

### Nota de segurança de rede compartilhada (CLI + gateway)

`openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que comandos CLI possam
alcançar de forma confiável o gateway via `127.0.0.1` no Docker.

Trate isso como um limite de confiança compartilhada: o bind de loopback não é isolamento entre esses dois
contêineres. Se você precisar de separação mais forte, execute comandos de um contêiner/caminho de rede de host
separado em vez do serviço `openclaw-cli` incluído.

Para reduzir o impacto se o processo CLI for comprometido, a config do compose descarta
`NET_RAW`/`NET_ADMIN` e habilita `no-new-privileges` em `openclaw-cli`.

Ele escreve config/workspace no host:

- `~/.opencraft/`
- `~/.opencraft/workspace`

Executando em um VPS? Veja [Hetzner (Docker VPS)](/install/hetzner).

### Usar uma imagem remota (pular build local)

Imagens pré-compiladas oficiais são publicadas em:

- [Pacote do GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)

Use o nome de imagem `ghcr.io/openclaw/openclaw` (não imagens do Docker Hub com nomes similares).

Tags comuns:

- `main` — build mais recente de `main`
- `<version>` — builds de tag de release (por exemplo `2026.2.26`)
- `latest` — tag de release estável mais recente

### Metadados da imagem base

A imagem Docker principal atualmente usa:

- `node:24-bookworm`

A imagem docker agora publica anotações OCI de imagem base (sha256 é um exemplo,
e aponta para o manifesto multi-arch fixado para aquela tag):

- `org.opencontainers.image.base.name=docker.io/library/node:24-bookworm`
- `org.opencontainers.image.base.digest=sha256:3a09aa6354567619221ef6c45a5051b671f953f0a1924d1f819ffb236e520e6b`
- `org.opencontainers.image.source=https://github.com/openclaw/openclaw`
- `org.opencontainers.image.url=https://openclaw.ai`
- `org.opencontainers.image.documentation=https://docs.openclaw.ai/install/docker`
- `org.opencontainers.image.licenses=MIT`
- `org.opencontainers.image.title=OpenCraft`
- `org.opencontainers.image.description=Imagem de contêiner do gateway e runtime CLI do OpenCraft`
- `org.opencontainers.image.revision=<git-sha>`
- `org.opencontainers.image.version=<tag-or-main>`
- `org.opencontainers.image.created=<rfc3339 timestamp>`

Referência: [Anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md)

Contexto de release: o histórico de tags deste repositório já usa Bookworm em
`v2026.2.22` e tags anteriores de 2026 (por exemplo `v2026.2.21`, `v2026.2.9`).

Por padrão, o script de configuração compila a imagem a partir do código-fonte. Para puxar uma imagem
pré-compilada, defina `OPENCLAW_IMAGE` antes de executar o script:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./docker-setup.sh
```

O script detecta que `OPENCLAW_IMAGE` não é o padrão `openclaw:local` e
executa `docker pull` em vez de `docker build`. Todo o resto (onboarding,
início do gateway, geração de token) funciona da mesma forma.

`docker-setup.sh` ainda executa a partir da raiz do repositório porque usa o
`docker-compose.yml` local e arquivos auxiliares. `OPENCLAW_IMAGE` pula o tempo de build
da imagem local; não substitui o fluxo de trabalho compose/setup.

### Auxiliares de shell (opcional)

Para gerenciamento mais fácil do Docker no dia a dia, instale o `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
```

**Adicione ao seu config de shell (zsh):**

```bash
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Em seguida, use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Execute `clawdock-help` para todos os comandos.

Veja o [README do Auxiliar `ClawDock`](https://github.com/openclaw/openclaw/blob/main/scripts/shell-helpers/README.md) para detalhes.

### Fluxo manual (compose)

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

Nota: execute `docker compose ...` a partir da raiz do repositório. Se você habilitou
`OPENCLAW_EXTRA_MOUNTS` ou `OPENCLAW_HOME_VOLUME`, o script de configuração escreve
`docker-compose.extra.yml`; inclua-o ao executar o Compose em outro lugar:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml <command>
```

### Token da UI de Controle + pareamento (Docker)

Se você vir "unauthorized" ou "disconnected (1008): pairing required", obtenha um
link de dashboard novo e aprove o dispositivo do navegador:

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

Mais detalhes: [Dashboard](/web/dashboard), [Dispositivos](/cli/devices).

### Mounts extras (opcional)

Se você quiser montar diretórios de host adicionais nos contêineres, defina
`OPENCLAW_EXTRA_MOUNTS` antes de executar `docker-setup.sh`. Isso aceita uma
lista separada por vírgulas de bind mounts do Docker e os aplica tanto ao
`openclaw-gateway` quanto ao `openclaw-cli` gerando `docker-compose.extra.yml`.

Exemplo:

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

Notas:

- Os caminhos devem ser compartilhados com o Docker Desktop no macOS/Windows.
- Cada entrada deve ser `source:target[:options]` sem espaços, tabs ou quebras de linha.
- Se você editar `OPENCLAW_EXTRA_MOUNTS`, execute novamente `docker-setup.sh` para regenerar o
  arquivo compose extra.
- `docker-compose.extra.yml` é gerado. Não o edite manualmente.

### Persistir o home do contêiner inteiro (opcional)

Se você quiser que `/home/node` persista entre recriações de contêiner, defina um volume
nomeado via `OPENCLAW_HOME_VOLUME`. Isso cria um volume Docker e o monta em
`/home/node`, mantendo os bind mounts padrão de config/workspace. Use um
volume nomeado aqui (não um caminho bind); para bind mounts, use
`OPENCLAW_EXTRA_MOUNTS`.

Exemplo:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

Você pode combinar com mounts extras:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

Notas:

- Volumes nomeados devem corresponder a `^[A-Za-z0-9][A-Za-z0-9_.-]*$`.
- Se você mudar `OPENCLAW_HOME_VOLUME`, execute novamente `docker-setup.sh` para regenerar o
  arquivo compose extra.
- O volume nomeado persiste até ser removido com `docker volume rm <name>`.

### Instalar pacotes apt extras (opcional)

Se você precisar de pacotes do sistema dentro da imagem (por exemplo, ferramentas de build ou bibliotecas
de mídia), defina `OPENCLAW_DOCKER_APT_PACKAGES` antes de executar `docker-setup.sh`.
Isso instala os pacotes durante o build da imagem, para que persistam mesmo se o
contêiner for excluído.

Exemplo:

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

Notas:

- Aceita uma lista separada por espaços de nomes de pacotes apt.
- Se você mudar `OPENCLAW_DOCKER_APT_PACKAGES`, execute novamente `docker-setup.sh` para reconstruir
  a imagem.

### Pré-instalar dependências de extensão (opcional)

Extensões com seu próprio `package.json` (ex.: `diagnostics-otel`, `matrix`,
`msteams`) instalam suas dependências npm na primeira carga. Para inserir essas
dependências na imagem em vez disso, defina `OPENCLAW_EXTENSIONS` antes de
executar `docker-setup.sh`:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel matrix"
./docker-setup.sh
```

Ou ao compilar diretamente:

```bash
docker build --build-arg OPENCLAW_EXTENSIONS="diagnostics-otel matrix" .
```

Notas:

- Aceita uma lista separada por espaços de nomes de diretório de extensão (em `extensions/`).
- Apenas extensões com um `package.json` são afetadas; plugins leves sem um são ignorados.
- Se você mudar `OPENCLAW_EXTENSIONS`, execute novamente `docker-setup.sh` para reconstruir
  a imagem.

### Contêiner completo / para usuários avançados (opt-in)

A imagem Docker padrão é **segurança em primeiro lugar** e executa como o usuário não-root `node`.
Isso mantém a superfície de ataque pequena, mas significa:

- sem instalações de pacotes do sistema em runtime
- sem Homebrew por padrão
- sem navegadores Chromium/Playwright incluídos

Se você quiser um contêiner mais completo, use esses controles opt-in:

1. **Persistir `/home/node`** para que downloads de navegador e caches de ferramentas sobrevivam:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

2. **Inserir deps do sistema na imagem** (repetível + persistente):

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"
./docker-setup.sh
```

3. **Instalar navegadores Playwright sem `npx`** (evita conflitos de override do npm):

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Se você precisar que o Playwright instale deps do sistema, reconstrua a imagem com
`OPENCLAW_DOCKER_APT_PACKAGES` em vez de usar `--with-deps` em runtime.

4. **Persistir downloads de navegador Playwright**:

- Defina `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` em
  `docker-compose.yml`.
- Certifique-se de que `/home/node` persiste via `OPENCLAW_HOME_VOLUME`, ou monte
  `/home/node/.cache/ms-playwright` via `OPENCLAW_EXTRA_MOUNTS`.

### Permissões + EACCES

A imagem executa como `node` (uid 1000). Se você vir erros de permissão em
`/home/node/.opencraft`, certifique-se de que seus bind mounts de host são de propriedade do uid 1000.

Exemplo (host Linux):

```bash
sudo chown -R 1000:1000 /path/to/opencraft-config /path/to/opencraft-workspace
```

Se você optar por executar como root por conveniência, você aceita a troca de segurança.

### Rebuilds mais rápidos (recomendado)

Para acelerar os rebuilds, ordene seu Dockerfile para que as camadas de dependência sejam cacheadas.
Isso evita re-executar `pnpm install` a menos que os lockfiles mudem:

```dockerfile
FROM node:24-bookworm

# Instalar Bun (necessário para scripts de build)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Cachear dependências a menos que metadados de pacote mudem
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

### Configuração de canal (opcional)

Use o contêiner CLI para configurar canais, depois reinicie o gateway se necessário.

WhatsApp (QR):

```bash
docker compose run --rm openclaw-cli channels login
```

Telegram (token do bot):

```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord (token do bot):

```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

Docs: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

### OAuth do OpenAI Codex (Docker headless)

Se você escolher o OAuth do OpenAI Codex no assistente, ele abre uma URL do navegador e tenta
capturar um callback em `http://127.0.0.1:1455/auth/callback`. No Docker ou
configurações headless, esse callback pode mostrar um erro do navegador. Copie a URL de redirect completa
em que você chegar e cole-a de volta no assistente para concluir a autenticação.

### Verificações de saúde

Endpoints de probe do contêiner (sem autenticação necessária):

```bash
curl -fsS http://127.0.0.1:18789/healthz
curl -fsS http://127.0.0.1:18789/readyz
```

Aliases: `/health` e `/ready`.

`/healthz` é uma probe de liveness superficial para "o processo do gateway está ativo".
`/readyz` permanece pronto durante a graça de inicialização, depois fica `503` apenas se os canais gerenciados
obrigatórios ainda estiverem desconectados após a graça ou se desconectarem depois.

A imagem Docker inclui um `HEALTHCHECK` integrado que faz ping em `/healthz` em
segundo plano. Em termos simples: o Docker continua verificando se o OpenCraft ainda está
responsivo. Se as verificações continuarem falhando, o Docker marca o contêiner como `unhealthy`,
e sistemas de orquestração (política de reinicialização do Docker Compose, Swarm, Kubernetes,
etc.) podem reiniciá-lo ou substituí-lo automaticamente.

Snapshot de saúde profunda autenticada (gateway + canais):

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### Teste de fumaça E2E (Docker)

```bash
scripts/e2e/onboard-docker.sh
```

### Teste de fumaça de importação QR (Docker)

```bash
pnpm test:docker:qr
```

### LAN vs loopback (Docker Compose)

`docker-setup.sh` define `OPENCLAW_GATEWAY_BIND=lan` por padrão para que o acesso do host a
`http://127.0.0.1:18789` funcione com publicação de porta do Docker.

- `lan` (padrão): navegador do host + CLI do host podem alcançar a porta do gateway publicada.
- `loopback`: apenas processos dentro do namespace de rede do contêiner podem alcançar
  o gateway diretamente; o acesso via porta publicada do host pode falhar.

O script de configuração também fixa `gateway.mode=local` após o onboarding para que comandos CLI do Docker
usem como padrão o targeting de loopback local.

Nota de config legada: use valores de modo bind em `gateway.bind` (`lan` / `loopback` /
`custom` / `tailnet` / `auto`), não aliases de host (`0.0.0.0`, `127.0.0.1`,
`localhost`, `::`, `::1`).

Se você vir `Gateway target: ws://172.x.x.x:18789` ou erros repetidos de `pairing required`
de comandos CLI do Docker, execute:

```bash
docker compose run --rm openclaw-cli config set gateway.mode local
docker compose run --rm openclaw-cli config set gateway.bind lan
docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
```

### Notas

- O bind do gateway usa `lan` por padrão para uso em contêiner (`OPENCLAW_GATEWAY_BIND`).
- O CMD do Dockerfile usa `--allow-unconfigured`; config montada com `gateway.mode` diferente de `local` ainda iniciará. Sobrescreva o CMD para impor a proteção.
- O contêiner do gateway é a fonte da verdade para sessões (`~/.opencraft/agents/<agentId>/sessions/`).

### Modelo de armazenamento

- **Dados persistentes do host:** o Docker Compose bind-monta `OPENCLAW_CONFIG_DIR` em `/home/node/.opencraft` e `OPENCLAW_WORKSPACE_DIR` em `/home/node/.opencraft/workspace`, para que esses caminhos sobrevivam à substituição do contêiner.
- **tmpfs efêmero de sandbox:** quando `agents.defaults.sandbox` está habilitado, os contêineres de sandbox usam `tmpfs` para `/tmp`, `/var/tmp` e `/run`. Esses mounts são separados da pilha Compose de nível superior e desaparecem com o contêiner de sandbox.
- **Pontos quentes de crescimento de disco:** observe `media/`, `agents/<agentId>/sessions/sessions.json`, arquivos JSONL de transcrição, `cron/runs/*.jsonl` e logs de arquivo rotativo em `/tmp/openclaw/` (ou seu `logging.file` configurado). Se você também executa o app macOS fora do Docker, seus logs de serviço são separados: `~/.opencraft/logs/gateway.log`, `~/.opencraft/logs/gateway.err.log` e `/tmp/openclaw/openclaw-gateway.log`.

## Sandbox de Agente (gateway no host + ferramentas Docker)

Aprofundamento: [Sandboxing](/gateway/sandboxing)

### O que faz

Quando `agents.defaults.sandbox` está habilitado, **sessões não-main** executam ferramentas dentro de um contêiner
Docker. O gateway permanece no seu host, mas a execução de ferramentas é isolada:

- escopo: `"agent"` por padrão (um contêiner + workspace por agente)
- escopo: `"session"` para isolamento por sessão
- pasta de workspace por escopo montada em `/workspace`
- acesso opcional ao workspace do agente (`agents.defaults.sandbox.workspaceAccess`)
- política de ferramentas de allow/deny (deny vence)
- mídia de entrada é copiada para o workspace do sandbox ativo (`media/inbound/*`) para que ferramentas possam lê-la (com `workspaceAccess: "rw"`, isso vai para o workspace do agente)

Aviso: `scope: "shared"` desabilita o isolamento entre sessões. Todas as sessões compartilham
um contêiner e um workspace.

### Perfis de sandbox por agente (multi-agente)

Se você usa roteamento multi-agente, cada agente pode sobrescrever configurações de sandbox + ferramenta:
`agents.list[].sandbox` e `agents.list[].tools` (mais `agents.list[].tools.sandbox.tools`). Isso permite executar
níveis de acesso mistos em um único gateway:

- Acesso completo (agente pessoal)
- Ferramentas somente leitura + workspace somente leitura (agente de família/trabalho)
- Sem ferramentas de sistema de arquivos/shell (agente público)

Veja [Sandbox e Ferramentas Multi-Agente](/tools/multi-agent-sandbox-tools) para exemplos,
precedência e solução de problemas.

### Comportamento padrão

- Imagem: `openclaw-sandbox:bookworm-slim`
- Um contêiner por agente
- Acesso ao workspace do agente: `workspaceAccess: "none"` (padrão) usa `~/.opencraft/sandboxes`
  - `"ro"` mantém o workspace do sandbox em `/workspace` e monta o workspace do agente somente leitura em `/agent` (desabilita `write`/`edit`/`apply_patch`)
  - `"rw"` monta o workspace do agente em leitura/escrita em `/workspace`
- Poda automática: inativo > 24h OU idade > 7d
- Rede: `none` por padrão (opte explicitamente se precisar de egresso)
  - `host` está bloqueado.
  - `container:<id>` está bloqueado por padrão (risco de namespace-join).
- Allow padrão: `exec`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- Deny padrão: `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`

### Habilitar sandboxing

Se você planeja instalar pacotes em `setupCommand`, note:

- `docker.network` padrão é `"none"` (sem egresso).
- `docker.network: "host"` está bloqueado.
- `docker.network: "container:<id>"` está bloqueado por padrão.
- Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.
- `readOnlyRoot: true` bloqueia instalações de pacotes.
- `user` deve ser root para `apt-get` (omita `user` ou defina `user: "0:0"`).
  O OpenCraft recria automaticamente contêineres quando `setupCommand` (ou config docker) muda
  a menos que o contêiner tenha sido **usado recentemente** (dentro de ~5 minutos). Contêineres quentes
  registram um aviso com o comando exato `opencraft sandbox recreate ...`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (agent é o padrão)
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
          idleHours: 24, // 0 desabilita poda por inatividade
          maxAgeDays: 7, // 0 desabilita poda por idade máxima
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

Controles de hardening ficam em `agents.defaults.sandbox.docker`:
`network`, `user`, `pidsLimit`, `memory`, `memorySwap`, `cpus`, `ulimits`,
`seccompProfile`, `apparmorProfile`, `dns`, `extraHosts`,
`dangerouslyAllowContainerNamespaceJoin` (apenas break-glass).

Multi-agente: sobrescreva `agents.defaults.sandbox.{docker,browser,prune}.*` por agente via `agents.list[].sandbox.{docker,browser,prune}.*`
(ignorado quando `agents.defaults.sandbox.scope` / `agents.list[].sandbox.scope` é `"shared"`).

### Compilar a imagem de sandbox padrão

```bash
scripts/sandbox-setup.sh
```

Isso compila `openclaw-sandbox:bookworm-slim` usando `Dockerfile.sandbox`.

### Imagem comum de sandbox (opcional)

Se você quiser uma imagem de sandbox com ferramentas de build comuns (Node, Go, Rust, etc.), compile a imagem comum:

```bash
scripts/sandbox-common-setup.sh
```

Isso compila `openclaw-sandbox-common:bookworm-slim`. Para usá-la:

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } },
    },
  },
}
```

### Imagem de sandbox do navegador

Para executar a ferramenta de navegador dentro do sandbox, compile a imagem do navegador:

```bash
scripts/sandbox-browser-setup.sh
```

Isso compila `openclaw-sandbox-browser:bookworm-slim` usando
`Dockerfile.sandbox-browser`. O contêiner executa o Chromium com CDP habilitado e
um observador noVNC opcional (headful via Xvfb).

Notas:

- Headful (Xvfb) reduz o bloqueio por bot vs headless.
- Headless ainda pode ser usado definindo `agents.defaults.sandbox.browser.headless=true`.
- Nenhum ambiente de desktop completo (GNOME) é necessário; o Xvfb fornece o display.
- Contêineres de navegador usam por padrão uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez do `bridge` global.
- `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe o ingresso CDP na borda do contêiner por CIDR (por exemplo `172.21.0.1/32`).
- O acesso ao observador noVNC é protegido por senha por padrão; o OpenCraft fornece uma URL de token de observador de curta duração que serve uma página de bootstrap local e mantém a senha no fragmento da URL (em vez da query da URL).
- Os padrões de inicialização do contêiner do navegador são conservadores para cargas de trabalho compartilhadas/em contêiner, incluindo:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derivado de OPENCLAW_BROWSER_CDP_PORT>`
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
  - Se `agents.defaults.sandbox.browser.noSandbox` estiver definido, `--no-sandbox` e
    `--disable-setuid-sandbox` também são acrescentados.
  - As três flags de hardening gráfico acima são opcionais. Se sua carga de trabalho precisar
    de WebGL/3D, defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` para executar sem
    `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu`.
  - O comportamento de extensão é controlado por `--disable-extensions` e pode ser desabilitado
    (habilita extensões) via `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para
    fluxos dependentes de extensão ou extensão-heavy.
  - `--renderer-process-limit=2` também é configurável com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT`; defina `0` para deixar o Chromium escolher seu
    limite de processo padrão quando a concorrência do navegador precisar de ajuste.

Os padrões são aplicados por padrão na imagem incluída. Se você precisar de flags Chromium diferentes,
use uma imagem de navegador personalizada e forneça seu próprio entrypoint.

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

Imagem de navegador personalizada:

```json5
{
  agents: {
    defaults: {
      sandbox: { browser: { image: "my-openclaw-browser" } },
    },
  },
}
```

Quando habilitado, o agente recebe:

- uma URL de controle do navegador sandbox (para a ferramenta `browser`)
- uma URL noVNC (se habilitado e headless=false)

Lembre-se: se você usar uma allowlist de ferramentas, adicione `browser` (e remova-o do
deny) ou a ferramenta permanece bloqueada.
As regras de poda (`agents.defaults.sandbox.prune`) também se aplicam a contêineres de navegador.

### Imagem de sandbox personalizada

Compile sua própria imagem e aponte a config para ela:

```bash
docker build -t my-openclaw-sbx -f Dockerfile.sandbox .
```

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "my-openclaw-sbx" } },
    },
  },
}
```

### Política de ferramentas (allow/deny)

- `deny` vence sobre `allow`.
- Se `allow` estiver vazio: todas as ferramentas (exceto deny) estão disponíveis.
- Se `allow` não estiver vazio: apenas ferramentas em `allow` estão disponíveis (menos deny).

### Estratégia de poda

Dois controles:

- `prune.idleHours`: remover contêineres não usados em X horas (0 = desabilitar)
- `prune.maxAgeDays`: remover contêineres com mais de X dias (0 = desabilitar)

Exemplo:

- Manter sessões ativas mas limitar o tempo de vida:
  `idleHours: 24`, `maxAgeDays: 7`
- Nunca podar:
  `idleHours: 0`, `maxAgeDays: 0`

### Notas de segurança

- A barreira rígida aplica-se apenas a **ferramentas** (exec/read/write/edit/apply_patch).
- Ferramentas somente-host como browser/camera/canvas são bloqueadas por padrão.
- Permitir `browser` no sandbox **quebra o isolamento** (o navegador executa no host).

## Solução de problemas

- Imagem ausente: compile com [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) ou defina `agents.defaults.sandbox.docker.image`.
- Contêiner não em execução: será criado automaticamente por sessão sob demanda.
- Erros de permissão no sandbox: defina `docker.user` para um UID:GID que corresponda à propriedade do workspace montado (ou faça chown na pasta do workspace).
- Ferramentas personalizadas não encontradas: o OpenCraft executa comandos com `sh -lc` (shell de login), que
  carrega `/etc/profile` e pode redefinir o PATH. Defina `docker.env.PATH` para prefixar seus
  caminhos de ferramentas personalizadas (ex.: `/custom/bin:/usr/local/share/npm-global/bin`), ou adicione
  um script em `/etc/profile.d/` no seu Dockerfile.
