---
name: session-logs
description: Pesquisa e analisa seus próprios logs de sessão (conversas antigas/pai) usando jq.
metadata: { "opencraft": { "emoji": "📜", "requires": { "bins": ["jq", "rg"] } } }
---

# session-logs

Pesquise seu histórico completo de conversas armazenado em arquivos JSONL de sessão. Use quando o usuário fizer referência a conversas antigas/pai ou perguntar o que foi dito antes.

## Gatilho

Use esta habilidade quando o usuário perguntar sobre chats anteriores, conversas pai ou contexto histórico que não está nos arquivos de memória.

## Localização

Os logs de sessão ficam em: `~/.opencraft/agents/<agentId>/sessions/` (use o valor `agent=<id>` da linha Runtime no prompt do sistema).

- **`sessions.json`** - Índice mapeando chaves de sessão para IDs de sessão
- **`<session-id>.jsonl`** - Transcrição completa da conversa por sessão

## Estrutura

Cada arquivo `.jsonl` contém mensagens com:

- `type`: "session" (metadados) ou "message"
- `timestamp`: timestamp ISO
- `message.role`: "user", "assistant" ou "toolResult"
- `message.content[]`: Texto, pensamento ou chamadas de ferramenta (filtre `type=="text"` para conteúdo legível por humanos)
- `message.usage.cost.total`: Custo por resposta

## Consultas Comuns

### Listar todas as sessões por data e tamanho

```bash
for f in ~/.opencraft/agents/<agentId>/sessions/*.jsonl; do
  date=$(head -1 "$f" | jq -r '.timestamp' | cut -dT -f1)
  size=$(ls -lh "$f" | awk '{print $5}')
  echo "$date $size $(basename $f)"
done | sort -r
```

### Encontrar sessões de um dia específico

```bash
for f in ~/.opencraft/agents/<agentId>/sessions/*.jsonl; do
  head -1 "$f" | jq -r '.timestamp' | grep -q "2026-01-06" && echo "$f"
done
```

### Extrair mensagens do usuário de uma sessão

```bash
jq -r 'select(.message.role == "user") | .message.content[]? | select(.type == "text") | .text' <sessao>.jsonl
```

### Pesquisar palavra-chave nas respostas do assistente

```bash
jq -r 'select(.message.role == "assistant") | .message.content[]? | select(.type == "text") | .text' <sessao>.jsonl | rg -i "palavra-chave"
```

### Obter custo total de uma sessão

```bash
jq -s '[.[] | .message.usage.cost.total // 0] | add' <sessao>.jsonl
```

### Resumo de custo diário

```bash
for f in ~/.opencraft/agents/<agentId>/sessions/*.jsonl; do
  date=$(head -1 "$f" | jq -r '.timestamp' | cut -dT -f1)
  cost=$(jq -s '[.[] | .message.usage.cost.total // 0] | add' "$f")
  echo "$date $cost"
done | awk '{a[$1]+=$2} END {for(d in a) print d, "$"a[d]}' | sort -r
```

### Contar mensagens e tokens em uma sessão

```bash
jq -s '{
  mensagens: length,
  usuario: [.[] | select(.message.role == "user")] | length,
  assistente: [.[] | select(.message.role == "assistant")] | length,
  primeiro: .[0].timestamp,
  ultimo: .[-1].timestamp
}' <sessao>.jsonl
```

### Breakdown de uso de ferramentas

```bash
jq -r '.message.content[]? | select(.type == "toolCall") | .name' <sessao>.jsonl | sort | uniq -c | sort -rn
```

### Pesquisar em TODAS as sessões por uma frase

```bash
rg -l "frase" ~/.opencraft/agents/<agentId>/sessions/*.jsonl
```

## Dicas

- Sessões são JSONL somente de adição (um objeto JSON por linha)
- Sessões grandes podem ter vários MB - use `head`/`tail` para amostragem
- O índice `sessions.json` mapeia provedores de chat (discord, whatsapp, etc.) para IDs de sessão
- Sessões deletadas têm sufixo `.deleted.<timestamp>`

## Dica de texto rápido (baixo ruído)

```bash
jq -r 'select(.type=="message") | .message.content[]? | select(.type=="text") | .text' ~/.opencraft/agents/<agentId>/sessions/<id>.jsonl | rg 'palavra-chave'
```
