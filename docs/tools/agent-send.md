---
summary: "Execuções diretas do CLI `opencraft agent` (com entrega opcional)"
read_when:
  - Adicionando ou modificando o ponto de entrada do CLI do agente
title: "Agent Send"
---

# `opencraft agent` (execuções diretas de agente)

`opencraft agent` executa um único turno de agente sem precisar de uma mensagem de chat de entrada.
Por padrão vai **pelo Gateway**; adicione `--local` para forçar o
runtime incorporado na máquina atual.

## Comportamento

- Obrigatório: `--message <texto>`
- Seleção de sessão:
  - `--to <dest>` deriva a chave de sessão (alvos de grupo/canal preservam isolamento; chats diretos colapsam para `main`), **ou**
  - `--session-id <id>` reutiliza uma sessão existente pelo id, **ou**
  - `--agent <id>` aponta diretamente para um agente configurado (usa a chave de sessão `main` daquele agente)
- Executa o mesmo runtime de agente incorporado que respostas normais de entrada.
- Flags de thinking/verbose persistem no armazenamento de sessão.
- Saída:
  - padrão: imprime o texto da resposta (mais linhas `MEDIA:<url>`)
  - `--json`: imprime payload estruturado + metadados
- Entrega opcional de volta a um canal com `--deliver` + `--channel` (formatos de alvo correspondem a `opencraft message --target`).
- Use `--reply-channel`/`--reply-to`/`--reply-account` para sobrescrever a entrega sem alterar a sessão.

Se o Gateway estiver inacessível, o CLI **cai para** a execução local incorporada.

## Exemplos

```bash
opencraft agent --to +15555550123 --message "atualização de status"
opencraft agent --agent ops --message "Resumir logs"
opencraft agent --session-id 1234 --message "Resumir inbox" --thinking medium
opencraft agent --to +15555550123 --message "Rastrear logs" --verbose on --json
opencraft agent --to +15555550123 --message "Invocar resposta" --deliver
opencraft agent --agent ops --message "Gerar relatório" --deliver --reply-channel slack --reply-to "#reports"
```

## Flags

- `--local`: executar localmente (requer chaves de API do provedor de modelo no seu shell)
- `--deliver`: enviar a resposta para o canal escolhido
- `--channel`: canal de entrega (`whatsapp|telegram|discord|googlechat|slack|signal|imessage`, padrão: `whatsapp`)
- `--reply-to`: sobrescrita do alvo de entrega
- `--reply-channel`: sobrescrita do canal de entrega
- `--reply-account`: sobrescrita do id de conta de entrega
- `--thinking <off|minimal|low|medium|high|xhigh>`: persistir nível de thinking (apenas modelos GPT-5.2 + Codex)
- `--verbose <on|full|off>`: persistir nível de verbose
- `--timeout <segundos>`: sobrescrever timeout do agente
- `--json`: saída JSON estruturada
