---
summary: "Suporte a conta pessoal Zalo via zca-js nativo (login por QR), capacidades e configuração"
read_when:
  - Configurando o Zalo Personal para o OpenCraft
  - Depurando login ou fluxo de mensagens do Zalo Personal
title: "Zalo Personal"
---

# Zalo Personal (não oficial)

Status: experimental. Esta integração automatiza uma **conta pessoal Zalo** via `zca-js` nativo dentro do OpenCraft.

> **Aviso:** Esta é uma integração não oficial e pode resultar em suspensão/banimento de conta. Use por sua conta e risco.

## Plugin necessário

O Zalo Personal é distribuído como plugin e não está incluído na instalação principal.

- Instale via CLI: `opencraft plugins install @openclaw/zalouser`
- Ou a partir de um checkout de fonte: `opencraft plugins install ./extensions/zalouser`
- Detalhes: [Plugins](/tools/plugin)

Nenhum binário CLI externo `zca`/`openzca` é necessário.

## Configuração rápida (iniciantes)

1. Instale o plugin (veja acima).
2. Faça login (QR, na máquina do Gateway):
   - `opencraft channels login --channel zalouser`
   - Escaneie o código QR com o app Zalo do celular.
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

4. Reinicie o Gateway (ou conclua o onboarding).
5. O acesso por DM é pareamento por padrão; aprove o código de pareamento no primeiro contato.

## O que é

- Executa inteiramente em-processo via `zca-js`.
- Usa event listeners nativos para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Projetado para casos de uso de "conta pessoal" onde a Zalo Bot API não está disponível.

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que isso automatiza uma **conta de usuário Zalo pessoal** (não oficial). Mantemos `zalo` reservado para uma potencial futura integração oficial da API Zalo.

## Encontrando IDs (diretório)

Use o CLI de diretório para descobrir peers/grupos e seus IDs:

```bash
opencraft directory self --channel zalouser
opencraft directory peers list --channel zalouser --query "nome"
opencraft directory groups list --channel zalouser --query "trabalho"
```

## Limites

- Texto de saída é dividido em chunks de ~2000 caracteres (limites do cliente Zalo).
- Streaming é bloqueado por padrão.

## Controle de acesso (DMs)

`channels.zalouser.dmPolicy` suporta: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` aceita IDs ou nomes de usuário. Durante o onboarding, os nomes são resolvidos para IDs usando o lookup de contato em-processo do plugin.

Aprove via:

- `opencraft pairing list zalouser`
- `opencraft pairing approve zalouser <código>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para substituir o padrão quando não definido.
- Restrinja a uma allowlist com:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (as chaves devem ser IDs de grupo estáveis; nomes são resolvidos para IDs na inicialização quando possível)
  - `channels.zalouser.groupAllowFrom` (controla quais remetentes nos grupos permitidos podem acionar o bot)
- Bloquear todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- O assistente de configuração pode solicitar allowlists de grupo.
- Na inicialização, o OpenCraft resolve nomes de grupo/usuário em allowlists para IDs e registra o mapeamento.
- A correspondência de allowlist de grupo é somente por ID por padrão. Nomes não resolvidos são ignorados para autenticação a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade break-glass que reabilita a correspondência por nome de grupo mutável.
- Se `groupAllowFrom` não estiver definido, o runtime usa `allowFrom` como fallback para verificações de remetente de grupo.
- As verificações de remetente se aplicam tanto a mensagens normais de grupo quanto a comandos de controle (por exemplo `/new`, `/reset`).

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

### Controle por menção em grupos

- `channels.zalouser.groups.<group>.requireMention` controla se respostas em grupo requerem uma menção.
- Ordem de resolução: ID/nome de grupo exato -> slug de grupo normalizado -> `*` -> padrão (`true`).
- Aplica-se tanto a grupos na allowlist quanto ao modo de grupo aberto.
- Comandos de controle autorizados (por exemplo `/new`) podem ignorar o controle por menção.
- Quando uma mensagem de grupo é ignorada porque a menção é necessária, o OpenCraft a armazena como histórico de grupo pendente e a inclui na próxima mensagem de grupo processada.
- O limite de histórico de grupo padrão é `messages.groupChat.historyLimit` (fallback `50`). Você pode substituir por conta com `channels.zalouser.historyLimit`.

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

## Multi-conta

As contas mapeiam para perfis `zalouser` no estado do OpenCraft. Exemplo:

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
- A ação de reação de mensagem `react` é suportada para `zalouser` em ações de canal.
  - Use `remove: true` para remover um emoji de reação específico de uma mensagem.
  - Semântica de reação: [Reações](/tools/reactions)
- Para mensagens de entrada que incluem metadados de evento, o OpenCraft envia confirmações de entregue + visto (melhor esforço).

## Solução de problemas

**Login não persiste:**

- `opencraft channels status --probe`
- Refaça o login: `opencraft channels logout --channel zalouser && opencraft channels login --channel zalouser`

**Nome de allowlist/grupo não foi resolvido:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom`/`groups`, ou nomes exatos de amigos/grupos.

**Atualizado a partir da configuração antiga baseada em CLI:**

- Remova quaisquer suposições de processo `zca` externo antigo.
- O canal agora executa completamente dentro do OpenCraft sem binários CLI externos.
