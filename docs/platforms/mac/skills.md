---
summary: "UI de configurações de Skills do macOS e status respaldado pelo gateway"
read_when:
  - Atualizando a UI de configurações de Skills do macOS
  - Alterando o controle de acesso ou comportamento de instalação de skills
title: "Skills"
---

# Skills (macOS)

O app macOS expõe as skills do OpenCraft via o gateway; não analisa as skills localmente.

## Fonte de dados

- `skills.status` (gateway) retorna todas as skills além de elegibilidade e requisitos ausentes
  (incluindo bloqueios de allowlist para skills embutidas).
- Os requisitos são derivados de `metadata.openclaw.requires` em cada `SKILL.md`.

## Ações de instalação

- `metadata.openclaw.install` define opções de instalação (brew/node/go/uv).
- O app chama `skills.install` para executar instaladores no host do gateway.
- O gateway expõe apenas um instalador preferido quando múltiplos são fornecidos
  (brew quando disponível, caso contrário gerenciador de node de `skills.install`, padrão npm).

## Env/chaves de API

- O app armazena chaves em `~/.opencraft/opencraft.json` sob `skills.entries.<skillKey>`.
- `skills.update` atualiza `enabled`, `apiKey` e `env`.

## Modo remoto

- Atualizações de instalação + configuração acontecem no host do gateway (não no Mac local).
