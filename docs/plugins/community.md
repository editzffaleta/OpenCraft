---
summary: "Plugins da comunidade: barra de qualidade, requisitos de hospedagem e caminho de submissão de PR"
read_when:
  - Você quer publicar um plugin OpenCraft de terceiros
  - Você quer propor um plugin para listagem na documentação
title: "Plugins da Comunidade"
---

# Plugins da Comunidade

Esta página acompanha **plugins mantidos pela comunidade** de alta qualidade para o OpenCraft.

Aceitamos PRs que adicionam plugins da comunidade aqui quando eles atingem a barra de qualidade.

## Requisitos para listagem

- O pacote do plugin está publicado no npmjs (instalável via `opencraft plugins install <npm-spec>`).
- O código-fonte está hospedado no GitHub (repositório público).
- O repositório inclui docs de configuração/uso e um rastreador de issues.
- O plugin tem um sinal claro de manutenção (mantenedor ativo, atualizações recentes ou tratamento responsivo de issues).

## Como submeter

Abra um PR que adicione seu plugin a esta página com:

- Nome do plugin
- Nome do pacote npm
- URL do repositório GitHub
- Descrição em uma linha
- Comando de instalação

## Barra de revisão

Preferimos plugins que sejam úteis, documentados e seguros de operar.
Wrappers de baixo esforço, propriedade pouco clara ou pacotes sem manutenção podem ser recusados.

## Formato de candidato

Use este formato ao adicionar entradas:

- **Nome do Plugin** — descrição curta
  npm: `@scope/pacote`
  repo: `https://github.com/org/repo`
  install: `opencraft plugins install @scope/pacote`

## Plugins listados

- **WeChat** — Conecte o OpenCraft ao WeChat pessoal via WeChatPadPro (protocolo iPad). Suporta troca de texto, imagem e arquivo com conversas acionadas por palavra-chave.
  npm: `@icesword760/openclaw-wechat`
  repo: `https://github.com/icesword0760/openclaw-wechat`
  install: `opencraft plugins install @icesword760/openclaw-wechat`
