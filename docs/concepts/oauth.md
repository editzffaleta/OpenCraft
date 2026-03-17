---
summary: "OAuth no OpenCraft: troca de Token, armazenamento e padroes multi-conta"
read_when:
  - Voce quer entender o OAuth do OpenCraft de ponta a ponta
  - Voce encontrou problemas de invalidacao de Token / logout
  - Voce quer fluxos de autenticacao setup-token ou OAuth
  - Voce quer multiplas contas ou roteamento de perfis
title: "OAuth"
---

# OAuth

O OpenCraft suporta "autenticacao por assinatura" via OAuth para provedores que oferecem isso (notavelmente **OpenAI Codex (ChatGPT OAuth)**). Para assinaturas Anthropic, use o fluxo de **setup-token**. O uso de assinatura Anthropic fora do Claude Code foi restrito para alguns usuarios no passado, entao trate como um risco por escolha do usuario e verifique a politica atual da Anthropic voce mesmo. O OAuth do OpenAI Codex e explicitamente suportado para uso em ferramentas externas como o OpenCraft. Esta pagina explica:

Para Anthropic em producao, a autenticacao por chave de API e o caminho mais seguro e recomendado em relacao a autenticacao por setup-token de assinatura.

- como a **troca de Token** OAuth funciona (PKCE)
- onde os Token sao **armazenados** (e por que)
- como lidar com **multiplas contas** (perfis + substituicoes por sessao)

O OpenCraft tambem suporta **Plugin de provedor** que incluem seus proprios fluxos de
OAuth ou chave de API. Execute-os via:

```bash
opencraft models auth login --provider <id>
```

## O receptaculo de Token (por que ele existe)

Provedores OAuth comumente geram um **novo refresh Token** durante fluxos de login/renovacao. Alguns provedores (ou clientes OAuth) podem invalidar refresh Token mais antigos quando um novo e emitido para o mesmo usuario/aplicativo.

Sintoma pratico:

- voce faz login via OpenCraft _e_ via Claude Code / Codex CLI → um deles aleatoriamente e "deslogado" depois

Para reduzir isso, o OpenCraft trata `auth-profiles.json` como um **receptaculo de Token**:

- o runtime le credenciais de **um unico lugar**
- podemos manter multiplos perfis e rotea-los deterministicamente

## Armazenamento (onde os Token ficam)

Os segredos sao armazenados **por agente**:

- Perfis de autenticacao (OAuth + chaves de API + refs opcionais em nivel de valor): `~/.opencraft/agents/<agentId>/agent/auth-profiles.json`
- Arquivo de compatibilidade legado: `~/.opencraft/agents/<agentId>/agent/auth.json`
  (entradas estaticas `api_key` sao removidas quando descobertas)

Arquivo legado somente para importacao (ainda suportado, mas nao e o armazenamento principal):

- `~/.opencraft/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso)

Todos os acima tambem respeitam `$OPENCRAFT_STATE_DIR` (substituicao do diretorio de estado). Referencia completa: [/gateway/configuration](/gateway/configuration#auth-storage-oauth--api-keys)

Para refs de segredos estaticos e comportamento de ativacao de snapshot de runtime, veja [Gerenciamento de Segredos](/gateway/secrets).

## Setup-token Anthropic (autenticacao por assinatura)

<Warning>
O suporte a setup-token Anthropic e compatibilidade tecnica, nao uma garantia de politica.
A Anthropic bloqueou alguns usos de assinatura fora do Claude Code no passado.
Decida voce mesmo se quer usar autenticacao por assinatura e verifique os termos atuais da Anthropic.
</Warning>

Execute `claude setup-token` em qualquer maquina, depois cole no OpenCraft:

```bash
opencraft models auth setup-token --provider anthropic
```

Se voce gerou o Token em outro lugar, cole-o manualmente:

```bash
opencraft models auth paste-token --provider anthropic
```

Verifique:

```bash
opencraft models status
```

## Troca OAuth (como o login funciona)

Os fluxos de login interativo do OpenCraft sao implementados em `@mariozechner/pi-ai` e conectados aos assistentes/comandos.

### Setup-token Anthropic

Formato do fluxo:

1. execute `claude setup-token`
2. cole o Token no OpenCraft
3. armazene como um perfil de autenticacao por Token (sem renovacao)

O caminho pelo assistente e `opencraft onboard` → escolha de autenticacao `setup-token` (Anthropic).

### OpenAI Codex (ChatGPT OAuth)

O OAuth do OpenAI Codex e explicitamente suportado para uso fora do Codex CLI, incluindo fluxos de trabalho do OpenCraft.

Formato do fluxo (PKCE):

1. gere verificador/desafio PKCE + `state` aleatorio
2. abra `https://auth.openai.com/oauth/authorize?...`
3. tente capturar o callback em `http://127.0.0.1:1455/auth/callback`
4. se o callback nao conseguir vincular (ou voce estiver remoto/headless), cole a URL/codigo de redirecionamento
5. troque em `https://auth.openai.com/oauth/token`
6. extraia `accountId` do Token de acesso e armazene `{ access, refresh, expires, accountId }`

O caminho pelo assistente e `opencraft onboard` → escolha de autenticacao `openai-codex`.

## Renovacao + expiracao

Os perfis armazenam um timestamp `expires`.

Em tempo de execucao:

- se `expires` esta no futuro → use o Token de acesso armazenado
- se expirado → renove (sob um bloqueio de arquivo) e substitua as credenciais armazenadas

O fluxo de renovacao e automatico; voce geralmente nao precisa gerenciar Token manualmente.

## Multiplas contas (perfis) + roteamento

Dois padroes:

### 1) Preferido: agentes separados

Se voce quer que "pessoal" e "trabalho" nunca interajam, use agentes isolados (sessoes + credenciais + workspace separados):

```bash
opencraft agents add work
opencraft agents add personal
```

Depois configure a autenticacao por agente (assistente) e roteie os chats para o agente correto.

### 2) Avancado: multiplos perfis em um agente

`auth-profiles.json` suporta multiplos IDs de perfil para o mesmo provedor.

Escolha qual perfil e usado:

- globalmente via ordenacao de configuracao (`auth.order`)
- por sessao via `/model ...@<profileId>`

Exemplo (substituicao por sessao):

- `/model Opus@anthropic:work`

Como ver quais IDs de perfil existem:

- `opencraft channels list --json` (mostra `auth[]`)

Documentacao relacionada:

- [/concepts/model-failover](/concepts/model-failover) (regras de rotacao + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (superficie de comandos)
