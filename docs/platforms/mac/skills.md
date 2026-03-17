---
summary: "UI de configurações de Skills do macOS e status baseado no Gateway"
read_when:
  - Atualizando a UI de configurações de Skills do macOS
  - Alterando comportamento de restrição ou instalação de Skills
title: "Skills"
---

# Skills (macOS)

O aplicativo macOS exibe as Skills do OpenCraft via Gateway; ele não analisa as Skills localmente.

## Fonte de dados

- `skills.status` (Gateway) retorna todas as Skills mais elegibilidade e requisitos ausentes
  (incluindo bloqueios de lista de permissão para Skills integradas).
- Os requisitos são derivados de `metadata.opencraft.requires` em cada `SKILL.md`.

## Ações de instalação

- `metadata.opencraft.install` define as opções de instalação (brew/node/go/uv).
- O aplicativo chama `skills.install` para executar instaladores no host do Gateway.
- O Gateway exibe apenas um instalador preferido quando múltiplos são fornecidos
  (brew quando disponível, caso contrário gerenciador de nó de `skills.install`, padrão npm).

## Env/chaves API

- O aplicativo armazena chaves em `~/.editzffaleta/OpenCraft.json` em `skills.entries.<skillKey>`.
- `skills.update` atualiza `enabled`, `apiKey` e `env`.

## Modo remoto

- Instalação + atualizações de configuração acontecem no host do Gateway (não no Mac local).
