---
summary: "Referência CLI para `opencraft channels` (contas, status, login/logout, logs)"
read_when:
  - Você quer adicionar/remover contas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage)
  - Você quer verificar o status do canal ou acompanhar logs do canal
title: "channels"
---

# `opencraft channels`

Gerencie contas de canais de chat e seu status em tempo de execução no Gateway.

Documentação relacionada:

- Guias de canais: [Canais](/channels/index)
- Configuração do Gateway: [Configuração](/gateway/configuration)

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
opencraft channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
opencraft channels remove --channel telegram --delete
```

Dica: `opencraft channels add --help` mostra flags por canal (token, chave privada, app token, caminhos do signal-cli, etc).

Quando você executa `opencraft channels add` sem flags, o assistente interativo pode solicitar:

- IDs de conta por canal selecionado
- nomes de exibição opcionais para essas contas
- `Vincular contas de canal configuradas aos agentes agora?`

Se você confirmar a vinculação agora, o assistente pergunta qual agente deve possuir cada conta de canal configurada e grava vinculações de roteamento com escopo de conta.

Você também pode gerenciar as mesmas regras de roteamento posteriormente com `opencraft agents bindings`, `opencraft agents bind` e `opencraft agents unbind` (veja [agents](/cli/agents)).

Quando você adiciona uma conta não padrão a um canal que ainda está usando configurações de nível superior de conta única (sem entradas `channels.<canal>.accounts` ainda), o OpenCraft move valores com escopo de conta de nível superior para `channels.<canal>.accounts.default`, e então grava a nova conta. Isso preserva o comportamento da conta original enquanto migra para o formato multi-conta.

O comportamento de roteamento permanece consistente:

- Vinculações existentes apenas de canal (sem `accountId`) continuam correspondendo à conta padrão.
- `channels add` não cria ou reescreve vinculações automaticamente no modo não interativo.
- A configuração interativa pode opcionalmente adicionar vinculações com escopo de conta.

Se sua config já estava em um estado misto (contas nomeadas presentes, faltando `default`, e valores de conta única de nível superior ainda definidos), execute `opencraft doctor --fix` para mover valores com escopo de conta para `accounts.default`.

## Login / logout (interativo)

```bash
opencraft channels login --channel whatsapp
opencraft channels logout --channel whatsapp
```

## Solução de problemas

- Execute `opencraft status --deep` para uma verificação ampla.
- Use `opencraft doctor` para correções guiadas.
- `opencraft channels list` imprime `Claude: HTTP 403 ... user:profile` → o snapshot de uso precisa do escopo `user:profile`. Use `--no-usage`, ou forneça uma chave de sessão claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou re-autentique via Claude Code CLI.
- `opencraft channels status` recorre a resumos apenas de config quando o gateway está inacessível. Se uma credencial de canal suportada está configurada via SecretRef mas indisponível no caminho de comando atual, ele reporta essa conta como configurada com notas degradadas em vez de mostrá-la como não configurada.

## Verificação de capacidades

Busque dicas de capacidade do provedor (intents/escopos quando disponíveis) mais suporte estático de recursos:

```bash
opencraft channels capabilities
opencraft channels capabilities --channel discord --target channel:123
```

Observações:

- `--channel` é opcional; omita para listar todos os canais (incluindo extensões).
- `--target` aceita `channel:<id>` ou um ID numérico de canal e se aplica apenas ao Discord.
- As verificações são específicas por provedor: Discord intents + permissões opcionais de canal; Slack bot + escopos de usuário; Telegram flags de bot + webhook; Signal versão do daemon; MS Teams app token + roles/escopos do Graph (anotados quando conhecidos). Canais sem verificações reportam `Probe: unavailable`.

## Resolver nomes para IDs

Resolva nomes de canal/usuário para IDs usando o diretório do provedor:

```bash
opencraft channels resolve --channel slack "#general" "@jane"
opencraft channels resolve --channel discord "My Server/#support" "@someone"
opencraft channels resolve --channel matrix "Project Room"
```

Observações:

- Use `--kind user|group|auto` para forçar o tipo de destino.
- A resolução prefere correspondências ativas quando múltiplas entradas compartilham o mesmo nome.
- `channels resolve` é somente leitura. Se uma conta selecionada está configurada via SecretRef mas essa credencial está indisponível no caminho de comando atual, o comando retorna resultados degradados não resolvidos com notas em vez de abortar a execução inteira.
