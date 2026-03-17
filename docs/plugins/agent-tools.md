---
summary: "Escreva ferramentas de agente em um Plugin (schemas, ferramentas opcionais, allowlists)"
read_when:
  - Você quer adicionar uma nova ferramenta de agente em um Plugin
  - Você precisa tornar uma ferramenta opt-in via allowlists
title: "Plugin Agent Tools"
---

# Ferramentas de agente em Plugin

Plugins do OpenCraft podem registrar **ferramentas de agente** (funções com schema JSON) que são expostas
ao LLM durante execuções do agente. Ferramentas podem ser **obrigatórias** (sempre disponíveis) ou
**opcionais** (opt-in).

Ferramentas de agente são configuradas em `tools` no config principal, ou por agente em
`agents.list[].tools`. A política de allowlist/denylist controla quais ferramentas o agente
pode chamar.

## Ferramenta básica

```ts
import { Type } from "@sinclair/typebox";

export default function (api) {
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({
      input: Type.String(),
    }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });
}
```

## Ferramenta opcional (opt-in)

Ferramentas opcionais **nunca** são habilitadas automaticamente. Os usuários devem adicioná-las a uma
allowlist de agente.

```ts
export default function (api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a local workflow",
      parameters: {
        type: "object",
        properties: {
          pipeline: { type: "string" },
        },
        required: ["pipeline"],
      },
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Habilite ferramentas opcionais em `agents.list[].tools.allow` (ou global `tools.allow`):

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: [
            "workflow_tool", // nome específico da ferramenta
            "workflow", // id do Plugin (habilita todas as ferramentas daquele Plugin)
            "group:plugins", // todas as ferramentas de Plugin
          ],
        },
      },
    ],
  },
}
```

Outras opções de config que afetam a disponibilidade de ferramentas:

- Allowlists que nomeiam apenas ferramentas de Plugin são tratadas como opt-ins de Plugin; ferramentas core permanecem
  habilitadas a menos que você também inclua ferramentas ou grupos core na allowlist.
- `tools.profile` / `agents.list[].tools.profile` (allowlist base)
- `tools.byProvider` / `agents.list[].tools.byProvider` (allow/deny específico por provedor)
- `tools.sandbox.tools.*` (política de ferramentas sandbox quando em sandbox)

## Regras + dicas

- Nomes de ferramentas **não** devem conflitar com nomes de ferramentas core; ferramentas conflitantes são ignoradas.
- IDs de Plugin usados em allowlists não devem conflitar com nomes de ferramentas core.
- Prefira `optional: true` para ferramentas que disparam efeitos colaterais ou requerem
  binários/credenciais extras.
