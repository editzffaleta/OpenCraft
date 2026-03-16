---
summary: "Referência do CLI para `opencraft secrets` (reload, audit, configure, apply)"
read_when:
  - Re-resolvendo refs de segredo em runtime
  - Auditando resíduos em texto simples e refs não resolvidas
  - Configurando SecretRefs e aplicando mudanças de scrub unidirecional
title: "secrets"
---

# `opencraft secrets`

Use `opencraft secrets` para gerenciar SecretRefs e manter o snapshot de runtime ativo saudável.

Papéis dos comandos:

- `reload`: RPC do gateway (`secrets.reload`) que re-resolve refs e troca o snapshot de runtime apenas em sucesso completo (sem writes de config).
- `audit`: scan read-only de configuração/auth/stores de modelos gerados e resíduos legados para texto simples, refs não resolvidas e deriva de precedência.
- `configure`: planejador interativo para setup de provedor, mapeamento de alvo e preflight (requer TTY).
- `apply`: executar um plano salvo (`--dry-run` apenas para validação), depois scrub de resíduos em texto simples direcionados.

Loop recomendado do operador:

```bash
opencraft secrets audit --check
opencraft secrets configure
opencraft secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
opencraft secrets apply --from /tmp/openclaw-secrets-plan.json
opencraft secrets audit --check
opencraft secrets reload
```

Nota de código de saída para CI/gates:

- `audit --check` retorna `1` em findings.
- refs não resolvidas retornam `2`.

Relacionado:

- Guia de segredos: [Secrets Management](/gateway/secrets)
- Superfície de credencial: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Guia de segurança: [Security](/gateway/security)

## Recarregar snapshot de runtime

Re-resolver refs de segredo e trocar atomicamente o snapshot de runtime.

```bash
opencraft secrets reload
opencraft secrets reload --json
```

Notas:

- Usa o método RPC do gateway `secrets.reload`.
- Se a resolução falhar, o gateway mantém o último snapshot conhecido e retorna um erro (sem ativação parcial).
- Resposta JSON inclui `warningCount`.

## Audit

Escanear estado do OpenCraft para:

- armazenamento de segredo em texto simples
- refs não resolvidas
- deriva de precedência (credenciais de `auth-profiles.json` sombreando refs de `opencraft.json`)
- resíduos de `agents/*/agent/models.json` gerados (valores `apiKey` do provedor e cabeçalhos sensíveis do provedor)
- resíduos legados (entradas legadas de auth store, lembretes OAuth)

Nota de resíduo de cabeçalho:

- Detecção de cabeçalho sensível de provedor é baseada em heurística de nome (nomes e fragmentos comuns de cabeçalho de auth/credencial como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

```bash
opencraft secrets audit
opencraft secrets audit --check
opencraft secrets audit --json
```

Comportamento de saída:

- `--check` sai com não-zero em findings.
- refs não resolvidas saem com código não-zero de prioridade mais alta.

Destaques da forma do relatório:

- `status`: `clean | findings | unresolved`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- códigos de finding:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (helper interativo)

Construir mudanças de provedor e SecretRef interativamente, rodar preflight e opcionalmente aplicar:

```bash
opencraft secrets configure
opencraft secrets configure --plan-out /tmp/openclaw-secrets-plan.json
opencraft secrets configure --apply --yes
opencraft secrets configure --providers-only
opencraft secrets configure --skip-provider-setup
opencraft secrets configure --agent ops
opencraft secrets configure --json
```

Fluxo:

- Setup de provedor primeiro (`add/edit/remove` para aliases de `secrets.providers`).
- Mapeamento de credencial segundo (selecionar campos e atribuir refs `{source, provider, id}`).
- Preflight e apply opcional por último.

Flags:

- `--providers-only`: configurar apenas `secrets.providers`, pular mapeamento de credencial.
- `--skip-provider-setup`: pular setup de provedor e mapear credenciais para provedores existentes.
- `--agent <id>`: escopo de descoberta de alvo e writes de `auth-profiles.json` para um store de agente.

Notas:

- Requer um TTY interativo.
- Você não pode combinar `--providers-only` com `--skip-provider-setup`.
- `configure` visa campos com segredos em `opencraft.json` mais `auth-profiles.json` para o escopo de agente selecionado.
- `configure` suporta criar novos mapeamentos de `auth-profiles.json` diretamente no fluxo do picker.
- Superfície suportada canônica: [SecretRef Credential Surface](/reference/secretref-credential-surface).
- Realiza resolução de preflight antes do apply.
- Planos gerados padrão para opções de scrub (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` todos habilitados).
- Path de apply é unidirecional para valores em texto simples scrubados.
- Sem `--apply`, o CLI ainda solicita `Apply this plan now?` após o preflight.
- Com `--apply` (e sem `--yes`), o CLI solicita uma confirmação irreversível extra.

Nota de segurança do provedor exec:

- Instalações Homebrew frequentemente expõem binários com links simbólicos em `/opt/homebrew/bin/*`.
- Defina `allowSymlinkCommand: true` apenas quando necessário para paths de gerenciadores de pacotes confiáveis, e combine com `trustedDirs` (por exemplo `["/opt/homebrew"]`).
- No Windows, se a verificação ACL não estiver disponível para um path de provedor, OpenCraft falha fechado. Para paths apenas confiáveis, defina `allowInsecurePath: true` naquele provedor para ignorar verificações de segurança de path.

## Aplicar um plano salvo

Aplicar ou fazer preflight de um plano gerado anteriormente:

```bash
opencraft secrets apply --from /tmp/openclaw-secrets-plan.json
opencraft secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
opencraft secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Detalhes do contrato do plano (paths de alvo permitidos, regras de validação e semântica de falha):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

O que `apply` pode atualizar:

- `opencraft.json` (alvos SecretRef + upserts/deletes de provedor)
- `auth-profiles.json` (scrubbing de alvo-provedor)
- resíduos legados de `auth.json`
- chaves de segredo conhecidas em `~/.opencraft/.env` cujos valores foram migrados

## Por que não há backups de rollback

`secrets apply` intencionalmente não escreve backups de rollback contendo valores antigos em texto simples.

A segurança vem de preflight estrito + apply atômico com restauração in-memory de melhor esforço em falha.

## Exemplo

```bash
opencraft secrets audit --check
opencraft secrets configure
opencraft secrets audit --check
```

Se `audit --check` ainda reportar findings de texto simples, atualize os paths de alvo reportados restantes e rode o audit novamente.
