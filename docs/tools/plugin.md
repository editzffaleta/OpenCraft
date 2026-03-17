---
summary: "Plugins/extensões do OpenCraft: descoberta, config e segurança"
read_when:
  - Adicionando ou modificando Plugins/extensões
  - Documentando regras de instalação ou carregamento de Plugin
  - Trabalhando com pacotes de Plugin compatíveis com Codex/Claude
title: "Plugins"
---

# Plugins (Extensões)

## Início rápido (novo em Plugins?)

Um Plugin é:

- um **Plugin OpenCraft** nativo (`opencraft.plugin.json` + módulo runtime), ou
- um **bundle** compatível (`.codex-plugin/plugin.json` ou `.claude-plugin/plugin.json`)

Ambos aparecem em `opencraft plugins`, mas apenas Plugins OpenCraft nativos executam
código runtime em processo.

Na maioria das vezes, você usará Plugins quando quiser uma funcionalidade que não está integrada
ao core do OpenCraft ainda (ou quando quiser manter funcionalidades opcionais fora da sua instalação
principal).

Caminho rápido:

1. Veja o que já está carregado:

```bash
opencraft plugins list
```

2. Instale um Plugin oficial (exemplo: Voice Call):

```bash
opencraft plugins install @opencraft/voice-call
```

Specs npm são **apenas registro** (nome de pacote + **versão exata** ou
**dist-tag** opcionais). Specs de Git/URL/arquivo e faixas semver são rejeitadas.

Specs simples e `@latest` ficam na trilha estável. Se npm resolver qualquer um
deles para um prerelease, o OpenCraft para e pede para você optar explicitamente com uma
tag prerelease como `@beta`/`@rc` ou uma versão prerelease exata.

3. Reinicie o Gateway, depois configure em `plugins.entries.<id>.config`.

Veja [Voice Call](/plugins/voice-call) para um exemplo concreto de Plugin.
Procurando listagens de terceiros? Veja [Plugins da comunidade](/plugins/community).
Precisa dos detalhes de compatibilidade de bundle? Veja [Plugin bundles](/plugins/bundles).

Para bundles compatíveis, instale de um diretório ou arquivo local:

```bash
opencraft plugins install ./my-bundle
opencraft plugins install ./my-bundle.tgz
```

Para instalações do marketplace Claude, liste o marketplace primeiro, depois instale por
nome de entrada do marketplace:

```bash
opencraft plugins marketplace list <marketplace-name>
opencraft plugins install <plugin-name>@<marketplace-name>
```

O OpenCraft resolve nomes de marketplace Claude conhecidos de
`~/.claude/plugins/known_marketplaces.json`. Você também pode passar uma fonte
explícita de marketplace com `--marketplace`.

## Arquitetura

O sistema de Plugin do OpenCraft tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenCraft encontra Plugins candidatos de caminhos configurados, raízes de workspace,
   raízes de extensão globais e extensões integradas. A descoberta lê manifestos
   nativos `opencraft.plugin.json` mais manifestos de bundle suportados primeiro.
2. **Habilitação + validação**
   O core decide se um Plugin descoberto está habilitado, desabilitado, bloqueado ou
   selecionado para um slot exclusivo como memória.
3. **Carregamento runtime**
   Plugins OpenCraft nativos são carregados em processo via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código runtime.
4. **Consumo pela superfície**
   O resto do OpenCraft lê o registro para expor ferramentas, canais, configuração de provedor,
   hooks, rotas HTTP, comandos CLI e serviços.

O limite de design importante:

- descoberta + validação de config deve funcionar a partir de **metadados de manifesto/schema**
  sem executar código de Plugin
- comportamento runtime nativo vem do caminho `register(api)` do módulo do Plugin

Essa divisão permite ao OpenCraft validar config, explicar Plugins ausentes/desabilitados e
construir dicas de UI/schema antes que o runtime completo esteja ativo.

## Modelo de propriedade de capacidade

O OpenCraft trata um Plugin nativo como o limite de propriedade para uma **empresa** ou uma
**funcionalidade**, não como uma sacola de integrações não relacionadas.

Isso significa:

- um Plugin de empresa deve geralmente possuir todas as superfícies voltadas ao OpenCraft daquela empresa
- um Plugin de funcionalidade deve geralmente possuir a superfície completa da funcionalidade que introduz
- canais devem consumir capacidades core compartilhadas em vez de reimplementar
  comportamento de provedor ad hoc

Exemplos:

- o Plugin `openai` integrado possui comportamento de provedor de modelo OpenAI e comportamento
  de fala OpenAI
- o Plugin `elevenlabs` integrado possui comportamento de fala ElevenLabs
- o Plugin `microsoft` integrado possui comportamento de fala Microsoft
- o Plugin `voice-call` é um Plugin de funcionalidade: possui transporte de chamada, ferramentas,
  CLI, rotas e runtime, mas consome capacidade core de TTS/STT em vez de
  inventar uma segunda pilha de fala

O estado final pretendido é:

- OpenAI fica em um Plugin mesmo se abrange modelos de texto, fala, imagens e
  futuro vídeo
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam qual Plugin do fornecedor possui o provedor; consomem o
  contrato de capacidade compartilhada exposto pelo core

Esta é a distinção chave:

- **Plugin** = limite de propriedade
- **capacidade** = contrato core que múltiplos Plugins podem implementar ou consumir

Então se o OpenCraft adiciona um novo domínio como vídeo, a primeira pergunta não é
"qual provedor deve codificar o tratamento de vídeo?" A primeira pergunta é "qual é
o contrato core de capacidade de vídeo?" Uma vez que esse contrato existe, Plugins de fornecedor
podem se registrar contra ele e Plugins de canal/funcionalidade podem consumi-lo.

Se a capacidade ainda não existe, o movimento correto é geralmente:

1. definir a capacidade ausente no core
2. expô-la através da API/runtime de Plugin de forma tipada
3. conectar canais/funcionalidades contra essa capacidade
4. deixar Plugins de fornecedor registrarem implementações

Isso mantém a propriedade explícita enquanto evita comportamento core que depende de um
único fornecedor ou caminho de código específico de Plugin único.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código pertence:

- **camada de capacidade core**: orquestração compartilhada, política, fallback, regras de
  merge de config, semântica de entrega e contratos tipados
- **camada de Plugin de fornecedor**: APIs específicas do fornecedor, auth, catálogos de modelo, síntese de fala,
  geração de imagem, futuros backends de vídeo, endpoints de uso
- **camada de Plugin de canal/funcionalidade**: integração Slack/Discord/voice-call/etc. que
  consome capacidades core e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- core possui política de TTS em tempo de resposta, ordem de fallback, preferências e entrega de canal
- `openai`, `elevenlabs` e `microsoft` possuem implementações de síntese
- `voice-call` consome o helper de runtime TTS de telefonia

Esse mesmo padrão deve ser preferido para futuras capacidades.

## Bundles compatíveis

O OpenCraft também reconhece dois layouts externos de bundle compatíveis:

- Bundles estilo Codex: `.codex-plugin/plugin.json`
- Bundles estilo Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem manifesto
- Bundles estilo Cursor: `.cursor-plugin/plugin.json`

Entradas de marketplace Claude podem apontar para qualquer um desses bundles compatíveis, ou para
fontes de Plugin OpenCraft nativo. O OpenCraft resolve a entrada do marketplace primeiro,
depois executa o caminho normal de instalação para a fonte resolvida.

São mostrados na lista de Plugins como `format=bundle`, com subtipo
`codex` ou `claude` na saída verbose/info.

Veja [Plugin bundles](/plugins/bundles) para as regras exatas de detecção, comportamento de
mapeamento e matriz de suporte atual.

Hoje, o OpenCraft trata estes como **pacotes de capacidade**, não Plugins runtime
nativos:

- suportado agora: Skills incluídas
- suportado agora: raízes markdown `commands/` do Claude, mapeadas no carregador
  normal de Skills do OpenCraft
- suportado agora: padrões de `settings.json` do bundle Claude para configurações do
  agente Pi embutido (com chaves de substituição shell sanitizadas)
- suportado agora: raízes `.cursor/commands/*.md` do Cursor, mapeadas no carregador
  normal de Skills do OpenCraft
- suportado agora: diretórios hook de bundle Codex que usam o layout de hook-pack
  do OpenCraft (`HOOK.md` + `handler.ts`/`handler.js`)
- detectado mas não conectado ainda: outras capacidades declaradas de bundle como
  agentes, automação de hook Claude, regras/hooks/metadados MCP do Cursor, metadados MCP/app/LSP,
  estilos de saída

Isso significa que instalação/descoberta/lista/info/habilitação de bundle funcionam, e Skills de bundle,
Skills de comando Claude, padrões de configurações de bundle Claude e diretórios hook de Codex
compatíveis carregam quando o bundle está habilitado, mas código runtime de bundle
não é executado em processo.

Suporte a hook de bundle é limitado ao formato normal de diretório hook do OpenCraft
(`HOOK.md` mais `handler.ts`/`handler.js` sob as raízes de hook declaradas).
Runtimes de hook shell/JSON específicos de fornecedor, incluindo `hooks.json` do Claude, são
apenas detectados hoje e não são executados diretamente.

## Modelo de execução

Plugins OpenCraft nativos rodam **em processo** com o Gateway. Não são
isolados em sandbox. Um Plugin nativo carregado tem o mesmo limite de confiança de processo que
código core.

Implicações:

- um Plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug de Plugin nativo pode travar ou desestabilizar o Gateway
- um Plugin nativo malicioso é equivalente a execução arbitrária de código dentro
  do processo OpenCraft

Bundles compatíveis são mais seguros por padrão porque o OpenCraft atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso principalmente significa Skills
incluídas.

Use allowlists e caminhos explícitos de instalação/carregamento para Plugins não integrados. Trate
Plugins de workspace como código de desenvolvimento, não padrões de produção.

Nota importante de confiança:

- `plugins.allow` confia em **ids de Plugin**, não procedência de fonte.
- Um Plugin de workspace com o mesmo id de um Plugin integrado intencionalmente sombreia
  a cópia integrada quando aquele Plugin de workspace está habilitado/na allowlist.
- Isso é normal e útil para desenvolvimento local, teste de patch e hotfixes.

## Plugins disponíveis (oficiais)

- Microsoft Teams é apenas Plugin desde 2026.1.15; instale `@opencraft/msteams` se usar Teams.
- Memory (Core) -- Plugin de pesquisa de memória integrado (habilitado por padrão via `plugins.slots.memory`)
- Memory (LanceDB) -- Plugin de memória de longo prazo integrado (auto-recall/captura; defina `plugins.slots.memory = "memory-lancedb"`)
- [Voice Call](/plugins/voice-call) -- `@opencraft/voice-call`
- [Zalo Personal](/plugins/zalouser) -- `@opencraft/zalouser`
- [Matrix](/channels/matrix) -- `@opencraft/matrix`
- [Nostr](/channels/nostr) -- `@opencraft/nostr`
- [Zalo](/channels/zalo) -- `@opencraft/zalo`
- [Microsoft Teams](/channels/msteams) -- `@opencraft/msteams`
- Runtime de provedor Anthropic -- integrado como `anthropic` (habilitado por padrão)
- Catálogo de provedor BytePlus -- integrado como `byteplus` (habilitado por padrão)
- Catálogo de provedor Cloudflare AI Gateway -- integrado como `cloudflare-ai-gateway` (habilitado por padrão)
- Pesquisa web Google + OAuth Gemini CLI -- integrado como `google` (pesquisa web auto-carrega; auth de provedor permanece opt-in)
- Runtime de provedor GitHub Copilot -- integrado como `github-copilot` (habilitado por padrão)
- Catálogo de provedor Hugging Face -- integrado como `huggingface` (habilitado por padrão)
- Runtime de provedor Kilo Gateway -- integrado como `kilocode` (habilitado por padrão)
- Catálogo de provedor Kimi Coding -- integrado como `kimi-coding` (habilitado por padrão)
- Catálogo de provedor MiniMax + uso + OAuth -- integrado como `minimax` (habilitado por padrão; possui `minimax` e `minimax-portal`)
- Capacidades de provedor Mistral -- integrado como `mistral` (habilitado por padrão)
- Catálogo de provedor Model Studio -- integrado como `modelstudio` (habilitado por padrão)
- Runtime de provedor Moonshot -- integrado como `moonshot` (habilitado por padrão)
- Catálogo de provedor NVIDIA -- integrado como `nvidia` (habilitado por padrão)
- Provedor de fala ElevenLabs -- integrado como `elevenlabs` (habilitado por padrão)
- Provedor de fala Microsoft -- integrado como `microsoft` (habilitado por padrão; entrada legada `edge` mapeia aqui)
- Runtime de provedor OpenAI -- integrado como `openai` (habilitado por padrão; possui tanto `openai` quanto `openai-codex`)
- Capacidades de provedor OpenCode Go -- integrado como `opencode-go` (habilitado por padrão)
- Capacidades de provedor OpenCode Zen -- integrado como `opencode` (habilitado por padrão)
- Runtime de provedor OpenRouter -- integrado como `openrouter` (habilitado por padrão)
- Catálogo de provedor Qianfan -- integrado como `qianfan` (habilitado por padrão)
- OAuth Qwen (auth de provedor + catálogo) -- integrado como `qwen-portal-auth` (habilitado por padrão)
- Catálogo de provedor Synthetic -- integrado como `synthetic` (habilitado por padrão)
- Catálogo de provedor Together -- integrado como `together` (habilitado por padrão)
- Catálogo de provedor Venice -- integrado como `venice` (habilitado por padrão)
- Catálogo de provedor Vercel AI Gateway -- integrado como `vercel-ai-gateway` (habilitado por padrão)
- Catálogo de provedor Volcengine -- integrado como `volcengine` (habilitado por padrão)
- Catálogo de provedor Xiaomi + uso -- integrado como `xiaomi` (habilitado por padrão)
- Runtime de provedor Z.AI -- integrado como `zai` (habilitado por padrão)
- Copilot Proxy (auth de provedor) -- ponte local VS Code Copilot Proxy; distinto do login de dispositivo `github-copilot` integrado (integrado, desabilitado por padrão)

Plugins OpenCraft nativos são **módulos TypeScript** carregados em runtime via jiti.
**Validação de config não executa código de Plugin**; usa o manifesto de Plugin
e JSON Schema em vez disso. Veja [Manifesto de Plugin](/plugins/manifest).

Plugins OpenCraft nativos podem registrar:

- Métodos RPC do Gateway
- Rotas HTTP do Gateway
- Ferramentas do agente
- Comandos CLI
- Provedores de fala
- Provedores de pesquisa web
- Serviços em segundo plano
- Motores de contexto
- Fluxos de auth de provedor e catálogos de modelo
- Hooks de runtime de provedor para ids dinâmicos de modelo, normalização de transporte, metadados de capacidade, wrapping de stream, política de TTL de cache, dicas de auth ausente, supressão de modelo integrado, aumento de catálogo, troca de auth em runtime, e resolução de auth + snapshot de uso/billing
- Validação de config opcional
- **Skills** (listando diretórios `skills` no manifesto de Plugin)
- **Comandos de auto-resposta** (executam sem invocar o agente IA)

Plugins OpenCraft nativos rodam **em processo** com o Gateway, então trate-os como código confiável.
Guia de autoria de ferramentas: [Ferramentas de agente de Plugin](/plugins/agent-tools).

Pense nessas registrações como **declarações de capacidade**. Um Plugin não deve
acessar internos aleatórios e "simplesmente fazer funcionar." Deve registrar
contra superfícies explícitas que o OpenCraft entende, valida e pode expor
consistentemente através de config, onboarding, status, docs e comportamento runtime.

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
- `load.paths`: arquivos/diretórios extras de Plugin
- `slots`: seletores de slot exclusivo como `memory` e `contextEngine`
- `entries.<id>`: toggles + config por Plugin

Alterações de config **requerem reinício do Gateway**.

## Descoberta e precedência

O OpenCraft escaneia, em ordem:

1. Caminhos de config: `plugins.load.paths` (arquivo ou diretório)
2. Extensões de workspace: `<workspace>/.opencraft/extensions/*.ts` e `<workspace>/.opencraft/extensions/*/index.ts`
3. Extensões globais: `~/.opencraft/extensions/*.ts` e `~/.opencraft/extensions/*/index.ts`
4. Extensões integradas (enviadas com OpenCraft; mistas padrão ligado/desligado): `<opencraft>/extensions/*`

Se múltiplos Plugins resolvem para o mesmo id, a primeira correspondência na ordem acima
vence e cópias de menor precedência são ignoradas.

### Regras de habilitação

A habilitação é resolvida após descoberta:

- `plugins.enabled: false` desabilita todos os Plugins
- `plugins.deny` sempre vence
- `plugins.entries.<id>.enabled: false` desabilita aquele Plugin
- Plugins de origem workspace são desabilitados por padrão
- Allowlists restringem o conjunto ativo quando `plugins.allow` não está vazio
- Allowlists são **baseadas em id**, não baseadas em fonte
- Plugins integrados são desabilitados por padrão a menos que:
  - o id integrado esteja no conjunto padrão ligado, ou
  - você explicitamente o habilite, ou
  - config de canal habilite implicitamente o Plugin de canal integrado
- Slots exclusivos podem forçar habilitação do Plugin selecionado para aquele slot

## CLI

```bash
opencraft plugins list
opencraft plugins info <id>
opencraft plugins install <path>
opencraft plugins install ./extensions/voice-call
opencraft plugins install ./plugin.tgz
opencraft plugins install ./plugin.zip
opencraft plugins install -l ./extensions/voice-call  # link (sem cópia) para dev
opencraft plugins install @opencraft/voice-call       # instalar do npm
opencraft plugins install @opencraft/voice-call --pin # armazenar nome@versão exata resolvida
opencraft plugins update <id>
opencraft plugins update --all
opencraft plugins enable <id>
opencraft plugins disable <id>
opencraft plugins doctor
```

`opencraft plugins list` mostra o formato de nível superior como `opencraft` ou `bundle`.
Saída verbose de lista/info também mostra subtipo de bundle (`codex` ou `claude`) mais
capacidades detectadas de bundle.

`plugins update` funciona apenas para instalações npm rastreadas em `plugins.installs`.
Se metadados de integridade armazenados mudam entre atualizações, o OpenCraft avisa e pede confirmação (use `--yes` global para ignorar prompts).

Plugins também podem registrar seus próprios comandos de nível superior (exemplo: `opencraft voicecall`).

## API de Plugin (visão geral)

Plugins exportam:

- Uma função: `(api) => { ... }`
- Um objeto: `{ id, name, configSchema, register(api) { ... } }`

`register(api)` é onde Plugins conectam comportamento. Registrações comuns incluem:

- `registerTool`
- `registerHook`
- `on(...)` para hooks tipados de ciclo de vida
- `registerChannel`
- `registerProvider`
- `registerSpeechProvider`
- `registerWebSearchProvider`
- `registerHttpRoute`
- `registerCommand`
- `registerCli`
- `registerContextEngine`
- `registerService`

Na prática, `register(api)` também é onde um Plugin declara **propriedade**.
Essa propriedade deve mapear claramente para:

- uma superfície de fornecedor como OpenAI, ElevenLabs ou Microsoft
- uma superfície de funcionalidade como Voice Call

Evite dividir capacidades de um fornecedor entre Plugins não relacionados a menos que haja
uma razão forte de produto. O padrão deve ser um Plugin por
fornecedor/funcionalidade, com contratos de capacidade core separando orquestração compartilhada
de comportamento específico do fornecedor.

## Hooks de Plugin

Plugins podem registrar hooks em runtime. Isso permite que um Plugin inclua automação
baseada em eventos sem instalação separada de pacote hook.

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
      description: "Runs when /new is invoked",
    },
  );
}
```

### Hooks de ciclo de vida do agente (`api.on`)

Para hooks tipados de ciclo de vida runtime, use `api.on(...)`:

```ts
export default function register(api) {
  api.on(
    "before_prompt_build",
    (event, ctx) => {
      return {
        prependSystemContext: "Follow company style guide.",
      };
    },
    { priority: 10 },
  );
}
```

Hooks importantes para construção de prompt:

- `before_model_resolve`: roda antes do carregamento da sessão (`messages` não estão disponíveis). Use para substituir deterministicamente `modelOverride` ou `providerOverride`.
- `before_prompt_build`: roda após carregamento da sessão (`messages` estão disponíveis). Use para formatar entrada do prompt.
- `before_agent_start`: hook de compatibilidade legado. Prefira os dois hooks explícitos acima.

Política de hook aplicada pelo core:

- Operadores podem desabilitar hooks de mutação de prompt por Plugin via `plugins.entries.<id>.hooks.allowPromptInjection: false`.
- Quando desabilitado, o OpenCraft bloqueia `before_prompt_build` e ignora campos de mutação de prompt retornados do legado `before_agent_start` enquanto preserva `modelOverride` e `providerOverride` legados.

## Notas de segurança

Plugins rodam em processo com o Gateway. Trate-os como código confiável:

- Instale apenas Plugins que você confia.
- Prefira allowlists `plugins.allow`.
- Lembre que `plugins.allow` é baseado em id, então um Plugin de workspace habilitado pode
  intencionalmente sombrear um Plugin integrado com o mesmo id.
- Reinicie o Gateway após alterações.

## Testando Plugins

Plugins podem (e devem) incluir testes:

- Plugins no repositório podem manter testes Vitest em `src/**` (exemplo: `src/plugins/voice-call.plugin.test.ts`).
- Plugins publicados separadamente devem rodar sua própria CI (lint/build/test) e validar que `opencraft.extensions` aponta para o entrypoint compilado (`dist/index.js`).

Para a documentação completa de hooks de runtime de provedor, contratos, exemplos de registração de canal, rotas HTTP do Gateway, caminhos de importação do SDK de Plugin, catálogos de provedor, slots exclusivos, motores de contexto, metadados de catálogo de canal e guia detalhado passo a passo de escrita de canal, consulte a versão completa em inglês deste documento ou a [documentação de Plugin do OpenCraft](https://docs.opencraft.ai/tools/plugin).
