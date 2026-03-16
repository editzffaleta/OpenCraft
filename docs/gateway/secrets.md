---
summary: "Gerenciamento de segredos: contrato SecretRef, comportamento de snapshot em runtime e limpeza segura unidirecional"
read_when:
  - Configurando SecretRefs para credenciais de provedor e refs de auth-profiles.json
  - Operando reload, auditoria, configuração e aplicação segura de segredos em produção
  - Entendendo fail-fast na inicialização, filtragem de superfície inativa e comportamento de last-known-good
title: "Gerenciamento de Segredos"
---

# Gerenciamento de segredos

O OpenCraft suporta SecretRefs aditivos para que credenciais suportadas não precisem ser armazenadas como texto simples na configuração.

Texto simples ainda funciona. SecretRefs são opt-in por credencial.

## Objetivos e modelo de runtime

Segredos são resolvidos em um snapshot de runtime em memória.

- A resolução é eager durante a ativação, não lazy em caminhos de requisição.
- A inicialização falha rápido quando um SecretRef efetivamente ativo não pode ser resolvido.
- O reload usa troca atômica: sucesso completo, ou manter o snapshot last-known-good.
- Requisições de runtime leem apenas do snapshot ativo em memória.
- Caminhos de entrega de saída também leem desse snapshot ativo (por exemplo entrega de resposta/thread do Discord e envios de ação do Telegram); eles não re-resolvem SecretRefs a cada envio.

Isso mantém interrupções do provedor de segredos fora dos caminhos de requisição críticos.

## Filtragem de superfície ativa

SecretRefs são validados apenas em superfícies efetivamente ativas.

- Superfícies habilitadas: refs não resolvidos bloqueiam inicialização/reload.
- Superfícies inativas: refs não resolvidos não bloqueiam inicialização/reload.
- Refs inativos emitem diagnósticos não-fatais com código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Exemplos de superfícies inativas:

- Entradas de canal/conta desabilitadas.
- Credenciais de canal de nível superior que nenhuma conta habilitada herda.
- Superfícies de tool/feature desabilitadas.
- Chaves específicas de provedor de busca web que não são selecionadas por `tools.web.search.provider`.
  No modo auto (provedor não definido), chaves são consultadas por precedência para auto-detecção do provedor até que uma resolva.
  Após a seleção, chaves de provedores não selecionados são tratadas como inativas até serem selecionadas.
- SecretRefs de `gateway.remote.token` / `gateway.remote.password` são ativos se um destes for verdadeiro:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurado
  - `gateway.tailscale.mode` é `serve` ou `funnel`
  - Em modo local sem essas superfícies remotas:
    - `gateway.remote.token` é ativo quando auth de token pode ganhar e nenhum token de env/auth está configurado.
    - `gateway.remote.password` é ativo apenas quando auth de senha pode ganhar e nenhuma senha de env/auth está configurada.
- SecretRef de `gateway.auth.token` é inativo para resolução de auth na inicialização quando `OPENCLAW_GATEWAY_TOKEN` (ou `CLAWDBOT_GATEWAY_TOKEN`) está definido, porque o input de token de env ganha para esse runtime.

## Diagnósticos de superfície de auth do Gateway

Quando um SecretRef está configurado em `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token`, ou `gateway.remote.password`, a inicialização/reload do gateway registra
o estado da superfície explicitamente:

- `active`: o SecretRef faz parte da superfície de auth efetiva e deve resolver.
- `inactive`: o SecretRef é ignorado para este runtime porque outra superfície de auth ganha, ou
  porque a auth remota está desabilitada/não ativa.

Essas entradas são registradas com `SECRETS_GATEWAY_AUTH_SURFACE` e incluem a razão usada pela
política de superfície ativa, para que você possa ver por que uma credencial foi tratada como ativa ou inativa.

## Preflight de referência no onboarding

Quando o onboarding roda em modo interativo e você escolhe armazenamento SecretRef, o OpenCraft executa validação preflight antes de salvar:

- Refs de env: valida o nome da variável de env e confirma que um valor não-vazio é visível durante o onboarding.
- Refs de provedor (`file` ou `exec`): valida a seleção do provedor, resolve `id` e verifica o tipo do valor resolvido.
- Caminho de reuso de quickstart: quando `gateway.auth.token` já é um SecretRef, o onboarding o resolve antes do probe/bootstrap do dashboard (para refs `env`, `file` e `exec`) usando o mesmo portão de fail-fast.

Se a validação falhar, o onboarding mostra o erro e permite que você tente novamente.

## Contrato SecretRef

Use uma forma de objeto em todo lugar:

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
- `id` não deve conter `.` ou `..` como segmentos de path delimitados por barra (por exemplo `a/../b` é rejeitado)

## Config de provedor

Defina provedores em `secrets.providers`:

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

### Provedor env

- Allowlist opcional via `allowlist`.
- Valores de env ausentes/vazios falham na resolução.

### Provedor file

- Lê arquivo local de `path`.
- `mode: "json"` espera payload de objeto JSON e resolve `id` como ponteiro.
- `mode: "singleValue"` espera id de ref `"value"` e retorna o conteúdo do arquivo.
- O path deve passar verificações de propriedade/permissão.
- Nota de falha fechada no Windows: se a verificação de ACL não estiver disponível para um path, a resolução falha. Para paths confiáveis apenas, defina `allowInsecurePath: true` nesse provedor para bypass das verificações de segurança do path.

### Provedor exec

- Roda o caminho de binário absoluto configurado, sem shell.
- Por padrão, `command` deve apontar para um arquivo regular (não um symlink).
- Defina `allowSymlinkCommand: true` para permitir paths de comando symlink (por exemplo shims do Homebrew). O OpenCraft valida o path de destino resolvido.
- Combine `allowSymlinkCommand` com `trustedDirs` para paths de gerenciador de pacotes (por exemplo `["/opt/homebrew"]`).
- Suporta timeout, timeout sem saída, limites de bytes de saída, allowlist de env e diretórios confiáveis.
- Nota de falha fechada no Windows: se a verificação de ACL não estiver disponível para o path do comando, a resolução falha. Para paths confiáveis apenas, defina `allowInsecurePath: true` nesse provedor para bypass das verificações de segurança do path.

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

### CLI 1Password

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // obrigatório para binários symlink do Homebrew
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
        allowSymlinkCommand: true, // obrigatório para binários symlink do Homebrew
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
        allowSymlinkCommand: true, // obrigatório para binários symlink do Homebrew
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

## Superfície de credencial suportada

Credenciais suportadas e não suportadas canônicas estão listadas em:

- [Superfície de Credencial SecretRef](/reference/secretref-credential-surface)

Credenciais mintadas em runtime ou rotativas e material de refresh OAuth são intencionalmente excluídos da resolução SecretRef somente-leitura.

## Comportamento obrigatório e precedência

- Campo sem ref: inalterado.
- Campo com ref: obrigatório em superfícies ativas durante a ativação.
- Se texto simples e ref estiverem presentes, o ref tem precedência em caminhos de precedência suportados.

Sinais de aviso e auditoria:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (aviso de runtime)
- `REF_SHADOWED` (achado de auditoria quando credenciais de `auth-profiles.json` têm precedência sobre refs de `opencraft.json`)

Comportamento de compatibilidade do Google Chat:

- `serviceAccountRef` tem precedência sobre `serviceAccount` em texto simples.
- Valor em texto simples é ignorado quando ref irmão está definido.

## Gatilhos de ativação

Ativação de segredos roda em:

- Inicialização (preflight mais ativação final)
- Caminho de hot-apply de reload de config
- Caminho de verificação de restart de reload de config
- Reload manual via `secrets.reload`

Contrato de ativação:

- Sucesso troca o snapshot atomicamente.
- Falha na inicialização aborta a inicialização do gateway.
- Falha no reload de runtime mantém o snapshot last-known-good.
- Fornecer um token de canal por chamada explícito a uma chamada de helper/tool de saída não aciona a ativação de SecretRef; os pontos de ativação permanecem inicialização, reload e `secrets.reload` explícito.

## Sinais de degradação e recuperação

Quando a ativação em tempo de reload falha após um estado saudável, o OpenCraft entra no estado de segredos degradados.

Códigos de evento de sistema e log one-shot:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradado: runtime mantém o snapshot last-known-good.
- Recuperado: emitido uma vez após a próxima ativação bem-sucedida.
- Falhas repetidas enquanto já degradado registram avisos mas não spamam eventos.
- Fail-fast na inicialização não emite eventos degradados porque o runtime nunca se tornou ativo.

## Resolução de caminho de comando

Caminhos de comando podem optar pela resolução de SecretRef suportada via RPC de snapshot do gateway.

Há dois comportamentos amplos:

- Caminhos de comando estritos (por exemplo caminhos de memória remota `opencraft memory` e `opencraft qr --remote`) leem do snapshot ativo e falham rápido quando um SecretRef necessário está indisponível.
- Caminhos de comando somente-leitura (por exemplo `opencraft status`, `opencraft status --all`, `opencraft channels status`, `opencraft channels resolve` e fluxos de reparo de config/doctor somente-leitura) também preferem o snapshot ativo, mas degradam em vez de abortar quando um SecretRef direcionado está indisponível nesse caminho de comando.

Comportamento somente-leitura:

- Quando o gateway está rodando, esses comandos leem do snapshot ativo primeiro.
- Se a resolução do gateway está incompleta ou o gateway está indisponível, eles tentam fallback local direcionado para a superfície de comando específica.
- Se um SecretRef direcionado ainda está indisponível, o comando continua com saída somente-leitura degradada e diagnósticos explícitos como "configured but unavailable in this command path".
- Esse comportamento degradado é somente local do comando. Ele não enfraquece os caminhos de inicialização, reload ou envio/auth de runtime.

Outras notas:

- Refresh do snapshot após rotação de segredo de backend é gerenciado por `opencraft secrets reload`.
- Método RPC do Gateway usado por esses caminhos de comando: `secrets.resolve`.

## Fluxo de auditoria e configuração

Fluxo padrão do operador:

```bash
opencraft secrets audit --check
opencraft secrets configure
opencraft secrets audit --check
```

### `secrets audit`

Achados incluem:

- valores em texto simples em repouso (`opencraft.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` gerados)
- resíduos de header de provedor sensível em texto simples em entradas `models.json` geradas
- refs não resolvidos
- shadowing de precedência (`auth-profiles.json` tendo prioridade sobre refs de `opencraft.json`)
- resíduos legados (`auth.json`, lembretes de OAuth)

Nota de resíduo de header:

- A detecção de header de provedor sensível é baseada em heurística de nome (nomes de header de auth/credencial comuns e fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

### `secrets configure`

Helper interativo que:

- configura `secrets.providers` primeiro (`env`/`file`/`exec`, adicionar/editar/remover)
- permite selecionar campos com suporte a segredos em `opencraft.json` mais `auth-profiles.json` para um escopo de agente
- pode criar um novo mapeamento `auth-profiles.json` diretamente no seletor de alvo
- captura detalhes do SecretRef (`source`, `provider`, `id`)
- roda validação preflight
- pode aplicar imediatamente

Modos úteis:

- `opencraft secrets configure --providers-only`
- `opencraft secrets configure --skip-provider-setup`
- `opencraft secrets configure --agent <id>`

Padrões de apply do `configure`:

- limpar credenciais estáticas correspondentes de `auth-profiles.json` para provedores direcionados
- limpar entradas `api_key` estáticas legadas de `auth.json`
- limpar linhas de segredo conhecidas correspondentes de `<config-dir>/.env`

### `secrets apply`

Aplique um plano salvo:

```bash
opencraft secrets apply --from /tmp/openclaw-secrets-plan.json
opencraft secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
```

Para detalhes estritos de contrato de alvo/path e regras de rejeição exatas, veja:

- [Contrato do Plano Secrets Apply](/gateway/secrets-plan-contract)

## Política de segurança unidirecional

O OpenCraft intencionalmente não escreve backups de rollback contendo valores históricos de segredos em texto simples.

Modelo de segurança:

- preflight deve ter sucesso antes do modo de escrita
- a ativação de runtime é validada antes do commit
- apply atualiza arquivos usando substituição atômica de arquivo e restauração best-effort em caso de falha

## Notas de compatibilidade de auth legada

Para credenciais estáticas, o runtime não depende mais de armazenamento legado de auth em texto simples.

- A fonte de credencial de runtime é o snapshot em memória resolvido.
- Entradas `api_key` estáticas legadas são limpas quando descobertas.
- O comportamento de compatibilidade relacionado a OAuth permanece separado.

## Nota da Web UI

Algumas uniões SecretInput são mais fáceis de configurar no modo de editor raw do que no modo de formulário.

## Docs relacionados

- Comandos CLI: [secrets](/cli/secrets)
- Detalhes do contrato do plano: [Contrato do Plano Secrets Apply](/gateway/secrets-plan-contract)
- Superfície de credencial: [Superfície de Credencial SecretRef](/reference/secretref-credential-surface)
- Configuração de auth: [Autenticação](/gateway/authentication)
- Postura de segurança: [Segurança](/gateway/security)
- Precedência de variáveis de ambiente: [Variáveis de Ambiente](/help/environment)
