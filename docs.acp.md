# Bridge ACP do OpenCraft

Este documento descreve como a bridge ACP (Agent Client Protocol) do OpenCraft funciona,
como ela mapeia sessões ACP para sessões do Gateway, e como as IDEs devem invocá-la.

## Visão Geral

`opencraft acp` expõe um agente ACP via stdio e encaminha prompts para um
OpenCraft Gateway em execução via WebSocket. Ele mantém os IDs de sessão ACP mapeados para
chaves de sessão do Gateway para que IDEs possam reconectar ao mesmo transcript do agente ou redefini-lo
mediante solicitação.

Objetivos principais:

- Área de superfície ACP mínima (stdio, NDJSON).
- Mapeamento de sessão estável entre reconexões.
- Funciona com o armazenamento de sessão existente do Gateway (list/resolve/reset).
- Padrões seguros (chaves de sessão ACP isoladas por padrão).

## Escopo da Bridge

`opencraft acp` é uma bridge ACP com suporte do Gateway, não um runtime editor
nativo ACP completo. Ela é projetada para rotear prompts de IDE em uma sessão OpenCraft Gateway
existente com mapeamento de sessão previsível e atualizações básicas de streaming.

## Matriz de Compatibilidade

| Área ACP                                                              | Status        | Notas                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado  | Fluxo principal da bridge via stdio para chat/send + abort do Gateway.                                                                                                                                                                          |
| `listSessions`, slash commands                                        | Implementado  | A lista de sessões funciona contra o estado de sessão do Gateway; os comandos são anunciados via `available_commands_update`.                                                                                                                    |
| `loadSession`                                                         | Parcial       | Revincula a sessão ACP a uma chave de sessão do Gateway e reproduz o histórico de texto de usuário/assistente armazenado. O histórico de tool/system não é reconstruído ainda.                                                                  |
| Conteúdo de prompt (`text`, `resource` embutido, imagens)             | Parcial       | Texto/recursos são achatados em input de chat; imagens se tornam attachments do Gateway.                                                                                                                                                        |
| Modos de sessão                                                       | Parcial       | `session/set_mode` é suportado e a bridge expõe controles iniciais de sessão com suporte do Gateway para nível de pensamento, verbosidade de tool, raciocínio, detalhe de uso e ações elevadas. Superfícies mais amplas de modo/config ACP-nativas ainda estão fora do escopo. |
| Informações de sessão e atualizações de uso                           | Parcial       | A bridge emite notificações `session_info_update` e `usage_update` de melhor esforço a partir de snapshots de sessão do Gateway em cache. O uso é aproximado e só é enviado quando os totais de token do Gateway são marcados como frescos.     |
| Streaming de tool                                                     | Parcial       | Eventos `tool_call` / `tool_call_update` incluem I/O bruto, conteúdo de texto e localizações de arquivo de melhor esforço quando os args/resultados de tool do Gateway os expõem. Terminais embutidos e saída estruturada de diff nativa ainda não são expostos. |
| Servidores MCP por sessão (`mcpServers`)                              | Não suportado | O modo bridge rejeita solicitações de servidor MCP por sessão. Configure o MCP no gateway ou agente OpenCraft.                                                                                                                                  |
| Métodos de sistema de arquivos do cliente (`fs/read_text_file`, `fs/write_text_file`) | Não suportado | A bridge não chama métodos de sistema de arquivos do cliente ACP.                                                                                                                                                             |
| Métodos de terminal do cliente (`terminal/*`)                         | Não suportado | A bridge não cria terminais de cliente ACP ou transmite IDs de terminal via tool calls.                                                                                                                                                         |
| Planos de sessão / streaming de pensamento                            | Não suportado | A bridge atualmente emite texto de saída e status de tool, não atualizações de plano ou pensamento ACP.                                                                                                                                         |

## Limitações Conhecidas

- `loadSession` reproduz o histórico de texto de usuário e assistente armazenado, mas não
  reconstrói tool calls históricas, avisos do sistema ou tipos de evento ACP-nativos mais ricos.
- Se múltiplos clientes ACP compartilharem a mesma chave de sessão do Gateway, o roteamento de eventos e cancel
  é de melhor esforço em vez de estritamente isolado por cliente. Prefira as sessões
  isoladas padrão `acp:<uuid>` quando precisar de turnos locais limpos no editor.
- Os estados de parada do Gateway são traduzidos para razões de parada ACP, mas esse mapeamento é
  menos expressivo do que um runtime totalmente ACP-nativo.
- Os controles iniciais de sessão atualmente expõem um subconjunto focado de controles do Gateway:
  nível de pensamento, verbosidade de tool, raciocínio, detalhe de uso e ações elevadas. A seleção de modelo e controles de exec-host ainda não são expostos como opções de configuração ACP.
- `session_info_update` e `usage_update` são derivados de snapshots de sessão do Gateway,
  não de contabilidade de runtime ACP-nativa ao vivo. O uso é aproximado,
  não carrega dados de custo e só é emitido quando o Gateway marca os dados totais de token
  como frescos.
- Os dados de acompanhamento de tool são de melhor esforço. A bridge pode expor caminhos de arquivo que
  aparecem em args/resultados conhecidos de tool, mas ainda não emite terminais ACP ou
  diffs de arquivo estruturados.

## Como posso usar isso

Use ACP quando uma IDE ou ferramenta falar Agent Client Protocol e você quiser que ela
direcione uma sessão do OpenCraft Gateway.

Passos rápidos:

1. Execute um Gateway (local ou remoto).
2. Configure o alvo do Gateway (`gateway.remote.url` + auth) ou passe flags.
3. Aponte a IDE para executar `opencraft acp` via stdio.

Configuração de exemplo:

```bash
opencraft config set gateway.remote.url wss://gateway-host:18789
opencraft config set gateway.remote.token <token>
```

Execução de exemplo:

```bash
opencraft acp --url wss://gateway-host:18789 --token <token>
```

## Selecionando agentes

O ACP não seleciona agentes diretamente. Ele roteia pela chave de sessão do Gateway.

Use chaves de sessão com escopo de agente para direcionar um agente específico:

```bash
opencraft acp --session agent:main:main
opencraft acp --session agent:design:main
opencraft acp --session agent:qa:bug-123
```

Cada sessão ACP mapeia para uma única chave de sessão do Gateway. Um agente pode ter muitas
sessões; o ACP usa por padrão uma sessão isolada `acp:<uuid>`, a menos que você sobrescreva
a chave ou o rótulo.

## Configuração do editor Zed

Adicione um agente ACP personalizado em `~/.config/zed/settings.json`:

```json
{
  "agent_servers": {
    "OpenCraft ACP": {
      "type": "custom",
      "command": "opencraft",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Para direcionar um Gateway ou agente específico:

```json
{
  "agent_servers": {
    "OpenCraft ACP": {
      "type": "custom",
      "command": "opencraft",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

No Zed, abra o painel de Agente e selecione "OpenCraft ACP" para iniciar uma thread.

## Modelo de Execução

- O cliente ACP spawna `opencraft acp` e fala mensagens ACP via stdio.
- A bridge conecta ao Gateway usando a configuração de auth existente (ou flags CLI).
- O `prompt` ACP traduz para `chat.send` do Gateway.
- Os eventos de streaming do Gateway são traduzidos de volta em eventos de streaming ACP.
- O `cancel` ACP mapeia para `chat.abort` do Gateway para a execução ativa.

## Mapeamento de Sessão

Por padrão, cada sessão ACP é mapeada para uma chave de sessão dedicada do Gateway:

- `acp:<uuid>`, a menos que seja sobrescrito.

Você pode sobrescrever ou reutilizar sessões de duas formas:

1. Padrões CLI

```bash
opencraft acp --session agent:main:main
opencraft acp --session-label "support inbox"
opencraft acp --reset-session
```

2. Metadados ACP por sessão

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true,
    "requireExisting": false
  }
}
```

Regras:

- `sessionKey`: chave de sessão direta do Gateway.
- `sessionLabel`: resolve uma sessão existente pelo rótulo.
- `resetSession`: cria um novo transcript para a chave antes do primeiro uso.
- `requireExisting`: falha se a chave/rótulo não existir.

### Listagem de Sessões

`listSessions` ACP mapeia para `sessions.list` do Gateway e retorna um resumo filtrado
adequado para seletores de sessão de IDE. `_meta.limit` pode limitar o número de
sessões retornadas.

## Tradução de Prompt

Os inputs de prompt ACP são convertidos em um `chat.send` do Gateway:

- Blocos `text` e `resource` tornam-se texto de prompt.
- `resource_link` com tipos MIME de imagem tornam-se attachments.
- O diretório de trabalho pode ser prefixado no prompt (ativo por padrão, pode ser
  desabilitado com `--no-prefix-cwd`).

Os eventos de streaming do Gateway são traduzidos em atualizações `message` e `tool_call` ACP.
Os estados terminais do Gateway mapeiam para `done` ACP com razões de parada:

- `complete` -> `stop`
- `aborted` -> `cancel`
- `error` -> `error`

## Auth + Descoberta do Gateway

`opencraft acp` resolve a URL do Gateway e auth a partir de flags CLI ou configuração:

- `--url` / `--token` / `--password` têm precedência.
- Caso contrário, use as configurações `gateway.remote.*` configuradas.

## Notas Operacionais

- As sessões ACP são armazenadas na memória pelo tempo de vida do processo bridge.
- O estado de sessão do Gateway é persistido pelo próprio Gateway.
- `--verbose` registra eventos da bridge ACP/Gateway no stderr (nunca no stdout).
- As execuções ACP podem ser canceladas e o ID de execução ativo é rastreado por sessão.

## Compatibilidade

- A bridge ACP usa `@agentclientprotocol/sdk` (atualmente 0.15.x).
- Funciona com clientes ACP que implementam `initialize`, `newSession`,
  `loadSession`, `prompt`, `cancel` e `listSessions`.
- O modo bridge rejeita `mcpServers` por sessão em vez de ignorá-los silenciosamente.
  Configure o MCP na camada do Gateway ou agente.

## Testes

- Unitário: `src/acp/session.test.ts` cobre o ciclo de vida do ID de execução.
- Gate completo: `pnpm build && pnpm check && pnpm test && pnpm docs:build`.

## Docs Relacionados

- Uso do CLI: `docs/cli/acp.md`
- Modelo de sessão: `docs/concepts/session.md`
- Internos de gerenciamento de sessão: `docs/reference/session-management-compaction.md`
