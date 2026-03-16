---
summary: "Escreva tools de agente em um plugin (schemas, tools opcionais, allowlists)"
read_when:
  - Você quer adicionar uma nova tool de agente em um plugin
  - Você precisa tornar uma tool opt-in via allowlists
title: "Tools de Agente de Plugin"
---

# Tools de agente de plugin

Plugins do OpenCraft podem registrar **tools de agente** (funções com JSON Schema) que são expostas
ao LLM durante execuções de agente. Tools podem ser **obrigatórias** (sempre disponíveis) ou
**opcionais** (opt-in).

Tools de agente são configuradas em `tools` na config principal, ou por agente em
`agents.list[].tools`. A política de allowlist/denylist controla quais tools o agente
pode chamar.

## Tool básica

```ts
import { Type } from "@sinclair/typebox";

export default function (api) {
  api.registerTool({
    name: "my_tool",
    description: "Fazer algo",
    parameters: Type.Object({
      input: Type.String(),
    }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });
}
```

## Tool opcional (opt-in)

Tools opcionais **nunca** são habilitadas automaticamente. Usuários devem adicioná-las a uma
allowlist de agente.

```ts
export default function (api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Rodar um workflow local",
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

Habilitar tools opcionais em `agents.list[].tools.allow` (ou `tools.allow` global):

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: [
            "workflow_tool", // nome específico da tool
            "workflow", // id do plugin (habilita todas as tools daquele plugin)
            "group:plugins", // todas as tools de plugin
          ],
        },
      },
    ],
  },
}
```

Outros ajustes de config que afetam a disponibilidade de tools:

- Allowlists que nomeiam apenas tools de plugin são tratadas como opt-ins de plugin; tools principais permanecem
  habilitadas a menos que você inclua também tools ou grupos principais na allowlist.
- `tools.profile` / `agents.list[].tools.profile` (allowlist base)
- `tools.byProvider` / `agents.list[].tools.byProvider` (allow/deny específico por provedor)
- `tools.sandbox.tools.*` (política de tool de sandbox quando em sandbox)

## Regras + dicas

- Nomes de tool **não devem** colidir com nomes de tools principais; tools conflitantes são ignoradas.
- Ids de plugin usados em allowlists não devem colidir com nomes de tools principais.
- Prefira `optional: true` para tools que acionam efeitos colaterais ou requerem
  binários/credenciais extras.
