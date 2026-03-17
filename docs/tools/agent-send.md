---
summary: "Execuções diretas de `opencraft agent` via CLI (com entrega opcional)"
read_when:
  - Adicionando ou modificando o ponto de entrada do agente na CLI
title: "Agent Send"
---

# `opencraft agent` (execuções diretas do agente)

`opencraft agent` executa um único turno do agente sem precisar de uma mensagem de chat de entrada.
Por padrão, passa **pelo Gateway**; adicione `--local` para forçar o runtime
embutido na máquina atual.

## Comportamento

- Obrigatório: `--message <text>`
- Seleção de sessão:
  - `--to <dest>` deriva a chave de sessão (alvos de grupo/canal preservam isolamento; chats diretos convergem para `main`), **ou**
  - `--session-id <id>` reutiliza uma sessão existente pelo id, **ou**
  - `--agent <id>` aponta para um agente configurado diretamente (usa a chave de sessão `main` daquele agente)
- Executa o mesmo runtime de agente embutido que as respostas normais de entrada.
- Flags de thinking/verbose persistem no armazenamento de sessão.
- Saída:
  - padrão: imprime texto de resposta (mais linhas `MEDIA:<url>`)
  - `--json`: imprime payload estruturado + metadados
- Entrega opcional de volta para um canal com `--deliver` + `--channel` (formatos de alvo correspondem a `opencraft message --target`).
- Use `--reply-channel`/`--reply-to`/`--reply-account` para substituir a entrega sem alterar a sessão.

Se o Gateway estiver inacessível, a CLI **recorre** à execução local embutida.

## Exemplos

```bash
opencraft agent --to +15555550123 --message "status update"
opencraft agent --agent ops --message "Summarize logs"
opencraft agent --session-id 1234 --message "Summarize inbox" --thinking medium
opencraft agent --to +15555550123 --message "Trace logs" --verbose on --json
opencraft agent --to +15555550123 --message "Summon reply" --deliver
opencraft agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## Flags

- `--local`: executar localmente (requer chaves de API do provedor de modelo no seu shell)
- `--deliver`: enviar a resposta para o canal escolhido
- `--channel`: canal de entrega (`whatsapp|telegram|discord|googlechat|slack|signal|imessage`, padrão: `whatsapp`)
- `--reply-to`: substituição do alvo de entrega
- `--reply-channel`: substituição do canal de entrega
- `--reply-account`: substituição do id da conta de entrega
- `--thinking <off|minimal|low|medium|high|xhigh>`: persistir nível de thinking (apenas modelos GPT-5.2 + Codex)
- `--verbose <on|full|off>`: persistir nível de verbose
- `--timeout <seconds>`: substituir timeout do agente
- `--json`: saída em JSON estruturado
