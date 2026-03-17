---
summary: "Gerenciamento de secrets: contrato SecretRef, comportamento de snapshot em runtime e scrubbing seguro unidirecional"
read_when:
  - Configurando SecretRefs para credenciais de provider e refs de `auth-profiles.json`
  - Operando reload, auditoria, configuração e apply de secrets com segurança em produção
  - Entendendo comportamento de fail-fast na inicialização, filtragem de superfície inativa e last-known-good
title: "Secrets Management"
---

# Gerenciamento de secrets

OpenCraft suporta SecretRefs aditivos para que credenciais suportadas não precisem ser armazenadas como texto puro na configuração.

Texto puro ainda funciona. SecretRefs são opt-in por credencial.

## Objetivos e modelo de runtime

Secrets são resolvidos em um snapshot de runtime em memória.

- A resolução é eager durante a ativação, não lazy nos caminhos de requisição.
- A inicialização falha rápido quando um SecretRef efetivamente ativo não pode ser resolvido.
- O reload usa troca atômica: sucesso total, ou mantém o snapshot last-known-good.
- Requisições em runtime leem apenas do snapshot ativo em memória.
- Caminhos de entrega de saída também leem desse snapshot ativo (por exemplo entrega de resposta/thread do Discord e envios de ação do Telegram); eles não re-resolvem SecretRefs a cada envio.

Isso mantém indisponibilidades de provedores de secrets fora dos caminhos quentes de requisição.

## Filtragem de superfície ativa

SecretRefs são validados apenas em superfícies efetivamente ativas.

- Superfícies habilitadas: refs não resolvidos bloqueiam inicialização/reload.
- Superfícies inativas: refs não resolvidos não bloqueiam inicialização/reload.
- Refs inativos emitem diagnósticos não fatais com código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Exemplos de superfícies inativas:

- Entradas de canal/conta desabilitadas.
- Credenciais de canal de nível superior que nenhuma conta habilitada herda.
- Superfícies de ferramenta/funcionalidade desabilitadas.
- Chaves específicas de provedor de busca web que não estão selecionadas por `tools.web.search.provider`.
  No modo auto (provider não definido), as chaves são consultadas por precedência para auto-detecção de provider até uma resolver.
  Após a seleção, chaves de providers não selecionados são tratadas como inativas até serem selecionadas.
- Material de autenticação SSH de sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, mais overrides por agente) é ativo apenas
  quando o backend de sandbox efetivo é `ssh` para o agente padrão ou um agente habilitado.
- SecretRefs de `gateway.remote.token` / `gateway.remote.password` são ativos se uma destas condições for verdadeira:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurada
  - `gateway.tailscale.mode` é `serve` ou `funnel`
  - No modo local sem essas superfícies remotas:
    - `gateway.remote.token` é ativo quando a autenticação por token pode vencer e nenhum token de env/auth está configurado.
    - `gateway.remote.password` é ativo apenas quando a autenticação por password pode vencer e nenhum password de env/auth está configurado.
- O SecretRef de `gateway.auth.token` é inativo para resolução de auth na inicialização quando `OPENCLAW_GATEWAY_TOKEN` (ou `CLAWDBOT_GATEWAY_TOKEN`) está definido, porque a entrada de token via env vence para esse runtime.

## Diagnósticos de superfície de auth do Gateway

Quando um SecretRef é configurado em `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` ou `gateway.remote.password`, a inicialização/reload do gateway registra o
estado da superfície explicitamente:

- `active`: o SecretRef faz parte da superfície de auth efetiva e deve resolver.
- `inactive`: o SecretRef é ignorado para este runtime porque outra superfície de auth vence, ou
  porque auth remoto está desabilitado/não ativo.

Essas entradas são registradas com `SECRETS_GATEWAY_AUTH_SURFACE` e incluem a razão usada pela
política de superfície ativa, para que você possa ver por que uma credencial foi tratada como ativa ou inativa.

## Preflight de referência de onboarding

Quando o onboarding executa em modo interativo e você escolhe armazenamento SecretRef, o OpenCraft executa validação de preflight antes de salvar:

- Refs de env: valida o nome da variável de ambiente e confirma que um valor não vazio está visível durante o setup.
- Refs de provider (`file` ou `exec`): valida a seleção de provider, resolve `id` e verifica o tipo do valor resolvido.
- Caminho de reutilização quickstart: quando `gateway.auth.token` já é um SecretRef, o onboarding resolve-o antes do bootstrap de probe/dashboard (para refs `env`, `file` e `exec`) usando o mesmo gate fail-fast.

Se a validação falhar, o onboarding mostra o erro e permite que você tente novamente.

## Contrato SecretRef

Use um formato de objeto em todos os lugares:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Validação:

- `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
- `id` deve corresponder a `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Validação:

- `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
- `id` deve ser um ponteiro JSON absoluto (`/...`)
- Escape RFC6901 em segmentos: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Validação:

- `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
- `id` deve corresponder a `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` não deve conter `.` ou `..` como segmentos de caminho delimitados por barra (por exemplo `a/../b` é rejeitado)

## Configuração de provider

Defina providers em `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.opencraft/secrets.json",
        mode: "json", // ou "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/opencraft-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Provider de env

- Allowlist opcional via `allowlist`.
- Valores de env ausentes/vazios falham na resolução.

### Provider de file

- Lê arquivo local de `path`.
- `mode: "json"` espera payload de objeto JSON e resolve `id` como ponteiro.
- `mode: "singleValue"` espera ref id `"value"` e retorna o conteúdo do arquivo.
- O caminho deve passar verificações de propriedade/permissão.
- Nota de fail-closed no Windows: se a verificação de ACL não estiver disponível para um caminho, a resolução falha. Para caminhos confiáveis apenas, defina `allowInsecurePath: true` nesse provider para ignorar verificações de segurança de caminho.

### Provider de exec

- Executa o binário de caminho absoluto configurado, sem shell.
- Por padrão, `command` deve apontar para um arquivo regular (não um symlink).
- Defina `allowSymlinkCommand: true` para permitir caminhos de comando symlink (por exemplo shims do Homebrew). O OpenCraft valida o caminho alvo resolvido.
- Combine `allowSymlinkCommand` com `trustedDirs` para caminhos de gerenciadores de pacotes (por exemplo `["/opt/homebrew"]`).
- Suporta timeout, timeout de sem saída, limites de bytes de saída, allowlist de env e diretórios confiáveis.
- Nota de fail-closed no Windows: se a verificação de ACL não estiver disponível para o caminho do comando, a resolução falha. Para caminhos confiáveis apenas, defina `allowInsecurePath: true` nesse provider para ignorar verificações de segurança de caminho.

Payload de requisição (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload de resposta (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Erros opcionais por id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exemplos de integração exec

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // necessário para binários com symlink do Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenCraft QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // necessário para binários com symlink do Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/opencraft"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // necessário para binários com symlink do Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## Material de autenticação SSH do sandbox

O backend de sandbox `ssh` central também suporta SecretRefs para material de autenticação SSH:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Comportamento em runtime:

- O OpenCraft resolve esses refs durante a ativação do sandbox, não de forma lazy durante cada chamada SSH.
- Valores resolvidos são escritos em arquivos temporários com permissões restritivas e usados na configuração SSH gerada.
- Se o backend de sandbox efetivo não for `ssh`, esses refs permanecem inativos e não bloqueiam a inicialização.

## Superfície de credenciais suportada

Credenciais suportadas e não suportadas canônicas estão listadas em:

- [Superfície de Credenciais SecretRef](/reference/secretref-credential-surface)

Credenciais geradas em runtime ou rotacionadas e material de refresh OAuth são intencionalmente excluídos da resolução SecretRef somente leitura.

## Comportamento obrigatório e precedência

- Campo sem ref: inalterado.
- Campo com ref: obrigatório em superfícies ativas durante a ativação.
- Se tanto texto puro quanto ref estiverem presentes, ref tem precedência nos caminhos de precedência suportados.

Sinais de aviso e auditoria:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (aviso de runtime)
- `REF_SHADOWED` (achado de auditoria quando credenciais de `auth-profiles.json` têm precedência sobre refs de `opencraft.json`)

Comportamento de compatibilidade do Google Chat:

- `serviceAccountRef` tem precedência sobre `serviceAccount` em texto puro.
- O valor em texto puro é ignorado quando o ref irmão está definido.

## Gatilhos de ativação

A ativação de secrets executa em:

- Inicialização (preflight mais ativação final)
- Caminho de hot-apply de reload de config
- Caminho de restart-check de reload de config
- Reload manual via `secrets.reload`

Contrato de ativação:

- Sucesso troca o snapshot atomicamente.
- Falha na inicialização aborta o startup do gateway.
- Falha no reload em runtime mantém o snapshot last-known-good.
- Fornecer um token de canal explícito por chamada a um helper/ferramenta de saída não aciona ativação de SecretRef; os pontos de ativação permanecem inicialização, reload e `secrets.reload` explícito.

## Sinais de degradado e recuperado

Quando a ativação em tempo de reload falha após um estado saudável, o OpenCraft entra em estado degradado de secrets.

Códigos de log e eventos de sistema one-shot:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradado: runtime mantém o snapshot last-known-good.
- Recuperado: emitido uma vez após a próxima ativação bem-sucedida.
- Falhas repetidas enquanto já degradado registram avisos mas não geram spam de eventos.
- Fail-fast na inicialização não emite eventos degradados porque o runtime nunca ficou ativo.

## Resolução em caminhos de comando

Caminhos de comando podem optar por resolução SecretRef suportada via RPC de snapshot do gateway.

Existem dois comportamentos amplos:

- Caminhos de comando estritos (por exemplo caminhos remote-memory de `opencraft memory` e `opencraft qr --remote`) leem do snapshot ativo e falham rápido quando um SecretRef obrigatório não está disponível.
- Caminhos de comando somente leitura (por exemplo `opencraft status`, `opencraft status --all`, `opencraft channels status`, `opencraft channels resolve`, `opencraft security audit` e fluxos somente leitura de doctor/config repair) também preferem o snapshot ativo, mas degradam em vez de abortar quando um SecretRef direcionado não está disponível nesse caminho de comando.

Comportamento somente leitura:

- Quando o gateway está executando, esses comandos leem primeiro do snapshot ativo.
- Se a resolução do gateway estiver incompleta ou o gateway não estiver disponível, eles tentam fallback local direcionado para a superfície específica do comando.
- Se um SecretRef direcionado ainda não estiver disponível, o comando continua com saída somente leitura degradada e diagnósticos explícitos como "configurado mas indisponível neste caminho de comando".
- Esse comportamento degradado é apenas local ao comando. Ele não enfraquece caminhos de inicialização, reload ou envio/auth em runtime.

Outras notas:

- A atualização do snapshot após rotação de secrets no backend é feita por `opencraft secrets reload`.
- Método RPC do gateway usado por esses caminhos de comando: `secrets.resolve`.

## Fluxo de auditoria e configuração

Fluxo padrão do operador:

```bash
opencraft secrets audit --check
opencraft secrets configure
opencraft secrets audit --check
```

### `secrets audit`

Achados incluem:

- valores em texto puro em repouso (`opencraft.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` gerado)
- resíduos de headers sensíveis de provider em texto puro em entradas `models.json` geradas
- refs não resolvidos
- sombreamento de precedência (`auth-profiles.json` tendo prioridade sobre refs de `opencraft.json`)
- resíduos legados (`auth.json`, lembretes OAuth)

Nota sobre resíduos de header:

- A detecção de headers sensíveis de provider é baseada em heurística de nome (nomes e fragmentos comuns de headers de auth/credencial como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

### `secrets configure`

Helper interativo que:

- configura `secrets.providers` primeiro (`env`/`file`/`exec`, adicionar/editar/remover)
- permite selecionar campos suportados que contêm secrets em `opencraft.json` mais `auth-profiles.json` para um escopo de agente
- pode criar um novo mapeamento de `auth-profiles.json` diretamente no seletor de alvo
- captura detalhes do SecretRef (`source`, `provider`, `id`)
- executa resolução de preflight
- pode aplicar imediatamente

Modos úteis:

- `opencraft secrets configure --providers-only`
- `opencraft secrets configure --skip-provider-setup`
- `opencraft secrets configure --agent <id>`

Padrões de apply do `configure`:

- limpa credenciais estáticas correspondentes de `auth-profiles.json` para providers direcionados
- limpa entradas estáticas legadas de `api_key` de `auth.json`
- limpa linhas de secrets conhecidas correspondentes de `<config-dir>/.env`

### `secrets apply`

Aplicar um plano salvo:

```bash
opencraft secrets apply --from /tmp/opencraft-secrets-plan.json
opencraft secrets apply --from /tmp/opencraft-secrets-plan.json --dry-run
```

Para detalhes estritos de contrato de alvo/caminho e regras exatas de rejeição, veja:

- [Contrato de Plano de Secrets Apply](/gateway/secrets-plan-contract)

## Política de segurança unidirecional

O OpenCraft intencionalmente não escreve backups de rollback contendo valores históricos de secrets em texto puro.

Modelo de segurança:

- preflight deve ter sucesso antes do modo de escrita
- ativação em runtime é validada antes do commit
- apply atualiza arquivos usando substituição atômica de arquivo e restauração best-effort em caso de falha

## Notas de compatibilidade de auth legado

Para credenciais estáticas, o runtime não depende mais de armazenamento de auth legado em texto puro.

- A fonte de credenciais em runtime é o snapshot resolvido em memória.
- Entradas estáticas legadas de `api_key` são limpas quando descobertas.
- Comportamento de compatibilidade relacionado a OAuth permanece separado.

## Nota sobre Web UI

Algumas uniões SecretInput são mais fáceis de configurar no modo de editor raw do que no modo de formulário.

## Documentação relacionada

- Comandos CLI: [secrets](/cli/secrets)
- Detalhes de contrato de plano: [Contrato de Plano de Secrets Apply](/gateway/secrets-plan-contract)
- Superfície de credenciais: [Superfície de Credenciais SecretRef](/reference/secretref-credential-surface)
- Setup de autenticação: [Autenticação](/gateway/authentication)
- Postura de segurança: [Segurança](/gateway/security)
- Precedência de variáveis de ambiente: [Variáveis de Ambiente](/help/environment)
