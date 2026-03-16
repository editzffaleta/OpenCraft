---
summary: "Usar catálogos OpenCode Zen e Go com o OpenCraft"
read_when:
  - Você quer acesso a modelos hospedados pelo OpenCode
  - Você quer escolher entre os catálogos Zen e Go
title: "OpenCode"
---

# OpenCode

O OpenCode expõe dois catálogos hospedados no OpenCraft:

- `opencode/...` para o catálogo **Zen**
- `opencode-go/...` para o catálogo **Go**

Ambos os catálogos usam a mesma chave de API do OpenCode. O OpenCraft mantém os IDs de provedor em runtime
separados para que o roteamento upstream por modelo permaneça correto, mas o onboarding e os docs os tratam
como uma única configuração do OpenCode.

## Configuração CLI

### Catálogo Zen

```bash
opencraft onboard --auth-choice opencode-zen
opencraft onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Catálogo Go

```bash
opencraft onboard --auth-choice opencode-go
opencraft onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Trecho de config

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catálogos

### Zen

- Provedor em runtime: `opencode`
- Exemplos de modelos: `opencode/claude-opus-4-6`, `opencode/gpt-5.2`, `opencode/gemini-3-pro`
- Melhor quando você quer o proxy multi-modelo curado do OpenCode

### Go

- Provedor em runtime: `opencode-go`
- Exemplos de modelos: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Melhor quando você quer a linha Kimi/GLM/MiniMax hospedada pelo OpenCode

## Notas

- `OPENCODE_ZEN_API_KEY` também é suportado.
- Inserir uma chave OpenCode durante o onboarding armazena credenciais para ambos os provedores em runtime.
- Você faz login no OpenCode, adiciona dados de cobrança e copia sua chave de API.
- Cobrança e disponibilidade de catálogo são gerenciados pelo dashboard do OpenCode.
