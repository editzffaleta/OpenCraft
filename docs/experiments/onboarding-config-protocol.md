---
summary: "Notas do protocolo RPC para o assistente de onboarding e esquema de configuração"
read_when: "Alterando etapas do assistente de onboarding ou endpoints do esquema de configuração"
title: "Protocolo de Onboarding e Configuração"
---

# Protocolo de Onboarding + Configuração

Objetivo: superfícies compartilhadas de onboarding + configuração entre CLI, aplicativo macOS e interface Web.

## Componentes

- Motor do assistente (sessão compartilhada + prompts + estado de onboarding).
- O onboarding via CLI usa o mesmo fluxo do assistente que os clientes de interface.
- O RPC do gateway expõe endpoints do assistente + esquema de configuração.
- O onboarding no macOS usa o modelo de etapas do assistente.
- A interface Web renderiza formulários de configuração a partir do JSON Schema + dicas de interface.

## RPC do Gateway

- `wizard.start` parâmetros: `{ mode?: "local"|"remote", workspace?: string }`
- `wizard.next` parâmetros: `{ sessionId, answer?: { stepId, value? } }`
- `wizard.cancel` parâmetros: `{ sessionId }`
- `wizard.status` parâmetros: `{ sessionId }`
- `config.schema` parâmetros: `{}`
- `config.schema.lookup` parâmetros: `{ path }`
  - `path` aceita segmentos de configuração padrão mais IDs de plugin delimitados por barra, por exemplo `plugins.entries.pack/one.config`.

Respostas (formato)

- Assistente: `{ sessionId, done, step?, status?, error? }`
- Esquema de configuração: `{ schema, uiHints, version, generatedAt }`
- Lookup de esquema de configuração: `{ path, schema, hint?, hintPath?, children[] }`

## Dicas de Interface

- `uiHints` com chave por caminho; metadados opcionais (label/help/group/order/advanced/sensitive/placeholder).
- Campos sensíveis são renderizados como entradas de senha; sem camada de redação.
- Nós de esquema não suportados recorrem ao editor JSON bruto.

## Notas

- Este documento é o único lugar para rastrear refatorações de protocolo para onboarding/configuração.
