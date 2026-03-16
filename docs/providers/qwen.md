---
summary: "Usar Qwen OAuth (tier gratuito) no OpenCraft"
read_when:
  - Você quer usar Qwen com o OpenCraft
  - Você quer acesso OAuth gratuito ao Qwen Coder
title: "Qwen"
---

# Qwen

O Qwen fornece um fluxo OAuth de tier gratuito para modelos Qwen Coder e Qwen Vision
(2.000 requisições/dia, sujeito aos limites de taxa do Qwen).

## Habilitar o plugin

```bash
opencraft plugins enable qwen-portal-auth
```

Reinicie o Gateway após habilitar.

## Autenticar

```bash
opencraft models auth login --provider qwen-portal --set-default
```

Isso executa o fluxo OAuth de device-code do Qwen e escreve uma entrada de provedor no seu
`models.json` (mais um alias `qwen` para troca rápida).

## IDs de modelo

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

Troque modelos com:

```bash
opencraft models set qwen-portal/coder-model
```

## Reutilizar login do Qwen Code CLI

Se você já fez login com o Qwen Code CLI, o OpenCraft sincronizará credenciais
de `~/.qwen/oauth_creds.json` ao carregar o auth store. Você ainda precisa de uma
entrada `models.providers.qwen-portal` (use o comando de login acima para criar uma).

## Notas

- Tokens são auto-renovados; re-execute o comando de login se a renovação falhar ou o acesso for revogado.
- URL base padrão: `https://portal.qwen.ai/v1` (sobrescreva com
  `models.providers.qwen-portal.baseUrl` se o Qwen fornecer um endpoint diferente).
- Veja [Provedores de modelo](/concepts/model-providers) para regras gerais de provedor.
