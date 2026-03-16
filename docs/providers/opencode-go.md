---
summary: "Usar o catálogo OpenCode Go com a configuração compartilhada do OpenCode"
read_when:
  - Você quer o catálogo OpenCode Go
  - Você precisa das refs de modelo em runtime para modelos hospedados pelo Go
title: "OpenCode Go"
---

# OpenCode Go

O OpenCode Go é o catálogo Go dentro do [OpenCode](/providers/opencode).
Usa a mesma `OPENCODE_API_KEY` que o catálogo Zen, mas mantém o ID de provedor
em runtime `opencode-go` para que o roteamento upstream por modelo permaneça correto.

## Modelos suportados

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## Configuração CLI

```bash
opencraft onboard --auth-choice opencode-go
# ou não-interativo
opencraft onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Trecho de config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Comportamento de roteamento

O OpenCraft cuida do roteamento por modelo automaticamente quando a ref de modelo usa `opencode-go/...`.

## Notas

- Use [OpenCode](/providers/opencode) para o onboarding compartilhado e visão geral do catálogo.
- Refs em runtime permanecem explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
