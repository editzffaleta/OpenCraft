---
summary: "Exploração: configuração de modelo, perfis de autenticação e comportamento de fallback"
read_when:
  - Explorando ideias futuras de seleção de modelo + perfis de autenticação
title: "Exploração de Configuração de Modelo"
---

# Configuração de Modelo (Exploração)

Este documento captura **ideias** para configuração futura de modelo. Não é uma
especificação para publicação. Para o comportamento atual, veja:

- [Modelos](/concepts/models)
- [Failover de modelo](/concepts/model-failover)
- [OAuth + perfis](/concepts/oauth)

## Motivação

Os operadores querem:

- Múltiplos perfis de autenticação por provedor (pessoal vs trabalho).
- Seleção simples de `/model` com fallbacks previsíveis.
- Separação clara entre modelos de texto e modelos com capacidade de imagem.

## Direção possível (visão geral)

- Manter a seleção de modelo simples: `provider/model` com aliases opcionais.
- Permitir que provedores tenham múltiplos perfis de autenticação, com ordem explícita.
- Usar uma lista de fallback global para que todas as sessões façam failover de forma consistente.
- Substituir roteamento de imagem apenas quando explicitamente configurado.

## Questões em aberto

- A rotação de perfil deve ser por provedor ou por modelo?
- Como a interface deve apresentar a seleção de perfil para uma sessão?
- Qual é o caminho de migração mais seguro a partir das chaves de configuração legadas?
