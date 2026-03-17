---
summary: "Referência CLI para `opencraft security` (auditoria e correção de falhas de segurança comuns)"
read_when:
  - Você quer executar uma auditoria rápida de segurança no config/estado
  - Você quer aplicar sugestões seguras de "correção" (chmod, restringir padrões)
title: "security"
---

# `opencraft security`

Ferramentas de segurança (auditoria + correções opcionais).

Relacionado:

- Guia de segurança: [Security](/gateway/security)

## Auditoria

```bash
opencraft security audit
opencraft security audit --deep
opencraft security audit --deep --password <password>
opencraft security audit --deep --token <token>
opencraft security audit --fix
opencraft security audit --json
```

A auditoria avisa quando múltiplos remetentes de DM compartilham a sessão principal e recomenda **modo seguro de DM**: `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` para canais com múltiplas contas) para caixas de entrada compartilhadas.
Isso é para hardening cooperativo/caixa de entrada compartilhada. Um único Gateway compartilhado por operadores mutuamente não confiáveis/adversários não é uma configuração recomendada; separe limites de confiança com Gateways separados (ou usuários/hosts de SO separados).
Também emite `security.trust_model.multi_user_heuristic` quando o config sugere provável ingresso de múltiplos usuários (por exemplo política aberta de DM/grupo, alvos de grupo configurados, ou regras de remetente curinga), e lembra que o OpenCraft é um modelo de confiança de assistente pessoal por padrão.
Para configurações intencionais de múltiplos usuários, a orientação da auditoria é colocar todas as sessões em sandbox, manter acesso ao sistema de arquivos com escopo de workspace e manter identidades/credenciais pessoais/privadas fora desse runtime.
Também avisa quando modelos pequenos (`<=300B`) são usados sem sandbox e com ferramentas web/navegador habilitadas.
Para ingresso de Webhook, avisa quando `hooks.defaultSessionKey` não está definido, quando sobrescritas de `sessionKey` da requisição estão habilitadas, e quando sobrescritas estão habilitadas sem `hooks.allowedSessionKeyPrefixes`.
Também avisa quando configurações Docker de sandbox estão configuradas enquanto o modo sandbox está desligado, quando `gateway.nodes.denyCommands` usa entradas de padrão ineficazes/desconhecidas (apenas correspondência exata de nome de comando de nó, não filtragem de texto de shell), quando `gateway.nodes.allowCommands` habilita explicitamente comandos perigosos de nó, quando `tools.profile="minimal"` global é sobreposto por perfis de ferramenta de agente, quando grupos abertos expõem ferramentas de runtime/sistema de arquivos sem proteções de sandbox/workspace, e quando ferramentas de Plugin de extensão instalado podem ser acessíveis sob política permissiva de ferramentas.
Também sinaliza `gateway.allowRealIpFallback=true` (risco de spoofing de cabeçalho se proxies estiverem mal configurados) e `discovery.mdns.mode="full"` (vazamento de metadados via registros TXT mDNS).
Também avisa quando sandbox de navegador usa rede Docker `bridge` sem `sandbox.browser.cdpSourceRange`.
Também sinaliza modos perigosos de rede Docker de sandbox (incluindo `host` e junções de namespace `container:*`).
Também avisa quando contêineres Docker de sandbox de navegador existentes têm labels de hash ausentes/desatualizados (por exemplo contêineres pré-migração sem `opencraft.browserConfigEpoch`) e recomenda `opencraft sandbox recreate --browser --all`.
Também avisa quando registros de instalação de Plugin/hook baseados em npm não estão fixados, faltam metadados de integridade, ou divergem das versões de pacotes atualmente instalados.
Avisa quando listas de permissão de canal dependem de nomes/emails/tags mutáveis em vez de IDs estáveis (Discord, Slack, Google Chat, MS Teams, Mattermost, escopos IRC onde aplicável).
Avisa quando `gateway.auth.mode="none"` deixa APIs HTTP do Gateway acessíveis sem segredo compartilhado (`/tools/invoke` mais quaisquer endpoints `/v1/*` habilitados).
Configurações prefixadas com `dangerous`/`dangerously` são sobrescritas explícitas de emergência do operador; habilitar uma não é, por si só, um relatório de vulnerabilidade de segurança.
Para o inventário completo de parâmetros perigosos, veja a seção "Insecure or dangerous flags summary" em [Security](/gateway/security).

Comportamento de SecretRef:

- `security audit` resolve SecretRefs suportados em modo somente leitura para seus caminhos direcionados.
- Se um SecretRef estiver indisponível no caminho de comando atual, a auditoria continua e reporta `secretDiagnostics` (em vez de travar).
- `--token` e `--password` apenas sobrepõem autenticação de sondagem profunda para aquela invocação de comando; eles não reescrevem config ou mapeamentos de SecretRef.

## Saída JSON

Use `--json` para verificações de CI/política:

```bash
opencraft security audit --json | jq '.summary'
opencraft security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Se `--fix` e `--json` forem combinados, a saída inclui ações de correção e relatório final:

```bash
opencraft security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## O que `--fix` altera

`--fix` aplica remediações seguras e determinísticas:

- Muda `groupPolicy="open"` comuns para `groupPolicy="allowlist"` (incluindo variantes de conta em canais suportados)
- Define `logging.redactSensitive` de `"off"` para `"tools"`
- Restringe permissões para estado/config e arquivos sensíveis comuns (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessão `*.jsonl`)

`--fix` **não**:

- Rotaciona Tokens/senhas/chaves de API
- Desativa ferramentas (`gateway`, `cron`, `exec`, etc.)
- Altera escolhas de bind/autenticação/exposição de rede do Gateway
- Remove ou reescreve Plugins/Skills
