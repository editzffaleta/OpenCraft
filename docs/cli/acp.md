---
summary: "Rodar a bridge ACP para integrações com IDEs"
read_when:
  - Configurando integrações de IDE baseadas em ACP
  - Depurando roteamento de sessão ACP para o Gateway
title: "acp"
---

# acp

Rodar a bridge do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que conversa com um Gateway OpenCraft.

Este comando fala ACP via stdio para IDEs e encaminha prompts para o Gateway
via WebSocket. Mantém sessões ACP mapeadas para session keys do Gateway.

`opencraft acp` é uma bridge ACP com backend no Gateway, não um runtime de editor nativo ACP completo.
Foca em roteamento de sessão, entrega de prompt e atualizações básicas de streaming.

## Matriz de Compatibilidade

| Área ACP                                                              | Status      | Notas                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado | Fluxo de bridge core via stdio para chat/send + abort do Gateway.                                                                                                                                                                                |
| `listSessions`, comandos slash                                        | Implementado | Lista de sessão funciona contra estado de sessão do Gateway; comandos são anunciados via `available_commands_update`.                                                                                                                            |
| `loadSession`                                                         | Parcial     | Re-vincula a sessão ACP a uma session key do Gateway e reproduz histórico de texto usuário/assistente armazenado. Histórico de ferramenta/sistema não é reconstruído ainda.                                                                     |
| Conteúdo de prompt (`text`, `resource` embutido, imagens)            | Parcial     | Texto/recursos são achatados em entrada de chat; imagens se tornam anexos do Gateway.                                                                                                                                                           |
| Modos de sessão                                                       | Parcial     | `session/set_mode` é suportado e a bridge expõe controles iniciais de sessão com backend no Gateway para nível de pensamento, verbosidade de ferramenta, raciocínio, detalhe de uso e ações elevadas. Superfícies mais amplas de modo/config ACP nativo ainda estão fora do escopo. |
| Informações de sessão e atualizações de uso                           | Parcial     | A bridge emite notificações `session_info_update` e `usage_update` de melhor esforço de snapshots de sessão do Gateway em cache. O uso é aproximado e só enviado quando o Gateway marca totais de token como frescos.                           |
| Streaming de ferramenta                                               | Parcial     | Eventos `tool_call` / `tool_call_update` incluem I/O bruto, conteúdo de texto e localizações de arquivo de melhor esforço quando args/resultados de ferramenta do Gateway os expõem. Terminais embutidos e saída diff nativa mais rica ainda não são expostos. |
| Servidores MCP por sessão (`mcpServers`)                              | Não suportado | Modo bridge rejeita requisições de servidor MCP por sessão. Configure MCP no gateway ou agente do OpenCraft.                                                                                                                                    |
| Métodos de sistema de arquivos do cliente (`fs/read_text_file`, `fs/write_text_file`) | Não suportado | A bridge não chama métodos de sistema de arquivos do cliente ACP.                                                                                                                                                              |
| Métodos de terminal do cliente (`terminal/*`)                         | Não suportado | A bridge não cria terminais de cliente ACP ou transmite ids de terminal via tool calls.                                                                                                                                                         |
| Planos de sessão / streaming de pensamento                            | Não suportado | A bridge atualmente emite texto de saída e status de ferramenta, não atualizações de plano ou pensamento ACP.                                                                                                                                  |

## Limitações Conhecidas

- `loadSession` reproduz histórico de texto de usuário e assistente armazenado, mas não
  reconstrói tool calls históricos, avisos de sistema ou tipos de evento ACP nativo mais ricos.
- Se múltiplos clientes ACP compartilham a mesma session key do Gateway, o roteamento de evento e cancel
  é de melhor esforço em vez de estritamente isolado por cliente. Prefira as sessões `acp:<uuid>` isoladas padrão quando precisar de turnos limpos locais de editor.
- Estados de stop do Gateway são traduzidos em razões de stop ACP, mas esse mapeamento é
  menos expressivo que um runtime totalmente nativo ACP.
- Controles iniciais de sessão atualmente expõem um subconjunto focado de controles do Gateway:
  nível de pensamento, verbosidade de ferramenta, raciocínio, detalhe de uso e
  ações elevadas. Seleção de modelo e controles de exec-host ainda não são expostos como opções
  de config ACP.
- `session_info_update` e `usage_update` são derivados de snapshots de sessão do Gateway,
  não de contabilidade de runtime nativo ACP ao vivo. O uso é aproximado,
  não carrega dados de custo e só é emitido quando o Gateway marca dados totais de token
  como frescos.
- Dados de acompanhamento de ferramenta são de melhor esforço. A bridge pode expor paths de arquivo que
  aparecem em args/resultados de ferramenta conhecidos, mas ainda não emite terminais ACP ou
  diffs de arquivo estruturados.

## Uso

```bash
opencraft acp

# Gateway remoto
opencraft acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token de arquivo)
opencraft acp --url wss://gateway-host:18789 --token-file ~/.opencraft/gateway.token

# Anexar a uma session key existente
opencraft acp --session agent:main:main

# Anexar por rótulo (deve já existir)
opencraft acp --session-label "support inbox"

# Resetar a session key antes do primeiro prompt
opencraft acp --session agent:main:main --reset-session
```

## Cliente ACP (debug)

Use o cliente ACP embutido para verificar a bridge sem um IDE.
Ele inicia a bridge ACP e permite digitar prompts interativamente.

```bash
opencraft acp client

# Apontar a bridge iniciada para um Gateway remoto
opencraft acp client --server-args --url wss://gateway-host:18789 --token-file ~/.opencraft/gateway.token

# Sobrescrever o comando do servidor (padrão: opencraft)
opencraft acp client --server "node" --server-args opencraft.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permissão (modo de debug do cliente):

- Auto-aprovação é baseada em allowlist e se aplica apenas a IDs de ferramentas core confiáveis.
- Auto-aprovação de `read` tem escopo para o diretório de trabalho atual (`--cwd` quando definido).
- Nomes de ferramentas desconhecidos/não-core, leituras fora do escopo e ferramentas perigosas sempre requerem aprovação explícita de prompt.
- `toolCall.kind` fornecido pelo servidor é tratado como metadados não confiáveis (não uma fonte de autorização).

## Como usar isso

Use ACP quando um IDE (ou outro cliente) fala Agent Client Protocol e você quer
que ele conduza uma sessão do Gateway OpenCraft.

1. Garantir que o Gateway está rodando (local ou remoto).
2. Configurar o alvo do Gateway (config ou flags).
3. Apontar seu IDE para rodar `opencraft acp` via stdio.

Exemplo de config (persistida):

```bash
opencraft config set gateway.remote.url wss://gateway-host:18789
opencraft config set gateway.remote.token <token>
```

Exemplo de execução direta (sem escrita de config):

```bash
opencraft acp --url wss://gateway-host:18789 --token <token>
# preferido para segurança de processo local
opencraft acp --url wss://gateway-host:18789 --token-file ~/.opencraft/gateway.token
```

## Selecionando agentes

ACP não seleciona agentes diretamente. Roteia pela session key do Gateway.

Use session keys com escopo de agente para direcionar um agente específico:

```bash
opencraft acp --session agent:main:main
opencraft acp --session agent:design:main
opencraft acp --session agent:qa:bug-123
```

Cada sessão ACP mapeia para uma única session key do Gateway. Um agente pode ter muitas
sessões; ACP padrão para uma sessão `acp:<uuid>` isolada a menos que você sobrescreva
a chave ou rótulo.

`mcpServers` por sessão não são suportados em modo bridge. Se um cliente ACP
os enviar durante `newSession` ou `loadSession`, a bridge retorna um erro claro
em vez de silenciosamente ignorá-los.

## Uso de `acpx` (Codex, Claude, outros clientes ACP)

Se você quiser que um agente de coding como Codex ou Claude Code converse com seu
bot OpenCraft via ACP, use `acpx` com seu alvo `opencraft` embutido.

Fluxo típico:

1. Rodar o Gateway e garantir que a bridge ACP pode alcançá-lo.
2. Apontar `acpx opencraft` para `opencraft acp`.
3. Direcionar a session key do OpenCraft que você quer que o agente de coding use.

Exemplos:

```bash
# Requisição one-shot para sua sessão ACP padrão do OpenCraft
acpx opencraft exec "Resumir o estado da sessão ativa do OpenCraft."

# Sessão com nome persistente para turnos de acompanhamento
acpx opencraft sessions ensure --name codex-bridge
acpx opencraft -s codex-bridge --cwd /path/to/repo \
  "Pedir ao meu agente de trabalho OpenCraft por contexto recente relevante a este repo."
```

Se você quiser que `acpx opencraft` direcione um Gateway específico e session key sempre,
sobrescreva o comando do agente `opencraft` em `~/.acpx/config.json`:

```json
{
  "agents": {
    "opencraft": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 opencraft acp --url ws://127.0.0.1:18789 --token-file ~/.opencraft/gateway.token --session agent:main:main"
    }
  }
}
```

Para um checkout local do OpenCraft, use o entrypoint CLI direto em vez do
runner de dev para que o stream ACP fique limpo. Por exemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node opencraft.mjs acp ...
```

Esta é a maneira mais fácil de deixar Codex, Claude Code ou outro cliente com suporte ACP
obter informações contextuais de um agente OpenCraft sem fazer scraping de um terminal.

## Configuração do editor Zed

Adicionar um agente ACP customizado em `~/.config/zed/settings.json` (ou use a UI de Configurações do Zed):

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

No Zed, abra o painel Agent e selecione "OpenCraft ACP" para iniciar uma thread.

## Mapeamento de sessão

Por padrão, sessões ACP obtêm uma session key isolada do Gateway com prefixo `acp:`.
Para reutilizar uma sessão conhecida, passe uma session key ou rótulo:

- `--session <key>`: usar uma session key específica do Gateway.
- `--session-label <label>`: resolver uma sessão existente por rótulo.
- `--reset-session`: cunhar um novo session id para essa chave (mesma chave, novo transcript).

Se seu cliente ACP suporta metadados, você pode sobrescrever por sessão:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Saiba mais sobre session keys em [/concepts/session](/concepts/session).

## Opções

- `--url <url>`: URL WebSocket do Gateway (padrão para gateway.remote.url quando configurado).
- `--token <token>`: token de auth do Gateway.
- `--token-file <path>`: ler token de auth do Gateway de arquivo.
- `--password <password>`: senha de auth do Gateway.
- `--password-file <path>`: ler senha de auth do Gateway de arquivo.
- `--session <key>`: session key padrão.
- `--session-label <label>`: rótulo de sessão padrão para resolver.
- `--require-existing`: falhar se a session key/rótulo não existir.
- `--reset-session`: resetar a session key antes do primeiro uso.
- `--no-prefix-cwd`: não prefixar prompts com o diretório de trabalho.
- `--verbose, -v`: log verboso para stderr.

Nota de segurança:

- `--token` e `--password` podem ser visíveis em listagens de processo local em alguns sistemas.
- Prefira `--token-file`/`--password-file` ou variáveis de ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Resolução de auth do Gateway segue o contrato compartilhado usado por outros clientes do Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` apenas quando `gateway.auth.*` não está definido (SecretRefs locais configurados mas não resolvidos falham fechados)
  - modo remoto: `gateway.remote.*` com fallback de env/config por regras de precedência remota
  - `--url` é seguro para override e não reutiliza credenciais implícitas de config/env; passe `--token`/`--password` explícitos (ou variantes de arquivo)
- Processos filho de runtime backend ACP recebem `OPENCLAW_SHELL=acp`, que pode ser usado para regras de shell/perfil específicas de contexto.
- `opencraft acp client` define `OPENCLAW_SHELL=acp-client` no processo bridge iniciado.

### Opções de `acp client`

- `--cwd <dir>`: diretório de trabalho para a sessão ACP.
- `--server <command>`: comando do servidor ACP (padrão: `opencraft`).
- `--server-args <args...>`: argumentos extras passados para o servidor ACP.
- `--server-verbose`: habilitar log verboso no servidor ACP.
- `--verbose, -v`: log verboso do cliente.
