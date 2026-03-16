---
summary: "Referência do CLI para `opencraft security` (auditar e corrigir footguns de segurança comuns)"
read_when:
  - Você quer rodar uma auditoria de segurança rápida na config/estado
  - Você quer aplicar sugestões de "fix" seguras (chmod, apertar padrões)
title: "security"
---

# `opencraft security`

Ferramentas de segurança (auditoria + correções opcionais).

Relacionado:

- Guia de segurança: [Security](/gateway/security)

## Audit

```bash
opencraft security audit
opencraft security audit --deep
opencraft security audit --fix
opencraft security audit --json
```

A auditoria avisa quando múltiplos remetentes de DM compartilham a sessão principal e recomenda o **modo DM seguro**: `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` para canais multi-conta) para inboxes compartilhados.
Isso é para hardening de inbox cooperativo/compartilhado. Um único Gateway compartilhado por operadores mutuamente não confiáveis/adversariais não é uma configuração recomendada; separe limites de confiança com gateways separados (ou usuários/hosts de OS separados).
Também emite `security.trust_model.multi_user_heuristic` quando a config sugere provável ingresso multi-usuário (por exemplo política aberta de DM/grupo, alvos de grupo configurados, ou regras de remetente com wildcard), e lembra que OpenCraft é um modelo de confiança de assistente pessoal por padrão.
Para configurações multi-usuário intencionais, a orientação da auditoria é sandboxear todas as sessões, manter acesso ao filesystem com escopo de workspace, e manter identidades pessoais/privadas ou credenciais fora daquele runtime.
Também avisa quando modelos pequenos (`<=300B`) são usados sem sandboxing e com tools web/browser habilitadas.
Para ingresso webhook, avisa quando `hooks.defaultSessionKey` não está definido, quando overrides de `sessionKey` de requisição estão habilitados, e quando overrides estão habilitados sem `hooks.allowedSessionKeyPrefixes`.
Também avisa quando configurações Docker de sandbox estão definidas enquanto o modo sandbox está desligado, quando `gateway.nodes.denyCommands` usa entradas pattern-like/desconhecidas inefetivas (apenas correspondência exata de nome de comando de node, não filtragem de texto shell), quando `gateway.nodes.allowCommands` habilita explicitamente comandos de node perigosos, quando `tools.profile="minimal"` global é sobrescrito por perfis de tools de agente, quando grupos abertos expõem tools de runtime/filesystem sem guardas de sandbox/workspace, e quando tools de plugins de extensão instalados podem ser acessíveis sob política de tools permissiva.
Também sinaliza `gateway.allowRealIpFallback=true` (risco de spoofing de cabeçalho se proxies estiverem mal configurados) e `discovery.mdns.mode="full"` (vazamento de metadados via registros TXT de mDNS).
Também avisa quando o browser de sandbox usa rede Docker `bridge` sem `sandbox.browser.cdpSourceRange`.
Também sinaliza modos de rede Docker de sandbox perigosos (incluindo `host` e joins de namespace `container:*`).
Também avisa quando containers Docker de browser de sandbox existentes têm labels de hash ausentes/obsoletos (por exemplo containers pré-migração sem `openclaw.browserConfigEpoch`) e recomenda `opencraft sandbox recreate --browser --all`.
Também avisa quando registros de instalação de plugin/hook baseados em npm não estão fixados, têm metadados de integridade ausentes, ou diferem das versões de pacote atualmente instaladas.
Avisa quando allowlists de canal dependem de nomes/emails/tags mutáveis em vez de IDs estáveis (Discord, Slack, Google Chat, MS Teams, Mattermost, escopos IRC onde aplicável).
Avisa quando `gateway.auth.mode="none"` deixa as APIs HTTP do Gateway acessíveis sem um segredo compartilhado (`/tools/invoke` mais qualquer endpoint `/v1/*` habilitado).
Configurações prefixadas com `dangerous`/`dangerously` são overrides explícitos de break-glass do operador; habilitar um não é, por si só, um relatório de vulnerabilidade de segurança.
Para o inventário completo de parâmetros perigosos, veja a seção "Insecure or dangerous flags summary" em [Security](/gateway/security).

## Saída JSON

Use `--json` para verificações de CI/política:

```bash
opencraft security audit --json | jq '.summary'
opencraft security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Se `--fix` e `--json` forem combinados, a saída inclui tanto ações de fix quanto o relatório final:

```bash
opencraft security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## O que `--fix` muda

`--fix` aplica remediações seguras e determinísticas:

- muda `groupPolicy="open"` comum para `groupPolicy="allowlist"` (incluindo variantes de conta em canais suportados)
- define `logging.redactSensitive` de `"off"` para `"tools"`
- aperta permissões para estado/config e arquivos sensíveis comuns (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessão `*.jsonl`)

`--fix` **não**:

- rotaciona tokens/senhas/chaves de API
- desabilita tools (`gateway`, `cron`, `exec`, etc.)
- muda escolhas de bind/auth/exposição de rede do gateway
- remove ou reescreve plugins/skills
