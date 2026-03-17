---
summary: "Exploração: configuração de modelo, perfis de autenticação e comportamento de fallback"
read_when:
  - Explorando futuras ideias de seleção de modelo + perfil de autenticação
title: "Model Config Exploration"
---

# Configuração de Modelo (Exploração)

Este documento captura **ideias** para futura configuração de modelo. Não é uma
especificação para envio. Para o comportamento atual, veja:

- [Modelos](/concepts/models)
- [Failover de modelo](/concepts/model-failover)
- [OAuth + perfis](/concepts/oauth)

## Motivação

Operadores querem:

- Múltiplos perfis de autenticação por provedor (pessoal vs trabalho).
- Seleção simples via `/model` com fallbacks previsíveis.
- Separação clara entre modelos de texto e modelos com capacidade de imagem.

## Possível direção (alto nível)

- Manter seleção de modelo simples: `provedor/modelo` com aliases opcionais.
- Permitir que provedores tenham múltiplos perfis de autenticação, com uma ordem explícita.
- Usar uma lista de fallback global para que todas as sessões façam failover consistentemente.
- Sobrescrever roteamento de imagem somente quando explicitamente configurado.

## Perguntas em aberto

- Rotação de perfil deve ser por provedor ou por modelo?
- Como a interface deve apresentar seleção de perfil para uma sessão?
- Qual é o caminho de migração mais seguro a partir de chaves de configuração legadas?
