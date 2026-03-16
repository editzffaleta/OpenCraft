---
summary: "OAuth no OpenCraft: troca de token, armazenamento e padrões multi-conta"
read_when:
  - Você quer entender o OAuth do OpenCraft de ponta a ponta
  - Você teve problemas de invalidação de token / logout
  - Você quer fluxos de auth por setup-token ou OAuth
  - Você quer múltiplas contas ou roteamento de perfil
title: "OAuth"
---

# OAuth

O OpenCraft suporta "auth de assinatura" via OAuth para provedores que o oferecem (notavelmente **OpenAI Codex (ChatGPT OAuth)**). Para assinaturas Anthropic, use o fluxo de **setup-token**. O uso de assinatura Anthropic fora do Claude Code foi restrito para alguns usuários no passado, então trate como um risco de escolha do usuário e verifique você mesmo a política atual da Anthropic. O OAuth do OpenAI Codex é explicitamente suportado para uso em ferramentas externas como o OpenCraft. Esta página explica:

Para Anthropic em produção, auth por chave de API é o caminho mais seguro e recomendado em vez do auth por setup-token de assinatura.

- como o **intercâmbio de token** OAuth funciona (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **múltiplas contas** (perfis + overrides por sessão)

O OpenCraft também suporta **plugins de provedor** que vêm com seus próprios fluxos OAuth ou de chave de API.
Rode-os via:

```bash
opencraft models auth login --provider <id>
```

## O sink de token (por que ele existe)

Provedores OAuth comumente cunham um **novo token de atualização** durante fluxos de login/atualização. Alguns provedores (ou clientes OAuth) podem invalidar tokens de atualização mais antigos quando um novo é emitido para o mesmo usuário/app.

Sintoma prático:

- você faz login via OpenCraft _e_ via Claude Code / Codex CLI → um deles aleatoriamente fica "deslogado" depois

Para reduzir isso, o OpenCraft trata `auth-profiles.json` como um **sink de token**:

- o runtime lê credenciais de **um lugar**
- podemos manter múltiplos perfis e roteá-los deterministicamente

## Armazenamento (onde os tokens ficam)

Segredos são armazenados **por agente**:

- Perfis de auth (OAuth + chaves de API + refs opcionais de nível de valor): `~/.opencraft/agents/<agentId>/agent/auth-profiles.json`
- Arquivo de compatibilidade legado: `~/.opencraft/agents/<agentId>/agent/auth.json`
  (entradas `api_key` estáticas são removidas quando descobertas)

Arquivo legado somente para importação (ainda suportado, mas não o armazenamento principal):

- `~/.opencraft/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso)

Todos os acima também respeitam `$OPENCLAW_STATE_DIR` (override de diretório de estado). Referência completa: [/gateway/configuration](/gateway/configuration#auth-storage-oauth--api-keys)

Para refs de segredo estáticas e comportamento de ativação de snapshot de runtime, veja [Gerenciamento de Segredos](/gateway/secrets).

## Anthropic setup-token (auth de assinatura)

<Warning>
O suporte ao setup-token Anthropic é compatibilidade técnica, não uma garantia de política.
A Anthropic bloqueou alguns usos de assinatura fora do Claude Code no passado.
Decida você mesmo se usa auth de assinatura e verifique os termos atuais da Anthropic.
</Warning>

Rode `claude setup-token` em qualquer máquina, depois cole no OpenCraft:

```bash
opencraft models auth setup-token --provider anthropic
```

Se você gerou o token em outro lugar, cole-o manualmente:

```bash
opencraft models auth paste-token --provider anthropic
```

Verifique:

```bash
opencraft models status
```

## Intercâmbio OAuth (como o login funciona)

Os fluxos de login interativo do OpenCraft são implementados em `@mariozechner/pi-ai` e conectados nos assistentes/comandos.

### Anthropic setup-token

Formato do fluxo:

1. rode `claude setup-token`
2. cole o token no OpenCraft
3. armazene como um perfil de auth de token (sem atualização)

O caminho do assistente é `opencraft onboard` → escolha de auth `setup-token` (Anthropic).

### OpenAI Codex (ChatGPT OAuth)

O OAuth do OpenAI Codex é explicitamente suportado para uso fora do CLI do Codex, incluindo fluxos do OpenCraft.

Formato do fluxo (PKCE):

1. gerar verificador/desafio PKCE + `state` aleatório
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. tentar capturar callback em `http://127.0.0.1:1455/auth/callback`
4. se callback não puder vincular (ou você estiver remoto/headless), colar a URL de redirecionamento/código
5. trocar em `https://auth.openai.com/oauth/token`
6. extrair `accountId` do token de acesso e armazenar `{ access, refresh, expires, accountId }`

Caminho do assistente é `opencraft onboard` → escolha de auth `openai-codex`.

## Atualização + expiração

Perfis armazenam um timestamp `expires`.

Em runtime:

- se `expires` estiver no futuro → use o token de acesso armazenado
- se expirado → atualize (sob um file lock) e sobrescreva as credenciais armazenadas

O fluxo de atualização é automático; geralmente você não precisa gerenciar tokens manualmente.

## Múltiplas contas (perfis) + roteamento

Dois padrões:

### 1) Preferido: agentes separados

Se você quer que "personal" e "work" nunca interajam, use agentes isolados (sessões + credenciais + workspace separados):

```bash
opencraft agents add work
opencraft agents add personal
```

Depois configure auth por agente (assistente) e roteie chats para o agente correto.

### 2) Avançado: múltiplos perfis em um agente

`auth-profiles.json` suporta múltiplos IDs de perfil para o mesmo provedor.

Escolha qual perfil é usado:

- globalmente via ordenação de config (`auth.order`)
- por sessão via `/model ...@<profileId>`

Exemplo (override de sessão):

- `/model Opus@anthropic:work`

Como ver quais IDs de perfil existem:

- `opencraft channels list --json` (mostra `auth[]`)

Docs relacionados:

- [/concepts/model-failover](/concepts/model-failover) (regras de rotação + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (superfície de comando)
