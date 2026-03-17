---
summary: "Suporte a conta pessoal Zalo via zca-js nativo (login por QR), capacidades e configuração"
read_when:
  - Setting up Zalo Personal for OpenCraft
  - Debugging Zalo Personal login or message flow
title: "Zalo Personal"
---

# Zalo Personal (não oficial)

Status: experimental. Esta integração automatiza uma **conta pessoal Zalo** via `zca-js` nativo dentro do OpenCraft.

> **Aviso:** Esta é uma integração não oficial e pode resultar em suspensão/banimento de conta. Use por sua conta e risco.

## Plugin necessário

Zalo Personal é distribuído como um plugin e não está incluso na instalação principal.

- Instalar via CLI: `opencraft plugins install @opencraft/zalouser`
- Ou a partir de um checkout do código-fonte: `opencraft plugins install ./extensions/zalouser`
- Detalhes: [Plugins](/tools/plugin)

Nenhum binário externo `zca`/`openzca` CLI é necessário.

## Configuração rápida (iniciante)

1. Instale o plugin (veja acima).
2. Login (QR, na máquina do Gateway):
   - `opencraft channels login --channel zalouser`
   - Escaneie o código QR com o aplicativo móvel Zalo.
3. Habilite o canal:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Reinicie o Gateway (ou finalize a configuração).
5. O acesso de DM é por pareamento por padrão; aprove o código de pareamento no primeiro contato.

## O que é

- Roda inteiramente em processo via `zca-js`.
- Usa listeners de evento nativos para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Projetado para casos de uso de "conta pessoal" onde a Zalo Bot API não está disponível.

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que isso automatiza uma **conta de usuário pessoal Zalo** (não oficial). Mantemos `zalo` reservado para uma potencial futura integração oficial com a API Zalo.

## Encontrando IDs (diretório)

Use o CLI de diretório para descobrir contatos/grupos e seus IDs:

```bash
opencraft directory self --channel zalouser
opencraft directory peers list --channel zalouser --query "name"
opencraft directory groups list --channel zalouser --query "work"
```

## Limites

- Texto de saída é dividido em blocos de ~2000 caracteres (limites do cliente Zalo).
- Streaming é bloqueado por padrão.

## Controle de acesso (DMs)

`channels.zalouser.dmPolicy` suporta: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` aceita IDs de usuário ou nomes. Durante a configuração, nomes são resolvidos para IDs usando a busca de contatos em processo do plugin.

Aprove via:

- `opencraft pairing list zalouser`
- `opencraft pairing approve zalouser <code>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para sobrescrever o padrão quando não definido.
- Restrinja a uma allowlist com:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (as chaves devem ser IDs de grupo estáveis; nomes são resolvidos para IDs na inicialização quando possível)
  - `channels.zalouser.groupAllowFrom` (controla quais remetentes em grupos permitidos podem acionar o Bot)
- Bloquear todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- O assistente de configuração pode solicitar allowlists de grupo.
- Na inicialização, o OpenCraft resolve nomes de grupo/usuário nas allowlists para IDs e registra o mapeamento em log.
- A correspondência de allowlist de grupo é apenas por ID por padrão. Nomes não resolvidos são ignorados para autenticação, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade de emergência que reabilita a correspondência mutável por nome de grupo.
- Se `groupAllowFrom` não estiver definido, o runtime usa `allowFrom` como fallback para verificações de remetente de grupo.
- Verificações de remetente se aplicam tanto a mensagens normais de grupo quanto a comandos de controle (por exemplo `/new`, `/reset`).

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Bloqueio por menção em grupos

- `channels.zalouser.groups.<group>.requireMention` controla se respostas em grupo exigem uma menção.
- Ordem de resolução: ID/nome exato do grupo -> slug normalizado do grupo -> `*` -> padrão (`true`).
- Isso se aplica tanto a grupos na allowlist quanto ao modo de grupo aberto.
- Comandos de controle autorizados (por exemplo `/new`) podem ignorar o bloqueio por menção.
- Quando uma mensagem de grupo é ignorada porque menção é necessária, o OpenCraft a armazena como histórico de grupo pendente e a inclui na próxima mensagem de grupo processada.
- O limite de histórico de grupo tem como padrão `messages.groupChat.historyLimit` (fallback `50`). Você pode sobrescrever por conta com `channels.zalouser.historyLimit`.

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Múltiplas contas

Contas mapeiam para perfis `zalouser` no estado do OpenCraft. Exemplo:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Digitação, reações e confirmações de entrega

- O OpenCraft envia um evento de digitação antes de despachar uma resposta (melhor esforço).
- A ação de reação a mensagens `react` é suportada para `zalouser` em ações de canal.
  - Use `remove: true` para remover um emoji de reação específico de uma mensagem.
  - Semântica de reações: [Reações](/tools/reactions)
- Para mensagens de entrada que incluem metadados de evento, o OpenCraft envia confirmações de entrega + visualização (melhor esforço).

## Solução de problemas

**Login não persiste:**

- `opencraft channels status --probe`
- Refaça o login: `opencraft channels logout --channel zalouser && opencraft channels login --channel zalouser`

**Allowlist/nome de grupo não resolveu:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom`/`groups`, ou nomes exatos de amigos/grupos.

**Atualizou de uma configuração antiga baseada em CLI:**

- Remova quaisquer suposições de processo externo `zca` antigo.
- O canal agora roda completamente dentro do OpenCraft sem binários CLI externos.
