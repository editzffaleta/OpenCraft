---
summary: "Plugins/extensões do OpenCraft: descoberta, configuração e segurança"
read_when:
  - Adicionando ou modificando plugins/extensões
  - Documentando regras de instalação ou carregamento de plugins
title: "Plugins"
---

# Plugins (Extensões)

## Início rápido (novo em plugins?)

Um plugin é apenas um **módulo de código pequeno** que estende o OpenCraft com recursos
extras (comandos, tools e Gateway RPC).

Na maioria das vezes, você usará plugins quando quiser um recurso que ainda não está
integrado ao OpenCraft (ou quando quiser manter recursos opcionais fora da sua
instalação principal).

Caminho rápido:

1. Veja o que já está carregado:

```bash
opencraft plugins list
```

2. Instale um plugin oficial (exemplo: Voice Call):

```bash
opencraft plugins install @openclaw/voice-call
```

Specs npm são **somente do registry** (nome do pacote + **versão exata** ou
**dist-tag** opcionais). Specs de Git/URL/arquivo e ranges de semver são rejeitados.

Specs bare e `@latest` ficam na trilha estável. Se o npm resolver qualquer um desses
para um prelançamento, o OpenCraft para e pede que você faça opt-in explicitamente com uma
tag de prelançamento como `@beta`/`@rc` ou uma versão exata de prelançamento.

3. Reinicie o Gateway, então configure em `plugins.entries.<id>.config`.

Veja [Voice Call](/plugins/voice-call) para um exemplo concreto de plugin.
Procurando listagens de terceiros? Veja [Plugins da comunidade](/plugins/community).

## Arquitetura

O sistema de plugins do OpenCraft tem quatro camadas:

1. **Manifest + descoberta**
   O OpenCraft encontra candidatos a plugins em caminhos configurados, raízes de workspace,
   raízes de extensões globais e extensões empacotadas. A descoberta lê
   `openclaw.plugin.json` mais metadados do pacote primeiro.
2. **Habilitação + validação**
   O core decide se um plugin descoberto é habilitado, desabilitado, bloqueado ou
   selecionado para um slot exclusivo como memória.
3. **Carregamento em runtime**
   Plugins habilitados são carregados em-processo via jiti e registram capacidades em
   um registry central.
4. **Consumo de superfície**
   O restante do OpenCraft lê o registry para expor tools, canais, configuração de
   provedor, hooks, rotas HTTP, comandos CLI e serviços.

A fronteira de design importante:

- descoberta + validação de config devem funcionar a partir de **metadados de manifest/schema**
  sem executar código de plugin
- o comportamento em runtime vem do caminho `register(api)` do módulo de plugin

Essa divisão permite que o OpenCraft valide config, explique plugins ausentes/desabilitados e
construa hints de UI/schema antes que o runtime completo esteja ativo.

## Modelo de execução

Plugins rodam **em-processo** com o Gateway. Eles não são sandboxados. Um plugin
carregado tem o mesmo limite de confiança em nível de processo que o código core.

Implicações:

- um plugin pode registrar tools, handlers de rede, hooks e serviços
- um bug em plugin pode travar ou desestabilizar o gateway
- um plugin malicioso é equivalente a execução de código arbitrário dentro do
  processo do OpenCraft

Use allowlists e caminhos explícitos de install/load para plugins não empacotados. Trate
plugins de workspace como código em tempo de desenvolvimento, não padrões de produção.

Nota importante de confiança:

- `plugins.allow` confia em **ids de plugin**, não em proveniência de fonte.
- Um plugin de workspace com o mesmo id que um plugin empacotado intencionalmente ofusca
  a cópia empacotada quando esse plugin de workspace é habilitado/allowlistado.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.

## Plugins disponíveis (oficiais)

- Microsoft Teams é somente plugin desde 2026.1.15; instale `@openclaw/msteams` se você usar o Teams.
- Memory (Core) — plugin de busca de memória empacotado (habilitado por padrão via `plugins.slots.memory`)
- Memory (LanceDB) — plugin de memória de longo prazo empacotado (auto-recall/capture; defina `plugins.slots.memory = "memory-lancedb"`)
- [Voice Call](/plugins/voice-call) — `@openclaw/voice-call`
- [Zalo Personal](/plugins/zalouser) — `@openclaw/zalouser`
- [Matrix](/channels/matrix) — `@openclaw/matrix`
- [Nostr](/channels/nostr) — `@openclaw/nostr`
- [Zalo](/channels/zalo) — `@openclaw/zalo`
- [Microsoft Teams](/channels/msteams) — `@openclaw/msteams`
- Google Antigravity OAuth (autenticação de provedor) — empacotado como `google-antigravity-auth` (desabilitado por padrão)
- Gemini CLI OAuth (autenticação de provedor) — empacotado como `google-gemini-cli-auth` (desabilitado por padrão)
- Qwen OAuth (autenticação de provedor) — empacotado como `qwen-portal-auth` (desabilitado por padrão)
- Copilot Proxy (autenticação de provedor) — ponte de proxy Copilot local do VS Code; distinto do login de dispositivo `github-copilot` integrado (empacotado, desabilitado por padrão)

Plugins do OpenCraft são **módulos TypeScript** carregados em runtime via jiti. **A
validação de config não executa código de plugin**; ela usa o manifest do plugin e JSON
Schema. Veja [Manifest de plugin](/plugins/manifest).

Plugins podem registrar:

- Métodos RPC do Gateway
- Rotas HTTP do Gateway
- Tools do agente
- Comandos CLI
- Serviços em background
- Engines de contexto
- Validação de config opcional
- **Skills** (listando diretórios `skills` no manifest do plugin)
- **Comandos de auto-resposta** (executam sem invocar o agente de IA)

Plugins rodam **em-processo** com o Gateway, então trate-os como código confiável.
Guia de autoria de tools: [Tools de agente para plugins](/plugins/agent-tools).

## Pipeline de carregamento

Na inicialização, o OpenCraft faz aproximadamente isso:

1. descobre raízes de plugins candidatas
2. lê `openclaw.plugin.json` e metadados do pacote
3. rejeita candidatos inseguros
4. normaliza a config do plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação para cada candidato
6. carrega módulos habilitados via jiti
7. chama `register(api)` e coleta registros no registry de plugin
8. expõe o registry para comandos/superfícies de runtime

As travas de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho é gravável por todos, ou a
propriedade do caminho parece suspeita para plugins não empacotados.

### Comportamento manifest-first

O manifest é a fonte de verdade do plano de controle. O OpenCraft o usa para:

- identificar o plugin
- descobrir canais/skills/schema de config declarados
- validar `plugins.entries.<id>.config`
- aumentar labels/placeholders da UI de Controle
- mostrar metadados de install/catálogo

O módulo em runtime é a parte do plano de dados. Ele registra comportamento real como
hooks, tools, comandos ou fluxos de provedor.

### O que o loader armazena em cache

O OpenCraft mantém caches curtos em-processo para:

- resultados de descoberta
- dados de registry de manifest
- registries de plugin carregados

Esses caches reduzem a sobrecarga de inicialização em rajada e de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não persistência.

## Helpers de runtime

Plugins podem acessar helpers selecionados do core via `api.runtime`. Para TTS de telefonia:

```ts
const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Olá do OpenCraft",
  cfg: api.config,
});
```

Notas:

- Usa a configuração `messages.tts` do core (OpenAI ou ElevenLabs).
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para provedores.
- Edge TTS não é suportado para telefonia.

Para STT/transcrição, plugins podem chamar:

```ts
const { text } = await api.runtime.stt.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional quando o MIME não pode ser inferido de forma confiável:
  mime: "audio/ogg",
});
```

Notas:

- Usa a configuração de áudio de compreensão de mídia do core (`tools.media.audio`) e a ordem de fallback de provedor.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo entrada ignorada/não suportada).

## Rotas HTTP do Gateway

Plugins podem expor endpoints HTTP com `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campos de rota:

- `path`: caminho de rota sob o servidor HTTP do gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação gerenciada pelo plugin/verificação de webhook.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorna `true` quando a rota tratou a requisição.

Notas:

- `api.registerHttpHandler(...)` está obsoleto. Use `api.registerHttpRoute(...)`.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com diferentes níveis de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` no mesmo nível de auth apenas.

## Caminhos de importação do SDK do plugin

Use subcaminhos do SDK em vez da importação monolítica `openclaw/plugin-sdk` ao
criar plugins:

- `openclaw/plugin-sdk/core` para APIs de plugin genéricas, tipos de autenticação de provedor e helpers compartilhados.
- `openclaw/plugin-sdk/compat` para código de plugin empacotado/interno que precisa de helpers de runtime compartilhados mais amplos do que `core`.
- `openclaw/plugin-sdk/telegram` para plugins de canal Telegram.
- `openclaw/plugin-sdk/discord` para plugins de canal Discord.
- `openclaw/plugin-sdk/slack` para plugins de canal Slack.
- `openclaw/plugin-sdk/signal` para plugins de canal Signal.
- `openclaw/plugin-sdk/imessage` para plugins de canal iMessage.
- `openclaw/plugin-sdk/whatsapp` para plugins de canal WhatsApp.
- `openclaw/plugin-sdk/line` para plugins de canal LINE.
- `openclaw/plugin-sdk/msteams` para a superfície de plugin Microsoft Teams empacotado.
- Subcaminhos específicos de extensões empacotadas também estão disponíveis:
  `openclaw/plugin-sdk/acpx`, `openclaw/plugin-sdk/bluebubbles`,
  `openclaw/plugin-sdk/copilot-proxy`, `openclaw/plugin-sdk/device-pair`,
  `openclaw/plugin-sdk/diagnostics-otel`, `openclaw/plugin-sdk/diffs`,
  `openclaw/plugin-sdk/feishu`,
  `openclaw/plugin-sdk/google-gemini-cli-auth`, `openclaw/plugin-sdk/googlechat`,
  `openclaw/plugin-sdk/irc`, `openclaw/plugin-sdk/llm-task`,
  `openclaw/plugin-sdk/lobster`, `openclaw/plugin-sdk/matrix`,
  `openclaw/plugin-sdk/mattermost`, `openclaw/plugin-sdk/memory-core`,
  `openclaw/plugin-sdk/memory-lancedb`,
  `openclaw/plugin-sdk/minimax-portal-auth`,
  `openclaw/plugin-sdk/nextcloud-talk`, `openclaw/plugin-sdk/nostr`,
  `openclaw/plugin-sdk/open-prose`, `openclaw/plugin-sdk/phone-control`,
  `openclaw/plugin-sdk/qwen-portal-auth`, `openclaw/plugin-sdk/synology-chat`,
  `openclaw/plugin-sdk/talk-voice`, `openclaw/plugin-sdk/test-utils`,
  `openclaw/plugin-sdk/thread-ownership`, `openclaw/plugin-sdk/tlon`,
  `openclaw/plugin-sdk/twitch`, `openclaw/plugin-sdk/voice-call`,
  `openclaw/plugin-sdk/zalo` e `openclaw/plugin-sdk/zalouser`.

Nota de compatibilidade:

- `openclaw/plugin-sdk` permanece suportado para plugins externos existentes.
- Plugins empacotados novos e migrados devem usar subcaminhos específicos de canal ou extensão; use `core` para superfícies genéricas e `compat` apenas quando helpers de runtime compartilhados mais amplos forem necessários.

## Inspeção de canal somente leitura

Se seu plugin registra um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho em runtime. Pode assumir que as credenciais
  estão totalmente materializadas e pode falhar rapidamente quando secrets obrigatórios estão ausentes.
- Caminhos de comando somente leitura como `opencraft status`, `opencraft status --all`,
  `opencraft channels status`, `opencraft channels resolve` e fluxos de reparo de doctor/config
  não devem precisar materializar credenciais em runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de fonte/status de credencial quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores de token brutos apenas para reportar
  disponibilidade somente leitura. Retornar `tokenStatus: "available"` (e o campo de fonte correspondente) é suficiente para comandos de estilo de status.
- Use `configured_unavailable` quando uma credencial é configurada via SecretRef mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura reportem "configurado mas indisponível neste caminho de comando" em vez de travar ou reportar incorretamente a conta como não configurada.

Nota de desempenho:

- Descoberta de plugin e metadados de manifest usam caches curtos em-processo para reduzir
  trabalho de inicialização/recarga em rajada.
- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desabilitar esses caches.
- Ajuste janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Descoberta e precedência

O OpenCraft escaneia, nesta ordem:

1. Caminhos de configuração

- `plugins.load.paths` (arquivo ou diretório)

2. Extensões de workspace

- `<workspace>/.openclaw/extensions/*.ts`
- `<workspace>/.openclaw/extensions/*/index.ts`

3. Extensões globais

- `~/.opencraft/extensions/*.ts`
- `~/.opencraft/extensions/*/index.ts`

4. Extensões empacotadas (enviadas com o OpenCraft, maioria desabilitada por padrão)

- `<opencraft>/extensions/*`

A maioria dos plugins empacotados deve ser habilitada explicitamente via
`plugins.entries.<id>.enabled` ou `opencraft plugins enable <id>`.

Exceções de plugins empacotados habilitados por padrão:

- `device-pair`
- `phone-control`
- `talk-voice`
- plugin de slot de memória ativo (slot padrão: `memory-core`)

Plugins instalados são habilitados por padrão, mas podem ser desabilitados da mesma forma.

Plugins de workspace são **desabilitados por padrão** a menos que você os habilite explicitamente
ou os allowliste. Isso é intencional: um repo clonado não deve silenciosamente
se tornar código de gateway de produção.

Notas de fortalecimento:

- Se `plugins.allow` estiver vazio e plugins não empacotados forem descobríveis, o OpenCraft registra um aviso de inicialização com ids e fontes de plugin.
- Caminhos candidatos são verificados de segurança antes da admissão de descoberta. O OpenCraft bloqueia candidatos quando:
  - a entrada de extensão resolve fora da raiz do plugin (incluindo escapes de symlink/path traversal),
  - o caminho raiz/fonte do plugin é gravável por todos,
  - a propriedade do caminho é suspeita para plugins não empacotados (proprietário POSIX não é nem uid atual nem root).
- Plugins não empacotados carregados sem proveniência de install/load-path emitem um aviso para que você possa fixar a confiança (`plugins.allow`) ou rastreamento de install (`plugins.installs`).

Cada plugin deve incluir um arquivo `openclaw.plugin.json` em sua raiz. Se um caminho
aponta para um arquivo, a raiz do plugin é o diretório do arquivo e deve conter o
manifest.

Se múltiplos plugins resolverem para o mesmo id, a primeira correspondência na ordem acima
vence e cópias de precedência inferior são ignoradas.

Isso significa:

- plugins de workspace intencionalmente ofuscam plugins empacotados com o mesmo id
- `plugins.allow: ["foo"]` autoriza o plugin `foo` ativo pelo id, mesmo quando
  a cópia ativa vem do workspace em vez da raiz de extensão empacotada
- se você precisar de controle de proveniência mais estrito, use caminhos explícitos de install/load e
  inspecione a fonte do plugin resolvido antes de habilitá-lo

### Regras de habilitação

A habilitação é resolvida após a descoberta:

- `plugins.enabled: false` desabilita todos os plugins
- `plugins.deny` sempre vence
- `plugins.entries.<id>.enabled: false` desabilita aquele plugin
- plugins de origem de workspace são desabilitados por padrão
- allowlists restringem o conjunto ativo quando `plugins.allow` é não vazio
- allowlists são **baseadas em id**, não em fonte
- plugins empacotados são desabilitados por padrão a menos que:
  - o id empacotado esteja no conjunto padrão habilitado integrado, ou
  - você o habilite explicitamente, ou
  - a config de canal implicitamente habilite o plugin de canal empacotado
- slots exclusivos podem forçar-habilitar o plugin selecionado para aquele slot

No core atual, ids padrão habilitados empacotados incluem helpers locais/de provedor como
`ollama`, `sglang`, `vllm`, mais `device-pair`, `phone-control` e
`talk-voice`.

### Pacotes de pacotes

Um diretório de plugin pode incluir um `package.json` com `openclaw.extensions`:

```json
{
  "name": "meu-pacote",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"]
  }
}
```

Cada entrada se torna um plugin. Se o pacote listar múltiplas extensões, o id do plugin
se torna `nome/<fileBase>`.

Se seu plugin importa deps npm, instale-os nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Guarda de segurança: cada entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Nota de segurança: `opencraft plugins install` instala dependências de plugin com
`npm install --ignore-scripts` (sem scripts de ciclo de vida). Mantenha árvores de dependência de plugin "JS/TS puro" e evite pacotes que requerem builds `postinstall`.

### Metadados de catálogo de canal

Plugins de canal podem anunciar metadados de onboarding via `openclaw.channel` e
hints de install via `openclaw.install`. Isso mantém os dados do catálogo core-free.

Exemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat self-hosted via bots webhook do Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "extensions/nextcloud-talk",
      "defaultChoice": "npm"
    }
  }
}
```

O OpenCraft também pode mesclar **catálogos de canal externos** (por exemplo, uma exportação de registry MPM). Coloque um arquivo JSON em um dos seguintes locais:

- `~/.opencraft/mpm/plugins.json`
- `~/.opencraft/mpm/catalog.json`
- `~/.opencraft/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto-e-vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`.

## IDs de plugin

IDs padrão de plugin:

- Pacotes de pacotes: `name` do `package.json`
- Arquivo standalone: nome base do arquivo (`~/.../voice-call.ts` → `voice-call`)

Se um plugin exporta `id`, o OpenCraft o usa mas avisa quando ele não corresponde ao
id configurado.

## Modelo de registry

Plugins carregados não mutam diretamente globals core aleatórios. Eles registram em um
registry central de plugins.

O registry rastreia:

- registros de plugin (identidade, fonte, origem, status, diagnósticos)
- tools
- hooks legados e hooks tipados
- canais
- provedores
- handlers RPC do gateway
- rotas HTTP
- registradores CLI
- serviços em background
- comandos de propriedade do plugin

Recursos core então leem desse registry em vez de falar com módulos de plugin
diretamente. Isso mantém o carregamento unidirecional:

- módulo de plugin -> registro no registry
- runtime core -> consumo do registry

Essa separação importa para a manutenibilidade. Significa que a maioria das superfícies core só
precisa de um ponto de integração: "ler o registry", não "tratar cada módulo de plugin como caso especial".

## Config

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Campos:

- `enabled`: toggle principal (padrão: true)
- `allow`: allowlist (opcional)
- `deny`: denylist (opcional; deny vence)
- `load.paths`: arquivos/dirs de plugin extras
- `slots`: seletores de slot exclusivo como `memory` e `contextEngine`
- `entries.<id>`: toggles + config por plugin

Mudanças de config **requerem reinicialização do gateway**.

Regras de validação (strict):

- IDs de plugin desconhecidos em `entries`, `allow`, `deny` ou `slots` são **erros**.
- Chaves `channels.<id>` desconhecidas são **erros** a menos que um manifest de plugin declare
  o id do canal.
- A config do plugin é validada usando o JSON Schema embutido em
  `openclaw.plugin.json` (`configSchema`).
- Se um plugin estiver desabilitado, sua config é preservada e um **aviso** é emitido.

### Desabilitado vs ausente vs inválido

Esses estados são intencionalmente diferentes:

- **desabilitado**: plugin existe, mas regras de habilitação o desligaram
- **ausente**: config referencia um id de plugin que a descoberta não encontrou
- **inválido**: plugin existe, mas sua config não corresponde ao schema declarado

O OpenCraft preserva a config para plugins desabilitados para que reativá-los não seja
destrutivo.

## Slots de plugin (categorias exclusivas)

Algumas categorias de plugin são **exclusivas** (apenas um ativo por vez). Use
`plugins.slots` para selecionar qual plugin possui o slot:

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desabilitar plugins de memória
      contextEngine: "legacy", // ou um id de plugin como "lossless-claw"
    },
  },
}
```

Slots exclusivos suportados:

- `memory`: plugin de memória ativo (`"none"` desabilita plugins de memória)
- `contextEngine`: plugin de engine de contexto ativo (`"legacy"` é o padrão integrado)

Se múltiplos plugins declararem `kind: "memory"` ou `kind: "context-engine"`, apenas
o plugin selecionado carrega para aquele slot. Os outros são desabilitados com diagnósticos.

### Plugins de engine de contexto

Plugins de engine de contexto possuem a orquestração de contexto de sessão para ingest, assembly
e compactação. Registre-os do seu plugin com
`api.registerContextEngine(id, factory)`, então selecione a engine ativa com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline de contexto padrão
em vez de apenas adicionar busca de memória ou hooks.

## UI de Controle (schema + labels)

A UI de Controle usa `config.schema` (JSON Schema + `uiHints`) para renderizar melhores formulários.

O OpenCraft aumenta `uiHints` em runtime com base nos plugins descobertos:

- Adiciona labels por plugin para `plugins.entries.<id>` / `.enabled` / `.config`
- Mescla hints de campo de config fornecidos opcionalmente pelo plugin em:
  `plugins.entries.<id>.config.<field>`

Se você quer que seus campos de config de plugin mostrem bons labels/placeholders (e marquem secrets como sensíveis),
forneça `uiHints` junto com seu JSON Schema no manifest do plugin.

Exemplo:

```json
{
  "id": "meu-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" },
      "region": { "type": "string" }
    }
  },
  "uiHints": {
    "apiKey": { "label": "Chave de API", "sensitive": true },
    "region": { "label": "Região", "placeholder": "us-east-1" }
  }
}
```

## CLI

```bash
opencraft plugins list
opencraft plugins info <id>
opencraft plugins install <caminho>                    # copia um arquivo/dir local em ~/.opencraft/extensions/<id>
opencraft plugins install ./extensions/voice-call     # caminho relativo ok
opencraft plugins install ./plugin.tgz                # instalar de um tarball local
opencraft plugins install ./plugin.zip                # instalar de um zip local
opencraft plugins install -l ./extensions/voice-call  # link (sem cópia) para dev
opencraft plugins install @openclaw/voice-call        # instalar do npm
opencraft plugins install @openclaw/voice-call --pin  # armazenar nome@versão exata resolvida
opencraft plugins update <id>
opencraft plugins update --all
opencraft plugins enable <id>
opencraft plugins disable <id>
opencraft plugins doctor
```

`plugins update` funciona apenas para installs npm rastreados em `plugins.installs`.
Se os metadados de integridade armazenados mudarem entre atualizações, o OpenCraft avisa e pede confirmação (use o `--yes` global para ignorar prompts).

Plugins também podem registrar seus próprios comandos de nível superior (exemplo: `opencraft voicecall`).

## API do plugin (visão geral)

Plugins exportam:

- Uma função: `(api) => { ... }`
- Um objeto: `{ id, name, configSchema, register(api) { ... } }`

`register(api)` é onde plugins anexam comportamento. Registros comuns incluem:

- `registerTool`
- `registerHook`
- `on(...)` para hooks de ciclo de vida tipados
- `registerChannel`
- `registerProvider`
- `registerHttpRoute`
- `registerCommand`
- `registerCli`
- `registerContextEngine`
- `registerService`

Plugins de engine de contexto também podem registrar um gerenciador de contexto de propriedade do runtime:

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Então habilite na config:

```json5
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw",
    },
  },
}
```

## Hooks de plugin

Plugins podem registrar hooks em runtime. Isso permite que um plugin empacote automação
orientada a eventos sem uma instalação separada de pacote de hook.

### Exemplo

```ts
export default function register(api) {
  api.registerHook(
    "command:new",
    async () => {
      // Lógica do hook aqui.
    },
    {
      name: "my-plugin.command-new",
      description: "Roda quando /new é invocado",
    },
  );
}
```

Notas:

- Registre hooks explicitamente via `api.registerHook(...)`.
- Regras de elegibilidade de hook ainda se aplicam (requisitos de OS/bins/env/config).
- Hooks gerenciados por plugin aparecem em `opencraft hooks list` com `plugin:<id>`.
- Você não pode habilitar/desabilitar hooks gerenciados por plugin via `opencraft hooks`; habilite/desabilite o plugin.

### Hooks de ciclo de vida do agente (`api.on`)

Para hooks de ciclo de vida em runtime tipados, use `api.on(...)`:

```ts
export default function register(api) {
  api.on(
    "before_prompt_build",
    (event, ctx) => {
      return {
        prependSystemContext: "Siga o guia de estilo da empresa.",
      };
    },
    { priority: 10 },
  );
}
```

Hooks importantes para construção de prompt:

- `before_model_resolve`: roda antes do carregamento de sessão (`messages` não estão disponíveis). Use para sobrescrever deterministicamente `modelOverride` ou `providerOverride`.
- `before_prompt_build`: roda após o carregamento de sessão (`messages` estão disponíveis). Use para moldar a entrada de prompt.
- `before_agent_start`: hook de compatibilidade legado. Prefira os dois hooks explícitos acima.

Política de hook imposta pelo core:

- Operadores podem desabilitar hooks de mutação de prompt por plugin via `plugins.entries.<id>.hooks.allowPromptInjection: false`.
- Quando desabilitado, o OpenCraft bloqueia `before_prompt_build` e ignora campos de mutação de prompt retornados do `before_agent_start` legado enquanto preserva `modelOverride` e `providerOverride` legados.

Campos de resultado de `before_prompt_build`:

- `prependContext`: prepend de texto ao prompt do usuário para este turno. Melhor para conteúdo específico de turno ou dinâmico.
- `systemPrompt`: substituição completa do prompt de sistema.
- `prependSystemContext`: prepend de texto ao prompt de sistema atual.
- `appendSystemContext`: append de texto ao prompt de sistema atual.

Ordem de build do prompt no runtime embutido:

1. Aplica `prependContext` ao prompt do usuário.
2. Aplica substituição `systemPrompt` quando fornecida.
3. Aplica `prependSystemContext + prompt de sistema atual + appendSystemContext`.

Notas de mesclagem e precedência:

- Handlers de hook rodam por prioridade (maior primeiro).
- Para campos de contexto mesclados, valores são concatenados em ordem de execução.
- Valores de `before_prompt_build` são aplicados antes dos valores de fallback do `before_agent_start` legado.

Orientação de migração:

- Mova orientação estática de `prependContext` para `prependSystemContext` (ou `appendSystemContext`) para que provedores possam armazenar em cache conteúdo estável de prefixo de sistema.
- Mantenha `prependContext` para contexto dinâmico por turno que deve ficar vinculado à mensagem do usuário.

## Plugins de provedor (autenticação de modelo)

Plugins podem registrar **provedores de modelo** para que usuários possam executar OAuth ou configuração de
chave de API dentro do OpenCraft, expor configuração de provedor no onboarding/model-pickers e
contribuir com descoberta implícita de provedor.

Plugins de provedor são a costura de extensão modular para configuração de provedor de modelo. Eles
não são apenas "helpers OAuth" mais.

### Ciclo de vida do plugin de provedor

Um plugin de provedor pode participar de cinco fases distintas:

1. **Autenticação**
   `auth[].run(ctx)` realiza OAuth, captura de chave de API, código de dispositivo ou configuração personalizada
   e retorna perfis de autenticação mais patches de config opcionais.
2. **Configuração não interativa**
   `auth[].runNonInteractive(ctx)` trata `opencraft onboard --non-interactive`
   sem prompts. Use isso quando o provedor precisa de configuração headless personalizada
   além dos caminhos simples de chave de API integrados.
3. **Integração com wizard**
   `wizard.onboarding` adiciona uma entrada ao `opencraft onboard`.
   `wizard.modelPicker` adiciona uma entrada de configuração ao seletor de modelo.
4. **Descoberta implícita**
   `discovery.run(ctx)` pode contribuir com config de provedor automaticamente durante
   resolução/listagem de modelo.
5. **Follow-up pós-seleção**
   `onModelSelected(ctx)` roda após um modelo ser escolhido. Use para trabalho
   específico do provedor como baixar um modelo local.

Essa é a divisão recomendada porque essas fases têm diferentes requisitos de ciclo de vida:

- autenticação é interativa e escreve credenciais/config
- configuração não interativa é acionada por flag/env e não deve solicitar
- metadados de wizard são estáticos e voltados para UI
- descoberta deve ser segura, rápida e tolerante a falhas
- hooks pós-seleção são efeitos colaterais vinculados ao modelo escolhido

### Contrato de autenticação do provedor

`auth[].run(ctx)` retorna:

- `profiles`: perfis de autenticação para escrever
- `configPatch`: mudanças opcionais de `opencraft.json`
- `defaultModel`: referência opcional `provedor/modelo`
- `notes`: notas opcionais voltadas para o usuário

O core então:

1. escreve os perfis de autenticação retornados
2. aplica fiação de config de perfil de autenticação
3. mescla o patch de config
4. opcionalmente aplica o modelo padrão
5. roda o hook `onModelSelected` do provedor quando apropriado

Isso significa que um plugin de provedor possui a lógica de configuração específica do provedor, enquanto o core
possui o caminho genérico de persistência e mesclagem de config.

### Contrato não interativo do provedor

`auth[].runNonInteractive(ctx)` é opcional. Implemente-o quando o provedor
precisar de configuração headless que não pode ser expressa pelos fluxos genéricos
de chave de API integrados.

O contexto não interativo inclui:

- a config atual e base
- opções de CLI de onboarding analisadas
- helpers de logging/error de runtime
- dirs de agente/workspace
- `resolveApiKey(...)` para ler chaves de provedor de flags, env ou perfis de autenticação
  existentes enquanto respeita `--secret-input-mode`
- `toApiKeyCredential(...)` para converter uma chave resolvida em uma credencial de perfil de autenticação
  com o armazenamento correto de texto simples vs secret-ref

Use esta superfície para provedores como:

- runtimes OpenAI-compatíveis self-hosted que precisam de `--custom-base-url` +
  `--custom-model-id`
- verificação não interativa específica do provedor ou síntese de config

Não solicite de `runNonInteractive`. Rejeite entradas ausentes com erros acionáveis.

### Metadados de wizard do provedor

`wizard.onboarding` controla como o provedor aparece no onboarding agrupado:

- `choiceId`: valor da escolha de autenticação
- `choiceLabel`: label da opção
- `choiceHint`: hint curto
- `groupId`: id do bucket de grupo
- `groupLabel`: label do grupo
- `groupHint`: hint do grupo
- `methodId`: método de autenticação para rodar

`wizard.modelPicker` controla como um provedor aparece como uma entrada "configurar isso agora"
na seleção de modelo:

- `label`
- `hint`
- `methodId`

Quando um provedor tem múltiplos métodos de autenticação, o wizard pode apontar para um
método explícito ou deixar o OpenCraft sintetizar escolhas por método.

O OpenCraft valida metadados de wizard de provedor quando o plugin registra:

- ids de método de autenticação duplicados ou em branco são rejeitados
- metadados de wizard são ignorados quando o provedor não tem métodos de autenticação
- bindings `methodId` inválidos são rebaixados para avisos e recuam para os
  métodos de autenticação restantes do provedor

### Contrato de descoberta do provedor

`discovery.run(ctx)` retorna um dos seguintes:

- `{ provider }`
- `{ providers }`
- `null`

Use `{ provider }` para o caso comum onde o plugin possui um id de provedor.
Use `{ providers }` quando um plugin descobre múltiplas entradas de provedor.

O contexto de descoberta inclui:

- a config atual
- dirs de agente/workspace
- env do processo
- um helper para resolver a chave de API do provedor e um valor de chave de API seguro para descoberta

A descoberta deve ser:

- rápida
- melhor esforço
- segura para pular em caso de falha
- cuidadosa com efeitos colaterais

Não deve depender de prompts ou configuração de longa duração.

### Ordenação de descoberta

A descoberta de provedor roda em fases ordenadas:

- `simple`
- `profile`
- `paired`
- `late`

Use:

- `simple` para descoberta barata somente de ambiente
- `profile` quando a descoberta depende de perfis de autenticação
- `paired` para provedores que precisam coordenar com outro passo de descoberta
- `late` para sondagem cara ou de rede local

A maioria dos provedores self-hosted deve usar `late`.

### Boas fronteiras de plugin de provedor

Boa adequação para plugins de provedor:

- provedores locais/self-hosted com fluxos de configuração personalizados
- login OAuth/device-code específico do provedor
- descoberta implícita de servidores de modelo locais
- efeitos colaterais pós-seleção como pulls de modelo

Menor adequação:

- provedores triviais somente de chave de API que diferem apenas por variável de env, URL base e um
  modelo padrão

Esses ainda podem se tornar plugins, mas o principal ganho de modularidade vem de
extrair provedores ricos em comportamento primeiro.

Registre um provedor via `api.registerProvider(...)`. Cada provedor expõe um
ou mais métodos de autenticação (OAuth, chave de API, código de dispositivo, etc.). Esses métodos podem
alimentar:

- `opencraft models auth login --provider <id> [--method <id>]`
- `opencraft onboard`
- entradas de configuração de "provedor personalizado" no seletor de modelo
- descoberta implícita de provedor durante resolução/listagem de modelo

Exemplo:

```ts
api.registerProvider({
  id: "acme",
  label: "AcmeAI",
  auth: [
    {
      id: "oauth",
      label: "OAuth",
      kind: "oauth",
      run: async (ctx) => {
        // Execute o fluxo OAuth e retorne perfis de autenticação.
        return {
          profiles: [
            {
              profileId: "acme:default",
              credential: {
                type: "oauth",
                provider: "acme",
                access: "...",
                refresh: "...",
                expires: Date.now() + 3600 * 1000,
              },
            },
          ],
          defaultModel: "acme/opus-1",
        };
      },
    },
  ],
  wizard: {
    onboarding: {
      choiceId: "acme",
      choiceLabel: "AcmeAI",
      groupId: "acme",
      groupLabel: "AcmeAI",
      methodId: "oauth",
    },
    modelPicker: {
      label: "AcmeAI (personalizado)",
      hint: "Conectar um endpoint AcmeAI self-hosted",
      methodId: "oauth",
    },
  },
  discovery: {
    order: "late",
    run: async () => ({
      provider: {
        baseUrl: "https://acme.example/v1",
        api: "openai-completions",
        apiKey: "${ACME_API_KEY}",
        models: [],
      },
    }),
  },
});
```

Notas:

- `run` recebe um `ProviderAuthContext` com helpers `prompter`, `runtime`,
  `openUrl` e `oauth.createVpsAwareHandlers`.
- `runNonInteractive` recebe um `ProviderAuthMethodNonInteractiveContext`
  com helpers `opts`, `resolveApiKey` e `toApiKeyCredential` para
  onboarding headless.
- Retorne `configPatch` quando precisar adicionar modelos padrão ou config de provedor.
- Retorne `defaultModel` para que `--set-default` possa atualizar padrões do agente.
- `wizard.onboarding` adiciona uma escolha de provedor ao `opencraft onboard`.
- `wizard.modelPicker` adiciona uma entrada "configurar este provedor" ao seletor de modelo.
- `discovery.run` retorna `{ provider }` para o id de provedor próprio do plugin
  ou `{ providers }` para descoberta multi-provedor.
- `discovery.order` controla quando o provedor roda em relação às fases de descoberta integradas: `simple`, `profile`, `paired` ou `late`.
- `onModelSelected` é o hook pós-seleção para trabalho de follow-up específico do provedor
  como puxar um modelo local.

### Registrar um canal de mensagens

Plugins podem registrar **plugins de canal** que se comportam como canais integrados
(WhatsApp, Telegram, etc.). A config do canal vive em `channels.<id>` e é
validada pelo seu código de plugin de canal.

```ts
const meuCanal = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "plugin de canal demo.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async () => ({ ok: true }),
  },
};

export default function (api) {
  api.registerChannel({ plugin: meuCanal });
}
```

Notas:

- Coloque a config em `channels.<id>` (não em `plugins.entries`).
- `meta.label` é usado para labels em listas de CLI/UI.
- `meta.aliases` adiciona ids alternativos para normalização e entradas CLI.
- `meta.preferOver` lista ids de canal para pular auto-enable quando ambos estiverem configurados.
- `meta.detailLabel` e `meta.systemImage` permitem que UIs mostrem labels/ícones de canal mais ricos.

### Hooks de onboarding de canal

Plugins de canal podem definir hooks de onboarding opcionais em `plugin.onboarding`:

- `configure(ctx)` é o fluxo de configuração base.
- `configureInteractive(ctx)` pode possuir completamente a configuração interativa para estados configurados e não configurados.
- `configureWhenConfigured(ctx)` pode sobrescrever o comportamento apenas para canais já configurados.

Precedência de hook no wizard:

1. `configureInteractive` (se presente)
2. `configureWhenConfigured` (somente quando o status do canal já está configurado)
3. fallback para `configure`

Detalhes de contexto:

- `configureInteractive` e `configureWhenConfigured` recebem:
  - `configured` (`true` ou `false`)
  - `label` (nome do canal voltado para o usuário usado por prompts)
  - mais os campos compartilhados de config/runtime/prompter/options
- Retornar `"skip"` deixa a seleção e rastreamento de conta sem alterações.
- Retornar `{ cfg, accountId? }` aplica atualizações de config e registra a seleção de conta.

### Escrever um novo canal de mensagens (passo a passo)

Use isso quando quiser uma **nova superfície de chat** (um "canal de mensagens"), não um provedor de modelo.
Docs de provedor de modelo vivem em `/providers/*`.

1. Escolha um id + forma de config

- Toda config de canal vive em `channels.<id>`.
- Prefira `channels.<id>.accounts.<accountId>` para configurações multi-conta.

2. Defina os metadados do canal

- `meta.label`, `meta.selectionLabel`, `meta.docsPath`, `meta.blurb` controlam listas CLI/UI.
- `meta.docsPath` deve apontar para uma página de docs como `/channels/<id>`.
- `meta.preferOver` permite que um plugin substitua outro canal (auto-enable o prefere).
- `meta.detailLabel` e `meta.systemImage` são usados por UIs para texto de detalhe/ícones.

3. Implemente os adaptadores obrigatórios

- `config.listAccountIds` + `config.resolveAccount`
- `capabilities` (tipos de chat, mídia, threads, etc.)
- `outbound.deliveryMode` + `outbound.sendText` (para envio básico)

4. Adicione adaptadores opcionais conforme necessário

- `setup` (wizard), `security` (política de DM), `status` (health/diagnósticos)
- `gateway` (start/stop/login), `mentions`, `threading`, `streaming`
- `actions` (ações de mensagem), `commands` (comportamento de comando nativo)

5. Registre o canal no seu plugin

- `api.registerChannel({ plugin })`

Exemplo mínimo de config:

```json5
{
  channels: {
    acmechat: {
      accounts: {
        default: { token: "ACME_TOKEN", enabled: true },
      },
    },
  },
}
```

Plugin de canal mínimo (somente saída):

```ts
const plugin = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "Canal de mensagens AcmeChat.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text }) => {
      // entregue `text` ao seu canal aqui
      return { ok: true };
    },
  },
};

export default function (api) {
  api.registerChannel({ plugin });
}
```

Carregue o plugin (dir de extensões ou `plugins.load.paths`), reinicie o gateway,
então configure `channels.<id>` na sua config.

### Tools do agente

Veja o guia dedicado: [Tools de agente para plugins](/plugins/agent-tools).

### Registrar um método RPC do gateway

```ts
export default function (api) {
  api.registerGatewayMethod("myplugin.status", ({ respond }) => {
    respond(true, { ok: true });
  });
}
```

### Registrar comandos CLI

```ts
export default function (api) {
  api.registerCli(
    ({ program }) => {
      program.command("mycmd").action(() => {
        console.log("Olá");
      });
    },
    { commands: ["mycmd"] },
  );
}
```

### Registrar comandos de auto-resposta

Plugins podem registrar comandos de barra personalizados que executam **sem invocar o
agente de IA**. Isso é útil para comandos de toggle, verificações de status ou ações rápidas
que não precisam de processamento LLM.

```ts
export default function (api) {
  api.registerCommand({
    name: "mystatus",
    description: "Mostrar status do plugin",
    handler: (ctx) => ({
      text: `Plugin rodando! Canal: ${ctx.channel}`,
    }),
  });
}
```

Contexto do handler de comando:

- `senderId`: O ID do remetente (se disponível)
- `channel`: O canal onde o comando foi enviado
- `isAuthorizedSender`: Se o remetente é um usuário autorizado
- `args`: Argumentos passados após o comando (se `acceptsArgs: true`)
- `commandBody`: O texto completo do comando
- `config`: A config atual do OpenCraft

Opções de comando:

- `name`: Nome do comando (sem o `/` inicial)
- `nativeNames`: Aliases de comando nativo opcionais para superfícies slash/menu. Use `default` para todos os provedores nativos, ou chaves específicas de provedor como `discord`
- `description`: Texto de ajuda mostrado em listas de comando
- `acceptsArgs`: Se o comando aceita argumentos (padrão: false). Se false e argumentos forem fornecidos, o comando não corresponderá e a mensagem passará por outros handlers
- `requireAuth`: Se deve exigir remetente autorizado (padrão: true)
- `handler`: Função que retorna `{ text: string }` (pode ser async)

Exemplo com autorização e argumentos:

```ts
api.registerCommand({
  name: "setmode",
  description: "Definir modo do plugin",
  acceptsArgs: true,
  requireAuth: true,
  handler: async (ctx) => {
    const mode = ctx.args?.trim() || "default";
    await saveMode(mode);
    return { text: `Modo definido para: ${mode}` };
  },
});
```

Notas:

- Comandos de plugin são processados **antes** de comandos integrados e do agente de IA
- Comandos são registrados globalmente e funcionam em todos os canais
- Nomes de comando são insensíveis a maiúsculas (`/MyStatus` corresponde a `/mystatus`)
- Nomes de comando devem começar com uma letra e conter apenas letras, números, hífens e sublinhados
- Nomes de comando reservados (como `help`, `status`, `reset`, etc.) não podem ser substituídos por plugins
- Registro duplicado de comandos entre plugins falhará com um erro de diagnóstico

### Registrar serviços em background

```ts
export default function (api) {
  api.registerService({
    id: "meu-servico",
    start: () => api.logger.info("pronto"),
    stop: () => api.logger.info("tchau"),
  });
}
```

## Convenções de nomenclatura

- Métodos de Gateway: `pluginId.acao` (exemplo: `voicecall.status`)
- Tools: `snake_case` (exemplo: `voice_call`)
- Comandos CLI: kebab ou camel, mas evite conflitar com comandos core

## Skills

Plugins podem incluir uma skill no repo (`skills/<nome>/SKILL.md`).
Habilite-a com `plugins.entries.<id>.enabled` (ou outros gates de config) e certifique-se de
que está presente nos locais de skills gerenciados/do workspace.

## Distribuição (npm)

Empacotamento recomendado:

- Pacote principal: `opencraft` (este repo)
- Plugins: pacotes npm separados em `@openclaw/*` (exemplo: `@openclaw/voice-call`)

Contrato de publicação:

- O `package.json` do plugin deve incluir `openclaw.extensions` com um ou mais arquivos de entrada.
- Arquivos de entrada podem ser `.js` ou `.ts` (jiti carrega TS em runtime).
- `opencraft plugins install <npm-spec>` usa `npm pack`, extrai em `~/.opencraft/extensions/<id>/` e o habilita na config.
- Estabilidade de chave de config: pacotes com escopo são normalizados para o id **sem escopo** para `plugins.entries.*`.

## Plugin de exemplo: Voice Call

Este repo inclui um plugin de voice call (Twilio ou fallback de log):

- Fonte: `extensions/voice-call`
- Skill: `skills/voice-call`
- CLI: `opencraft voicecall start|status`
- Tool: `voice_call`
- RPC: `voicecall.start`, `voicecall.status`
- Config (twilio): `provider: "twilio"` + `twilio.accountSid/authToken/from` (opcional `statusCallbackUrl`, `twimlUrl`)
- Config (dev): `provider: "log"` (sem rede)

Veja [Voice Call](/plugins/voice-call) e `extensions/voice-call/README.md` para configuração e uso.

## Notas de segurança

Plugins rodam em-processo com o Gateway. Trate-os como código confiável:

- Instale apenas plugins em que você confia.
- Prefira allowlists `plugins.allow`.
- Lembre que `plugins.allow` é baseado em id, então um plugin de workspace habilitado pode
  intencionalmente ofuscar um plugin empacotado com o mesmo id.
- Reinicie o Gateway após mudanças.

## Testando plugins

Plugins podem (e devem) incluir testes:

- Plugins no repo podem manter testes Vitest em `src/**` (exemplo: `src/plugins/voice-call.plugin.test.ts`).
- Plugins publicados separadamente devem rodar seu próprio CI (lint/build/test) e validar que `openclaw.extensions` aponta para o entrypoint buildado (`dist/index.js`).
