---
summary: "Use o catálogo OpenCode Go com a configuração compartilhada do OpenCode"
read_when:
  - Você quer o catálogo OpenCode Go
  - Você precisa das referências de modelo em tempo de execução para modelos hospedados via Go
title: "OpenCode Go"
---

# OpenCode Go

OpenCode Go é o catálogo Go dentro do [OpenCode](/providers/opencode).
Ele usa a mesma `OPENCODE_API_KEY` que o catálogo Zen, mas mantém o
id de provider em tempo de execução `opencode-go` para que o roteamento por modelo do upstream permaneça correto.

## Modelos suportados

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## Configuração via CLI

```bash
opencraft onboard --auth-choice opencode-go
# ou não interativo
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

O OpenCraft trata o roteamento por modelo automaticamente quando a referência de modelo usa `opencode-go/...`.

## Notas

- Use [OpenCode](/providers/opencode) para o onboarding compartilhado e visão geral do catálogo.
- As referências em tempo de execução permanecem explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
