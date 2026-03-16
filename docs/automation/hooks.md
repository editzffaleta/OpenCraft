---
summary: "Hooks: automação orientada a eventos para comandos e eventos de ciclo de vida"
read_when:
  - Você quer automação orientada a eventos para /new, /reset, /stop, e eventos de ciclo de vida do agente
  - Você quer construir, instalar ou depurar hooks
title: "Hooks"
---

# Hooks

Hooks fornecem um sistema extensível orientado a eventos para automatizar ações em resposta a comandos e eventos do agente. Hooks são descobertos automaticamente a partir de diretórios e podem ser gerenciados via comandos CLI, similar a como skills funcionam no OpenCraft.

## Orientação

Hooks são pequenos scripts que rodam quando algo acontece. Há dois tipos:

- **Hooks** (esta página): rodam dentro do Gateway quando eventos do agente disparam, como `/new`, `/reset`, `/stop`, ou eventos de ciclo de vida.
- **Webhooks**: webhooks HTTP externos que permitem que outros sistemas acionem trabalho no OpenCraft. Veja [Webhook Hooks](/automation/webhook) ou use `opencraft webhooks` para comandos auxiliares do Gmail.

Hooks também podem ser empacotados dentro de plugins; veja [Plugins](/tools/plugin#plugin-hooks).

Usos comuns:

- Salvar um snapshot de memória quando você reseta uma sessão
- Manter um rastro de auditoria de comandos para resolução de problemas ou conformidade
- Acionar automação de acompanhamento quando uma sessão inicia ou termina
- Escrever arquivos no workspace do agente ou chamar APIs externas quando eventos disparam

Se você consegue escrever uma pequena função TypeScript, você consegue escrever um hook. Hooks são descobertos automaticamente, e você os habilita ou desabilita via CLI.

## Visão geral

O sistema de hooks permite que você:

- Salve contexto de sessão na memória quando `/new` é emitido
- Registre todos os comandos para auditoria
- Acione automações customizadas em eventos de ciclo de vida do agente
- Estenda o comportamento do OpenCraft sem modificar o código core

## Primeiros passos

### Hooks embutidos

O OpenCraft vem com quatro hooks embutidos que são automaticamente descobertos:

- **💾 session-memory**: Salva contexto de sessão no workspace do seu agente (padrão `~/.opencraft/workspace/memory/`) quando você emite `/new`
- **📎 bootstrap-extra-files**: Injeta arquivos de bootstrap de workspace adicionais de padrões de glob/path configurados durante `agent:bootstrap`
- **📝 command-logger**: Registra todos os eventos de comando em `~/.opencraft/logs/commands.log`
- **🚀 boot-md**: Roda `BOOT.md` quando o gateway inicia (requer hooks internos habilitados)

Listar hooks disponíveis:

```bash
opencraft hooks list
```

Habilitar um hook:

```bash
opencraft hooks enable session-memory
```

Verificar status do hook:

```bash
opencraft hooks check
```

Obter informações detalhadas:

```bash
opencraft hooks info session-memory
```

### Onboarding

Durante o onboarding (`opencraft onboard`), você será solicitado a habilitar hooks recomendados. O wizard descobre automaticamente hooks elegíveis e os apresenta para seleção.

## Descoberta de Hooks

Hooks são automaticamente descobertos a partir de três diretórios (em ordem de precedência):

1. **Hooks de workspace**: `<workspace>/hooks/` (por agente, maior precedência)
2. **Hooks gerenciados**: `~/.opencraft/hooks/` (instalados pelo usuário, compartilhados entre workspaces)
3. **Hooks embutidos**: `<opencraft>/dist/hooks/bundled/` (fornecidos com o OpenCraft)

Diretórios de hooks gerenciados podem ser um **hook único** ou um **hook pack** (diretório de pacote).

Cada hook é um diretório contendo:

```
my-hook/
├── HOOK.md          # Metadata + documentação
└── handler.ts       # Implementação do handler
```

## Hook Packs (npm/arquivos)

Hook packs são pacotes npm padrão que exportam um ou mais hooks via `openclaw.hooks` em
`package.json`. Instale-os com:

```bash
opencraft hooks install <path-or-spec>
```

Specs npm são apenas do registro (nome do pacote + versão exata opcional ou dist-tag).
Specs Git/URL/arquivo e ranges semver são rejeitados.

Specs sem prefixo e `@latest` permanecem na trilha estável. Se o npm resolver qualquer um
desses para um pré-lançamento, o OpenCraft para e pede que você opte explicitamente com uma
tag de pré-lançamento como `@beta`/`@rc` ou uma versão exata de pré-lançamento.

Exemplo de `package.json`:

```json
{
  "name": "@acme/my-hooks",
  "version": "0.1.0",
  "openclaw": {
    "hooks": ["./hooks/my-hook", "./hooks/other-hook"]
  }
}
```

Cada entrada aponta para um diretório de hook contendo `HOOK.md` e `handler.ts` (ou `index.ts`).
Hook packs podem incluir dependências; elas serão instaladas em `~/.opencraft/hooks/<id>`.
Cada entrada `openclaw.hooks` deve permanecer dentro do diretório do pacote após resolução de symlink;
entradas que escapam são rejeitadas.

Nota de segurança: `opencraft hooks install` instala dependências com `npm install --ignore-scripts`
(sem scripts de ciclo de vida). Mantenha as árvores de dependência do hook pack como "JS/TS puro" e evite pacotes que dependem
de builds `postinstall`.

## Estrutura do Hook

### Formato HOOK.md

O arquivo `HOOK.md` contém metadados em frontmatter YAML mais documentação Markdown:

```markdown
---
name: my-hook
description: "Descrição curta do que este hook faz"
homepage: https://docs.openclaw.ai/automation/hooks#my-hook
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Meu Hook

Documentação detalhada vai aqui...

## O que Faz

- Escuta por comandos `/new`
- Realiza alguma ação
- Registra o resultado

## Requisitos

- Node.js deve estar instalado

## Configuração

Nenhuma configuração necessária.
```

### Campos de Metadata

O objeto `metadata.openclaw` suporta:

- **`emoji`**: Emoji de exibição para CLI (ex.: `"💾"`)
- **`events`**: Array de eventos para escutar (ex.: `["command:new", "command:reset"]`)
- **`export`**: Export nomeado para usar (padrão `"default"`)
- **`homepage`**: URL de documentação
- **`requires`**: Requisitos opcionais
  - **`bins`**: Binários necessários no PATH (ex.: `["git", "node"]`)
  - **`anyBins`**: Pelo menos um desses binários deve estar presente
  - **`env`**: Variáveis de ambiente necessárias
  - **`config`**: Paths de config necessários (ex.: `["workspace.dir"]`)
  - **`os`**: Plataformas necessárias (ex.: `["darwin", "linux"]`)
- **`always`**: Ignorar verificações de elegibilidade (boolean)
- **`install`**: Métodos de instalação (para hooks embutidos: `[{"id":"bundled","kind":"bundled"}]`)

### Implementação do Handler

O arquivo `handler.ts` exporta uma função `HookHandler`:

```typescript
const myHandler = async (event) => {
  // Acionar apenas no comando 'new'
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] Comando new acionado`);
  console.log(`  Sessão: ${event.sessionKey}`);
  console.log(`  Timestamp: ${event.timestamp.toISOString()}`);

  // Sua lógica customizada aqui

  // Opcionalmente enviar mensagem ao usuário
  event.messages.push("✨ Meu hook executou!");
};

export default myHandler;
```

#### Contexto do Evento

Cada evento inclui:

```typescript
{
  type: 'command' | 'session' | 'agent' | 'gateway' | 'message',
  action: string,              // ex.: 'new', 'reset', 'stop', 'received', 'sent'
  sessionKey: string,          // Identificador de sessão
  timestamp: Date,             // Quando o evento ocorreu
  messages: string[],          // Empurre mensagens aqui para enviar ao usuário
  context: {
    // Eventos de comando:
    sessionEntry?: SessionEntry,
    sessionId?: string,
    sessionFile?: string,
    commandSource?: string,    // ex.: 'whatsapp', 'telegram'
    senderId?: string,
    workspaceDir?: string,
    bootstrapFiles?: WorkspaceBootstrapFile[],
    cfg?: OpenCraftConfig,
    // Eventos de mensagem (veja seção de Message Events para detalhes completos):
    from?: string,             // message:received
    to?: string,               // message:sent
    content?: string,
    channelId?: string,
    success?: boolean,         // message:sent
  }
}
```

## Tipos de Evento

### Eventos de Comando

Acionados quando comandos do agente são emitidos:

- **`command`**: Todos os eventos de comando (listener geral)
- **`command:new`**: Quando o comando `/new` é emitido
- **`command:reset`**: Quando o comando `/reset` é emitido
- **`command:stop`**: Quando o comando `/stop` é emitido

### Eventos de Sessão

- **`session:compact:before`**: Logo antes da compactação resumir o histórico
- **`session:compact:after`**: Após a compactação completar com metadados de resumo

Payloads de hook internos emitem esses como `type: "session"` com `action: "compact:before"` / `action: "compact:after"`; listeners se inscrevem com as chaves combinadas acima.
Registro específico de handler usa o formato de chave literal `${type}:${action}`. Para esses eventos, registre `session:compact:before` e `session:compact:after`.

### Eventos de Agente

- **`agent:bootstrap`**: Antes de arquivos de bootstrap do workspace serem injetados (hooks podem mutar `context.bootstrapFiles`)

### Eventos de Gateway

Acionados quando o gateway inicia:

- **`gateway:startup`**: Após os canais iniciarem e os hooks serem carregados

### Eventos de Mensagem

Acionados quando mensagens são recebidas ou enviadas:

- **`message`**: Todos os eventos de mensagem (listener geral)
- **`message:received`**: Quando uma mensagem de entrada é recebida de qualquer canal. Dispara cedo no processamento antes do entendimento de mídia. Conteúdo pode conter placeholders brutos como `<media:audio>` para anexos de mídia que ainda não foram processados.
- **`message:transcribed`**: Quando uma mensagem foi totalmente processada, incluindo transcrição de áudio e entendimento de link. Neste ponto, `transcript` contém o texto completo da transcrição para mensagens de áudio. Use este hook quando precisar de acesso ao conteúdo de áudio transcrito.
- **`message:preprocessed`**: Dispara para cada mensagem após todo o entendimento de mídia + link completar, dando aos hooks acesso ao body completamente enriquecido (transcrições, descrições de imagem, resumos de link) antes que o agente o veja.
- **`message:sent`**: Quando uma mensagem de saída é enviada com sucesso

#### Contexto de Evento de Mensagem

Eventos de mensagem incluem contexto rico sobre a mensagem:

```typescript
// contexto de message:received
{
  from: string,           // Identificador do remetente (número de telefone, ID de usuário, etc.)
  content: string,        // Conteúdo da mensagem
  timestamp?: number,     // Timestamp Unix quando recebido
  channelId: string,      // Canal (ex.: "whatsapp", "telegram", "discord")
  accountId?: string,     // ID de conta do provedor para configurações multi-conta
  conversationId?: string, // ID de chat/conversa
  messageId?: string,     // ID de mensagem do provedor
  metadata?: {            // Dados adicionais específicos do provedor
    to?: string,
    provider?: string,
    surface?: string,
    threadId?: string,
    senderId?: string,
    senderName?: string,
    senderUsername?: string,
    senderE164?: string,
  }
}

// contexto de message:sent
{
  to: string,             // Identificador do destinatário
  content: string,        // Conteúdo da mensagem que foi enviada
  success: boolean,       // Se o envio foi bem-sucedido
  error?: string,         // Mensagem de erro se o envio falhou
  channelId: string,      // Canal (ex.: "whatsapp", "telegram", "discord")
  accountId?: string,     // ID de conta do provedor
  conversationId?: string, // ID de chat/conversa
  messageId?: string,     // ID de mensagem retornado pelo provedor
  isGroup?: boolean,      // Se esta mensagem de saída pertence a um contexto de grupo/canal
  groupId?: string,       // Identificador de grupo/canal para correlação com message:received
}

// contexto de message:transcribed
{
  body?: string,          // Body de entrada bruto antes do enriquecimento
  bodyForAgent?: string,  // Body enriquecido visível ao agente
  transcript: string,     // Texto de transcrição de áudio
  channelId: string,      // Canal (ex.: "telegram", "whatsapp")
  conversationId?: string,
  messageId?: string,
}

// contexto de message:preprocessed
{
  body?: string,          // Body de entrada bruto
  bodyForAgent?: string,  // Body final enriquecido após entendimento de mídia/link
  transcript?: string,    // Transcrição quando áudio estava presente
  channelId: string,      // Canal (ex.: "telegram", "whatsapp")
  conversationId?: string,
  messageId?: string,
  isGroup?: boolean,
  groupId?: string,
}
```

#### Exemplo: Hook de Logger de Mensagem

```typescript
const isMessageReceivedEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "received";
const isMessageSentEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "sent";

const handler = async (event) => {
  if (isMessageReceivedEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Recebido de ${event.context.from}: ${event.context.content}`);
  } else if (isMessageSentEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Enviado para ${event.context.to}: ${event.context.content}`);
  }
};

export default handler;
```

### Hooks de Resultado de Ferramenta (Plugin API)

Esses hooks não são listeners de stream de eventos; eles permitem que plugins ajustem sincronamente resultados de ferramentas antes que o OpenCraft os persista.

- **`tool_result_persist`**: transformar resultados de ferramentas antes de serem escritos no transcript de sessão. Deve ser síncrono; retorne o payload de resultado de ferramenta atualizado ou `undefined` para mantê-lo como está. Veja [Agent Loop](/concepts/agent-loop).

### Eventos de Hook de Plugin

Hooks de ciclo de vida de compactação expostos através do runner de hook de plugin:

- **`before_compaction`**: Roda antes da compactação com metadados de count/token
- **`after_compaction`**: Roda após a compactação com metadados de resumo de compactação

### Eventos Futuros

Tipos de evento planejados:

- **`session:start`**: Quando uma nova sessão começa
- **`session:end`**: Quando uma sessão termina
- **`agent:error`**: Quando um agente encontra um erro

## Criando Hooks Customizados

### 1. Escolher Localização

- **Hooks de workspace** (`<workspace>/hooks/`): Por agente, maior precedência
- **Hooks gerenciados** (`~/.opencraft/hooks/`): Compartilhados entre workspaces

### 2. Criar Estrutura de Diretório

```bash
mkdir -p ~/.opencraft/hooks/my-hook
cd ~/.opencraft/hooks/my-hook
```

### 3. Criar HOOK.md

```markdown
---
name: my-hook
description: "Faz algo útil"
metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
---

# Meu Hook Customizado

Este hook faz algo útil quando você emite `/new`.
```

### 4. Criar handler.ts

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log("[my-hook] Rodando!");
  // Sua lógica aqui
};

export default handler;
```

### 5. Habilitar e Testar

```bash
# Verificar se o hook foi descoberto
opencraft hooks list

# Habilitá-lo
opencraft hooks enable my-hook

# Reiniciar seu processo de gateway (reinício do app menubar no macOS, ou reinicie seu processo de dev)

# Acionar o evento
# Envie /new via seu canal de mensagens
```

## Configuração

### Novo Formato de Config (Recomendado)

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

### Configuração por Hook

Hooks podem ter configuração customizada:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": {
            "MY_CUSTOM_VAR": "value"
          }
        }
      }
    }
  }
}
```

### Diretórios Extras

Carregar hooks de diretórios adicionais:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

### Formato de Config Legado (Ainda Suportado)

O formato de config antigo ainda funciona para compatibilidade retroativa:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts",
          "export": "default"
        }
      ]
    }
  }
}
```

Nota: `module` deve ser um path relativo ao workspace. Paths absolutos e travessia fora do workspace são rejeitados.

**Migração**: Use o novo sistema baseado em descoberta para novos hooks. Handlers legados são carregados após hooks baseados em diretório.

## Comandos CLI

### Listar Hooks

```bash
# Listar todos os hooks
opencraft hooks list

# Mostrar apenas hooks elegíveis
opencraft hooks list --eligible

# Saída verbosa (mostrar requisitos ausentes)
opencraft hooks list --verbose

# Saída JSON
opencraft hooks list --json
```

### Informações do Hook

```bash
# Mostrar informações detalhadas sobre um hook
opencraft hooks info session-memory

# Saída JSON
opencraft hooks info session-memory --json
```

### Verificar Elegibilidade

```bash
# Mostrar resumo de elegibilidade
opencraft hooks check

# Saída JSON
opencraft hooks check --json
```

### Habilitar/Desabilitar

```bash
# Habilitar um hook
opencraft hooks enable session-memory

# Desabilitar um hook
opencraft hooks disable command-logger
```

## Referência de hooks embutidos

### session-memory

Salva contexto de sessão na memória quando você emite `/new`.

**Eventos**: `command:new`

**Requisitos**: `workspace.dir` deve estar configurado

**Saída**: `<workspace>/memory/YYYY-MM-DD-slug.md` (padrão `~/.opencraft/workspace`)

**O que faz**:

1. Usa a entrada de sessão pré-reset para localizar o transcript correto
2. Extrai as últimas 15 linhas de conversa
3. Usa LLM para gerar um slug de nome de arquivo descritivo
4. Salva metadados de sessão em um arquivo de memória datado

**Exemplo de saída**:

```markdown
# Sessão: 2026-01-16 14:30:00 UTC

- **Session Key**: agent:main:main
- **Session ID**: abc123def456
- **Source**: telegram
```

**Exemplos de nome de arquivo**:

- `2026-01-16-proposta-vendedor.md`
- `2026-01-16-design-api.md`
- `2026-01-16-1430.md` (timestamp de fallback se geração de slug falhar)

**Habilitar**:

```bash
opencraft hooks enable session-memory
```

### bootstrap-extra-files

Injeta arquivos de bootstrap adicionais (por exemplo `AGENTS.md` / `TOOLS.md` locais de monorepo) durante `agent:bootstrap`.

**Eventos**: `agent:bootstrap`

**Requisitos**: `workspace.dir` deve estar configurado

**Saída**: Nenhum arquivo escrito; contexto de bootstrap é modificado apenas em memória.

**Config**:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

**Notas**:

- Paths são resolvidos relativos ao workspace.
- Arquivos devem permanecer dentro do workspace (verificação realpath).
- Apenas basenames de bootstrap reconhecidos são carregados.
- Allowlist de subagente é preservada (apenas `AGENTS.md` e `TOOLS.md`).

**Habilitar**:

```bash
opencraft hooks enable bootstrap-extra-files
```

### command-logger

Registra todos os eventos de comando em um arquivo de auditoria centralizado.

**Eventos**: `command`

**Requisitos**: Nenhum

**Saída**: `~/.opencraft/logs/commands.log`

**O que faz**:

1. Captura detalhes do evento (ação do comando, timestamp, session key, sender ID, source)
2. Acrescenta ao arquivo de log em formato JSONL
3. Roda silenciosamente em background

**Exemplos de entradas de log**:

```jsonl
{"timestamp":"2026-01-16T14:30:00.000Z","action":"new","sessionKey":"agent:main:main","senderId":"+1234567890","source":"telegram"}
{"timestamp":"2026-01-16T15:45:22.000Z","action":"stop","sessionKey":"agent:main:main","senderId":"user@example.com","source":"whatsapp"}
```

**Ver logs**:

```bash
# Ver comandos recentes
tail -n 20 ~/.opencraft/logs/commands.log

# Pretty-print com jq
cat ~/.opencraft/logs/commands.log | jq .

# Filtrar por ação
grep '"action":"new"' ~/.opencraft/logs/commands.log | jq .
```

**Habilitar**:

```bash
opencraft hooks enable command-logger
```

### boot-md

Roda `BOOT.md` quando o gateway inicia (após os canais iniciarem).
Hooks internos devem estar habilitados para este rodar.

**Eventos**: `gateway:startup`

**Requisitos**: `workspace.dir` deve estar configurado

**O que faz**:

1. Lê `BOOT.md` do seu workspace
2. Roda as instruções via o runner de agente
3. Envia quaisquer mensagens de saída solicitadas via a ferramenta de mensagem

**Habilitar**:

```bash
opencraft hooks enable boot-md
```

## Boas Práticas

### Manter Handlers Rápidos

Hooks rodam durante o processamento de comandos. Mantenha-os leves:

```typescript
// ✓ Bom - trabalho assíncrono, retorna imediatamente
const handler: HookHandler = async (event) => {
  void processInBackground(event); // Fire and forget
};

// ✗ Ruim - bloqueia o processamento de comandos
const handler: HookHandler = async (event) => {
  await slowDatabaseQuery(event);
  await evenSlowerAPICall(event);
};
```

### Tratar Erros Graciosamente

Sempre envolva operações arriscadas:

```typescript
const handler: HookHandler = async (event) => {
  try {
    await riskyOperation(event);
  } catch (err) {
    console.error("[my-handler] Falhou:", err instanceof Error ? err.message : String(err));
    // Não lance - deixe outros handlers rodarem
  }
};
```

### Filtrar Eventos Cedo

Retorne cedo se o evento não for relevante:

```typescript
const handler: HookHandler = async (event) => {
  // Lidar apenas com comandos 'new'
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // Sua lógica aqui
};
```

### Usar Chaves de Evento Específicas

Especifique eventos exatos em metadados quando possível:

```yaml
metadata: { "openclaw": { "events": ["command:new"] } } # Específico
```

Em vez de:

```yaml
metadata: { "openclaw": { "events": ["command"] } } # Geral - mais overhead
```

## Depuração

### Habilitar Log de Hook

O gateway registra carregamento de hooks na inicialização:

```
Registered hook: session-memory -> command:new
Registered hook: bootstrap-extra-files -> agent:bootstrap
Registered hook: command-logger -> command
Registered hook: boot-md -> gateway:startup
```

### Verificar Descoberta

Listar todos os hooks descobertos:

```bash
opencraft hooks list --verbose
```

### Verificar Registro

No seu handler, registre quando é chamado:

```typescript
const handler: HookHandler = async (event) => {
  console.log("[my-handler] Acionado:", event.type, event.action);
  // Sua lógica
};
```

### Verificar Elegibilidade

Verifique por que um hook não é elegível:

```bash
opencraft hooks info my-hook
```

Procure por requisitos ausentes na saída.

## Testes

### Logs do Gateway

Monitore logs do gateway para ver execução de hook:

```bash
# macOS
./scripts/clawlog.sh -f

# Outras plataformas
tail -f ~/.opencraft/gateway.log
```

### Testar Hooks Diretamente

Teste seus handlers em isolamento:

```typescript
import { test } from "vitest";
import myHandler from "./hooks/my-hook/handler.js";

test("meu handler funciona", async () => {
  const event = {
    type: "command",
    action: "new",
    sessionKey: "test-session",
    timestamp: new Date(),
    messages: [],
    context: { foo: "bar" },
  };

  await myHandler(event);

  // Verificar efeitos colaterais
});
```

## Arquitetura

### Componentes Core

- **`src/hooks/types.ts`**: Definições de tipo
- **`src/hooks/workspace.ts`**: Varredura e carregamento de diretório
- **`src/hooks/frontmatter.ts`**: Análise de metadados HOOK.md
- **`src/hooks/config.ts`**: Verificação de elegibilidade
- **`src/hooks/hooks-status.ts`**: Relatório de status
- **`src/hooks/loader.ts`**: Carregador de módulo dinâmico
- **`src/cli/hooks-cli.ts`**: Comandos CLI
- **`src/gateway/server-startup.ts`**: Carrega hooks na inicialização do gateway
- **`src/auto-reply/reply/commands-core.ts`**: Aciona eventos de comando

### Fluxo de Descoberta

```
Inicialização do Gateway
    ↓
Varrer diretórios (workspace → gerenciado → embutido)
    ↓
Analisar arquivos HOOK.md
    ↓
Verificar elegibilidade (bins, env, config, os)
    ↓
Carregar handlers de hooks elegíveis
    ↓
Registrar handlers para eventos
```

### Fluxo de Evento

```
Usuário envia /new
    ↓
Validação de comando
    ↓
Criar evento de hook
    ↓
Acionar hook (todos os handlers registrados)
    ↓
Processamento de comando continua
    ↓
Reset de sessão
```

## Resolução de Problemas

### Hook Não Descoberto

1. Verificar estrutura de diretório:

   ```bash
   ls -la ~/.opencraft/hooks/my-hook/
   # Deve mostrar: HOOK.md, handler.ts
   ```

2. Verificar formato HOOK.md:

   ```bash
   cat ~/.opencraft/hooks/my-hook/HOOK.md
   # Deve ter frontmatter YAML com name e metadata
   ```

3. Listar todos os hooks descobertos:

   ```bash
   opencraft hooks list
   ```

### Hook Não Elegível

Verificar requisitos:

```bash
opencraft hooks info my-hook
```

Procurar ausência de:

- Binários (verificar PATH)
- Variáveis de ambiente
- Valores de config
- Compatibilidade de SO

### Hook Não Executando

1. Verificar se o hook está habilitado:

   ```bash
   opencraft hooks list
   # Deve mostrar ✓ ao lado de hooks habilitados
   ```

2. Reiniciar seu processo de gateway para que os hooks recarreguem.

3. Verificar logs do gateway por erros:

   ```bash
   ./scripts/clawlog.sh | grep hook
   ```

### Erros de Handler

Verificar por erros de TypeScript/import:

```bash
# Testar import diretamente
node -e "import('./path/to/handler.ts').then(console.log)"
```

## Guia de Migração

### De Config Legado para Descoberta

**Antes**:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts"
        }
      ]
    }
  }
}
```

**Depois**:

1. Criar diretório de hook:

   ```bash
   mkdir -p ~/.opencraft/hooks/my-hook
   mv ./hooks/handlers/my-handler.ts ~/.opencraft/hooks/my-hook/handler.ts
   ```

2. Criar HOOK.md:

   ```markdown
   ---
   name: my-hook
   description: "Meu hook customizado"
   metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
   ---

   # Meu Hook

   Faz algo útil.
   ```

3. Atualizar config:

   ```json
   {
     "hooks": {
       "internal": {
         "enabled": true,
         "entries": {
           "my-hook": { "enabled": true }
         }
       }
     }
   }
   ```

4. Verificar e reiniciar seu processo de gateway:

   ```bash
   opencraft hooks list
   # Deve mostrar: 🎯 my-hook ✓
   ```

**Benefícios da migração**:

- Descoberta automática
- Gerenciamento via CLI
- Verificação de elegibilidade
- Melhor documentação
- Estrutura consistente

## Veja Também

- [Referência CLI: hooks](/cli/hooks)
- [README de Hooks Embutidos](https://github.com/openclaw/openclaw/tree/main/src/hooks/bundled)
- [Webhook Hooks](/automation/webhook)
- [Configuração](/gateway/configuration#hooks)
