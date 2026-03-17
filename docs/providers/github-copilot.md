---
summary: "Faça login no GitHub Copilot a partir do OpenCraft usando o fluxo de dispositivo"
read_when:
  - Você quer usar o GitHub Copilot como provider de modelo
  - Você precisa do fluxo `opencraft models auth login-github-copilot`
title: "GitHub Copilot"
---

# GitHub Copilot

## O que é o GitHub Copilot?

O GitHub Copilot é o assistente de codificação com IA do GitHub. Ele fornece acesso a modelos
do Copilot para sua conta e plano do GitHub. O OpenCraft pode usar o Copilot como provider
de modelo de duas formas diferentes.

## Duas formas de usar o Copilot no OpenCraft

### 1) Provider GitHub Copilot integrado (`github-copilot`)

Use o fluxo nativo de login por dispositivo para obter um token do GitHub, depois troque-o por
tokens da API do Copilot quando o OpenCraft executar. Este é o caminho **padrão** e mais simples
porque não requer o VS Code.

### 2) Plugin Copilot Proxy (`copilot-proxy`)

Use a extensão **Copilot Proxy** do VS Code como ponte local. O OpenCraft se comunica com
o endpoint `/v1` do proxy e usa a lista de modelos que você configura lá. Escolha
esta opção quando você já executa o Copilot Proxy no VS Code ou precisa rotear através dele.
Você deve habilitar o plugin e manter a extensão do VS Code em execução.

Use o GitHub Copilot como provider de modelo (`github-copilot`). O comando de login executa
o fluxo de dispositivo do GitHub, salva um perfil de autenticação e atualiza sua configuração para usar aquele
perfil.

## Configuração via CLI

```bash
opencraft models auth login-github-copilot
```

Você será solicitado a visitar uma URL e inserir um código único. Mantenha o terminal
aberto até que seja concluído.

### Flags opcionais

```bash
opencraft models auth login-github-copilot --profile-id github-copilot:work
opencraft models auth login-github-copilot --yes
```

## Definir um modelo padrão

```bash
opencraft models set github-copilot/gpt-4o
```

### Trecho de configuração

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Notas

- Requer um TTY interativo; execute diretamente em um terminal.
- A disponibilidade de modelos do Copilot depende do seu plano; se um modelo for rejeitado, tente
  outro ID (por exemplo `github-copilot/gpt-4.1`).
- O login armazena um token do GitHub no repositório de perfis de autenticação e o troca por um
  token da API do Copilot quando o OpenCraft executa.
