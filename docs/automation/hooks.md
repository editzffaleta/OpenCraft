---
summary: "Hooks: automação orientada a eventos para comandos e eventos de ciclo de vida"
read_when:
  - Você quer automação orientada a eventos para /new, /reset, /stop e eventos de ciclo de vida do agente
  - Você quer construir, instalar ou depurar hooks
title: "Hooks"
---

# Hooks

Hooks fornecem um sistema extensível orientado a eventos para automatizar ações em resposta a comandos e eventos do agente. Hooks são automaticamente descobertos a partir de diretórios e podem ser gerenciados via comandos CLI, similar a como Skills funcionam no OpenCraft.

## Orientação Inicial

Hooks são pequenos scripts que executam quando algo acontece. Existem dois tipos:

- **Hooks** (esta página): executam dentro do Gateway quando eventos do agente disparam, como `/new`, `/reset`, `/stop`, ou eventos de ciclo de vida.
- **Webhooks**: Webhooks HTTP externos que permitem que outros sistemas disparem trabalho no OpenCraft. Veja [Webhook Hooks](/automation/webhook) ou use `opencraft webhooks` para comandos auxiliares de Gmail.

Hooks também podem ser empacotados dentro de Plugins; veja [Plugins](/tools/plugin#plugin-hooks).

Usos comuns:

- Salvar um snapshot de memória quando você reseta uma sessão
- Manter uma trilha de auditoria de comandos para troubleshooting ou compliance
- Disparar automação de acompanhamento quando uma sessão inicia ou termina
- Escrever arquivos no workspace do agente ou chamar APIs externas quando eventos disparam

Se você consegue escrever uma pequena função TypeScript, você consegue escrever um hook. Hooks são descobertos automaticamente, e você os habilita ou desabilita via CLI.

## Visão Geral

O sistema de hooks permite que você:

- Salve contexto de sessão na memória quando `/new` é emitido
- Registre todos os comandos para auditoria
- Dispare automações personalizadas em eventos de ciclo de vida do agente
- Estenda o comportamento do OpenCraft sem modificar o código principal

## Começando

### Hooks Incluídos

O OpenCraft vem com quatro hooks incluídos que são automaticamente descobertos:

- **session-memory**: Salva contexto de sessão no seu workspace de agente (padrão `~/.opencraft/workspace/memory/`) quando você emite `/new`
- **bootstrap-extra-files**: Injeta arquivos de bootstrap de workspace adicionais a partir de padrões glob/caminho configurados durante `agent:bootstrap`
- **command-logger**: Registra todos os eventos de comando em `~/.opencraft/logs/commands.log`
- **boot-md**: Executa `BOOT.md` quando o Gateway inicia (requer hooks internos habilitados)

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

Durante o onboarding (`opencraft onboard`), você será solicitado a habilitar hooks recomendados. O assistente automaticamente descobre hooks elegíveis e os apresenta para seleção.

## Descoberta de Hooks

Hooks são automaticamente descobertos a partir de três diretórios (em ordem de precedência):

1. **Hooks do workspace**: `<workspace>/hooks/` (por agente, maior precedência)
2. **Hooks gerenciados**: `~/.opencraft/hooks/` (instalados pelo usuário, compartilhados entre workspaces)
3. **Hooks incluídos**: `<opencraft>/dist/hooks/bundled/` (enviados com o OpenCraft)

Diretórios de hooks gerenciados podem ser um **hook único** ou um **pacote de hooks** (diretório de pacote).

Cada hook é um diretório contendo:

```
my-hook/
├── HOOK.md          # Metadados + documentação
└── handler.ts       # Implementação do handler
```

## Pacotes de Hooks (npm/arquivos)

Pacotes de hooks são pacotes npm padrão que exportam um ou mais hooks via `opencraft.hooks` no
`package.json`. Instale-os com:

```bash
opencraft hooks install <path-or-spec>
```

Specs npm são somente do registro (nome do pacote + versão exata ou dist-tag opcional).
Specs git/URL/arquivo e ranges semver são rejeitados.

Specs simples e `@latest` permanecem na trilha estável. Se o npm resolver qualquer
um deles para um prerelease, o OpenCraft para e pede que você opte explicitamente com uma
tag prerelease como `@beta`/`@rc` ou uma versão prerelease exata.

Exemplo `package.json`:

```json
{
  "name": "@acme/my-hooks",
  "version": "0.1.0",
  "opencraft": {
    "hooks": ["./hooks/my-hook", "./hooks/other-hook"]
  }
}
```

Cada entrada aponta para um diretório de hook contendo `HOOK.md` e `handler.ts` (ou `index.ts`).
Pacotes de hooks podem incluir dependências; elas serão instaladas em `~/.opencraft/hooks/<id>`.
Cada entrada de `opencraft.hooks` deve permanecer dentro do diretório do pacote após resolução de
symlink; entradas que escapam são rejeitadas.

Nota de segurança: `opencraft hooks install` instala dependências com `npm install --ignore-scripts`
(sem scripts de ciclo de vida). Mantenha árvores de dependência de pacotes de hooks como "JS/TS puro" e evite pacotes que dependem
de builds `postinstall`.

## Estrutura do Hook

### Formato do HOOK.md

O arquivo `HOOK.md` contém metadados em frontmatter YAML mais documentação Markdown:

```markdown
---
name: my-hook
description: "Descrição curta do que este hook faz"
homepage: https://docs.opencraft.ai/automation/hooks#my-hook
metadata:
  { "opencraft": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Meu Hook

Documentação detalhada vai aqui...

## O que Ele Faz

- Escuta comandos `/new`
- Executa alguma ação
- Registra o resultado

## Requisitos

- Node.js deve estar instalado

## Configuração

Nenhuma configuração necessária.
```

### Campos de Metadados

O objeto `metadata.opencraft` suporta:

- **`emoji`**: Emoji de exibição para CLI (ex., `"💾"`)
- **`events`**: Array de eventos para escutar (ex., `["command:new", "command:reset"]`)
- **`export`**: Export nomeado a ser usado (padrão `"default"`)
- **`homepage`**: URL de documentação
- **`requires`**: Requisitos opcionais
  - **`bins`**: Binários necessários no PATH (ex., `["git", "node"]`)
  - **`anyBins`**: Pelo menos um desses binários deve estar presente
  - **`env`**: Variáveis de ambiente necessárias
  - **`config`**: Caminhos de configuração necessários (ex., `["workspace.dir"]`)
  - **`os`**: Plataformas necessárias (ex., `["darwin", "linux"]`)
- **`always`**: Ignorar verificações de elegibilidade (booleano)
- **`install`**: Métodos de instalação (para hooks incluídos: `[{"id":"bundled","kind":"bundled"}]`)

### Implementação do Handler

O arquivo `handler.ts` exporta uma função `HookHandler`:

```typescript
const myHandler = async (event) => {
  // Disparar apenas no comando 'new'
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  console.log(`  Session: ${event.sessionKey}`);
  console.log(`  Timestamp: ${event.timestamp.toISOString()}`);

  // Sua lógica personalizada aqui

  // Opcionalmente enviar mensagem ao usuário
  event.messages.push("✨ My hook executed!");
};

export default myHandler;
```

#### Contexto do Evento

Cada evento inclui:

```typescript
{
  type: 'command' | 'session' | 'agent' | 'gateway' | 'message',
  action: string,              // ex., 'new', 'reset', 'stop', 'received', 'sent'
  sessionKey: string,          // Identificador da sessão
  timestamp: Date,             // Quando o evento ocorreu
  messages: string[],          // Adicione mensagens aqui para enviar ao usuário
  context: {
    // Eventos de comando:
    sessionEntry?: SessionEntry,
    sessionId?: string,
    sessionFile?: string,
    commandSource?: string,    // ex., 'whatsapp', 'telegram'
    senderId?: string,
    workspaceDir?: string,
    bootstrapFiles?: WorkspaceBootstrapFile[],
    cfg?: OpenCraftConfig,
    // Eventos de mensagem (veja seção Eventos de Mensagem para detalhes completos):
    from?: string,             // message:received
    to?: string,               // message:sent
    content?: string,
    channelId?: string,
    success?: boolean,         // message:sent
  }
}
```

## Tipos de Eventos

### Eventos de Comando

Disparados quando comandos do agente são emitidos:

- **`command`**: Todos os eventos de comando (listener geral)
- **`command:new`**: Quando o comando `/new` é emitido
- **`command:reset`**: Quando o comando `/reset` é emitido
- **`command:stop`**: Quando o comando `/stop` é emitido

### Eventos de Sessão

- **`session:compact:before`**: Logo antes da compactação resumir o histórico
- **`session:compact:after`**: Após a compactação completar com metadados de resumo

Payloads internos de hook emitem estes como `type: "session"` com `action: "compact:before"` / `action: "compact:after"`; listeners assinam com as chaves combinadas acima.
Registro específico de handler usa o formato literal de chave `${type}:${action}`. Para estes eventos, registre `session:compact:before` e `session:compact:after`.

### Eventos de Agente

- **`agent:bootstrap`**: Antes dos arquivos de bootstrap do workspace serem injetados (hooks podem mutar `context.bootstrapFiles`)

### Eventos do Gateway

Disparados quando o Gateway inicia:

- **`gateway:startup`**: Após canais iniciarem e hooks serem carregados

### Eventos de Mensagem

Disparados quando mensagens são recebidas ou enviadas:

- **`message`**: Todos os eventos de mensagem (listener geral)
- **`message:received`**: Quando uma mensagem de entrada é recebida de qualquer canal. Dispara cedo no processamento antes da compreensão de mídia. O conteúdo pode conter placeholders brutos como `<media:audio>` para anexos de mídia que ainda não foram processados.
- **`message:transcribed`**: Quando uma mensagem foi totalmente processada, incluindo transcrição de áudio e compreensão de link. Neste ponto, `transcript` contém o texto completo da transcrição para mensagens de áudio. Use este hook quando você precisa de acesso ao conteúdo de áudio transcrito.
- **`message:preprocessed`**: Dispara para toda mensagem após toda compreensão de mídia + link completar, dando aos hooks acesso ao corpo totalmente enriquecido (transcrições, descrições de imagem, resumos de link) antes do agente ver.
- **`message:sent`**: Quando uma mensagem de saída é enviada com sucesso

#### Contexto de Evento de Mensagem

Eventos de mensagem incluem contexto rico sobre a mensagem:

```typescript
// contexto message:received
{
  from: string,           // Identificador do remetente (número de telefone, ID do usuário, etc.)
  content: string,        // Conteúdo da mensagem
  timestamp?: number,     // Timestamp Unix quando recebida
  channelId: string,      // Canal (ex., "whatsapp", "telegram", "discord")
  accountId?: string,     // ID da conta do provedor para configurações multi-conta
  conversationId?: string, // ID do chat/conversa
  messageId?: string,     // ID da mensagem do provedor
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

// contexto message:sent
{
  to: string,             // Identificador do destinatário
  content: string,        // Conteúdo da mensagem que foi enviada
  success: boolean,       // Se o envio teve sucesso
  error?: string,         // Mensagem de erro se o envio falhou
  channelId: string,      // Canal (ex., "whatsapp", "telegram", "discord")
  accountId?: string,     // ID da conta do provedor
  conversationId?: string, // ID do chat/conversa
  messageId?: string,     // ID da mensagem retornado pelo provedor
  isGroup?: boolean,      // Se esta mensagem de saída pertence a um contexto de grupo/canal
  groupId?: string,       // Identificador do grupo/canal para correlação com message:received
}

// contexto message:transcribed
{
  body?: string,          // Corpo bruto de entrada antes do enriquecimento
  bodyForAgent?: string,  // Corpo enriquecido visível ao agente
  transcript: string,     // Texto da transcrição de áudio
  channelId: string,      // Canal (ex., "telegram", "whatsapp")
  conversationId?: string,
  messageId?: string,
}

// contexto message:preprocessed
{
  body?: string,          // Corpo bruto de entrada
  bodyForAgent?: string,  // Corpo final enriquecido após compreensão de mídia/link
  transcript?: string,    // Transcrição quando áudio estava presente
  channelId: string,      // Canal (ex., "telegram", "whatsapp")
  conversationId?: string,
  messageId?: string,
  isGroup?: boolean,
  groupId?: string,
}
```

#### Exemplo: Hook Logger de Mensagens

```typescript
const isMessageReceivedEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "received";
const isMessageSentEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "sent";

const handler = async (event) => {
  if (isMessageReceivedEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Received from ${event.context.from}: ${event.context.content}`);
  } else if (isMessageSentEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Sent to ${event.context.to}: ${event.context.content}`);
  }
};

export default handler;
```

### Hooks de Resultado de Ferramenta (API de Plugin)

Estes hooks não são listeners de fluxo de eventos; eles permitem que Plugins ajustem sincronamente resultados de ferramentas antes do OpenCraft persisti-los.

- **`tool_result_persist`**: transforma resultados de ferramentas antes de serem escritos na transcrição da sessão. Deve ser síncrono; retorne o payload atualizado do resultado da ferramenta ou `undefined` para mantê-lo como está. Veja [Agent Loop](/concepts/agent-loop).

### Eventos de Hook de Plugin

Hooks de ciclo de vida de compactação expostos através do executor de hooks de Plugin:

- **`before_compaction`**: Executa antes da compactação com metadados de contagem/Token
- **`after_compaction`**: Executa após a compactação com metadados de resumo da compactação

### Eventos Futuros

Tipos de eventos planejados:

- **`session:start`**: Quando uma nova sessão começa
- **`session:end`**: Quando uma sessão termina
- **`agent:error`**: Quando um agente encontra um erro

## Criando Hooks Personalizados

### 1. Escolha a Localização

- **Hooks do workspace** (`<workspace>/hooks/`): Por agente, maior precedência
- **Hooks gerenciados** (`~/.opencraft/hooks/`): Compartilhados entre workspaces

### 2. Crie a Estrutura de Diretórios

```bash
mkdir -p ~/.opencraft/hooks/my-hook
cd ~/.opencraft/hooks/my-hook
```

### 3. Crie o HOOK.md

```markdown
---
name: my-hook
description: "Faz algo útil"
metadata: { "opencraft": { "emoji": "🎯", "events": ["command:new"] } }
---

# Meu Hook Personalizado

Este hook faz algo útil quando você emite `/new`.
```

### 4. Crie o handler.ts

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log("[my-hook] Running!");
  // Sua lógica aqui
};

export default handler;
```

### 5. Habilite e Teste

```bash
# Verifique se o hook é descoberto
opencraft hooks list

# Habilite-o
opencraft hooks enable my-hook

# Reinicie o processo do Gateway (reiniciar app da barra de menu no macOS, ou reiniciar o processo de dev)

# Dispare o evento
# Envie /new via seu canal de mensagens
```

## Configuração

### Novo Formato de Configuração (Recomendado)

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

Hooks podem ter configuração personalizada:

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

### Formato de Configuração Legado (Ainda Suportado)

O formato de configuração antigo ainda funciona para compatibilidade retroativa:

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

Nota: `module` deve ser um caminho relativo ao workspace. Caminhos absolutos e travessia fora do workspace são rejeitados.

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

## Referência de hooks incluídos

### session-memory

Salva contexto de sessão na memória quando você emite `/new`.

**Eventos**: `command:new`

**Requisitos**: `workspace.dir` deve estar configurado

**Saída**: `<workspace>/memory/YYYY-MM-DD-slug.md` (padrão `~/.opencraft/workspace`)

**O que faz**:

1. Usa a entrada de sessão pré-reset para localizar a transcrição correta
2. Extrai as últimas 15 linhas de conversa
3. Usa LLM para gerar um slug de nome de arquivo descritivo
4. Salva metadados da sessão em um arquivo de memória datado

**Exemplo de saída**:

```markdown
# Session: 2026-01-16 14:30:00 UTC

- **Session Key**: agent:main:main
- **Session ID**: abc123def456
- **Source**: telegram
```

**Exemplos de nome de arquivo**:

- `2026-01-16-vendor-pitch.md`
- `2026-01-16-api-design.md`
- `2026-01-16-1430.md` (timestamp de fallback se geração de slug falhar)

**Habilitar**:

```bash
opencraft hooks enable session-memory
```

### bootstrap-extra-files

Injeta arquivos de bootstrap adicionais (por exemplo `AGENTS.md` / `TOOLS.md` locais de monorepo) durante `agent:bootstrap`.

**Eventos**: `agent:bootstrap`

**Requisitos**: `workspace.dir` deve estar configurado

**Saída**: Nenhum arquivo escrito; contexto de bootstrap é modificado somente em memória.

**Configuração**:

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

- Caminhos são resolvidos relativos ao workspace.
- Arquivos devem permanecer dentro do workspace (verificação de realpath).
- Apenas nomes base de bootstrap reconhecidos são carregados.
- A lista de permissão de subagentes é preservada (somente `AGENTS.md` e `TOOLS.md`).

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

1. Captura detalhes do evento (ação do comando, timestamp, chave de sessão, ID do remetente, origem)
2. Adiciona ao arquivo de log no formato JSONL
3. Executa silenciosamente em segundo plano

**Exemplos de entradas de log**:

```jsonl
{"timestamp":"2026-01-16T14:30:00.000Z","action":"new","sessionKey":"agent:main:main","senderId":"+1234567890","source":"telegram"}
{"timestamp":"2026-01-16T15:45:22.000Z","action":"stop","sessionKey":"agent:main:main","senderId":"user@example.com","source":"whatsapp"}
```

**Visualizar logs**:

```bash
# Ver comandos recentes
tail -n 20 ~/.opencraft/logs/commands.log

# Imprimir formatado com jq
cat ~/.opencraft/logs/commands.log | jq .

# Filtrar por ação
grep '"action":"new"' ~/.opencraft/logs/commands.log | jq .
```

**Habilitar**:

```bash
opencraft hooks enable command-logger
```

### boot-md

Executa `BOOT.md` quando o Gateway inicia (após canais iniciarem).
Hooks internos devem estar habilitados para que isso execute.

**Eventos**: `gateway:startup`

**Requisitos**: `workspace.dir` deve estar configurado

**O que faz**:

1. Lê `BOOT.md` do seu workspace
2. Executa as instruções via o executor de agente
3. Envia quaisquer mensagens de saída solicitadas via a ferramenta de mensagem

**Habilitar**:

```bash
opencraft hooks enable boot-md
```

## Boas Práticas

### Mantenha Handlers Rápidos

Hooks executam durante o processamento de comandos. Mantenha-os leves:

```typescript
// ✓ Bom - trabalho assíncrono, retorna imediatamente
const handler: HookHandler = async (event) => {
  void processInBackground(event); // Disparar e esquecer
};

// ✗ Ruim - bloqueia processamento de comandos
const handler: HookHandler = async (event) => {
  await slowDatabaseQuery(event);
  await evenSlowerAPICall(event);
};
```

### Trate Erros com Elegância

Sempre envolva operações arriscadas:

```typescript
const handler: HookHandler = async (event) => {
  try {
    await riskyOperation(event);
  } catch (err) {
    console.error("[my-handler] Failed:", err instanceof Error ? err.message : String(err));
    // Não lance - deixe outros handlers executarem
  }
};
```

### Filtre Eventos Cedo

Retorne cedo se o evento não é relevante:

```typescript
const handler: HookHandler = async (event) => {
  // Tratar apenas comandos 'new'
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // Sua lógica aqui
};
```

### Use Chaves de Evento Específicas

Especifique eventos exatos nos metadados quando possível:

```yaml
metadata: { "opencraft": { "events": ["command:new"] } } # Específico
```

Em vez de:

```yaml
metadata: { "opencraft": { "events": ["command"] } } # Geral - mais overhead
```

## Depuração

### Habilitar Logging de Hook

O Gateway registra o carregamento de hooks na inicialização:

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
  console.log("[my-handler] Triggered:", event.type, event.action);
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

Monitore logs do Gateway para ver execução de hooks:

```bash
# macOS
./scripts/clawlog.sh -f

# Outras plataformas
tail -f ~/.opencraft/gateway.log
```

### Testar Hooks Diretamente

Teste seus handlers isoladamente:

```typescript
import { test } from "vitest";
import myHandler from "./hooks/my-hook/handler.js";

test("my handler works", async () => {
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

### Componentes Principais

- **`src/hooks/types.ts`**: Definições de tipos
- **`src/hooks/workspace.ts`**: Escaneamento e carregamento de diretórios
- **`src/hooks/frontmatter.ts`**: Parsing de metadados do HOOK.md
- **`src/hooks/config.ts`**: Verificação de elegibilidade
- **`src/hooks/hooks-status.ts`**: Reporte de status
- **`src/hooks/loader.ts`**: Carregador dinâmico de módulos
- **`src/cli/hooks-cli.ts`**: Comandos CLI
- **`src/gateway/server-startup.ts`**: Carrega hooks na inicialização do Gateway
- **`src/auto-reply/reply/commands-core.ts`**: Dispara eventos de comando

### Fluxo de Descoberta

```
Inicialização do Gateway
    ↓
Escanear diretórios (workspace → gerenciados → incluídos)
    ↓
Analisar arquivos HOOK.md
    ↓
Verificar elegibilidade (bins, env, config, os)
    ↓
Carregar handlers de hooks elegíveis
    ↓
Registrar handlers para eventos
```

### Fluxo de Eventos

```
Usuário envia /new
    ↓
Validação de comando
    ↓
Criar evento de hook
    ↓
Disparar hook (todos os handlers registrados)
    ↓
Processamento de comando continua
    ↓
Reset de sessão
```

## Solução de Problemas

### Hook Não Descoberto

1. Verifique a estrutura de diretórios:

   ```bash
   ls -la ~/.opencraft/hooks/my-hook/
   # Deve mostrar: HOOK.md, handler.ts
   ```

2. Verifique o formato do HOOK.md:

   ```bash
   cat ~/.opencraft/hooks/my-hook/HOOK.md
   # Deve ter frontmatter YAML com name e metadata
   ```

3. Liste todos os hooks descobertos:

   ```bash
   opencraft hooks list
   ```

### Hook Não Elegível

Verifique requisitos:

```bash
opencraft hooks info my-hook
```

Procure por:

- Binários ausentes (verifique PATH)
- Variáveis de ambiente
- Valores de configuração
- Compatibilidade de SO

### Hook Não Executando

1. Verifique se o hook está habilitado:

   ```bash
   opencraft hooks list
   # Deve mostrar ✓ ao lado dos hooks habilitados
   ```

2. Reinicie o processo do Gateway para que os hooks recarreguem.

3. Verifique logs do Gateway para erros:

   ```bash
   ./scripts/clawlog.sh | grep hook
   ```

### Erros do Handler

Verifique erros de TypeScript/import:

```bash
# Testar import diretamente
node -e "import('./path/to/handler.ts').then(console.log)"
```

## Guia de Migração

### De Configuração Legada para Descoberta

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

1. Crie o diretório do hook:

   ```bash
   mkdir -p ~/.opencraft/hooks/my-hook
   mv ./hooks/handlers/my-handler.ts ~/.opencraft/hooks/my-hook/handler.ts
   ```

2. Crie o HOOK.md:

   ```markdown
   ---
   name: my-hook
   description: "Meu hook personalizado"
   metadata: { "opencraft": { "emoji": "🎯", "events": ["command:new"] } }
   ---

   # Meu Hook

   Faz algo útil.
   ```

3. Atualize a configuração:

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

4. Verifique e reinicie o processo do Gateway:

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
- [README dos Hooks Incluídos](https://github.com/editzffaleta/OpenCraft/tree/main/src/hooks/bundled)
- [Webhook Hooks](/automation/webhook)
- [Configuração](/gateway/configuration#hooks)
