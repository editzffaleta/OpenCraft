---
summary: "Fazer login no GitHub Copilot pelo OpenCraft usando o fluxo de dispositivo"
read_when:
  - Você quer usar GitHub Copilot como provedor de modelo
  - Você precisa do fluxo `opencraft models auth login-github-copilot`
title: "GitHub Copilot"
---

# GitHub Copilot

## O que é GitHub Copilot?

O GitHub Copilot é o assistente de código de IA do GitHub. Fornece acesso a modelos
Copilot para sua conta e plano do GitHub. O OpenCraft pode usar o Copilot como provedor
de modelo de duas formas diferentes.

## Duas formas de usar o Copilot no OpenCraft

### 1) Provedor GitHub Copilot nativo (`github-copilot`)

Use o fluxo de login de dispositivo nativo para obter um token GitHub, depois troque-o por
tokens da API Copilot quando o OpenCraft rodar. Este é o caminho **padrão** e mais simples
porque não requer VS Code.

### 2) Plugin Copilot Proxy (`copilot-proxy`)

Use a extensão VS Code **Copilot Proxy** como uma ponte local. O OpenCraft fala com o
endpoint `/v1` do proxy e usa a lista de modelos que você configura lá. Escolha esta opção
quando já rodar o Copilot Proxy no VS Code ou precisar rotear por ele.
Você deve habilitar o plugin e manter a extensão VS Code rodando.

Use o GitHub Copilot como provedor de modelo (`github-copilot`). O comando de login executa
o fluxo de dispositivo do GitHub, salva um perfil de auth e atualiza sua config para usar
esse perfil.

## Configuração CLI

```bash
opencraft models auth login-github-copilot
```

Você será solicitado a visitar uma URL e inserir um código de uso único. Mantenha o terminal
aberto até concluir.

### Flags opcionais

```bash
opencraft models auth login-github-copilot --profile-id github-copilot:work
opencraft models auth login-github-copilot --yes
```

## Definir um modelo padrão

```bash
opencraft models set github-copilot/gpt-4o
```

### Trecho de config

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Notas

- Requer um TTY interativo; execute diretamente em um terminal.
- A disponibilidade de modelos Copilot depende do seu plano; se um modelo for rejeitado, tente
  outro ID (por exemplo `github-copilot/gpt-4.1`).
- O login armazena um token GitHub no store de perfis de auth e o troca por um token da API
  Copilot quando o OpenCraft roda.
