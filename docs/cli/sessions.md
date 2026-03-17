---
summary: "Referência CLI para `opencraft sessions` (listar sessões armazenadas + uso)"
read_when:
  - Você quer listar sessões armazenadas e ver atividade recente
title: "sessions"
---

# `opencraft sessions`

Listar sessões de conversa armazenadas.

```bash
opencraft sessions
opencraft sessions --agent work
opencraft sessions --all-agents
opencraft sessions --active 120
opencraft sessions --json
```

Seleção de escopo:

- padrão: armazenamento do agente padrão configurado
- `--agent <id>`: um armazenamento de agente configurado
- `--all-agents`: agregar todos os armazenamentos de agentes configurados
- `--store <path>`: caminho de armazenamento explícito (não pode ser combinado com `--agent` ou `--all-agents`)

`opencraft sessions --all-agents` lê armazenamentos de agentes configurados. A descoberta de sessão
do Gateway e ACP é mais ampla: ela também inclui armazenamentos somente em disco encontrados sob
a raiz padrão `agents/` ou uma raiz `session.store` modelada. Esses
armazenamentos descobertos devem resolver para arquivos `sessions.json` regulares dentro da
raiz do agente; symlinks e caminhos fora da raiz são ignorados.

Exemplos JSON:

`opencraft sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.opencraft/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.opencraft/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-5" }
  ]
}
```

## Manutenção de limpeza

Executar manutenção agora (em vez de esperar pelo próximo ciclo de escrita):

```bash
opencraft sessions cleanup --dry-run
opencraft sessions cleanup --agent work --dry-run
opencraft sessions cleanup --all-agents --dry-run
opencraft sessions cleanup --enforce
opencraft sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
opencraft sessions cleanup --json
```

`opencraft sessions cleanup` usa configurações de `session.maintenance` do config:

- Nota de escopo: `opencraft sessions cleanup` mantém apenas armazenamentos de sessão/transcrições. Ele não remove logs de execução Cron (`cron/runs/<jobId>.jsonl`), que são gerenciados por `cron.runLog.maxBytes` e `cron.runLog.keepLines` em [Configuração Cron](/automation/cron-jobs#configuration) e explicados em [Manutenção Cron](/automation/cron-jobs#maintenance).

- `--dry-run`: pré-visualizar quantas entradas seriam removidas/limitadas sem escrever.
  - No modo texto, dry-run imprime uma tabela de ação por sessão (`Action`, `Key`, `Age`, `Model`, `Flags`) para que você possa ver o que seria mantido vs removido.
- `--enforce`: aplicar manutenção mesmo quando `session.maintenance.mode` é `warn`.
- `--active-key <key>`: proteger uma chave ativa específica de despejo por orçamento de disco.
- `--agent <id>`: executar limpeza para um armazenamento de agente configurado.
- `--all-agents`: executar limpeza para todos os armazenamentos de agentes configurados.
- `--store <path>`: executar contra um arquivo `sessions.json` específico.
- `--json`: imprimir resumo JSON. Com `--all-agents`, a saída inclui um resumo por armazenamento.

`opencraft sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.opencraft/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.opencraft/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Relacionado:

- Configuração de sessão: [Configuration reference](/gateway/configuration-reference#session)
