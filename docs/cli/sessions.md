---
summary: "Referência do CLI para `opencraft sessions` (listar sessões armazenadas + uso)"
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

- padrão: store do agente padrão configurado
- `--agent <id>`: um store de agente configurado
- `--all-agents`: agregar todos os stores de agentes configurados
- `--store <path>`: path de store explícito (não pode ser combinado com `--agent` ou `--all-agents`)

`opencraft sessions --all-agents` lê stores de agentes configurados. Descoberta de sessão
do Gateway e ACP é mais ampla: também inclui stores apenas em disco encontrados em
o root padrão `agents/` ou um root `session.store` com template. Esses
stores descobertos devem resolver para arquivos `sessions.json` regulares dentro do
root do agente; links simbólicos e paths fora do root são pulados.

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

Rodar manutenção agora (em vez de aguardar o próximo ciclo de escrita):

```bash
opencraft sessions cleanup --dry-run
opencraft sessions cleanup --agent work --dry-run
opencraft sessions cleanup --all-agents --dry-run
opencraft sessions cleanup --enforce
opencraft sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
opencraft sessions cleanup --json
```

`opencraft sessions cleanup` usa configurações de `session.maintenance` da config:

- Nota de escopo: `opencraft sessions cleanup` mantém apenas stores/transcrições de sessão. Não remove logs de execução de cron (`cron/runs/<jobId>.jsonl`), que são gerenciados por `cron.runLog.maxBytes` e `cron.runLog.keepLines` em [Configuração de Cron](/automation/cron-jobs#configuration) e explicados em [Manutenção de Cron](/automation/cron-jobs#maintenance).

- `--dry-run`: preview de quantas entradas seriam podadas/limitadas sem escrever.
  - Em modo texto, dry-run imprime uma tabela de ação por sessão (`Action`, `Key`, `Age`, `Model`, `Flags`) para que você veja o que seria mantido vs removido.
- `--enforce`: aplicar manutenção mesmo quando `session.maintenance.mode` é `warn`.
- `--active-key <key>`: proteger uma chave ativa específica de evicção por orçamento de disco.
- `--agent <id>`: rodar limpeza para um store de agente configurado.
- `--all-agents`: rodar limpeza para todos os stores de agentes configurados.
- `--store <path>`: rodar contra um arquivo `sessions.json` específico.
- `--json`: imprimir um resumo JSON. Com `--all-agents`, a saída inclui um resumo por store.

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

- Config de sessão: [Configuration reference](/gateway/configuration-reference#session)
