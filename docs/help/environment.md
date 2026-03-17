---
summary: "Onde o OpenCraft carrega variáveis de ambiente e a ordem de precedência"
read_when:
  - Você precisa saber quais variáveis de ambiente são carregadas e em que ordem
  - Você está depurando chaves de API faltando no Gateway
  - Você está documentando autenticação de provedor ou ambientes de implantação
title: "Variáveis de Ambiente"
---

# Variáveis de ambiente

O OpenCraft obtém variáveis de ambiente de múltiplas fontes. A regra é **nunca sobrescrever valores existentes**.

## Precedência (mais alta → mais baixa)

1. **Ambiente do processo** (o que o processo do Gateway já tem do shell/daemon pai).
2. **`.env` no diretório de trabalho atual** (padrão dotenv; não sobrescreve).
3. **`.env` global** em `~/.opencraft/.env` (também `$OPENCRAFT_STATE_DIR/.env`; não sobrescreve).
4. **Bloco `env` da configuração** em `~/.editzffaleta/OpenCraft.json` (aplicado apenas se faltando).
5. **Importação opcional de shell de login** (`env.shellEnv.enabled` ou `OPENCRAFT_LOAD_SHELL_ENV=1`), aplicada apenas para chaves esperadas faltantes.

Se o arquivo de configuração estiver completamente faltando, a etapa 4 é pulada; a importação do shell ainda roda se habilitada.

## Bloco `env` da configuração

Duas formas equivalentes de definir variáveis de ambiente inline (ambas não sobrescrevem):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Importação de env do shell

`env.shellEnv` executa seu shell de login e importa apenas chaves esperadas **faltantes**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Equivalentes em variáveis de ambiente:

- `OPENCRAFT_LOAD_SHELL_ENV=1`
- `OPENCRAFT_SHELL_ENV_TIMEOUT_MS=15000`

## Variáveis de ambiente injetadas em runtime

O OpenCraft também injeta marcadores de contexto em processos filhos gerados:

- `OPENCRAFT_SHELL=exec`: definido para comandos executados pela ferramenta `exec`.
- `OPENCRAFT_SHELL=acp`: definido para spawns de processo backend de runtime ACP (por exemplo `acpx`).
- `OPENCRAFT_SHELL=acp-client`: definido para `opencraft acp client` quando ele gera o processo bridge ACP.
- `OPENCRAFT_SHELL=tui-local`: definido para comandos shell `!` da TUI local.

Estes são marcadores de runtime (não configuração obrigatória do usuário). Podem ser usados em lógica de shell/profile
para aplicar regras específicas de contexto.

## Variáveis de ambiente da UI

- `OPENCRAFT_THEME=light`: forçar a paleta clara da TUI quando seu terminal tem fundo claro.
- `OPENCRAFT_THEME=dark`: forçar a paleta escura da TUI.
- `COLORFGBG`: se seu terminal exporta, o OpenCraft usa a dica de cor de fundo para auto-selecionar a paleta da TUI.

## Substituição de variáveis de ambiente na configuração

Você pode referenciar variáveis de ambiente diretamente em valores de string da configuração usando a sintaxe `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Veja [Configuração: Substituição de variáveis de ambiente](/gateway/configuration#env-var-substitution-in-config) para detalhes completos.

## Referências de secret vs strings `${ENV}`

O OpenCraft suporta dois padrões baseados em env:

- Substituição de string `${VAR}` em valores de configuração.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que suportam referências de secrets.

Ambos resolvem a partir do env do processo no momento da ativação. Detalhes de SecretRef estão documentados em [Gerenciamento de Secrets](/gateway/secrets).

## Variáveis de ambiente relacionadas a caminhos

| Variável                | Propósito                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCRAFT_HOME`        | Sobrescrever o diretório home usado para toda resolução interna de caminhos (`~/.opencraft/`, diretórios de agente, sessões, credenciais). Útil ao rodar OpenCraft como um usuário de serviço dedicado. |
| `OPENCRAFT_STATE_DIR`   | Sobrescrever o diretório de estado (padrão `~/.opencraft`).                                                                                                                                             |
| `OPENCRAFT_CONFIG_PATH` | Sobrescrever o caminho do arquivo de configuração (padrão `~/.editzffaleta/OpenCraft.json`).                                                                                                            |

## Logging

| Variável              | Propósito                                                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCRAFT_LOG_LEVEL` | Sobrescrever nível de log para arquivo e console (ex.: `debug`, `trace`). Tem precedência sobre `logging.level` e `logging.consoleLevel` na configuração. Valores inválidos são ignorados com aviso. |

### `OPENCRAFT_HOME`

Quando definido, `OPENCRAFT_HOME` substitui o diretório home do sistema (`$HOME` / `os.homedir()`) para toda resolução interna de caminhos. Isso permite isolamento completo do sistema de arquivos para contas de serviço headless.

**Precedência:** `OPENCRAFT_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Exemplo** (LaunchDaemon macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCRAFT_HOME</key>
  <string>/Users/kira</string>
</dict>
```

`OPENCRAFT_HOME` também pode ser definido como um caminho com til (ex.: `~/svc`), que é expandido usando `$HOME` antes do uso.

## Relacionado

- [Configuração do Gateway](/gateway/configuration)
- [FAQ: variáveis de ambiente e carregamento de .env](/help/faq#env-vars-and-env-loading)
- [Visão geral de modelos](/concepts/models)
