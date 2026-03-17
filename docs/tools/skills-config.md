---
summary: "Schema e exemplos de config de Skills"
read_when:
  - Adicionando ou modificando config de Skills
  - Ajustando allowlist de bundled ou comportamento de instalação
title: "Config de Skills"
---

# Config de Skills

Toda configuração relacionada a Skills fica em `skills` no `~/.editzffaleta/OpenCraft.json`.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto simples
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

## Campos

- `allowBundled`: allowlist opcional apenas para Skills **integradas**. Quando definida, apenas
  Skills integradas na lista são elegíveis (Skills gerenciadas/do workspace não são afetadas).
- `load.extraDirs`: diretórios adicionais de Skills para escanear (menor precedência).
- `load.watch`: observar pastas de Skills e atualizar o snapshot de Skills (padrão: true).
- `load.watchDebounceMs`: debounce para eventos do observador de Skills em milissegundos (padrão: 250).
- `install.preferBrew`: preferir instaladores brew quando disponíveis (padrão: true).
- `install.nodeManager`: preferência de instalador node (`npm` | `pnpm` | `yarn` | `bun`, padrão: npm).
  Isso afeta apenas **instalações de Skills**; o runtime do Gateway ainda deve ser Node
  (Bun não recomendado para WhatsApp/Telegram).
- `entries.<skillKey>`: substituições por Skill.

Campos por Skill:

- `enabled`: defina `false` para desabilitar uma Skill mesmo se estiver integrada/instalada.
- `env`: variáveis de ambiente injetadas para a execução do agente (apenas se ainda não definidas).
- `apiKey`: conveniência opcional para Skills que declaram uma variável de ambiente principal.
  Suporta string em texto simples ou objeto SecretRef (`{ source, provider, id }`).

## Notas

- Chaves em `entries` mapeiam para o nome da Skill por padrão. Se uma Skill definir
  `metadata.opencraft.skillKey`, use essa chave em vez disso.
- Alterações nas Skills são captadas no próximo turno do agente quando o observador está habilitado.

### Skills em sandbox + variáveis de ambiente

Quando uma sessão está em **sandbox**, processos de Skills rodam dentro do Docker. O sandbox
**não** herda o `process.env` do host.

Use uma das opções:

- `agents.defaults.sandbox.docker.env` (ou por agente `agents.list[].sandbox.docker.env`)
- incorpore o env na sua imagem personalizada de sandbox

`env` global e `skills.entries.<skill>.env/apiKey` se aplicam apenas a execuções no **host**.
