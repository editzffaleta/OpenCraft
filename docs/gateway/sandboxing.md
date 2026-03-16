---
summary: "Como o sandboxing do OpenCraft funciona: modos, escopos, acesso ao workspace e imagens"
title: Sandboxing
read_when: "Você quer uma explicação dedicada sobre sandboxing ou precisa ajustar agents.defaults.sandbox."
status: active
---

# Sandboxing

O OpenCraft pode rodar **tools dentro de containers Docker** para reduzir o raio de explosão.
Isso é **opcional** e controlado por configuração (`agents.defaults.sandbox` ou
`agents.list[].sandbox`). Se o sandboxing estiver desativado, as tools rodam no host.
O Gateway permanece no host; a execução de tools roda em um sandbox isolado
quando habilitado.

Isso não é um limite de segurança perfeito, mas limita materialmente o acesso ao
sistema de arquivos e a processos quando o modelo faz algo indesejado.

## O que é sandboxado

- Execução de tools (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Browser sandboxado opcional (`agents.defaults.sandbox.browser`).
  - Por padrão, o browser do sandbox inicia automaticamente (garante que CDP seja acessível) quando a tool de browser precisar.
    Configure via `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Por padrão, containers do browser do sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede `bridge` global.
    Configure com `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe o ingresso CDP da borda do container com uma allowlist CIDR (por exemplo `172.21.0.1/32`).
  - O acesso do observador noVNC é protegido por senha por padrão; o OpenCraft emite uma URL de token de curta duração que serve uma página de bootstrap local e abre o noVNC com a senha no fragmento de URL (não em logs de query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões sandboxadas direcionem explicitamente para o browser do host.
  - Allowlists opcionais portam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Não sandboxado:

- O próprio processo do Gateway.
- Qualquer tool explicitamente permitida a rodar no host (ex. `tools.elevated`).
  - **Exec elevado roda no host e bypassa o sandboxing.**
  - Se o sandboxing está desativado, `tools.elevated` não muda a execução (já no host). Veja [Modo Elevated](/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o sandboxing é usado:

- `"off"`: sem sandboxing.
- `"non-main"`: sandbox apenas sessões **não-main** (padrão se você quer chats normais no host).
- `"all"`: cada sessão roda em um sandbox.
  Nota: `"non-main"` é baseado em `session.mainKey` (padrão `"main"`), não no id do agente.
  Sessões de grupo/canal usam suas próprias chaves, então contam como não-main e serão sandboxadas.

## Escopo

`agents.defaults.sandbox.scope` controla **quantos containers** são criados:

- `"session"` (padrão): um container por sessão.
- `"agent"`: um container por agente.
- `"shared"`: um container compartilhado por todas as sessões sandboxadas.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que o sandbox pode ver**:

- `"none"` (padrão): tools veem um workspace do sandbox em `~/.opencraft/sandboxes`.
- `"ro"`: monta o workspace do agente somente-leitura em `/agent` (desabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta o workspace do agente em leitura/escrita em `/workspace`.

Mídia de entrada é copiada para o workspace do sandbox ativo (`media/inbound/*`).
Nota sobre skills: a tool `read` tem raiz no sandbox. Com `workspaceAccess: "none"`,
o OpenCraft espelha skills elegíveis para o workspace do sandbox (`.../skills`) para
que possam ser lidas. Com `"rw"`, skills do workspace são legíveis em
`/workspace/skills`.

## Bind mounts customizados

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no container.
Formato: `host:container:mode` (ex., `"/home/usuario/source:/source:rw"`).

Binds globais e por agente são **mesclados** (não substituídos). Sob `scope: "shared"`, binds por agente são ignorados.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host apenas no container do **browser do sandbox**.

- Quando definido (incluindo `[]`), substitui `agents.defaults.sandbox.docker.binds` para o container do browser.
- Quando omitido, o container do browser usa `agents.defaults.sandbox.docker.binds` como fallback (compatível com versões anteriores).

Exemplo (código-fonte somente-leitura + um diretório de dados extra):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/usuario/source:/source:ro", "/var/data/myapp:/data:ro"],
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

- Binds bypassam o sistema de arquivos do sandbox: eles expõem paths do host com qualquer modo que você definir (`:ro` ou `:rw`).
- O OpenCraft bloqueia fontes de bind perigosas (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, e montagens pai que os exporiam).
- Montagens sensíveis (segredos, chaves SSH, credenciais de serviço) devem ser `:ro` a menos que absolutamente necessário.
- Combine com `workspaceAccess: "ro"` se você só precisa de acesso de leitura ao workspace; os modos de bind permanecem independentes.
- Veja [Sandbox vs Política de Tool vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) para como os binds interagem com a política de tool e exec elevado.

## Imagens + configuração

Imagem padrão: `openclaw-sandbox:bookworm-slim`

Construa uma vez:

```bash
scripts/sandbox-setup.sh
```

Nota: a imagem padrão **não** inclui Node. Se uma skill precisa de Node (ou
outros runtimes), bake uma imagem customizada ou instale via
`sandbox.docker.setupCommand` (requer egress de rede + raiz gravável +
usuário root).

Se você quer uma imagem de sandbox mais funcional com tooling comum (por exemplo
`curl`, `jq`, `nodejs`, `python3`, `git`), construa:

```bash
scripts/sandbox-common-setup.sh
```

Depois defina `agents.defaults.sandbox.docker.image` como
`openclaw-sandbox-common:bookworm-slim`.

Imagem do browser sandboxado:

```bash
scripts/sandbox-browser-setup.sh
```

Por padrão, containers do sandbox rodam **sem rede**.
Substitua com `agents.defaults.sandbox.docker.network`.

A imagem do browser do sandbox incluída também aplica padrões conservadores de inicialização do Chromium
para workloads em container. Os padrões atuais do container incluem:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derivado de OPENCLAW_BROWSER_CDP_PORT>`
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
- As três flags de endurecimento de gráficos (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) são opcionais e úteis
  quando containers não têm suporte a GPU. Defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  se sua workload requer WebGL ou outros recursos 3D/browser.
- `--disable-extensions` está habilitado por padrão e pode ser desabilitado com
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
- `--renderer-process-limit=2` é controlado por
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, onde `0` mantém o padrão do Chromium.

Se você precisa de um perfil de runtime diferente, use uma imagem de browser customizada e forneça
seu próprio entrypoint. Para perfis Chromium locais (não em container), use
`browser.extraArgs` para adicionar flags de inicialização extras.

Padrões de segurança:

- `network: "host"` está bloqueado.
- `network: "container:<id>"` está bloqueado por padrão (risco de bypass de junção de namespace).
- Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalações Docker e o gateway em container ficam aqui:
[Docker](/install/docker)

Para deployments de gateway Docker, `docker-setup.sh` pode fazer bootstrap da config do sandbox.
Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para habilitar esse caminho. Você pode
substituir a localização do socket com `OPENCLAW_DOCKER_SOCKET`. Configuração completa e referência de env:
[Docker](/install/docker#enable-agent-sandbox-for-docker-gateway-opt-in).

## setupCommand (configuração única do container)

`setupCommand` roda **uma vez** após o container do sandbox ser criado (não a cada run).
Ele é executado dentro do container via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

Armadilhas comuns:

- `docker.network` padrão é `"none"` (sem egress), então instalações de pacotes falharão.
- `docker.network: "container:<id>"` requer `dangerouslyAllowContainerNamespaceJoin: true` e é somente break-glass.
- `readOnlyRoot: true` impede escritas; defina `readOnlyRoot: false` ou bake uma imagem customizada.
- `user` deve ser root para instalações de pacotes (omita `user` ou defina `user: "0:0"`).
- Exec do sandbox **não** herda `process.env` do host. Use
  `agents.defaults.sandbox.docker.env` (ou uma imagem customizada) para chaves de API de skills.

## Política de tool + válvulas de escape

Políticas de allow/deny de tool ainda se aplicam antes das regras do sandbox. Se uma tool está negada
globalmente ou por agente, o sandboxing não a restaura.

`tools.elevated` é uma válvula de escape explícita que roda `exec` no host.
Diretivas `/exec` se aplicam apenas para remetentes autorizados e persistem por sessão; para hard-disable
`exec`, use deny de política de tool (veja [Sandbox vs Política de Tool vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `opencraft sandbox explain` para inspecionar o modo efetivo do sandbox, política de tool e chaves de config de correção.
- Veja [Sandbox vs Política de Tool vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental "por que está bloqueado?".
  Mantenha tudo bem restrito.

## Overrides multi-agente

Cada agente pode substituir sandbox + tools:
`agents.list[].sandbox` e `agents.list[].tools` (mais `agents.list[].tools.sandbox.tools` para política de tool do sandbox).
Veja [Sandbox & Tools Multi-Agente](/tools/multi-agent-sandbox-tools) para precedência.

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

## Docs relacionados

- [Configuração do Sandbox](/gateway/configuration#agentsdefaults-sandbox)
- [Sandbox & Tools Multi-Agente](/tools/multi-agent-sandbox-tools)
- [Segurança](/gateway/security)
