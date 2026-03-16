---
summary: "Onde o OpenCraft carrega variáveis de ambiente e a ordem de precedência"
read_when:
  - Você precisa saber quais variáveis de env são carregadas e em qual ordem
  - Você está depurando chaves de API ausentes no Gateway
  - Você está documentando auth de provedor ou ambientes de implantação
title: "Variáveis de Ambiente"
---

# Variáveis de ambiente

O OpenCraft obtém variáveis de ambiente de múltiplas fontes. A regra é **nunca sobrescrever valores existentes**.

## Precedência (maior → menor)

1. **Ambiente do processo** (o que o processo do Gateway já tem do shell/daemon pai).
2. **`.env` no diretório de trabalho atual** (padrão dotenv; não sobrescreve).
3. **`.env` global** em `~/.opencraft/.env` (também `$OPENCLAW_STATE_DIR/.env`; não sobrescreve).
4. **Bloco `env` da config** em `~/.opencraft/opencraft.json` (aplicado apenas se ausente).
5. **Importação opcional do shell de login** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada apenas para chaves esperadas ausentes.

Se o arquivo de configuração estiver completamente ausente, o passo 4 é ignorado; a importação do shell ainda roda se habilitada.

## Bloco `env` da config

Duas formas equivalentes de definir variáveis de env inline (ambas não sobrescrevem):

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

`env.shellEnv` executa seu shell de login e importa apenas chaves esperadas **ausentes**:

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

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variáveis de env injetadas em tempo de execução

O OpenCraft também injeta marcadores de contexto em processos filhos iniciados:

- `OPENCLAW_SHELL=exec`: definido para comandos executados pela ferramenta `exec`.
- `OPENCLAW_SHELL=acp`: definido para spawns do processo backend de runtime ACP (por exemplo `acpx`).
- `OPENCLAW_SHELL=acp-client`: definido para `opencraft acp client` quando inicia o processo bridge ACP.
- `OPENCLAW_SHELL=tui-local`: definido para comandos shell `!` do TUI local.

Estes são marcadores de runtime (não configuração obrigatória do usuário). Podem ser usados em lógica de shell/perfil
para aplicar regras específicas de contexto.

## Variáveis de env de UI

- `OPENCLAW_THEME=light`: força a paleta de TUI clara quando seu terminal tem fundo claro.
- `OPENCLAW_THEME=dark`: força a paleta de TUI escura.
- `COLORFGBG`: se seu terminal exportá-lo, o OpenCraft usa a dica de cor de fundo para escolher automaticamente a paleta do TUI.

## Substituição de variável de env na config

Você pode referenciar variáveis de env diretamente em valores de string da config usando a sintaxe `${VAR_NAME}`:

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

Veja [Configuração: Substituição de variável de env](/gateway/configuration#env-var-substitution-in-config) para detalhes completos.

## Refs de segredo vs strings `${ENV}`

O OpenCraft suporta dois padrões baseados em env:

- Substituição de string `${VAR}` em valores de config.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que suportam referências de segredo.

Ambos resolvem a partir do env do processo no momento de ativação. Detalhes do SecretRef estão documentados em [Gerenciamento de Segredos](/gateway/secrets).

## Variáveis de env relacionadas a caminhos

| Variável               | Propósito                                                                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Substitui o diretório home usado para toda resolução de caminho interno (`~/.opencraft/`, diretórios de agente, sessões, credenciais). Útil ao executar o OpenCraft como usuário de serviço dedicado. |
| `OPENCLAW_STATE_DIR`   | Substitui o diretório de estado (padrão `~/.opencraft`).                                                                                                                            |
| `OPENCLAW_CONFIG_PATH` | Substitui o caminho do arquivo de config (padrão `~/.opencraft/opencraft.json`).                                                                                                   |

## Logging

| Variável             | Propósito                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_LOG_LEVEL` | Substitui o nível de log para arquivo e console (ex.: `debug`, `trace`). Tem precedência sobre `logging.level` e `logging.consoleLevel` na config. Valores inválidos são ignorados com aviso. |

### `OPENCLAW_HOME`

Quando definido, `OPENCLAW_HOME` substitui o diretório home do sistema (`$HOME` / `os.homedir()`) para toda resolução de caminho interno. Isso permite isolamento completo do sistema de arquivos para contas de serviço headless.

**Precedência:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Exemplo** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/kira</string>
</dict>
```

`OPENCLAW_HOME` também pode ser definido com um caminho de tilde (ex.: `~/svc`), que é expandido usando `$HOME` antes do uso.

## Relacionado

- [Configuração do gateway](/gateway/configuration)
- [FAQ: variáveis de env e carregamento de .env](/help/faq#env-vars-and-env-loading)
- [Visão geral de modelos](/concepts/models)
