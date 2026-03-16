---
summary: "Solução de problemas rápida no nível do canal com assinaturas de falha e correções por canal"
read_when:
  - O transporte do canal diz conectado mas as respostas falham
  - Você precisa de verificações específicas do canal antes dos docs detalhados do provedor
title: "Solução de Problemas de Canal"
---

# Solução de problemas de canal

Use esta página quando um canal conecta mas o comportamento está errado.

## Sequência de comandos

Execute estes em ordem primeiro:

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
- Probe do canal mostra connected/ready

## WhatsApp

### Assinaturas de falha do WhatsApp

| Sintoma                                  | Verificação mais rápida                                | Correção                                                             |
| ---------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| Conectado mas sem respostas de DM        | `opencraft pairing list whatsapp`                      | Aprove o remetente ou mude a política/lista de permissão de DM.      |
| Mensagens de grupo ignoradas             | Verifique `requireMention` + padrões de menção na config | Mencione o bot ou afrouxe a política de menção para aquele grupo.    |
| Loops aleatórios de desconexão/re-login  | `opencraft channels status --probe` + logs             | Refaça o login e verifique se o diretório de credenciais está saudável. |

Solução completa: [/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

## Telegram

### Assinaturas de falha do Telegram

| Sintoma                                         | Verificação mais rápida                               | Correção                                                                           |
| ----------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/start` mas sem fluxo de resposta utilizável   | `opencraft pairing list telegram`                     | Aprove o pareamento ou mude a política de DM.                                      |
| Bot online mas grupo fica silencioso            | Verifique o requisito de menção e o modo de privacidade do bot | Desabilite o modo de privacidade para visibilidade do grupo ou mencione o bot.    |
| Falhas de envio com erros de rede               | Inspecione logs para falhas de chamada da API Telegram | Corrija o roteamento DNS/IPv6/proxy para `api.telegram.org`.                       |
| `setMyCommands` rejeitado na inicialização      | Inspecione logs para `BOT_COMMANDS_TOO_MUCH`          | Reduza comandos de plugin/skill/Telegram personalizados ou desabilite menus nativos. |
| Atualizou e a lista de permissão te bloqueia    | `opencraft security audit` e listas de permissão da config | Execute `opencraft doctor --fix` ou substitua `@username` por IDs numéricos de remetente. |

Solução completa: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Assinaturas de falha do Discord

| Sintoma                                    | Verificação mais rápida                    | Correção                                                                |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------- |
| Bot online mas sem respostas no servidor   | `opencraft channels status --probe`        | Permita servidor/canal e verifique a intenção de conteúdo de mensagem.  |
| Mensagens de grupo ignoradas               | Verifique logs para drops de menção        | Mencione o bot ou defina `requireMention: false` no servidor/canal.     |
| Respostas de DM ausentes                   | `opencraft pairing list discord`           | Aprove o pareamento de DM ou ajuste a política de DM.                   |

Solução completa: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Assinaturas de falha do Slack

| Sintoma                                             | Verificação mais rápida                          | Correção                                                     |
| --------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| Modo socket conectado mas sem respostas             | `opencraft channels status --probe`              | Verifique o token do app + token do bot e os escopos necessários. |
| DMs bloqueados                                      | `opencraft pairing list slack`                   | Aprove o pareamento ou afrouxe a política de DM.             |
| Mensagem do canal ignorada                          | Verifique `groupPolicy` e lista de permissão do canal | Permita o canal ou mude a política para `open`.         |

Solução completa: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Assinaturas de falha do iMessage e BlueBubbles

| Sintoma                                       | Verificação mais rápida                                                           | Correção                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Sem eventos de entrada                        | Verifique acessibilidade do webhook/servidor e permissões do app                  | Corrija a URL do webhook ou o estado do servidor BlueBubbles. |
| Pode enviar mas não receber no macOS          | Verifique permissões de privacidade do macOS para automação de Mensagens          | Conceda novamente as permissões TCC e reinicie o processo do canal. |
| Remetente de DM bloqueado                     | `opencraft pairing list imessage` ou `opencraft pairing list bluebubbles`         | Aprove o pareamento ou atualize a lista de permissão.         |

Solução completa:

- [/channels/imessage#troubleshooting-macos-privacy-and-security-tcc](/channels/imessage#troubleshooting-macos-privacy-and-security-tcc)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Assinaturas de falha do Signal

| Sintoma                                      | Verificação mais rápida                          | Correção                                                             |
| -------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| Daemon acessível mas bot silencioso          | `opencraft channels status --probe`              | Verifique URL/conta do daemon `signal-cli` e modo de recebimento.   |
| DM bloqueado                                 | `opencraft pairing list signal`                  | Aprove o remetente ou ajuste a política de DM.                       |
| Respostas de grupo não são acionadas         | Verifique lista de permissão de grupo e padrões de menção | Adicione remetente/grupo ou afrouxe o controle.             |

Solução completa: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                                       | Verificação mais rápida                         | Correção                                                              |
| --------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Logado mas ignora mensagens de sala           | `opencraft channels status --probe`             | Verifique `groupPolicy` e lista de permissão de sala.                |
| DMs não processados                           | `opencraft pairing list matrix`                 | Aprove o remetente ou ajuste a política de DM.                        |
| Salas criptografadas falham                   | Verifique módulo de cripto e configurações de criptografia | Habilite suporte a criptografia e rejunte/sincronize a sala.  |

Solução completa: [/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)
