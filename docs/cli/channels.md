---
summary: "Referência do CLI para `opencraft channels` (contas, status, login/logout, logs)"
read_when:
  - Você quer adicionar/remover contas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage)
  - Você quer verificar status do canal ou cauda de logs do canal
title: "channels"
---

# `opencraft channels`

Gerenciar contas de canal de chat e seu status de runtime no Gateway.

Docs relacionados:

- Guias de canal: [Channels](/channels/index)
- Configuração do Gateway: [Configuration](/gateway/configuration)

## Comandos comuns

```bash
opencraft channels list
opencraft channels status
opencraft channels capabilities
opencraft channels capabilities --channel discord --target channel:123
opencraft channels resolve --channel slack "#general" "@jane"
opencraft channels logs --channel all
```

## Adicionar / remover contas

```bash
opencraft channels add --channel telegram --token <bot-token>
opencraft channels remove --channel telegram --delete
```

Dica: `opencraft channels add --help` mostra flags por canal (token, app token, paths do signal-cli, etc).

Quando você roda `opencraft channels add` sem flags, o wizard interativo pode solicitar:

- ids de conta por canal selecionado
- nomes de exibição opcionais para essas contas
- `Vincular contas de canal configuradas a agentes agora?`

Se você confirmar vincular agora, o wizard pergunta qual agente deve possuir cada conta de canal configurada e escreve bindings de roteamento com escopo de conta.

Você também pode gerenciar as mesmas regras de roteamento depois com `opencraft agents bindings`, `opencraft agents bind` e `opencraft agents unbind` (veja [agents](/cli/agents)).

Quando você adiciona uma conta não padrão a um canal que ainda está usando configurações de conta única de nível superior (ainda sem entradas `channels.<channel>.accounts`), o OpenCraft move valores de conta única de nível superior com escopo de conta para `channels.<channel>.accounts.default`, depois escreve a nova conta. Isso preserva o comportamento da conta original enquanto move para o formato multi-conta.

O comportamento de roteamento permanece consistente:

- Bindings apenas de canal existentes (sem `accountId`) continuam correspondendo à conta padrão.
- `channels add` não cria ou reescreve bindings automaticamente em modo não interativo.
- Setup interativo pode opcionalmente adicionar bindings com escopo de conta.

Se sua config já estava em um estado misto (contas nomeadas presentes, `default` ausente, e valores de conta única de nível superior ainda definidos), rode `opencraft doctor --fix` para mover valores com escopo de conta para `accounts.default`.

## Login / logout (interativo)

```bash
opencraft channels login --channel whatsapp
opencraft channels logout --channel whatsapp
```

## Resolução de problemas

- Rode `opencraft status --deep` para um probe amplo.
- Use `opencraft doctor` para correções guiadas.
- `opencraft channels list` imprime `Claude: HTTP 403 ... user:profile` → snapshot de uso precisa do escopo `user:profile`. Use `--no-usage`, ou forneça uma session key do claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou re-auth via CLI do Claude Code.
- `opencraft channels status` faz fallback para resumos apenas de config quando o gateway está inacessível. Se uma credencial de canal suportada estiver configurada via SecretRef mas indisponível no path de comando atual, ela relata essa conta como configurada com notas degradadas em vez de mostrá-la como não configurada.

## Probe de capacidades

Buscar hints de capacidade do provedor (intenções/escopos onde disponível) mais suporte de recurso estático:

```bash
opencraft channels capabilities
opencraft channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` é opcional; omita-o para listar todos os canais (incluindo extensões).
- `--target` aceita `channel:<id>` ou um id numérico de canal bruto e se aplica apenas ao Discord.
- Probes são específicos do provedor: intenções Discord + permissões de canal opcionais; escopos de bot + usuário Slack; flags de bot Telegram + webhook; versão do daemon Signal; token de app MS Teams + funções/escopos do Graph (anotados onde conhecidos). Canais sem probes relatam `Probe: unavailable`.

## Resolver nomes para IDs

Resolver nomes de canal/usuário para IDs usando o diretório do provedor:

```bash
opencraft channels resolve --channel slack "#general" "@jane"
opencraft channels resolve --channel discord "My Server/#support" "@someone"
opencraft channels resolve --channel matrix "Project Room"
```

Notas:

- Use `--kind user|group|auto` para forçar o tipo de alvo.
- Resolução prefere correspondências ativas quando múltiplas entradas compartilham o mesmo nome.
- `channels resolve` é somente leitura. Se uma conta selecionada estiver configurada via SecretRef mas essa credencial estiver indisponível no path de comando atual, o comando retorna resultados não resolvidos degradados com notas em vez de abortar a execução inteira.
