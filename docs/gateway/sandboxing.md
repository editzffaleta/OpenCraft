---
summary: "Como o sandboxing do OpenCraft funciona: modos, escopos, acesso ao workspace e imagens"
title: Sandboxing
read_when: "Você quer uma explicação dedicada do sandboxing ou precisa ajustar agents.defaults.sandbox."
status: active
---

# Sandboxing

OpenCraft pode executar **ferramentas dentro de backends de sandbox** para reduzir o raio de impacto.
Isso é **opcional** e controlado por configuração (`agents.defaults.sandbox` ou
`agents.list[].sandbox`). Se o sandboxing estiver desativado, as ferramentas executam no host.
O Gateway permanece no host; a execução de ferramentas roda em um sandbox isolado
quando habilitado.

Isso não é um limite de segurança perfeito, mas limita materialmente o acesso ao
filesystem e processos quando o modelo faz algo errado.

## O que fica em sandbox

- Execução de ferramentas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador em sandbox opcional (`agents.defaults.sandbox.browser`).
  - Por padrão, o navegador sandbox auto-inicia (garante que o CDP está acessível) quando a ferramenta de navegador precisa dele.
    Configure via `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Por padrão, containers de navegador sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede `bridge` global.
    Configure com `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe o ingresso CDP na borda do container com uma allowlist CIDR (por exemplo `172.21.0.1/32`).
  - O acesso de observador noVNC é protegido por senha por padrão; o OpenCraft emite uma URL com token de curta duração que serve uma página bootstrap local e abre o noVNC com a senha no fragmento da URL (não em query/header/logs).
  - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões em sandbox direcionem o navegador do host explicitamente.
  - Allowlists opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

O que não fica em sandbox:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente permitida a executar no host (ex: `tools.elevated`).
  - **Exec elevated executa no host e ignora o sandboxing.**
  - Se o sandboxing estiver desativado, `tools.elevated` não muda a execução (já está no host). Veja [Modo Elevated](/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o sandboxing é usado:

- `"off"`: sem sandboxing.
- `"non-main"`: sandbox apenas em sessões **não-main** (padrão se você quer chats normais no host).
- `"all"`: toda sessão executa em um sandbox.
  Nota: `"non-main"` é baseado em `session.mainKey` (padrão `"main"`), não no id do agente.
  Sessões de grupo/canal usam suas próprias chaves, então contam como não-main e ficarão em sandbox.

## Escopo

`agents.defaults.sandbox.scope` controla **quantos containers** são criados:

- `"session"` (padrão): um container por sessão.
- `"agent"`: um container por agente.
- `"shared"`: um container compartilhado por todas as sessões em sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qual runtime** fornece o sandbox:

- `"docker"` (padrão): runtime sandbox local baseado em Docker.
- `"ssh"`: runtime sandbox remoto genérico baseado em SSH.
- `"openshell"`: runtime sandbox baseado em OpenShell.

Configurações específicas de SSH ficam em `agents.defaults.sandbox.ssh`.
Configurações específicas de OpenShell ficam em `plugins.entries.openshell.config`.

### Backend SSH

Use `backend: "ssh"` quando quiser que o OpenCraft coloque `exec`, ferramentas de arquivo e leituras de mídia em sandbox
em uma máquina acessível via SSH arbitrária.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/opencraft-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Ou use SecretRefs / conteúdo inline em vez de arquivos locais:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Como funciona:

- O OpenCraft cria uma raiz remota por escopo em `sandbox.ssh.workspaceRoot`.
- No primeiro uso após criar ou recriar, o OpenCraft semeia esse workspace remoto a partir do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia de prompt e staging de mídia de entrada executam diretamente contra o workspace remoto via SSH.
- O OpenCraft não sincroniza mudanças remotas de volta ao workspace local automaticamente.

Material de autenticação:

- `identityFile`, `certificateFile`, `knownHostsFile`: use arquivos locais existentes e passe-os pela configuração OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: use strings inline ou SecretRefs. O OpenCraft resolve-os através do snapshot normal de runtime de secrets, escreve-os em arquivos temporários com `0600`, e deleta-os quando a sessão SSH termina.
- Se ambos `*File` e `*Data` estiverem definidos para o mesmo item, `*Data` vence para essa sessão SSH.

Este é um modelo **remote-canonical**. O workspace SSH remoto se torna o estado real do sandbox após a semeadura inicial.

Consequências importantes:

- Edições feitas localmente no host fora do OpenCraft após a etapa de semeadura não são visíveis remotamente até você recriar o sandbox.
- `opencraft sandbox recreate` deleta a raiz remota por escopo e semeia novamente a partir do local no próximo uso.
- Sandboxing de navegador não é suportado no backend SSH.
- Configurações `sandbox.docker.*` não se aplicam ao backend SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "opencraft",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Modos do OpenShell:

- `mirror` (padrão): o workspace local permanece canônico. O OpenCraft sincroniza arquivos locais no OpenShell antes do exec e sincroniza o workspace remoto de volta após o exec.
- `remote`: o workspace do OpenShell é canônico após a criação do sandbox. O OpenCraft semeia o workspace remoto uma vez a partir do workspace local, depois ferramentas de arquivo e exec executam diretamente contra o sandbox remoto sem sincronizar mudanças de volta.

O OpenShell reutiliza o mesmo transporte SSH central e bridge de filesystem remoto do backend SSH genérico.
O plugin adiciona ciclo de vida específico do OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) e o modo `mirror` opcional.

Detalhes de transporte remoto:

- O OpenCraft solicita ao OpenShell a configuração SSH específica do sandbox via `openshell sandbox ssh-config <name>`.
- O core escreve essa configuração SSH em um arquivo temporário, abre a sessão SSH e reutiliza o mesmo bridge de filesystem remoto usado por `backend: "ssh"`.
- No modo `mirror` apenas o ciclo de vida difere: sincronizar local para remoto antes do exec, depois sincronizar de volta após o exec.

Limitações atuais do OpenShell:

- navegador sandbox não é suportado ainda
- `sandbox.docker.binds` não é suportado no backend OpenShell
- Knobs de runtime específicos do Docker em `sandbox.docker.*` ainda se aplicam apenas ao backend Docker

## Modos de workspace do OpenShell

O OpenShell tem dois modelos de workspace. Esta é a parte que mais importa na prática.

### `mirror`

Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace local permaneça canônico**.

Comportamento:

- Antes do `exec`, o OpenCraft sincroniza o workspace local no sandbox do OpenShell.
- Após o `exec`, o OpenCraft sincroniza o workspace remoto de volta ao workspace local.
- Ferramentas de arquivo ainda operam através do bridge do sandbox, mas o workspace local permanece a fonte de verdade entre turnos.

Use isso quando:

- você edita arquivos localmente fora do OpenCraft e quer que essas mudanças apareçam no sandbox automaticamente
- você quer que o sandbox do OpenShell se comporte o mais parecido possível com o backend Docker
- você quer que o workspace do host reflita as escritas do sandbox após cada turno de exec

Tradeoff:

- custo extra de sincronização antes e depois do exec

### `remote`

Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o **workspace do OpenShell se torne canônico**.

Comportamento:

- Quando o sandbox é criado pela primeira vez, o OpenCraft semeia o workspace remoto a partir do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam diretamente contra o workspace remoto do OpenShell.
- O OpenCraft **não** sincroniza mudanças remotas de volta ao workspace local após o exec.
- Leituras de mídia em tempo de prompt ainda funcionam porque ferramentas de arquivo e mídia leem através do bridge do sandbox em vez de assumir um caminho local no host.
- O transporte é SSH para o sandbox do OpenShell retornado por `openshell sandbox ssh-config`.

Consequências importantes:

- Se você editar arquivos no host fora do OpenCraft após a etapa de semeadura, o sandbox remoto **não** verá essas mudanças automaticamente.
- Se o sandbox for recriado, o workspace remoto é semeado a partir do workspace local novamente.
- Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto é compartilhado no mesmo escopo.

Use isso quando:

- o sandbox deve residir primariamente no lado remoto do OpenShell
- você quer menor overhead de sincronização por turno
- você não quer que edições locais no host sobrescrevam silenciosamente o estado do sandbox remoto

Escolha `mirror` se você pensa no sandbox como um ambiente de execução temporário.
Escolha `remote` se você pensa no sandbox como o workspace real.

## Ciclo de vida do OpenShell

Sandboxes do OpenShell ainda são gerenciados através do ciclo de vida normal de sandbox:

- `opencraft sandbox list` mostra runtimes do OpenShell assim como runtimes Docker
- `opencraft sandbox recreate` deleta o runtime atual e deixa o OpenCraft recriá-lo no próximo uso
- lógica de prune também é consciente do backend

Para o modo `remote`, recriar é especialmente importante:

- recriar deleta o workspace remoto canônico para aquele escopo
- o próximo uso semeia um workspace remoto novo a partir do workspace local

Para o modo `mirror`, recriar principalmente reseta o ambiente de execução remoto
porque o workspace local permanece canônico de qualquer forma.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que o sandbox pode ver**:

- `"none"` (padrão): ferramentas veem um workspace sandbox em `~/.opencraft/sandboxes`.
- `"ro"`: monta o workspace do agente como somente leitura em `/agent` (desabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta o workspace do agente como leitura/escrita em `/workspace`.

Com o backend OpenShell:

- o modo `mirror` ainda usa o workspace local como fonte canônica entre turnos de exec
- o modo `remote` usa o workspace remoto do OpenShell como fonte canônica após a semeadura inicial
- `workspaceAccess: "ro"` e `"none"` ainda restringem o comportamento de escrita da mesma forma

Mídia de entrada é copiada para o workspace sandbox ativo (`media/inbound/*`).
Nota sobre Skills: a ferramenta `read` tem raiz no sandbox. Com `workspaceAccess: "none"`,
o OpenCraft espelha Skills elegíveis no workspace sandbox (`.../skills`) para que
possam ser lidos. Com `"rw"`, Skills do workspace são legíveis em
`/workspace/skills`.

## Montagens de bind personalizadas

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no container.
Formato: `host:container:modo` (ex: `"/home/user/source:/source:rw"`).

Binds globais e por agente são **mesclados** (não substituídos). Em `scope: "shared"`, binds por agente são ignorados.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host no container do **navegador sandbox** apenas.

- Quando definido (incluindo `[]`), substitui `agents.defaults.sandbox.docker.binds` para o container do navegador.
- Quando omitido, o container do navegador usa `agents.defaults.sandbox.docker.binds` como fallback (compatível com versões anteriores).

Exemplo (código fonte somente leitura + um diretório de dados extra):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Notas de segurança:

- Binds ignoram o filesystem do sandbox: eles expõem caminhos do host com o modo que você definiu (`:ro` ou `:rw`).
- O OpenCraft bloqueia fontes de bind perigosas (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montagens pai que as exporiam).
- Montagens sensíveis (secrets, chaves SSH, credenciais de serviço) devem ser `:ro` a menos que absolutamente necessário.
- Combine com `workspaceAccess: "ro"` se você precisa apenas de acesso de leitura ao workspace; modos de bind permanecem independentes.
- Veja [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) para como binds interagem com política de ferramentas e exec elevated.

## Imagens + setup

Imagem Docker padrão: `openclaw-sandbox:bookworm-slim`

Construa uma vez:

```bash
scripts/sandbox-setup.sh
```

Nota: a imagem padrão **não** inclui Node. Se uma Skill precisa de Node (ou
outros runtimes), construa uma imagem personalizada ou instale via
`sandbox.docker.setupCommand` (requer egresso de rede + raiz gravável +
usuário root).

Se você quer uma imagem sandbox mais funcional com ferramentas comuns (por exemplo
`curl`, `jq`, `nodejs`, `python3`, `git`), construa:

```bash
scripts/sandbox-common-setup.sh
```

Depois defina `agents.defaults.sandbox.docker.image` como
`openclaw-sandbox-common:bookworm-slim`.

Imagem do navegador sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Por padrão, containers sandbox Docker executam **sem rede**.
Sobrescreva com `agents.defaults.sandbox.docker.network`.

A imagem do navegador sandbox empacotada também aplica padrões conservadores de inicialização do Chromium
para workloads em containers. Os padrões atuais do container incluem:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derivado de OPENCRAFT_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` está habilitado.
- As três flags de hardening gráfico (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) são opcionais e são úteis
  quando containers não têm suporte a GPU. Defina `OPENCRAFT_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  se seu workload requer WebGL ou outras funcionalidades 3D/navegador.
- `--disable-extensions` é habilitado por padrão e pode ser desabilitado com
  `OPENCRAFT_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
- `--renderer-process-limit=2` é controlado por
  `OPENCRAFT_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, onde `0` mantém o padrão do Chromium.

Se você precisa de um perfil de runtime diferente, use uma imagem de navegador personalizada e forneça
seu próprio entrypoint. Para perfis locais (não em container) do Chromium, use
`browser.extraArgs` para adicionar flags de inicialização adicionais.

Padrões de segurança:

- `network: "host"` é bloqueado.
- `network: "container:<id>"` é bloqueado por padrão (risco de bypass de junção de namespace).
- Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalações Docker e o gateway em container estão aqui:
[Docker](/install/docker)

Para deploys de gateway Docker, `docker-setup.sh` pode inicializar a configuração do sandbox.
Defina `OPENCRAFT_SANDBOX=1` (ou `true`/`yes`/`on`) para habilitar esse caminho. Você pode
sobrescrever a localização do socket com `OPENCRAFT_DOCKER_SOCKET`. Setup completo e referência
de env: [Docker](/install/docker#enable-agent-sandbox-for-docker-gateway-opt-in).

## setupCommand (setup único do container)

`setupCommand` executa **uma vez** após o container sandbox ser criado (não em toda execução).
Ele executa dentro do container via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

Armadilhas comuns:

- `docker.network` padrão é `"none"` (sem egresso), então instalações de pacotes falharão.
- `docker.network: "container:<id>"` requer `dangerouslyAllowContainerNamespaceJoin: true` e é apenas break-glass.
- `readOnlyRoot: true` impede escritas; defina `readOnlyRoot: false` ou construa uma imagem personalizada.
- `user` deve ser root para instalações de pacotes (omita `user` ou defina `user: "0:0"`).
- Exec do sandbox **não** herda `process.env` do host. Use
  `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para chaves de API de Skills.

## Política de ferramentas + saídas de emergência

Políticas de allow/deny de ferramentas ainda se aplicam antes das regras de sandbox. Se uma ferramenta é negada
globalmente ou por agente, o sandboxing não a traz de volta.

`tools.elevated` é uma saída de emergência explícita que executa `exec` no host.
Diretivas `/exec` se aplicam apenas para remetentes autorizados e persistem por sessão; para desabilitar
`exec` permanentemente, use política de deny de ferramentas (veja [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `opencraft sandbox explain` para inspecionar modo efetivo de sandbox, política de ferramentas e chaves de config para correção.
- Veja [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental de "por que isso está bloqueado?".
  Mantenha bloqueado.

## Overrides multi-agente

Cada agente pode sobrescrever sandbox + ferramentas:
`agents.list[].sandbox` e `agents.list[].tools` (mais `agents.list[].tools.sandbox.tools` para política de ferramentas do sandbox).
Veja [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) para precedência.

## Exemplo mínimo de habilitação

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Documentação relacionada

- [Configuração de Sandbox](/gateway/configuration#agentsdefaults-sandbox)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)
- [Segurança](/gateway/security)
