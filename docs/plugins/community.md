---
summary: "Plugins da comunidade: barra de qualidade, requisitos de hospedagem e caminho de submissão via PR"
read_when:
  - Você quer publicar um Plugin de terceiros para o OpenCraft
  - Você quer propor um Plugin para listagem na documentação
title: "Community plugins"
---

# Plugins da comunidade

Esta página rastreia **Plugins mantidos pela comunidade** de alta qualidade para o OpenCraft.

Aceitamos PRs que adicionam Plugins da comunidade aqui quando atendem a barra de qualidade.

## Requisitos para listagem

- O pacote do Plugin está publicado no npmjs (instalável via `opencraft plugins install <npm-spec>`).
- O código-fonte está hospedado no GitHub (repositório público).
- O repositório inclui documentação de configuração/uso e um rastreador de issues.
- O Plugin tem um sinal claro de manutenção (mantenedor ativo, atualizações recentes ou tratamento responsivo de issues).

## Como submeter

Abra um PR que adicione seu Plugin a esta página com:

- Nome do Plugin
- Nome do pacote npm
- URL do repositório no GitHub
- Descrição em uma linha
- Comando de instalação

## Barra de revisão

Preferimos Plugins que sejam úteis, documentados e seguros para operar.
Wrappers de baixo esforço, propriedade incerta ou pacotes sem manutenção podem ser recusados.

## Formato de candidato

Use este formato ao adicionar entradas:

- **Nome do Plugin** — breve descrição
  npm: `@scope/package`
  repo: `https://github.com/org/repo`
  install: `opencraft plugins install @scope/package`

## Plugins listados

- **WeChat** — Conecte o OpenCraft a contas pessoais do WeChat via WeChatPadPro (protocolo iPad). Suporta troca de texto, imagem e arquivo com conversas ativadas por palavra-chave.
  npm: `@icesword760/opencraft-wechat`
  repo: `https://github.com/icesword0760/opencraft-wechat`
  install: `opencraft plugins install @icesword760/opencraft-wechat`
