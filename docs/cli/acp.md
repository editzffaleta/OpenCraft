---
summary: "Executar a ponte ACP para integrações com IDEs"
read_when:
  - Configurando integrações com IDEs baseadas em ACP
  - Depurando roteamento de sessão ACP para o Gateway
title: "acp"
---

# acp

Executa a ponte [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica com um Gateway OpenCraft.

Este comando fala ACP via stdio para IDEs e encaminha prompts para o Gateway
via WebSocket. Ele mantém sessões ACP mapeadas para chaves de sessão do Gateway.

`opencraft acp` é uma ponte ACP baseada no Gateway, não um runtime ACP-nativo completo.
Ele foca em roteamento de sessão, entrega de prompts e atualizações básicas de streaming.

## Matriz de Compatibilidade

| Área ACP                                                              | Status      | Notas                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado | Fluxo principal da ponte via stdio para chat/send + abort do Gateway.                                                                                                                                                                        |
| `listSessions`, comandos slash                                        | Implementado | Lista de sessões funciona com o estado de sessão do Gateway; comandos são anunciados via `available_commands_update`.                                                                                                                       |
| `loadSession`                                                         | Parcial     | Reconecta a sessão ACP a uma chave de sessão do Gateway e reproduz o histórico armazenado de texto usuário/assistente. Histórico de ferramentas/sistema ainda não é reconstruído.                                                               |
| Conteúdo do prompt (`text`, `resource` embutido, imagens)             | Parcial     | Texto/recursos são achatados na entrada do chat; imagens se tornam anexos do Gateway.                                                                                                                                                         |
| Modos de sessão                                                       | Parcial     | `session/set_mode` é suportado e a ponte expõe controles iniciais de sessão baseados no Gateway para nível de pensamento, verbosidade de ferramentas, raciocínio, detalhes de uso e ações elevadas. Superfícies mais amplas de modo/config ACP-nativo ainda estão fora do escopo. |
| Informações de sessão e atualizações de uso                           | Parcial     | A ponte emite notificações `session_info_update` e `usage_update` de melhor esforço a partir de snapshots de sessão do Gateway em cache. O uso é aproximado e só é enviado quando os totais de Token do Gateway são marcados como atualizados.                                        |
| Streaming de ferramentas                                              | Parcial     | Eventos `tool_call` / `tool_call_update` incluem I/O bruto, conteúdo de texto e localizações de arquivo de melhor esforço quando args/resultados de ferramentas do Gateway os expõem. Terminais embutidos e saída nativa de diff mais rica ainda não são expostos.                        |
| Servidores MCP por sessão (`mcpServers`)                              | Não suportado | O modo ponte rejeita requisições de servidor MCP por sessão. Configure o MCP no Gateway ou agente OpenCraft.                                                                                                                                    |
| Métodos de sistema de arquivos do cliente (`fs/read_text_file`, `fs/write_text_file`) | Não suportado | A ponte não chama métodos de sistema de arquivos do cliente ACP.                                                                                                                                                                          |
| Métodos de terminal do cliente (`terminal/*`)                         | Não suportado | A ponte não cria terminais de cliente ACP nem transmite IDs de terminal através de chamadas de ferramenta.                                                                                                                                       |
| Planos de sessão / streaming de pensamento                            | Não suportado | A ponte atualmente emite texto de saída e status de ferramenta, não atualizações de plano ou pensamento ACP.                                                                                                                                         |

## Limitações Conhecidas

- `loadSession` reproduz o histórico armazenado de texto de usuário e assistente, mas não
  reconstrói chamadas de ferramenta históricas, avisos de sistema ou tipos de eventos
  ACP-nativos mais ricos.
- Se múltiplos clientes ACP compartilham a mesma chave de sessão do Gateway, o roteamento de
  eventos e cancelamento é de melhor esforço, não estritamente isolado por cliente. Prefira as
  sessões isoladas padrão `acp:<uuid>` quando você precisar de turnos limpos locais ao editor.
- Estados de parada do Gateway são traduzidos em razões de parada ACP, mas esse mapeamento é
  menos expressivo que um runtime totalmente ACP-nativo.
- Os controles iniciais de sessão atualmente expõem um subconjunto focado de opções do Gateway:
  nível de pensamento, verbosidade de ferramentas, raciocínio, detalhes de uso e ações
  elevadas. Seleção de modelo e controles de host de execução ainda não são expostos como opções
  de config ACP.
- `session_info_update` e `usage_update` são derivados de snapshots de sessão do Gateway,
  não de contabilidade de runtime ACP-nativo. O uso é aproximado, não contém dados de custo,
  e só é emitido quando o Gateway marca os dados totais de Token como atualizados.
- Dados de acompanhamento de ferramentas são de melhor esforço. A ponte pode expor caminhos de
  arquivo que aparecem em args/resultados conhecidos de ferramentas, mas ainda não emite terminais
  ACP ou diffs estruturados de arquivos.

## Uso

```bash
opencraft acp

# Gateway remoto
opencraft acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token de arquivo)
opencraft acp --url wss://gateway-host:18789 --token-file ~/.opencraft/gateway.token

# Conectar a uma chave de sessão existente
opencraft acp --session agent:main:main

# Conectar por rótulo (deve já existir)
opencraft acp --session-label "support inbox"

# Redefinir a chave de sessão antes do primeiro prompt
opencraft acp --session agent:main:main --reset-session
```

## Cliente ACP (depuração)

Use o cliente ACP integrado para verificar a ponte sem uma IDE.
Ele inicia a ponte ACP e permite que você digite prompts interativamente.

```bash
opencraft acp client

# Apontar a ponte iniciada para um Gateway remoto
opencraft acp client --server-args --url wss://gateway-host:18789 --token-file ~/.opencraft/gateway.token

# Substituir o comando do servidor (padrão: opencraft)
opencraft acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permissão (modo de depuração do cliente):

- Auto-aprovação é baseada em lista de permissão e se aplica apenas a IDs de ferramentas principais confiáveis.
- Auto-aprovação de `read` é limitada ao diretório de trabalho atual (`--cwd` quando definido).
- Nomes de ferramentas desconhecidos/não-principais, leituras fora do escopo e ferramentas perigosas sempre requerem aprovação explícita via prompt.
- `toolCall.kind` fornecido pelo servidor é tratado como metadado não confiável (não uma fonte de autorização).

## Como usar

Use ACP quando uma IDE (ou outro cliente) fala Agent Client Protocol e você deseja
que ela conduza uma sessão do Gateway OpenCraft.

1. Certifique-se de que o Gateway está rodando (local ou remoto).
2. Configure o alvo do Gateway (config ou flags).
3. Aponte sua IDE para executar `opencraft acp` via stdio.

Exemplo de config (persistido):

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

ACP não seleciona agentes diretamente. Ele roteia pela chave de sessão do Gateway.

Use chaves de sessão com escopo de agente para direcionar um agente específico:

```bash
opencraft acp --session agent:main:main
opencraft acp --session agent:design:main
opencraft acp --session agent:qa:bug-123
```

Cada sessão ACP mapeia para uma única chave de sessão do Gateway. Um agente pode ter muitas
sessões; ACP assume por padrão uma sessão isolada `acp:<uuid>` a menos que você substitua
a chave ou o rótulo.

`mcpServers` por sessão não são suportados no modo ponte. Se um cliente ACP
os enviar durante `newSession` ou `loadSession`, a ponte retorna um erro claro
em vez de silenciosamente ignorá-los.

## Uso a partir de `acpx` (Codex, Claude, outros clientes ACP)

Se você deseja que um agente de código como Codex ou Claude Code converse com seu
Bot OpenCraft via ACP, use `acpx` com seu alvo `opencraft` integrado.

Fluxo típico:

1. Execute o Gateway e certifique-se de que a ponte ACP pode alcançá-lo.
2. Aponte `acpx opencraft` para `opencraft acp`.
3. Direcione para a chave de sessão OpenCraft que você deseja que o agente de código use.

Exemplos:

```bash
# Requisição única na sua sessão ACP OpenCraft padrão
acpx opencraft exec "Summarize the active OpenCraft session state."

# Sessão nomeada persistente para turnos seguintes
acpx opencraft sessions ensure --name codex-bridge
acpx opencraft -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenCraft work agent for recent context relevant to this repo."
```

Se você deseja que `acpx opencraft` direcione para um Gateway e chave de sessão específicos toda
vez, substitua o comando do agente `opencraft` em `~/.acpx/config.json`:

```json
{
  "agents": {
    "opencraft": {
      "command": "env OPENCRAFT_HIDE_BANNER=1 OPENCRAFT_SUPPRESS_NOTES=1 opencraft acp --url ws://127.0.0.1:18789 --token-file ~/.opencraft/gateway.token --session agent:main:main"
    }
  }
}
```

Para um checkout local do repo OpenCraft, use o ponto de entrada CLI direto em vez do
runner de desenvolvimento para que o stream ACP permaneça limpo. Por exemplo:

```bash
env OPENCRAFT_HIDE_BANNER=1 OPENCRAFT_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta é a maneira mais fácil de permitir que Codex, Claude Code ou outro cliente compatível com ACP
obtenha informações contextuais de um agente OpenCraft sem fazer scraping de terminal.

## Configuração do editor Zed

Adicione um agente ACP personalizado em `~/.config/zed/settings.json` (ou use a interface de Configurações do Zed):

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

Para direcionar a um Gateway ou agente específico:

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

No Zed, abra o painel do Agente e selecione "OpenCraft ACP" para iniciar uma conversa.

## Mapeamento de sessão

Por padrão, sessões ACP recebem uma chave de sessão isolada do Gateway com prefixo `acp:`.
Para reutilizar uma sessão conhecida, passe uma chave ou rótulo de sessão:

- `--session <key>`: usar uma chave de sessão específica do Gateway.
- `--session-label <label>`: resolver uma sessão existente por rótulo.
- `--reset-session`: criar um novo ID de sessão para essa chave (mesma chave, nova transcrição).

Se seu cliente ACP suporta metadados, você pode substituir por sessão:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Saiba mais sobre chaves de sessão em [/concepts/session](/concepts/session).

## Opções

- `--url <url>`: URL WebSocket do Gateway (usa gateway.remote.url quando configurado como padrão).
- `--token <token>`: Token de autenticação do Gateway.
- `--token-file <path>`: ler Token de autenticação do Gateway de um arquivo.
- `--password <password>`: senha de autenticação do Gateway.
- `--password-file <path>`: ler senha de autenticação do Gateway de um arquivo.
- `--session <key>`: chave de sessão padrão.
- `--session-label <label>`: rótulo de sessão padrão a resolver.
- `--require-existing`: falhar se a chave/rótulo de sessão não existir.
- `--reset-session`: redefinir a chave de sessão antes do primeiro uso.
- `--no-prefix-cwd`: não prefixar prompts com o diretório de trabalho.
- `--verbose, -v`: log detalhado para stderr.

Nota de segurança:

- `--token` e `--password` podem ser visíveis em listagens de processos locais em alguns sistemas.
- Prefira `--token-file`/`--password-file` ou variáveis de ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- A resolução de autenticação do Gateway segue o contrato compartilhado usado por outros clientes do Gateway:
  - modo local: env (`OPENCRAFT_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` somente quando `gateway.auth.*` não está definido (SecretRefs configurados mas não resolvidos em modo local falham fechados)
  - modo remoto: `gateway.remote.*` com fallback env/config seguindo regras de precedência remota
  - `--url` é seguro para substituição e não reutiliza credenciais implícitas de config/env; passe `--token`/`--password` explícitos (ou variantes de arquivo)
- Processos filho do backend de runtime ACP recebem `OPENCRAFT_SHELL=acp`, que pode ser usado para regras de shell/perfil específicas do contexto.
- `opencraft acp client` define `OPENCRAFT_SHELL=acp-client` no processo da ponte iniciado.

### Opções do `acp client`

- `--cwd <dir>`: diretório de trabalho para a sessão ACP.
- `--server <command>`: comando do servidor ACP (padrão: `opencraft`).
- `--server-args <args...>`: argumentos extras passados ao servidor ACP.
- `--server-verbose`: habilitar log detalhado no servidor ACP.
- `--verbose, -v`: log detalhado do cliente.
