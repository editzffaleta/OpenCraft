---
summary: "Referência CLI para `opencraft secrets` (reload, audit, configure, apply)"
read_when:
  - Re-resolvendo referências secretas em runtime
  - Auditando resíduos de texto puro e referências não resolvidas
  - Configurando SecretRefs e aplicando mudanças de limpeza irreversível
title: "secrets"
---

# `opencraft secrets`

Use `opencraft secrets` para gerenciar SecretRefs e manter o snapshot do runtime ativo saudável.

Funções dos comandos:

- `reload`: RPC do Gateway (`secrets.reload`) que re-resolve referências e troca o snapshot do runtime apenas em caso de sucesso total (sem escritas de config).
- `audit`: varredura somente leitura de armazenamentos de configuração/autenticação/modelo gerado e resíduos legados para texto puro, referências não resolvidas e desvio de precedência.
- `configure`: planejador interativo para configuração de provedor, mapeamento de alvos e pré-voo (TTY obrigatório).
- `apply`: executar um plano salvo (`--dry-run` apenas para validação), depois limpar resíduos de texto puro direcionados.

Loop recomendado para operador:

```bash
opencraft secrets audit --check
opencraft secrets configure
opencraft secrets apply --from /tmp/opencraft-secrets-plan.json --dry-run
opencraft secrets apply --from /tmp/opencraft-secrets-plan.json
opencraft secrets audit --check
opencraft secrets reload
```

Nota sobre código de saída para CI/gates:

- `audit --check` retorna `1` em achados.
- Referências não resolvidas retornam `2`.

Relacionado:

- Guia de segredos: [Secrets Management](/gateway/secrets)
- Superfície de credenciais: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Guia de segurança: [Security](/gateway/security)

## Recarregar snapshot do runtime

Re-resolver referências secretas e trocar atomicamente o snapshot do runtime.

```bash
opencraft secrets reload
opencraft secrets reload --json
```

Notas:

- Usa o método RPC do Gateway `secrets.reload`.
- Se a resolução falhar, o Gateway mantém o snapshot anterior conhecido como bom e retorna erro (sem ativação parcial).
- Resposta JSON inclui `warningCount`.

## Auditoria

Varrer estado do OpenCraft para:

- Armazenamento de segredos em texto puro
- Referências não resolvidas
- Desvio de precedência (credenciais de `auth-profiles.json` sobrepondo referências de `opencraft.json`)
- Resíduos de `agents/*/agent/models.json` gerados (valores `apiKey` de provedor e cabeçalhos sensíveis de provedor)
- Resíduos legados (entradas de armazenamento de autenticação legado, lembretes OAuth)

Nota sobre resíduos de cabeçalho:

- A detecção de cabeçalhos sensíveis de provedor é baseada em heurística de nome (nomes e fragmentos comuns de cabeçalhos de autenticação/credencial como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

```bash
opencraft secrets audit
opencraft secrets audit --check
opencraft secrets audit --json
```

Comportamento de saída:

- `--check` sai com código não zero em achados.
- Referências não resolvidas saem com código não zero de prioridade mais alta.

Destaques do formato do relatório:

- `status`: `clean | findings | unresolved`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- Códigos de achado:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configurar (assistente interativo)

Construir mudanças de provedor e SecretRef interativamente, executar pré-voo e opcionalmente aplicar:

```bash
opencraft secrets configure
opencraft secrets configure --plan-out /tmp/opencraft-secrets-plan.json
opencraft secrets configure --apply --yes
opencraft secrets configure --providers-only
opencraft secrets configure --skip-provider-setup
opencraft secrets configure --agent ops
opencraft secrets configure --json
```

Fluxo:

- Configuração de provedor primeiro (`add/edit/remove` para aliases `secrets.providers`).
- Mapeamento de credenciais segundo (selecionar campos e atribuir referências `{source, provider, id}`).
- Pré-voo e aplicação opcional por último.

Flags:

- `--providers-only`: configurar apenas `secrets.providers`, pular mapeamento de credenciais.
- `--skip-provider-setup`: pular configuração de provedor e mapear credenciais para provedores existentes.
- `--agent <id>`: limitar escopo de descoberta e escritas de alvo `auth-profiles.json` a um armazenamento de agente.

Notas:

- Requer TTY interativo.
- Você não pode combinar `--providers-only` com `--skip-provider-setup`.
- `configure` direciona campos com segredos em `opencraft.json` mais `auth-profiles.json` para o escopo de agente selecionado.
- `configure` suporta criar novos mapeamentos de `auth-profiles.json` diretamente no fluxo do seletor.
- Superfície canônica suportada: [SecretRef Credential Surface](/reference/secretref-credential-surface).
- Realiza resolução de pré-voo antes de aplicar.
- Planos gerados usam opções de limpeza por padrão (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` todos habilitados).
- O caminho de aplicação é irreversível para valores de texto puro limpos.
- Sem `--apply`, o CLI ainda pergunta `Apply this plan now?` após o pré-voo.
- Com `--apply` (e sem `--yes`), o CLI solicita uma confirmação extra de irreversibilidade.

Nota de segurança sobre provedor exec:

- Instalações Homebrew frequentemente expõem binários com symlink em `/opt/homebrew/bin/*`.
- Defina `allowSymlinkCommand: true` apenas quando necessário para caminhos confiáveis de gerenciador de pacotes, e combine com `trustedDirs` (por exemplo `["/opt/homebrew"]`).
- No Windows, se a verificação ACL não estiver disponível para um caminho de provedor, o OpenCraft falha de forma fechada. Apenas para caminhos confiáveis, defina `allowInsecurePath: true` naquele provedor para ignorar verificações de segurança de caminho.

## Aplicar um plano salvo

Aplicar ou validar um plano gerado anteriormente:

```bash
opencraft secrets apply --from /tmp/opencraft-secrets-plan.json
opencraft secrets apply --from /tmp/opencraft-secrets-plan.json --dry-run
opencraft secrets apply --from /tmp/opencraft-secrets-plan.json --json
```

Detalhes do contrato do plano (caminhos de alvo permitidos, regras de validação e semântica de falha):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

O que `apply` pode atualizar:

- `opencraft.json` (alvos SecretRef + upserts/deletes de provedor)
- `auth-profiles.json` (limpeza de alvo de provedor)
- Resíduos legados de `auth.json`
- Chaves secretas conhecidas de `~/.opencraft/.env` cujos valores foram migrados

## Por que não há backups de rollback

`secrets apply` intencionalmente não escreve backups de rollback contendo valores antigos em texto puro.

A segurança vem de pré-voo rigoroso + aplicação atômica com restauração em memória de melhor esforço em caso de falha.

## Exemplo

```bash
opencraft secrets audit --check
opencraft secrets configure
opencraft secrets audit --check
```

Se `audit --check` ainda reportar achados de texto puro, atualize os caminhos de alvo restantes reportados e execute a auditoria novamente.
