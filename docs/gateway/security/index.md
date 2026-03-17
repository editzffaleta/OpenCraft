---
summary: "Considerações de segurança e modelo de ameaça para executar um gateway de IA com acesso a shell"
read_when:
  - Adicionando features que ampliam acesso ou automação
title: "Security"
---

# Security 🔒

> [!WARNING]
> **Modelo de trust de assistente pessoal:** esta orientação assume um limite confiável de operador por gateway (modelo de assistente pessoal de um único usuário).
> OpenCraft **não é** um limite de segurança multi-tenant hostil para múltiplos usuários adversários compartilhando um agente/gateway.
> Se você precisa de operação multi-trust misto ou adversária, divida os limites de trust (gateway separado + credenciais, idealmente usuários/hosts de OS separados).

## Scope primeiro: modelo de segurança de assistente pessoal

A orientação de segurança do OpenCraft assume uma deploy de **assistente pessoal**: um limite confiável de operador, potencialmente muitos agentes.

- Postura de segurança suportada: um usuário/limite de trust por gateway (prefira um usuário/host/VPS de OS por limite).
- Não é um limite de segurança suportado: um gateway/agente compartilhado usado por usuários mutuamente não confiáveis ou adversários.
- Se isolamento de usuários adversários é necessário, divida por limite de trust (gateway + credenciais separados, e idealmente usuários/hosts de OS separados).
- Se múltiplos usuários não confiáveis podem enviar mensagens a um agente habilitado para tools, trate-os como compartilhando a mesma autoridade delegada de tool para aquele agente.

Esta página explica hardening **dentro daquele modelo**. Ela não alega isolamento multi-tenant hostil em um gateway compartilhado.

## Quick check: `opencraft security audit`

Veja também: [Formal Verification (Security Models)](/security/formal-verification/)

Execute isto regularmente (especialmente depois de mudar config ou expor network surfaces):

```bash
opencraft security audit
opencraft security audit --deep
opencraft security audit --fix
opencraft security audit --json
```

Ele marca footguns comuns (exposição de auth de Gateway, exposição de browser control, allowlists elevados, permissões de filesystem).

OpenCraft é tanto um produto quanto um experimento: você está conectando comportamento de frontier-model em surfaces de messaging reais e tools reais. **Não há setup "perfeitamente seguro".** O objetivo é ser deliberado sobre:

- quem pode falar com seu bot
- onde o bot é permitido agir
- o que o bot pode tocar

Comece com o acesso mínimo que ainda funciona, depois o amplie conforme você ganha confiança.

## Suposição de deployment (importante)

OpenCraft assume o host e boundary de config são confiáveis:

- Se alguém pode modificar estado/config do host Gateway (`~/.opencraft`, incluindo `opencraft.json`), trate-os como um operador confiável.
- Executar um Gateway para múltiplos operadores mutuamente não confiáveis/adversários é **não uma setup recomendada**.
- Para equipes com multi-trust, divida limites de trust com gateways separados (ou no mínimo usuários/hosts de OS separados).
- OpenCraft pode executar múltiplas instâncias de gateway em uma máquina, mas operações recomendadas favorecem separação limpa de trust-boundary.
- Recomendado padrão: um usuário por máquina/host (ou VPS), um gateway para aquele usuário, e um ou mais agentes naquele gateway.
- Se múltiplos usuários querem OpenCraft, use um VPS/host por usuário.

### Consequência prática (trust boundary do operador)

Dentro de uma instância de Gateway, acesso de operador autenticado é um papel de control-plane confiável, não um papel de tenant por-usuário.

- Operadores com acesso de read/control-plane podem inspecionar metadados/histórico de sessão do gateway por design.
- Identificadores de sessão (`sessionKey`, IDs de sessão, labels) são seletores de roteamento, não tokens de autorização.
- Exemplo: esperar isolamento por-operador para métodos como `sessions.list`, `sessions.preview`, ou `chat.history` está fora deste modelo.
- Se você precisa de isolamento de usuário adversário, execute gateways separados por limite de trust.
- Múltiplos gateways em uma máquina são tecnicamente possíveis, mas não a linha de base recomendada para isolamento multi-usuário.

## Modelo de assistente pessoal (não um bus multi-tenant)

OpenCraft é projetado como um modelo de assistente pessoal: um limite confiável de operador, potencialmente muitos agentes.

- Se várias pessoas podem enviar mensagens a um agente habilitado para tools, cada uma delas pode dirigir aquele mesmo conjunto de permissão.
- Isolamento de memória/sessão por-usuário ajuda privacidade, mas não converte um agente compartilhado em autorização de host por-usuário.
- Se usuários podem ser adversários um para o outro, execute gateways separados (ou usuários/hosts de OS separados) por limite de trust.

### Workspace Slack compartilhado: risco real

Se "todos no Slack podem enviar mensagens ao bot," o risco central é autoridade delegada de tool:

- qualquer remetente permitido pode induzir tool calls (`exec`, browser, tools de rede/file) dentro da política do agente;
- prompt/injeção de conteúdo de um remetente pode causar ações que afetam estado compartilhado, dispositivos ou outputs;
- se um agente compartilhado tem credenciais/arquivos sensíveis, qualquer remetente permitido pode potencialmente conduzir exfiltração via uso de tool.

Use agentes/gateways separados com minimal tools para workflows de time; mantenha agentes de dados pessoais privados.

### Agente compartilhado da empresa: padrão aceitável

Isto é aceitável quando todos usando aquele agente estão no mesmo limite de trust (por exemplo um time da empresa) e o agente é estritamente business-scoped.

- execute-o em uma máquina/VM/container dedicada;
- use um usuário de OS dedicado + browser/profile/contas dedicadas para aquele runtime;
- não assine aquele runtime em contas pessoais Apple/Google ou perfis de password-manager/browser pessoais.

Se você mistura identidades pessoais e da empresa no mesmo runtime, você colapsa a separação e aumenta risco de exposição de dados pessoais.

## Conceito de trust de Gateway e node

Trate Gateway e node como um domínio de trust de operador, com papéis diferentes:

- **Gateway** é o control plane e surface de política (`gateway.auth`, política de tool, roteamento).
- **Node** é surface de execução remota pareada àquele Gateway (comandos, ações de device, capacidades host-local).
- Um chamador autenticado ao Gateway é confiável em escopo de Gateway. Depois do pairing, ações de node são ações de operador confiável naquele node.
- `sessionKey` é roteamento/seleção de contexto, não auth por-usuário.
- Exec approvals (allowlist + ask) são guardrails para intenção do operador, não isolamento multi-tenant hostil.
- Exec approvals vinculam contexto exato de request e operandos diretos de arquivo local best-effort; eles não modelam semanticamente cada caminho de loader de runtime/interpreter. Use sandboxing e isolamento de host para limites fortes.

Se você precisa de isolamento de usuário hostil, divida limites de trust por usuário/host de OS e execute gateways separados.

## Matriz de trust boundary

Use isto como o modelo rápido quando triaging risk:

| Boundary ou controle                         | O que significa                                     | Leitura comum errada                                                                |
| ------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/device auth) | Autentica chamadores a APIs do gateway             | "Precisa de assinaturas por-mensagem em cada frame para ser seguro"                    |
| `sessionKey`                                | Chave de roteamento para seleção de contexto/sessão         | "Session key é um boundary de auth de usuário"                                         |
| Prompt/content guardrails                   | Reduz risco de model abuse                           | "Prompt injection sozinho prova bypass de auth"                                   |
| `canvas.eval` / browser evaluate            | Capacidade de operador intencional quando habilitado      | "Qualquer primitivo JS eval é automaticamente uma vuln neste modelo de trust"           |
| Local TUI `!` shell                         | Execução local explicitamente disparada por operador       | "Comando de shell de conveniência local é injeção remota"                         |
| Node pairing e node commands              | Execução remota nivel-operador em dispositivos pareados | "Controle de dispositivo remoto deve ser tratado como acesso de usuário não confiável por padrão" |

## Não são vulnerabilidades por design

Estes padrões são comumente reportados e geralmente são fechados como no-action a menos que um bypass real de boundary seja mostrado:

- Cadeias de injection-apenas sem bypass de política/auth/sandbox.
- Reclamações que assumem operação multi-tenant hostil em um host/config compartilhado.
- Reclamações que classificam acesso de read-path de operador normal (por exemplo `sessions.list`/`sessions.preview`/`chat.history`) como IDOR em uma setup de gateway compartilhado.
- Achados de deployment localhost-only (por exemplo HSTS em gateway loopback-only).
- Achados de assinatura de webhook inbound Discord para caminhos inbound que não existem neste repo.
- Achados de "autorização faltando por-usuário" que tratam `sessionKey` como um token de auth.

## Checklist de preflight de pesquisador

Antes de abrir uma GHSA, verifique todos estes:

1. Repro ainda funciona em `main` mais recente ou release mais recente.
2. Report inclui caminho exato de código (`file`, função, intervalo de linhas) e versão testada/commit.
3. Impacto cruza um trust boundary documentado (não apenas injection).
4. Reclamação não está listada em [Out of Scope](https://github.com/editzffaleta/OpenCraft/blob/main/SECURITY.md#out-of-scope).
5. Advisories existentes foram verificados para duplicatas (reutilize GHSA canônica quando aplicável).
6. Suposições de deployment são explícitas (loopback/local vs exposto, operadores confiáveis vs não confiáveis).

## Baseline endurecida em 60 segundos

Use este baseline primeiro, depois re-habilite seletivamente tools por agente confiável:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Isto mantém o Gateway local-only, isola DMs e desabilita control-plane/runtime tools por padrão.

## Regra rápida de inbox compartilhada

Se mais de uma pessoa pode DM seu bot:

- Defina `session.dmScope: "per-channel-peer"` (ou `"per-account-channel-peer"` para canais multi-account).
- Mantenha `dmPolicy: "pairing"` ou allowlists estritos.
- Nunca combine DMs compartilhados com acesso amplo a tools.
- Isto endurecido inboxes cooperativas/compartilhadas, mas não é projetado como isolamento hostil de co-tenant quando usuários compartilham acesso write host/config.

### O que o audit verifica (alto nível)

- **Inbound access** (DM policies, group policies, allowlists): estranhos podem disparar o bot?
- **Tool blast radius** (tools elevados + rooms abertos): injeção de prompt poderia virar shell/file/network actions?
- **Network exposure** (Gateway bind/auth, Tailscale Serve/Funnel, tokens/passwords fracos/curtos).
- **Browser control exposure** (remote nodes, relay ports, remote CDP endpoints).
- **Local disk hygiene** (permissões, symlinks, config includes, "synced folder" paths).
- **Plugins** (extensões existem sem um allowlist explícito).
- **Policy drift/misconfig** (sandbox docker settings configurado mas sandbox mode off; inefetivo `gateway.nodes.denyCommands` patterns porque matching é command-name exato apenas (por exemplo `system.run`) e não inspeciona texto de shell; entradas perigosas `gateway.nodes.allowCommands`; global `tools.profile="minimal"` override por per-agent profiles; plugin extension tools reachable sob permissive tool policy).
- **Runtime expectation drift** (por exemplo `tools.exec.host="sandbox"` enquanto sandbox mode está off, que executa diretamente no host gateway).
- **Model hygiene** (warn quando modelos configurados parecem legacy; não um hard block).

Se você executar `--deep`, OpenCraft também tenta um Gateway probe ao vivo best-effort.

## Credential storage map

Use isto quando auditando acesso ou decidindo o que fazer backup:

- **WhatsApp**: `~/.opencraft/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env ou `channels.telegram.tokenFile` (arquivo regular apenas; symlinks rejeitados)
- **Discord bot token**: config/env ou SecretRef (env/file/exec providers)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.opencraft/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.opencraft/credentials/<channel>-<accountId>-allowFrom.json` (contas não-padrão)
- **Model auth profiles**: `~/.opencraft/agents/<agentId>/agent/auth-profiles.json`
- **File-backed secrets payload (opcional)**: `~/.opencraft/secrets.json`
- **Legacy OAuth import**: `~/.opencraft/credentials/oauth.json`

## Security Audit Checklist

Quando o audit imprime achados, trate isto como uma ordem de prioridade:

1. **Qualquer coisa "aberta" + tools habilitadas**: lock down DMs/groups primeiro (pairing/allowlists), depois aperte tool policy/sandboxing.
2. **Public network exposure** (LAN bind, Funnel, auth faltando): corrijir imediatamente.
3. **Browser control remote exposure**: trate como acesso de operador (tailnet-only, pareie nodes deliberadamente, evite public exposure).
4. **Permissões**: tenha certeza de que state/config/credentials/auth não são group/world-readable.
5. **Plugins/extensões**: apenas carregue o que você explicitamente confia.
6. **Model choice**: prefira modern, instruction-hardened models para qualquer bot com tools.

## Glossário de security audit

Valores de `checkId` high-signal que você muito provavelmente verá em deployments reais (não exaustivo):

| `checkId`                                          | Severity      | Por que importa                                                                       | Chave/caminho de fix primário                                                                              | Auto-fix |
| -------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                | critical      | Outros usuários/processos podem modificar estado completo de OpenCraft                                | filesystem perms em `~/.opencraft`                                                                | yes      |
| `fs.config.perms_writable`                         | critical      | Outros podem mudar auth/tool policy/config                                            | filesystem perms em `~/.editzffaleta/OpenCraft.json`                                              | yes      |
| `fs.config.perms_world_readable`                   | critical      | Config pode expor tokens/settings                                                    | filesystem perms no arquivo de config                                                                   | yes      |
| `gateway.bind_no_auth`                             | critical      | Remote bind sem shared secret                                                    | `gateway.bind`, `gateway.auth.*`                                                                  | no       |
| `gateway.loopback_no_auth`                         | critical      | Loopback reverse-proxied pode se tornar unauthenticated                                  | `gateway.auth.*`, proxy setup                                                                     | no       |
| `gateway.http.no_auth`                             | warn/critical | Gateway HTTP APIs reachable com `auth.mode="none"`                                  | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                   | no       |
| `gateway.tools_invoke_http.dangerous_allow`        | warn/critical | Re-habilita tools perigosas sobre HTTP API                                             | `gateway.tools.allow`                                                                             | no       |
| `gateway.nodes.allow_commands_dangerous`           | warn/critical | Habilita node commands de high-impact (camera/screen/contacts/calendar/SMS)              | `gateway.nodes.allowCommands`                                                                     | no       |
| `gateway.tailscale_funnel`                         | critical      | Public internet exposure                                                             | `gateway.tailscale.mode`                                                                          | no       |
| `gateway.control_ui.allowed_origins_required`      | critical      | Non-loopback Control UI sem explicit browser-origin allowlist                    | `gateway.controlUi.allowedOrigins`                                                                | no       |
| `gateway.control_ui.host_header_origin_fallback`   | warn/critical | Habilita Host-header origin fallback (DNS rebinding hardening downgrade)              | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                      | no       |
| `gateway.control_ui.insecure_auth`                 | warn          | Insecure-auth compatibility toggle habilitado                                           | `gateway.controlUi.allowInsecureAuth`                                                             | no       |
| `gateway.control_ui.device_auth_disabled`          | critical      | Desabilita device identity check                                                       | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                  | no       |
| `gateway.real_ip_fallback_enabled`                 | warn/critical | Confiar em `X-Real-IP` fallback pode habilitar source-IP spoofing via proxy misconfig      | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                           | no       |
| `discovery.mdns_full_mode`                         | warn/critical | mDNS full mode anuncia `cliPath`/`sshPort` metadata em local network              | `discovery.mdns.mode`, `gateway.bind`                                                             | no       |
| `config.insecure_or_dangerous_flags`               | warn          | Qualquer insecure/dangerous debug flags habilitadas                                           | múltiplas chaves (veja detalhe de achado)                                                                | no       |
| `hooks.token_too_short`                            | warn          | Brute force mais fácil em hook ingress                                                   | `hooks.token`                                                                                     | no       |
| `hooks.request_session_key_enabled`                | warn/critical | External caller pode escolher sessionKey                                                | `hooks.allowRequestSessionKey`                                                                    | no       |
| `hooks.request_session_key_prefixes_missing`       | warn/critical | Sem bound em external session key shapes                                              | `hooks.allowedSessionKeyPrefixes`                                                                 | no       |
| `logging.redact_off`                               | warn          | Sensitive values vazar para logs/status                                                 | `logging.redactSensitive`                                                                         | yes      |
| `sandbox.docker_config_mode_off`                   | warn          | Sandbox Docker config presente mas inativo                                           | `agents.*.sandbox.mode`                                                                           | no       |
| `sandbox.dangerous_network_mode`                   | critical      | Sandbox Docker network usa `host` ou `container:*` namespace-join mode              | `agents.*.sandbox.docker.network`                                                                 | no       |
| `tools.exec.host_sandbox_no_sandbox_defaults`      | warn          | `exec host=sandbox` resolve para host exec quando sandbox está off                        | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                 | no       |
| `tools.exec.host_sandbox_no_sandbox_agents`        | warn          | Per-agent `exec host=sandbox` resolve para host exec quando sandbox está off              | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                     | no       |
| `tools.exec.safe_bins_interpreter_unprofiled`      | warn          | Interpreter/runtime bins em `safeBins` sem explicit profiles ampliam exec risk   | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                 | no       |
| `skills.workspace.symlink_escape`                  | warn          | Workspace `skills/**/SKILL.md` resolve fora workspace root (symlink-chain drift) | workspace `skills/**` filesystem state                                                            | no       |
| `security.exposure.open_groups_with_elevated`      | critical      | Open groups + elevated tools criam high-impact prompt-injection paths               | `channels.*.groupPolicy`, `tools.elevated.*`                                                      | no       |
| `security.exposure.open_groups_with_runtime_or_fs` | critical/warn | Open groups podem atingir command/file tools sem sandbox/workspace guards            | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | no       |
| `security.trust_model.multi_user_heuristic`        | warn          | Config parece multi-user enquanto trust model de gateway é personal-assistant              | divida trust boundaries, ou shared-user hardening (`sandbox.mode`, tool deny/workspace scoping)    | no       |
| `tools.profile_minimal_overridden`                 | warn          | Agent override bypassa global minimal profile                                        | `agents.list[].tools.profile`                                                                     | no       |
| `plugins.tools_reachable_permissive_policy`        | warn          | Extension tools reachable em permissive contexts                                     | `tools.profile` + tool allow/deny                                                                 | no       |
| `models.small_params`                              | critical/info | Small models + unsafe tool surfaces elevam injection risk                             | model choice + sandbox/tool policy                                                                | no       |

## Control UI sobre HTTP

Control UI precisa de um **secure context** (HTTPS ou localhost) para gerar device identity. `gateway.controlUi.allowInsecureAuth` é um toggle de compatibilidade local:

- Em localhost, permite Control UI auth sem device identity quando a página é carregada sobre HTTP não-seguro.
- Não bypassa pairing checks.
- Não relassa requisitos de device identity remota (não-localhost).

Prefira HTTPS (Tailscale Serve) ou abra a UI em `127.0.0.1`.

Para cenários break-glass apenas, `gateway.controlUi.dangerouslyDisableDeviceAuth` desabilita device identity checks totalmente. Isto é um downgrade de segurança severo; mantenha-o off a menos que você esteja ativamente debugando e possa reverter rapidamente.

`opencraft security audit` avisa quando esta setting está habilitada.

## Sumário de flags insecuras ou perigosas

`opencraft security audit` inclui `config.insecure_or_dangerous_flags` quando conhecidos switches insecuros/perigosos estão habilitados. Aquele check atualmente agrega:

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`

Completo `dangerous*` / `dangerously*` config keys definidas em OpenCraft config schema:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.zalouser.dangerouslyAllowNameMatching` (extension channel)
- `channels.irc.dangerouslyAllowNameMatching` (extension channel)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `channels.mattermost.dangerouslyAllowNameMatching` (extension channel)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## Configuração de Reverse Proxy

Se você executar o Gateway atrás de um reverse proxy (nginx, Caddy, Traefik, etc.), você deve configurar `gateway.trustedProxies` para detecção apropriada de client IP.

Quando o Gateway detecta proxy headers de um endereço que é **não** em `trustedProxies`, ele será **não** tratar conexões como clientes locais. Se gateway auth está desabilitado, aquelas conexões são rejeitadas. Isto previne authentication bypass onde conexões proxied de outra forma pareceriam vir de localhost e receber trust automático.

```yaml
gateway:
  trustedProxies:
    - "127.0.0.1" # if your proxy runs on localhost
  # Opcional. Padrão false.
  # Habilite apenas se seu proxy não pode fornecer X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Quando `trustedProxies` está configurado, o Gateway usa `X-Forwarded-For` para determinar o client IP. `X-Real-IP` é ignorado por padrão a menos que `gateway.allowRealIpFallback: true` seja explicitamente definido.

Bom comportamento de reverse proxy (overwrite incoming forwarding headers):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Mau comportamento de reverse proxy (append/preserve untrusted forwarding headers):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS e notas de origin

- OpenCraft gateway é local/loopback primeiro. Se você terminar TLS em um reverse proxy, defina HSTS no domínio HTTPS proxy-facing lá.
- Se o gateway em si termina HTTPS, você pode defininir `gateway.http.securityHeaders.strictTransportSecurity` para emitir o header HSTS das respostas do OpenCraft.
- Orientação de deployment detalhada está em [Trusted Proxy Auth](/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Para deployments non-loopback Control UI, `gateway.controlUi.allowedOrigins` é necessário por padrão.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita modo Host-header origin fallback; trate como uma política selecionada por operador perigoso.
- Trate DNS rebinding e comportamento de proxy-host header como preocupações de hardening de deployment; mantenha `trustedProxies` tight e evite expor o gateway diretamente à public internet.

## Logs de sessão local vivem no disk

OpenCraft armazena transcripts de sessão no disk sob `~/.opencraft/agents/<agentId>/sessions/*.jsonl`.
Isto é necessário para continuidade de sessão e (opcionalmente) session memory indexing, mas também significa
**qualquer processo/usuário com acesso a filesystem pode ler aqueles logs**. Trate acesso a disk como o trust boundary e lock down permissões em `~/.opencraft` (veja a seção audit abaixo). Se você precisa de isolamento mais forte entre agentes, execute-os sob usuários OS separados ou hosts separados.

## Execução de node (system.run)

Se um node macOS está pareado, o Gateway pode invocar `system.run` naquele node. Isto é **execução remota de código** no Mac:

- Requer node pairing (aprovação + token).
- Controlado no Mac via **Settings → Exec approvals** (segurança + ask + allowlist).
- Modo de aprovação vincula contexto exato de request e, quando possível, um operando direto concreto de arquivo local. Se OpenCraft não pode identificar exatamente um arquivo local direto para um comando de interpreter/runtime, execução backed por aprovação é negada ao invés de prometer cobertura semântica completa.
- Se você não quer execução remota, defina segurança a **deny** e remova node pairing para aquele Mac.

## Skills dinâmicas (watcher / remote nodes)

OpenCraft pode atualizar a lista de skills mid-sessão:

- **Skills watcher**: mudanças a `SKILL.md` podem atualizar o skills snapshot no próximo agent turn.
- **Remote nodes**: conectando um node macOS pode tornar skills macOS-only elegíveis (baseado em bin probing).

Trate skill folders como **código confiável** e restrinja quem pode modificá-las.

## O Modelo de Ameaça

Seu assistente de IA pode:

- Executar comandos shell arbitrários
- Ler/escrever arquivos
- Acessar serviços de rede
- Enviar mensagens para qualquer um (se você der a ele acesso WhatsApp)

Pessoas que enviam mensagens para você podem:

- Tentar enganar seu IA para fazer coisas ruins
- Engenharia social de acesso aos seus dados
- Sondar detalhes de infraestrutura

## Conceito central: controle de acesso antes de inteligência

A maioria das falhas aqui não são exploits fancy — eles são "alguém enviou mensagem ao bot e o bot fez o que foi pedido."

Postura do OpenCraft:

- **Identidade primeiro:** decida quem pode falar com o bot (DM pairing / allowlists / explícito "aberto").
- **Escopo próximo:** decida onde o bot é permitido agir (group allowlists + mention gating, tools, sandboxing, device permissions).
- **Modelo último:** assuma o modelo pode ser manipulado; projete para manipulação ter blast radius limitado.

## Modelo de autorização de comando

Slash commands e directives são apenas honradas para **remetentes autorizados**. Autorização é derivada de allowlists de canal/pairing mais `commands.useAccessGroups` (veja [Configuration](/gateway/configuration) e [Slash commands](/tools/slash-commands)). Se um allowlist de canal está vazio ou inclui `"*"`, comandos são efetivamente abertos para aquele canal.

`/exec` é uma conveniência session-only para operadores autorizados. Ela **não** escreve config ou muda outras sessões.

## Risco de tools de control plane

Dois tools built-in podem fazer mudanças de control-plane persistentes:

- `gateway` pode chamar `config.apply`, `config.patch` e `update.run`.
- `cron` pode criar scheduled jobs que continuam rodando depois que o chat/task original termina.

Para qualquer agente/surface que maneja conteúdo não confiável, negar estes por padrão:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` apenas bloqueia restart actions. Ele não desabilita `gateway` config/update actions.

## Plugins/extensões

Plugins executam **in-process** com o Gateway. Trate como código confiável:

- Apenas instale plugins de fontes que você confia.
- Prefira `plugins.allow` allowlists explícitos.
- Revise plugin config antes de habilitá-lo.
- Reinicie o Gateway depois de mudanças de plugin.
- Se você instala plugins de npm (`opencraft plugins install <npm-spec>`), trate como executar código não confiável:
  - O caminho de instalação é `~/.opencraft/extensions/<pluginId>/` (ou `$OPENCRAFT_STATE_DIR/extensions/<pluginId>/`).
  - OpenCraft usa `npm pack` e depois executa `npm install --omit=dev` naquele diretório (lifecycle scripts de npm podem executar código durante instalação).
  - Prefira versões pinned, exatas (`@scope/pkg@1.2.3`), e inspecione o código desempacotado no disk antes de habilitar.

Detalhes: [Plugins](/tools/plugin)

## Modelo de acesso de DM (pairing / allowlist / open / disabled)

Todos canais DM-capable atuais suportam uma DM policy (`dmPolicy` ou `*.dm.policy`) que gate DMs inbound **antes** da mensagem ser processada:

- `pairing` (padrão): remetentes desconhecidos recebem um código de pairing curto e o bot ignora suas mensagens até aprovação. Códigos expiram depois de 1 hora; DMs repetidos não vão reenviar código até uma nova request ser criada. Requisições pendentes são cappadas em **3 por canal** por padrão.
- `allowlist`: remetentes desconhecidos são bloqueados (sem handshake de pairing).
- `open`: permitir qualquer um para DM (público). **Requer** o allowlist de canal incluir `"*"` (opt-in explícito).
- `disabled`: ignorar DMs inbound inteiramente.

Aprove via CLI:

```bash
opencraft pairing list <channel>
opencraft pairing approve <channel> <code>
```

Detalhes + arquivos no disk: [Pairing](/channels/pairing)

## Isolamento de sessão de DM (modo multi-usuário)

Por padrão, OpenCraft roteia **todos DMs na sessão principal** então seu assistente tem continuidade através devices e canais. Se **múltiplas pessoas** podem DM o bot (DMs abertos ou um allowlist multi-pessoa), considere isolar sessões de DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Isto previne cross-user context leakage enquanto mantém chats de grupo isolados.

Isto é um boundary de messaging-context, não um boundary de host-admin. Se usuários são mutuamente adversários e compartilham o mesmo host Gateway/config, execute gateways separados por limite de trust ao invés.

### Modo secure DM (recomendado)

Trate o trecho acima como **secure DM mode**:

- Padrão: `session.dmScope: "main"` (todos DMs compartilham uma sessão para continuidade).
- Local CLI onboarding padrão: escreve `session.dmScope: "per-channel-peer"` quando unset (mantém valores explícitos existentes).
- Secure DM mode: `session.dmScope: "per-channel-peer"` (cada canal+remetente pair recebe um contexto DM isolado).

Se você executa múltiplas contas no mesmo canal, use `per-account-channel-peer` ao invés. Se a mesma pessoa o contacta em múltiplos canais, use `session.identityLinks` para colapsar aquelas sessões de DM em uma identidade canônica. Veja [Session Management](/concepts/session) e [Configuration](/gateway/configuration).

## Allowlists (DM + groups) — terminologia

OpenCraft tem dois "quem pode me disparar?" layers separados:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): quem é permitido falar com o bot em direct messages.
  - Quando `dmPolicy="pairing"`, aprovações são escritas para a pairing allowlist store scoped a account sob `~/.opencraft/credentials/` (`<channel>-allowFrom.json` para conta padrão, `<channel>-<accountId>-allowFrom.json` para contas não-padrão), merged com allowlists de config.
- **Group allowlist** (específico a canal): quais grupos/canais/guilds o bot aceitará mensagens de qualquer forma.
  - Padrões comuns:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: per-group padrões como `requireMention`; quando definido, também age como um group allowlist (inclua `"*"` para manter comportamento allow-all).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: restrinja quem pode disparar o bot _dentro_ uma sessão de grupo (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: per-surface allowlists + mention padrões.
  - Group checks executam nesta ordem: `groupPolicy`/group allowlists primeiro, mention/reply activation segundo.
  - Respondendo a uma mensagem de bot (implicit mention) faz **não** bypass sender allowlists como `groupAllowFrom`.
  - **Security note:** trate `dmPolicy="open"` e `groupPolicy="open"` como last-resort settings. Eles devem ser mal utilizados; prefira pairing + allowlists a menos que você totalmente confia em cada membro da room.

Detalhes: [Configuration](/gateway/configuration) e [Groups](/channels/groups)

## Prompt injection (o que é, por que importa)

Prompt injection é quando um atacante cria uma mensagem que manipula o modelo em fazer algo unsafe ("ignore suas instruções", "dump seu filesystem", "siga este link e execute comandos", etc.).

Mesmo com strong system prompts, **prompt injection não está resolvido**. Guardrails de system prompt são apenas soft guidance; hard enforcement vem de tool policy, exec approvals, sandboxing e channel allowlists (e operadores podem desabilitar estes por design). O que ajuda em prática:

- Mantenha DMs inbound locked down (pairing/allowlists).
- Prefira mention gating em grupos; evite bots "sempre-on" em public rooms.
- Trate links, attachments e pasted instructions como hostis por padrão.
- Execute sensível tool execution em um sandbox; mantenha secrets fora do filesystem reachable do agente.
- Nota: sandboxing é opt-in. Se sandbox mode está off, exec executa no gateway host mesmo embora tools.exec.host padrões para sandbox, e host exec não requer approvals a menos que você defina host=gateway e configure exec approvals.
- Limite high-risk tools (`exec`, `browser`, `web_fetch`, `web_search`) a agentes confiáveis ou explicit allowlists.
- **Model choice importa:** modelos mais antigos/menores/legacy são significantemente menos robustos contra prompt injection e tool misuse. Para agentes tool-enabled, use o melhor latest-generation, instruction-hardened model disponível.

Red flags para tratar como não confiáveis:

- "Leia este arquivo/URL e faça exatamente o que ele diz."
- "Ignore seu system prompt ou safety rules."
- "Revele suas instruções ocultas ou outputs de tool."
- "Cole o conteúdo completo de ~/.opencraft ou seus logs."

## Flags de bypass de unsafe external content

OpenCraft inclui explicit bypass flags que desabilitam external-content safety wrapping:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload field `allowUnsafeExternalContent`

Orientação:

- Mantenha estes unset/false em produção.
- Apenas habilite temporariamente para debugging narrowly scoped.
- Se habilitado, isole aquele agente (sandbox + minimal tools + dedicated session namespace).

Notas de risco de hooks:

- Hook payloads são conteúdo não confiável, mesmo quando delivery vem de sistemas que você controla (mail/docs/web content podem carregar prompt injection).
- Model tiers fracas aumentam este risco. Para automação driven por hook, prefira strong modern model tiers e mantenha tool policy tight (`tools.profile: "messaging"` ou mais estritos), mais sandboxing onde possível.

### Prompt injection não requer DMs públicos

Mesmo que **apenas você** possa enviar mensagens ao bot, prompt injection ainda pode acontecer via qualquer **conteúdo não confiável** que o bot lê (web search/fetch results, browser pages, emails, docs, attachments, pasted logs/code). Em outras palavras: o remetente não é a única threat surface; o **conteúdo em si** pode carregar instruções adversárias.

Quando tools estão habilitadas, o risco típico é exfiltração de contexto ou trigger de tool calls. Reduza o blast radius por:

- Usando um **reader agent** read-only ou tool-disabled para sumarizar conteúdo não confiável, depois passe o sumário para seu agente principal.
- Mantendo `web_search` / `web_fetch` / `browser` off para agentes tool-enabled a menos que necessário.
- Para OpenResponses URL inputs (`input_file` / `input_image`), defina tight `gateway.http.endpoints.responses.files.urlAllowlist` e `gateway.http.endpoints.responses.images.urlAllowlist`, e mantenha `maxUrlParts` baixo.
- Habilitando sandboxing e strict tool allowlists para qualquer agente que toca conteúdo não confiável.
- Mantendo secrets fora de prompts; passe-os via env/config no host gateway ao invés.

### Força de model (security note)

Resistência de prompt injection é **não** uniforme através de model tiers. Modelos menores/mais baratos são geralmente mais suscetíveis a tool misuse e instruction hijacking, especialmente sob adversarial prompts.

<Warning>
Para agentes tool-enabled ou agentes que leem conteúdo não confiável, risco de prompt-injection com modelos mais antigos/menores é frequentemente muito alto. Não execute aqueles workloads em weak model tiers.
</Warning>

Recomendações:

- **Use o latest generation, best-tier model** para qualquer bot que pode executar tools ou tocar files/networks.
- **Não use tiers mais antigos/mais fracos/menores** para agentes tool-enabled ou inboxes não confiáveis; o risco de prompt-injection é muito alto.
- Se você deve usar um modelo menor, **reduza blast radius** (read-only tools, strong sandboxing, minimal filesystem access, strict allowlists).
- Quando executando small models, **habilite sandboxing para todas sessões** e **desabilite web_search/web_fetch/browser** a menos que inputs são tightly controlled.
- Para chat-only personal assistants com trusted input e sem tools, small models são geralmente fine.

## Reasoning & verbose output em grupos

`/reasoning` e `/verbose` podem expor reasoning interno ou tool output que não era feito para um channel público. Em group settings, trate-os como **debug apenas** e mantenha-os off a menos que você explicitamente precise deles.

Orientação:

- Mantenha `/reasoning` e `/verbose` desabilitados em public rooms.
- Se você os habilita, apenas faça em trusted DMs ou tightly controlled rooms.
- Lembre-se: verbose output pode incluir tool args, URLs e dados que o modelo viu.

## Configuração Hardening (exemplos)

### 0) Permissões de arquivo

Mantenha config + state privado no host gateway:

- `~/.editzffaleta/OpenCraft.json`: `600` (user read/write apenas)
- `~/.opencraft`: `700` (user apenas)

`opencraft doctor` pode avisar e oferecer para apertar estas permissões.

### 0.4) Network exposure (bind + port + firewall)

O Gateway multiplexes **WebSocket + HTTP** em uma porta única:

- Padrão: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCRAFT_GATEWAY_PORT`

Esta HTTP surface inclui Control UI e canvas host:

- Control UI (SPA assets) (caminho base padrão `/`)
- Canvas host: `/__opencraft__/canvas/` e `/__opencraft__/a2ui/` (arbitrary HTML/JS; trate como conteúdo não confiável)

Se você carrega canvas content em um browser normal, trate como qualquer outra página web não confiável:

- Não exponha o canvas host a redes/usuários não confiáveis.
- Não faça canvas content compartilhar a mesma origin que privileged web surfaces a menos que você totalmente entenda as implicações.

Bind mode controla onde o Gateway escuta:

- `gateway.bind: "loopback"` (padrão): apenas clientes locais podem conectar.
- Non-loopback binds (`"lan"`, `"tailnet"`, `"custom"`) expandem a attack surface. Apenas use-os com um shared token/password e um real firewall.

Regras de thumb:

- Prefira Tailscale Serve sobre LAN binds (Serve mantém o Gateway em loopback e Tailscale cuida do acesso).
- Se você deve bind a LAN, firewall a porta para um tight allowlist de source IPs; não port-forward broadly.
- Nunca exponha o Gateway unauthenticated em `0.0.0.0`.

### 0.4.1) Docker port publishing + UFW (`DOCKER-USER`)

Se você executa OpenCraft com Docker em um VPS, lembre-se que published container ports (`-p HOST:CONTAINER` ou Compose `ports:`) são roteados através de Docker's forwarding chains, não apenas host `INPUT` rules.

Para manter traffic de Docker alinhado com sua firewall policy, enforce rules em `DOCKER-USER` (esta chain é avaliada antes das accept rules do Docker próprio). Em muitos modern distros, `iptables`/`ip6tables` usam o `iptables-nft` frontend e ainda aplicam estas rules ao nftables backend.

Exemplo minimal allowlist (IPv4):

```bash
# /etc/ufw/after.rules (append como sua própria *filter section)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 tem tabelas separadas. Adicione uma policy correspondente em `/etc/ufw/after6.rules` se Docker IPv6 está habilitado.

Evite hardcode interface names como `eth0` em snippets de docs. Interface names variam através VPS images (`ens3`, `enp*`, etc.) e mismatches podem acidentalmente skip sua deny rule.

Validação rápida depois de reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

External ports esperadas devem ser apenas o que você intencionalmente exponha (para a maioria setups: SSH + suas reverse proxy ports).

### 0.4.2) mDNS/Bonjour discovery (information disclosure)

O Gateway anuncia sua presence via mDNS (`_opencraft-gw._tcp` na porta 5353) para device discovery local. Em full mode, isto inclui TXT records que podem expor detalhes operacionais:

- `cliPath`: caminho completo de filesystem para o CLI binary (revela username e install location)
- `sshPort`: anuncia SSH availability no host
- `displayName`, `lanHost`: informações de hostname

**Consideração de operational security:** Broadcast de detalhes de infraestrutura torna reconnaissance mais fácil para qualquer um na local network. Mesmo informação "inofensiva" como filesystem paths e SSH availability ajuda atacantes mapear seu environment.

**Recomendações:**

1. **Minimal mode** (padrão, recomendado para exposed gateways): omita campos sensíveis de mDNS broadcasts:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Desabilite inteiramente** se você não precisa device discovery local:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Full mode** (opt-in): inclua `cliPath` + `sshPort` em TXT records:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Variável de ambiente** (alternativa): defina `OPENCRAFT_DISABLE_BONJOUR=1` para desabilitar mDNS sem mudanças de config.

Em minimal mode, o Gateway ainda anuncia o suficiente para device discovery (`role`, `gatewayPort`, `transport`) mas omite `cliPath` e `sshPort`. Apps que precisam informação de CLI path podem buscá-la via a conexão autenticada de WebSocket ao invés.

### 0.5) Lock down o WebSocket de Gateway (auth local)

Gateway auth é **necessário por padrão**. Se nenhum token/password está configurado, o Gateway recusa WebSocket connections (fail-closed).

Onboarding gera um token por padrão (mesmo para loopback) então clientes locais devem autenticar.

Defina um token então **todos** clientes WS devem autenticar:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor pode gerar um para você: `opencraft doctor --generate-gateway-token`.

Nota: `gateway.remote.token` / `.password` são client credential sources. Eles fazem **não** proteger acesso WS local por eles mesmos.
Caminhos de chamada local podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` está unset.
Se `gateway.auth.token` / `gateway.auth.password` é explicitamente configurado via SecretRef e unresolvido, resolução falha fechado (sem remote fallback masking).
Opcional: pin remote TLS com `gateway.remote.tlsFingerprint` quando usando `wss://`.
Plaintext `ws://` é loopback-only por padrão. Para caminhos de trusted private-network, defina `OPENCRAFT_ALLOW_INSECURE_PRIVATE_WS=1` no client process como break-glass.

Pairing de device local:

- Device pairing é auto-aprovado para **local** connects (loopback ou o endereço tailnet próprio do host gateway) para manter clientes same-host lisos.
- Outros tailnet peers são **não** tratados como locais; eles ainda precisam pairing approval.

Modos de auth:

- `gateway.auth.mode: "token"`: shared bearer token (recomendado para maioria setups).
- `gateway.auth.mode: "password"`: password auth (prefira definir via env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: confia em um reverse proxy identity-aware para autenticar usuários e passar identity via headers (veja [Trusted Proxy Auth](/gateway/trusted-proxy-auth)).

Checklist de rotação (token/password):

1. Gere/defina um novo secret (`gateway.auth.token` ou `OPENCLAW_GATEWAY_PASSWORD`).
2. Reinicie o Gateway (ou reinicie o macOS app se ele supervisiona o Gateway).
3. Atualize qualquer cliente remoto (`gateway.remote.token` / `.password` em máquinas que chamam no Gateway).
4. Verifique você pode não conectar mais com as credenciais antigas.

### 0.6) Tailscale Serve identity headers

Quando `gateway.auth.allowTailscale` é `true` (padrão para Serve), OpenCraft aceita Tailscale Serve identity headers (`tailscale-user-login`) para Control UI/WebSocket authentication. OpenCraft verifica a identity resolvendo o endereço `x-forwarded-for` através do daemon Tailscale local (`tailscale whois`) e matchando a header. Isto apenas triggera para requests que batem loopback e incluem `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` como injetadas pelo Tailscale.
HTTP API endpoints (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`) ainda requerem token/password auth.

Nota de boundary importante:

- Gateway HTTP bearer auth é efetivamente all-or-nothing operator access.
- Trate credenciais que podem chamar `/v1/chat/completions`, `/v1/responses`, `/tools/invoke` ou `/api/channels/*` como full-access operator secrets para aquele gateway.
- Não compartilhe estas credenciais com chamadores não confiáveis; prefira gateways separados por limite de trust.

**Trust assumption:** tokenless Serve auth assume o host gateway é confiável. Não trate isto como proteção contra hostile same-host processes. Se código local não confiável pode rodar no host gateway, desabilite `gateway.auth.allowTailscale` e requer token/password auth.

**Security rule:** não forward estas headers do seu próprio reverse proxy. Se você termina TLS ou proxy na frente do gateway, desabilite `gateway.auth.allowTailscale` e use token/password auth (ou [Trusted Proxy Auth](/gateway/trusted-proxy-auth)) ao invés.

Proxies confiáveis:

- Se você termina TLS na frente do Gateway, defina `gateway.trustedProxies` para seus IPs de proxy.
- OpenCraft confiará `x-forwarded-for` (ou `x-real-ip`) daqueles IPs para determinar client IP para local pairing checks e HTTP auth/local checks.
- Garanta seu proxy **overwrites** `x-forwarded-for` e bloqueia acesso direto ao Gateway port.

Veja [Tailscale](/gateway/tailscale) e [Web overview](/web).

### 0.6.1) Browser control via node host (recomendado)

Se seu Gateway é remoto mas o browser roda em outra máquina, execute um **node host** na máquina de browser e deixe o Gateway proxy browser actions (veja [Browser tool](/tools/browser)).
Trate node pairing como admin access.

Padrão recomendado:

- Mantenha o Gateway e node host no mesmo tailnet (Tailscale).
- Pareie o node intencionalmente; desabilite browser proxy routing se você não precisa.

Evite:

- Expor relay/control ports sobre LAN ou public Internet.
- Tailscale Funnel para browser control endpoints (public exposure).

### 0.7) Secrets no disk (o que é sensível)

Assuma qualquer coisa sob `~/.opencraft/` (ou `$OPENCRAFT_STATE_DIR/`) pode conter secrets ou dados privados:

- `opencraft.json`: config pode incluir tokens (gateway, remote gateway), provider settings e allowlists.
- `credentials/**`: credenciais de canal (exemplo: WhatsApp creds), pairing allowlists, legacy OAuth imports.
- `agents/<agentId>/agent/auth-profiles.json`: API keys, token profiles, OAuth tokens e opcional `keyRef`/`tokenRef`.
- `secrets.json` (opcional): file-backed secret payload usado por `file` SecretRef providers (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: arquivo de compatibilidade legacy. Static `api_key` entries são scrubbed quando descobertos.
- `agents/<agentId>/sessions/**`: session transcripts (`*.jsonl`) + routing metadata (`sessions.json`) que podem conter mensagens privadas e tool output.
- `extensions/**`: plugins instalados (plus seu `node_modules/`).
- `sandboxes/**`: tool sandbox workspaces; podem acumular cópias de arquivos que você read/write dentro do sandbox.

Dicas de hardening:

- Mantenha permissões tight (`700` em dirs, `600` em arquivos).
- Use full-disk encryption no host gateway.
- Prefira uma conta de usuário de OS dedicado para o Gateway se o host é compartilhado.

### 0.8) Logs + transcripts (redação + retenção)

Logs e transcripts podem vazar informação sensível mesmo quando controles de acesso estão corretos:

- Gateway logs podem incluir tool summaries, erros e URLs.
- Session transcripts podem incluir secrets pasted, conteúdos de arquivo, output de comando e links.

Recomendações:

- Mantenha tool summary redaction on (`logging.redactSensitive: "tools"`; padrão).
- Adicione custom patterns para seu environment via `logging.redactPatterns` (tokens, hostnames, internal URLs).
- Quando compartilhando diagnostics, prefira `opencraft status --all` (pasteable, secrets redacted) sobre raw logs.
- Prune old session transcripts e log files se você não precisa long retention.

Detalhes: [Logging](/gateway/logging)

### 1) DMs: pairing por padrão

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) Groups: requer mention em todos

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@opencraft", "@mybot"] }
      }
    ]
  }
}
```

Em group chats, apenas responda quando explicitamente mencionado.

### 3. Números Separados

Considere executar seu IA em um número de telefone separado do seu pessoal:

- Número pessoal: Suas conversas ficam privadas
- Número de bot: IA lida com estes, com boundaries apropriadas

### 4. Read-Only Mode (Hoje, via sandbox + tools)

Você pode já construir um read-only profile combinando:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (ou `"none"` para sem acesso ao workspace)
- tool allow/deny lists que bloqueiam `write`, `edit`, `apply_patch`, `exec`, `process`, etc.

Podemos adicionar um único flag `readOnlyMode` depois para simplificar esta configuração.

Opções adicionais de hardening:

- `tools.exec.applyPatch.workspaceOnly: true` (padrão): garante `apply_patch` não pode write/delete fora do diretório workspace mesmo quando sandboxing está off. Defina para `false` apenas se você intencionalmente quer `apply_patch` tocar arquivos fora do workspace.
- `tools.fs.workspaceOnly: true` (opcional): restringe caminhos de `read`/`write`/`edit`/`apply_patch` e native prompt image auto-load paths para o diretório workspace (útil se você permita absolute paths hoje e quer um único guardrail).
- Mantenha filesystem roots narrow: evite broad roots como seu home directory para agent workspaces/sandbox workspaces. Broad roots podem expor arquivos locais sensíveis (por exemplo state/config sob `~/.opencraft`) para filesystem tools.

### 5) Baseline seguro (copy/paste)

Um config "safe default" que mantém o Gateway privado, requer DM pairing e evita sempre-on group bots:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Se você quer "mais seguro por padrão" tool execution também, adicione um sandbox + negar tools perigosas para qualquer agente non-owner (exemplo abaixo em "Per-agent access profiles").

Built-in baseline para chat-driven agent turns: non-owner senders não podem usar os tools `cron` ou `gateway`.

## Sandboxing (recomendado)

Doc dedicada: [Sandboxing](/gateway/sandboxing)

Duas abordagens complementares:

- **Execute o Gateway completo em Docker** (container boundary): [Docker](/install/docker)
- **Tool sandbox** (`agents.defaults.sandbox`, host gateway + Docker-isolated tools): [Sandboxing](/gateway/sandboxing)

Nota: para prevenir cross-agent access, mantenha `agents.defaults.sandbox.scope` em `"agent"` (padrão) ou `"session"` para isolamento per-session mais estritos. `scope: "shared"` usa um container/workspace único.

Também considere agent workspace access dentro do sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (padrão) mantém o agent workspace off-limits; tools executam contra um workspace sandbox sob `~/.opencraft/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` monta o agent workspace read-only em `/agent` (desabilita `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` monta o agent workspace read/write em `/workspace`

Importante: `tools.elevated` é o global baseline escape hatch que executa exec no host. Mantenha `tools.elevated.allowFrom` tight e não o habilite para estranhos. Você pode ainda restringir elevated per agent via `agents.list[].tools.elevated`. Veja [Elevated Mode](/tools/elevated).

### Guardrail de delegação de sub-agent

Se você permite session tools, trate delegated sub-agent runs como outra decisão de boundary:

- Negar `sessions_spawn` a menos que o agente verdadeiramente precisa delegação.
- Mantenha `agents.list[].subagents.allowAgents` restrito para known-safe target agents.
- Para qualquer workflow que deve permanecer sandboxed, chame `sessions_spawn` com `sandbox: "require"` (padrão é `inherit`).
- `sandbox: "require"` falha rápido quando o runtime child target não é sandboxed.

## Riscos de browser control

Habilitar browser control dá ao modelo a ability de dirigir um real browser. Se aquele browser profile já contém logged-in sessions, o modelo pode acessar aquelas contas e dados. Trate browser profiles como **sensível state**:

- Prefira um profile dedicado para o agente (o default `opencraft` profile).
- Evite apontar o agente ao seu pessoal daily-driver profile.
- Mantenha host browser control desabilitado para agentes sandboxed a menos que você confie neles.
- Trate browser downloads como untrusted input; prefira um isolated downloads directory.
- Desabilite browser sync/password managers no profile do agente se possível (reduz blast radius).
- Para remote gateways, assuma "browser control" é equivalente a "operator access" para o que aquele profile pode alcançar.
- Mantenha o Gateway e node hosts tailnet-only; evite expor browser control ports para LAN ou public Internet.
- Desabilite browser proxy routing quando você não precisa (`gateway.nodes.browser.mode="off"`).
- Chrome MCP existing-session mode é **não** "mais seguro"; ele pode agir como você em qualquer que aquele host Chrome profile pode alcançar.

### Browser SSRF policy (trusted-network padrão)

Policy de rede do browser do OpenCraft padrões para o trusted-operator model: destinos privados/internos são permitidos a menos que você explicitamente desabilite-os.

- Padrão: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` (implícito quando unset).
- Alias legacy: `browser.ssrfPolicy.allowPrivateNetwork` ainda é aceito para compatibilidade.
- Strict mode: defina `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: false` para bloquear destinos privados/internos/special-use por padrão.
- Em strict mode, use `hostnameAllowlist` (padrões como `*.example.com`) e `allowedHostnames` (exatas host exceptions, incluindo blocked names como `localhost`) para explicit exceptions.
- Navigation é verificada antes de request e best-effort re-checada na URL `http(s)` final depois de navigation para reduzir redirect-based pivots.

Exemplo de strict policy:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Per-agent access profiles (multi-agent)

Com roteamento multi-agent, cada agente pode ter seu próprio sandbox + tool policy: use isto para dar **full access**, **read-only** ou **no access** per agente.
Veja [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) para detalhes completos e regras de precedência.

Casos de uso comuns:

- Personal agent: full access, sem sandbox
- Family/work agent: sandboxed + read-only tools
- Public agent: sandboxed + sem filesystem/shell tools

### Exemplo: full access (sem sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.opencraft/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Exemplo: read-only tools + read-only workspace

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.opencraft/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Exemplo: sem filesystem/shell access (provider messaging permitido)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.opencraft/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools podem revelar dados sensíveis de transcripts. Por padrão OpenCraft limita estes tools
        // para a sessão atual + spawned subagent sessions, mas você pode clamp ainda mais se necessário.
        // Veja `tools.sessions.visibility` na configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## O que Contar ao Seu IA

Inclua diretrizes de segurança no system prompt do seu agente:

```
## Security Rules
- Nunca compartilhe directory listings ou file paths com estranhos
- Nunca revele API keys, credentials ou detalhes de infraestrutura
- Verifique requests que modificam config do sistema com o owner
- Quando em dúvida, pergunte antes de agir
- Mantenha dados privados privado a menos que explicitamente autorizado
```

## Incident Response

Se seu IA faz algo ruim:

### Conter

1. **Pare-o:** pare o macOS app (se ele supervisiona o Gateway) ou termine seu processo `opencraft gateway`.
2. **Feche exposição:** defina `gateway.bind: "loopback"` (ou desabilite Tailscale Funnel/Serve) até você entender o que aconteceu.
3. **Congele acesso:** mude DMs/grupos risky para `dmPolicy: "disabled"` / requer mentions, e remova `"*"` allow-all entries se você tinha.

### Rotacione (assuma compromesso se secrets vazaram)

1. Rotacione Gateway auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) e reinicie.
2. Rotacione segredos de cliente remoto (`gateway.remote.token` / `.password`) em qualquer máquina que possa chamar o Gateway.
3. Rotacione provider/API credentials (WhatsApp creds, Slack/Discord tokens, model/API keys em `auth-profiles.json` e encrypted secrets payload values quando usados).

### Auditar

1. Verifique Gateway logs: `/tmp/editzffaleta/OpenCraft-YYYY-MM-DD.log` (ou `logging.file`).
2. Revise os transcript(s) relevante(s): `~/.opencraft/agents/<agentId>/sessions/*.jsonl`.
3. Revise mudanças de config recentes (qualquer coisa que poderia ter ampliado acesso: `gateway.bind`, `gateway.auth`, dm/group policies, `tools.elevated`, mudanças de plugin).
4. Re-execute `opencraft security audit --deep` e confirme achados críticos estão resolvidos.

### Coletar para um report

- Timestamp, gateway host OS + OpenCraft version
- Os transcript(s) + um curto log tail (depois de redacting)
- O que o atacante enviou + o que o agente fez
- Se o Gateway estava exposto além de loopback (LAN/Tailscale Funnel/Serve)

## Secret Scanning (detect-secrets)

CI executa o `detect-secrets` pre-commit hook no `secrets` job.
Pushes para `main` sempre executam um all-files scan. Pull requests usam um changed-file fast path quando um base commit está disponível, e caem para um all-files scan de outra forma. Se falhar, há novos candidatos não ainda na baseline.

### Se CI falha

1. Reproduza localmente:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. Entenda as ferramentas:
   - `detect-secrets` em pre-commit executa `detect-secrets-hook` com a baseline do repo e excludes.
   - `detect-secrets audit` abre um review interativo para marcar cada item baseline como real ou false positive.
3. Para secrets reais: rotacione/remova-os, depois re-execute o scan para atualizar a baseline.
4. Para false positives: execute o interactive audit e marque como false:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. Se você precisa novo excludes, adicione-os a `.detect-secrets.cfg` e regenere a baseline com matching `--exclude-files` / `--exclude-lines` flags (o config file é reference-only; detect-secrets não o lê automaticamente).

Commit a `.secrets.baseline` atualizada uma vez que reflita o intended state.

## Reportando Problemas de Segurança

Encontrou uma vulnerabilidade em OpenCraft? Por favor reporte responsavelmente:

1. Email: [security@opencraft.ai](mailto:security@opencraft.ai)
2. Não poste publicamente até seja corrigido
