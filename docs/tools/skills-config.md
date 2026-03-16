---
summary: "Schema e exemplos de configuração de skills"
read_when:
  - Adicionando ou modificando configuração de skills
  - Ajustando allowlist embutida ou comportamento de instalação
title: "Config de Skills"
---

# Config de Skills

Toda configuração relacionada a skills fica em `skills` em `~/.opencraft/opencraft.json`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (runtime do Gateway ainda é Node; bun não recomendado)
    },
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string texto simples
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_AQUI",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

## Campos

- `allowBundled`: allowlist opcional apenas para skills **embutidas**. Quando definido, apenas
  skills embutidas na lista são elegíveis (skills gerenciadas/workspace não afetadas).
- `load.extraDirs`: diretórios adicionais de skill para escanear (menor precedência).
- `load.watch`: monitorar pastas de skill e atualizar o snapshot de skills (padrão: true).
- `load.watchDebounceMs`: debounce para eventos do watcher de skills em milissegundos (padrão: 250).
- `install.preferBrew`: preferir instaladores brew quando disponíveis (padrão: true).
- `install.nodeManager`: preferência de instalador node (`npm` | `pnpm` | `yarn` | `bun`, padrão: npm).
  Isso afeta apenas **instalações de skill**; o runtime do Gateway ainda deve ser Node
  (Bun não recomendado para WhatsApp/Telegram).
- `entries.<skillKey>`: overrides por skill.

Campos por skill:

- `enabled`: defina `false` para desabilitar uma skill mesmo se for embutida/instalada.
- `env`: variáveis de ambiente injetadas para a execução do agente (apenas se ainda não estiver definida).
- `apiKey`: conveniência opcional para skills que declaram uma var de env primária.
  Suporta string texto simples ou objeto SecretRef (`{ source, provider, id }`).

## Notas

- Chaves em `entries` mapeiam para o nome da skill por padrão. Se uma skill define
  `metadata.openclaw.skillKey`, use essa chave.
- Mudanças em skills são capturadas no próximo turno do agente quando o watcher está habilitado.

### Skills em sandbox + vars de env

Quando uma sessão está **em sandbox**, processos de skill rodam dentro do Docker. O sandbox
**não** herda o `process.env` do host.

Use um dos seguintes:

- `agents.defaults.sandbox.docker.env` (ou por agente `agents.list[].sandbox.docker.env`)
- incorpore o env na sua imagem de sandbox personalizada

`env` global e `skills.entries.<skill>.env/apiKey` se aplicam apenas a execuções no **host**.
