---
summary: "Solução rápida de problemas por canal com assinaturas de falha e correções específicas"
read_when:
  - Channel transport says connected but replies fail
  - You need channel specific checks before deep provider docs
title: "Channel Troubleshooting"
---

# Solução de problemas de canais

Use esta página quando um canal conecta, mas o comportamento está incorreto.

## Sequência de comandos

Execute estes na ordem primeiro:

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Linha de base saudável:

- `Runtime: running`
- `RPC probe: ok`
- Sonda do canal mostra conectado/pronto

## WhatsApp

### Assinaturas de falha do WhatsApp

| Sintoma                               | Verificação mais rápida                                  | Correção                                                                      |
| ------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Conectado mas sem respostas de DM     | `opencraft pairing list whatsapp`                        | Aprove o remetente ou altere a política de DM/allowlist.                      |
| Mensagens de grupo ignoradas          | Verifique `requireMention` + padrões de menção na config | Mencione o Bot ou relaxe a política de menção para aquele grupo.              |
| Desconexão aleatória/loops de relogin | `opencraft channels status --probe` + logs               | Faça login novamente e verifique se o diretório de credenciais está saudável. |

Solução completa: [/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

## Telegram

### Assinaturas de falha do Telegram

| Sintoma                                    | Verificação mais rápida                                    | Correção                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/start` mas sem fluxo de resposta útil    | `opencraft pairing list telegram`                          | Aprove o pareamento ou altere a política de DM.                                           |
| Bot online mas grupo permanece silencioso  | Verifique requisito de menção e modo de privacidade do Bot | Desabilite o modo de privacidade para visibilidade em grupo ou mencione o Bot.            |
| Falhas de envio com erros de rede          | Inspecione logs para falhas de chamada da API Telegram     | Corrija roteamento DNS/IPv6/proxy para `api.telegram.org`.                                |
| `setMyCommands` rejeitado na inicialização | Inspecione logs para `BOT_COMMANDS_TOO_MUCH`               | Reduza comandos de plugin/Skill/Telegram personalizados ou desabilite menus nativos.      |
| Atualizou e allowlist bloqueia você        | `opencraft security audit` e allowlists na config          | Execute `opencraft doctor --fix` ou substitua `@username` por IDs numéricos de remetente. |

Solução completa: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Assinaturas de falha do Discord

| Sintoma                               | Verificação mais rápida             | Correção                                                          |
| ------------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| Bot online mas sem respostas no guild | `opencraft channels status --probe` | Permita guild/canal e verifique a intent de conteúdo de mensagem. |
| Mensagens de grupo ignoradas          | Verifique logs para drops de menção | Mencione o Bot ou defina `requireMention: false` no guild/canal.  |
| Respostas de DM ausentes              | `opencraft pairing list discord`    | Aprove o pareamento de DM ou ajuste a política de DM.             |

Solução completa: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Assinaturas de falha do Slack

| Sintoma                                 | Verificação mais rápida                      | Correção                                               |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Socket Mode conectado mas sem respostas | `opencraft channels status --probe`          | Verifique app Token + bot Token e escopos necessários. |
| DMs bloqueadas                          | `opencraft pairing list slack`               | Aprove o pareamento ou relaxe a política de DM.        |
| Mensagem do canal ignorada              | Verifique `groupPolicy` e allowlist do canal | Permita o canal ou mude a política para `open`.        |

Solução completa: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Assinaturas de falha do iMessage e BlueBubbles

| Sintoma                                  | Verificação mais rápida                                                   | Correção                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Nenhum evento de entrada                 | Verifique acessibilidade do Webhook/servidor e permissões do app          | Corrija a URL do Webhook ou o estado do servidor BlueBubbles.       |
| Consegue enviar mas não receber no macOS | Verifique permissões de privacidade do macOS para automação do Messages   | Conceda novamente as permissões TCC e reinicie o processo do canal. |
| Remetente de DM bloqueado                | `opencraft pairing list imessage` ou `opencraft pairing list bluebubbles` | Aprove o pareamento ou atualize a allowlist.                        |

Solução completa:

- [/channels/imessage#troubleshooting-macos-privacy-and-security-tcc](/channels/imessage#troubleshooting-macos-privacy-and-security-tcc)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Assinaturas de falha do Signal

| Sintoma                             | Verificação mais rápida                          | Correção                                                          |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Daemon acessível mas Bot silencioso | `opencraft channels status --probe`              | Verifique URL/conta do daemon `signal-cli` e modo de recebimento. |
| DM bloqueada                        | `opencraft pairing list signal`                  | Aprove o remetente ou ajuste a política de DM.                    |
| Respostas de grupo não disparam     | Verifique allowlist de grupo e padrões de menção | Adicione remetente/grupo ou relaxe o bloqueio.                    |

Solução completa: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                             | Verificação mais rápida                          | Correção                                                             |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| Logado mas ignora mensagens da sala | `opencraft channels status --probe`              | Verifique `groupPolicy` e allowlist da sala.                         |
| DMs não são processadas             | `opencraft pairing list matrix`                  | Aprove o remetente ou ajuste a política de DM.                       |
| Salas criptografadas falham         | Verifique módulo de criptografia e configurações | Habilite suporte a criptografia e entre/sincronize a sala novamente. |

Solução completa: [/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)
