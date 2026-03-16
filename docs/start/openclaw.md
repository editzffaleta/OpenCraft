---
summary: "Guia completo para configurar o OpenCraft como assistente pessoal, com precauções de segurança"
read_when:
  - Configurando uma nova instância de assistente
  - Revisando implicações de segurança/permissão
title: "Configuração de Assistente Pessoal"
---

# Construindo um assistente pessoal com OpenCraft

O OpenCraft é um gateway de WhatsApp + Telegram + Discord + iMessage para agentes **Pi**. Plugins adicionam o Mattermost. Este guia é a configuração de "assistente pessoal": um número de WhatsApp dedicado que se comporta como seu agente sempre ativo.

## ⚠️ Segurança primeiro

Você está colocando um agente em posição de:

- executar comandos na sua máquina (dependendo da configuração de ferramentas do Pi)
- ler/escrever arquivos no seu workspace
- enviar mensagens de volta via WhatsApp/Telegram/Discord/Mattermost (plugin)

Comece de forma conservadora:

- Sempre defina `channels.whatsapp.allowFrom` (nunca rode aberto para o mundo no seu Mac pessoal).
- Use um número de WhatsApp dedicado para o assistente.
- Heartbeats agora padrão a cada 30 minutos. Desabilite até confiar na configuração definindo `agents.defaults.heartbeat.every: "0m"`.

## Pré-requisitos

- OpenCraft instalado e configurado — veja [Primeiros Passos](/start/getting-started) se ainda não fez isso
- Um segundo número de telefone (SIM/eSIM/pré-pago) para o assistente

## A configuração de dois celulares (recomendada)

Você quer isso:

```mermaid
flowchart TB
    A["<b>Seu celular (pessoal)<br></b><br>Seu WhatsApp<br>+55-11-99999-0001"] -- mensagem --> B["<b>Segundo celular (assistente)<br></b><br>WA do assistente<br>+55-11-99999-0002"]
    B -- vinculado via QR --> C["<b>Seu Mac (opencraft)<br></b><br>Agente Pi"]
```

Se você vincular seu WhatsApp pessoal ao OpenCraft, cada mensagem para você se torna "entrada para o agente". Raramente é isso que você quer.

## Início rápido em 5 minutos

1. Parear o WhatsApp Web (exibe QR; escaneie com o celular do assistente):

```bash
opencraft channels login
```

2. Iniciar o Gateway (deixe rodando):

```bash
opencraft gateway --port 18789
```

3. Coloque uma configuração mínima em `~/.opencraft/opencraft.json`:

```json5
{
  channels: { whatsapp: { allowFrom: ["+5511999999999"] } },
}
```

Agora envie mensagem para o número do assistente a partir do seu celular na lista de permissões.

Quando o onboarding terminar, abrimos automaticamente o dashboard e imprimimos um link limpo (sem token). Se solicitar auth, cole o token de `gateway.auth.token` nas configurações da UI de controle. Para reabrir depois: `opencraft dashboard`.

## Dê um workspace ao agente (AGENTS)

O OpenCraft lê instruções de operação e "memória" do diretório do workspace.

Por padrão, o OpenCraft usa `~/.opencraft/workspace` como workspace do agente e o criará (mais os arquivos iniciais `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) automaticamente na configuração/primeira execução do agente. `BOOTSTRAP.md` só é criado quando o workspace é totalmente novo (não deve voltar após ser deletado). `MEMORY.md` é opcional (não criado automaticamente); quando presente, é carregado para sessões normais. Sessões de sub-agentes só injetam `AGENTS.md` e `TOOLS.md`.

Dica: trate esta pasta como a "memória" do OpenCraft e transforme-a em um repositório git (idealmente privado) para que seus arquivos `AGENTS.md` + memória fiquem com backup. Se o git estiver instalado, workspaces novos são inicializados automaticamente.

```bash
opencraft setup
```

Layout completo do workspace + guia de backup: [Workspace do agente](/concepts/agent-workspace)
Fluxo de memória: [Memória](/concepts/memory)

Opcional: escolha um workspace diferente com `agents.defaults.workspace` (suporta `~`).

```json5
{
  agent: {
    workspace: "~/.opencraft/workspace",
  },
}
```

Se você já distribui seus próprios arquivos de workspace a partir de um repositório, pode desabilitar completamente a criação de arquivos de bootstrap:

```json5
{
  agent: {
    skipBootstrap: true,
  },
}
```

## A configuração que o transforma em "um assistente"

O OpenCraft tem bons padrões para assistente, mas você geralmente vai querer ajustar:

- persona/instruções em `SOUL.md`
- padrões de thinking (se desejado)
- heartbeats (quando confiar nele)

Exemplo:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.opencraft/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Comece com 0; habilite depois.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+5511999999999"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@opencraft", "opencraft"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sessões e memória

- Arquivos de sessão: `~/.opencraft/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Metadados de sessão (uso de tokens, última rota, etc): `~/.opencraft/agents/<agentId>/sessions/sessions.json` (legado: `~/.opencraft/sessions/sessions.json`)
- `/new` ou `/reset` inicia uma nova sessão para aquele chat (configurável via `resetTriggers`). Se enviado sozinho, o agente responde com uma saudação curta para confirmar o reset.
- `/compact [instruções]` compacta o contexto da sessão e reporta o orçamento de contexto restante.

## Heartbeats (modo proativo)

Por padrão, o OpenCraft executa um heartbeat a cada 30 minutos com o prompt:
`Leia HEARTBEAT.md se existir (contexto do workspace). Siga-o estritamente. Não infira ou repita tarefas antigas de chats anteriores. Se nada precisar de atenção, responda HEARTBEAT_OK.`
Defina `agents.defaults.heartbeat.every: "0m"` para desabilitar.

- Se `HEARTBEAT.md` existir mas estiver efetivamente vazio (apenas linhas em branco e cabeçalhos markdown como `# Título`), o OpenCraft pula a execução do heartbeat para economizar chamadas de API.
- Se o arquivo estiver ausente, o heartbeat ainda roda e o modelo decide o que fazer.
- Se o agente responder com `HEARTBEAT_OK` (opcionalmente com padding curto; veja `agents.defaults.heartbeat.ackMaxChars`), o OpenCraft suprime a entrega de saída para aquele heartbeat.
- Por padrão, a entrega de heartbeat para targets DM-style `user:<id>` é permitida. Defina `agents.defaults.heartbeat.directPolicy: "block"` para suprimir a entrega para targets diretos enquanto mantém as execuções de heartbeat ativas.
- Heartbeats executam turnos completos do agente — intervalos menores gastam mais tokens.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Mídia de entrada e saída

Anexos de entrada (imagens/áudio/documentos) podem ser expostos ao seu comando via templates:

- `{{MediaPath}}` (caminho de arquivo temporário local)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (se a transcrição de áudio estiver habilitada)

Anexos de saída do agente: inclua `MEDIA:<caminho-ou-url>` em sua própria linha (sem espaços). Exemplo:

```
Aqui está a captura de tela.
MEDIA:https://example.com/screenshot.png
```

O OpenCraft extrai estes e os envia como mídia junto com o texto.

## Checklist de operações

```bash
opencraft status          # status local (credenciais, sessões, eventos na fila)
opencraft status --all    # diagnóstico completo (somente leitura, copiável)
opencraft status --deep   # adiciona probes de saúde do gateway (Telegram + Discord)
opencraft health --json   # snapshot de saúde do gateway (WS)
```

Logs ficam em `/tmp/openclaw/` (padrão: `openclaw-YYYY-MM-DD.log`).

## Próximos passos

- WebChat: [WebChat](/web/webchat)
- Operações do gateway: [Runbook do Gateway](/gateway)
- Cron + wakeups: [Tarefas agendadas](/automation/cron-jobs)
- App complementar macOS: [App macOS OpenCraft](/platforms/macos)
- App de nó iOS: [App iOS](/platforms/ios)
- App de nó Android: [App Android](/platforms/android)
- Status Windows: [Windows (WSL2)](/platforms/windows)
- Status Linux: [App Linux](/platforms/linux)
- Segurança: [Segurança](/gateway/security)
