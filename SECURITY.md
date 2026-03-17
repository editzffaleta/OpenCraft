# Política de Segurança

Se você acredita que encontrou um problema de segurança no OpenCraft, por favor reporte-o em privado.

## Reportagem

Reporte vulnerabilidades diretamente no repositório onde o problema existe:

- **Core CLI and gateway** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft)
- **macOS desktop app** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) (apps/macos)
- **iOS app** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) (apps/ios)
- **Android app** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) (apps/android)
- **ClawHub** — [opencraft/clawhub](https://github.com/opencraft/clawhub)
- **Trust and threat model** — [opencraft/trust](https://github.com/opencraft/trust)

Para problemas que não se encaixam em um repositório específico, ou se tiver dúvidas, envie um email para **[security@opencraft.ai](mailto:security@opencraft.ai)** e nós o redirecionaremos.

Para instruções completas de reportagem, consulte nossa [página de Confiança](https://trust.opencraft.ai).

### Obrigatório nos Relatórios

1. **Título**
2. **Avaliação de Severidade**
3. **Impacto**
4. **Componente Afetado**
5. **Reprodução Técnica**
6. **Impacto Demonstrado**
7. **Ambiente**
8. **Conselho de Remediação**

Relatórios sem etapas de reprodução, impacto demonstrado e conselho de remediação serão depriorizados. Dado o volume de descobertas geradas por scanner de IA, devemos garantir que estamos recebendo relatórios vetados de pesquisadores que entendem os problemas.

### Gate de Aceitação de Relatório (Caminho Rápido de Triagem)

Para triagem mais rápida, inclua todos os seguintes itens:

- Caminho vulnerável exato (`file`, função e intervalo de linhas) em uma revisão atual.
- Detalhes da versão testada (versão do OpenCraft e/ou SHA do commit).
- PoC reproduzível contra a versão mais recente `main` ou versão lançada mais recente.
- Se a alegação visa uma versão lançada, evidência da tag enviada e artefato/pacote publicado para essa versão exata (não apenas `main`).
- Impacto demonstrado vinculado aos limites de confiança documentados do OpenCraft.
- Para relatórios de credencial exposta: prova de que a credencial é propriedade do OpenCraft (ou concede acesso à infraestrutura/serviços operados pelo OpenCraft).
- Declaração explícita de que o relatório não depende de operadores adversariais compartilhando um host/config do gateway.
- Verificação de escopo explicando por que o relatório **não** está coberto pela seção Fora do Escopo abaixo.
- Para relatórios de risco de comando/paridade (por exemplo, diferenças de detecção de ofuscação), um caminho concreto de bypass de limite é necessário (auth/approval/allowlist/sandbox). Descobertas de paridade são tratadas como endurecimento, não vulnerabilidades.

Relatórios que perdem esses requisitos podem ser fechados como `invalid` ou `no-action`.

### Padrões Comuns de Falsos Positivos

Estes são frequentemente reportados, mas geralmente são fechados sem alteração de código:

- Cadeias de injeção de prompt sem bypass de limite (injeção de prompt está fora do escopo).
- Recursos locais pretendidos pelo operador (por exemplo, shell local TUI `!`) apresentados como injeção remota.
- Relatórios que tratam superfícies de controle de operador explícitas (por exemplo, `canvas.eval`, execução de script/avaliação de navegador ou primitivos de execução `node.invoke` diretos) como vulnerabilidades sem demonstrar um bypass de limite de auth/política/sandbox. Essas capacidades são intencionais quando habilitadas e são recursos de operador confiável, não bugs de segurança independentes.
- Ações locais desencadeadas por usuário autorizado apresentadas como escalação de privilégio. Exemplo: um remetente autorizado/proprietário executando `/export-session /absolute/path.html` para escrever no host. Neste modelo de confiança, ações autorizadas de usuário são ações de host confiáveis, a menos que você demonstre um bypass de auth/sandbox/limite.
- Relatórios que apenas mostram um plugin malicioso executando ações privilegiadas após um operador confiável instalar/habilitá-lo.
- Relatórios que assumem autorização multi-tenant por usuário em um host/config do gateway compartilhado.
- Relatórios que tratam os endpoints de compatibilidade HTTP do Gateway (`POST /v1/chat/completions`, `POST /v1/responses`) como se tivessem implementado auth de operador com escopo (`operator.write` vs `operator.admin`). Esses endpoints autenticam o secret/senha do portador do Gateway compartilhado e são superfícies de acesso de operador completo documentadas, não limites por usuário/escopo.
- Relatórios que apenas mostram diferenças em detecção heurística/paridade (por exemplo, detecção de padrão de ofuscação em um caminho exec, mas não em outro, como lacunas de paridade `node.invoke -> system.run`) sem demonstrar bypass de auth, aprovações, imposição de allowlist, sandboxing ou outros limites de confiança documentados.
- Alegações de ReDoS/DoS que requerem entrada de configuração de operador confiável (por exemplo, regex catastrófica em `sessionFilter` ou `logging.redactPatterns`) sem um bypass de limite de confiança.
- Alegações de extração de arquivo/instalação que requerem preparação de sistema de arquivos local preexistente em estado confiável (por exemplo, plantando aliases symlink/hardlink sob diretórios de destino como caminhos de skills/tools) sem mostrar um caminho não confiável que possa criar/controlar essa primitiva.
- Relatórios que dependem de substituir ou reescrever um caminho executável já aprovado em um host confiável (swap de inode/conteúdo do mesmo caminho) sem mostrar um caminho não confiável para executar essa escrita.
- Relatórios que dependem de estado de sistema de arquivos de skill/workspace symlinked pré-existente (por exemplo, cadeias symlink envolvendo `skills/*/SKILL.md`) sem mostrar um caminho não confiável que possa criar/controlar esse estado.
- Achados HSTS faltando em deployments locais/loopback padrão.
- Achados de assinatura webhook Slack quando o modo HTTP já usa verificação de secret de assinatura.
- Achados de assinatura webhook Discord inbound para caminhos não usados pela integração Discord deste repositório.
- Alegações de que Microsoft Teams `fileConsent/invoke` `uploadInfo.uploadUrl` é controlado pelo atacante sem demonstrar um de: bypass de limite de auth, um evento real autenticado do Teams/Bot Framework carregando URL escolhida pelo atacante, ou compromisso do caminho de confiança Microsoft/Bot.
- Alegações de scanner contra caminhos obsoletos/inexistentes, ou alegações sem um repro funcional.
- Relatórios que reafirmam um problema já corrigido contra versões lançadas posteriormente sem mostrar que o caminho vulnerável ainda existe na tag enviada ou artefato publicado para essa versão posterior.

### Tratamento de Relatórios Duplicados

- Pesquise os advisories existentes antes de apresentar.
- Inclua IDs GHSA provavelmente duplicados em seu relatório quando aplicável.
- Mantenedores podem fechar duplicatas de menor qualidade/posteriores em favor do relatório canônico de maior qualidade mais antigo.

## Segurança e Confiança

**Jamieson O'Reilly** ([@theonejvo](https://twitter.com/theonejvo)) é Security & Trust no OpenCraft. Jamieson é fundador da [Dvuln](https://dvuln.com) e traz ampla experiência em segurança ofensiva, teste de penetração e desenvolvimento de programa de segurança.

## Recompensas por Bugs

OpenCraft é um trabalho de amor. Não há programa de recompensa por bugs e nenhum orçamento para relatórios pagos. Por favor, ainda assim divulgue responsavelmente para que possamos corrigir problemas rapidamente.
A melhor maneira de ajudar o projeto agora é enviando PRs.

## Mantenedores: Atualizações GHSA via CLI

Ao corrigir um GHSA via `gh api`, inclua `X-GitHub-Api-Version: 2022-11-28` (ou mais recente). Sem isso, alguns campos (notavelmente CVSS) podem não persistir mesmo se a solicitação retornar 200.

## Modelo de Confiança de Operador (Importante)

OpenCraft **não** modela um gateway como um limite de usuário adversarial multi-tenant.

- Chamadores de Gateway autenticados são tratados como operadores confiáveis para aquela instância de gateway.
- Os endpoints de compatibilidade HTTP (`POST /v1/chat/completions`, `POST /v1/responses`) estão no mesmo bucket de operador confiável. Passar auth de portador do Gateway lá é equivalente a acesso de operador para aquele gateway; eles não implementam uma divisão de confiança `operator.write` vs `operator.admin` mais estreita.
- Identificadores de sessão (`sessionKey`, IDs de sessão, labels) são controles de roteamento, não limites de autorização por usuário.
- Se um operador pode visualizar dados de outro operador no mesmo gateway, isso é esperado neste modelo de confiança.
- OpenCraft pode tecnicamente executar múltiplas instâncias do gateway em uma máquina, mas as operações recomendadas são separação clara por limite de confiança.
- Modo recomendado: um usuário por máquina/host (ou VPS), um gateway para esse usuário e um ou mais agents dentro daquele gateway.
- Se múltiplos usuários precisam do OpenCraft, use um VPS (ou limite de usuário/host/SO) por usuário.
- Para configurações avançadas, múltiplos gateways em uma máquina são possíveis, mas apenas com isolamento estrito e não são o padrão recomendado.
- O comportamento Exec é host-first por padrão: `agents.defaults.sandbox.mode` assume como padrão `off`.
- `tools.exec.host` assume como padrão `sandbox` como uma preferência de roteamento, mas se o runtime sandbox não estiver ativo para a sessão, exec é executado no host do gateway.
- Chamadas exec implícitas (sem host explícito na chamada de ferramenta) seguem o mesmo comportamento.
- Isso é esperado no modelo de operador confiável de um usuário do OpenCraft. Se você precisa de isolamento, habilite o modo sandbox (`non-main`/`all`) e mantenha uma política de ferramentas rigorosa.

## Conceito de Plugin Confiável (Core)

Plugins/extensões fazem parte da base de computação confiável do OpenCraft para um gateway.

- Instalar ou habilitar um plugin concede a ele o mesmo nível de confiança que código local em execução naquele host do gateway.
- Comportamento de plugin como ler env/arquivos ou executar comandos do host é esperado dentro deste limite de confiança.
- Relatórios de segurança devem mostrar um bypass de limite (por exemplo, carregamento de plugin não autenticado, bypass de allowlist/política ou bypass de sandbox/segurança de caminho), não apenas comportamento malicioso de um plugin confiável instalado.

## Fora do Escopo

- Exposição à Internet Pública
- Usar OpenCraft de formas que a documentação recomenda não fazer
- Deployments onde operadores mutuamente não confiáveis/adversariais compartilham um host/config do gateway (por exemplo, relatórios esperando isolamento por operador para `sessions.list`, `sessions.preview`, `chat.history` ou leituras de plano de controle semelhantes)
- Ataques de injeção de prompt (sem bypass de limite de política/auth/sandbox)
- Relatórios que requerem acesso de escrita a estado local confiável (`~/.opencraft`, arquivos de workspace como `MEMORY.md` / `memory/*.md`)
- Relatórios onde exploratibilidade depende de estado de sistema de arquivos symlink/hardlink pré-existente controlado pelo atacante em caminhos locais confiáveis (por exemplo, árvores de destino de extração/instalação) a menos que um bypass de limite não confiável separado seja demonstrado que cria aquele estado.
- Relatórios cuja única alegação é expansão de leitura de sandbox/workspace através de estado symlink confiável de skill/workspace local (por exemplo, cadeias symlink `skills/*/SKILL.md`) a menos que um bypass de limite não confiável separado seja demonstrado que cria/controla aquele estado.
- Relatórios cuja única alegação é drift de identidade executável pós-aprovação em um host confiável via substituição/reescrita de arquivo do mesmo caminho a menos que um bypass de limite não confiável separado seja demonstrado para aquela primitiva de escrita do host.
- Relatórios onde o único impacto demonstrado é um remetente já autorizado invocando intencionalmente um comando de ação local (por exemplo, `/export-session` escrevendo em um caminho de host absoluto) sem contornar auth, sandbox ou outro limite documentado
- Relatórios cuja única alegação é uso de uma superfície de controle de operador confiável explícita (por exemplo, `canvas.eval`, execução de script/avaliação de navegador, ou execução `node.invoke` direto) sem demonstrar um bypass de auth, política, allowlist, aprovação ou sandbox.
- Relatórios onde a única alegação é que um plugin confiável instalado/habilitado pode executar com privilégios de gateway/host (comportamento de modelo de confiança documentado).
- Qualquer relatório cuja única alegação seja que uma opção de config `dangerous*`/`dangerously*` habilitada pelo operador enfraquece padrões (estes são tradeoffs de break-glass explícitos por design)
- Relatórios que dependem de valores de configuração fornecidos pelo operador confiável para desencadear impacto de disponibilidade (por exemplo, padrões de regex customizados). Estes ainda podem ser corrigidos como endurecimento de defesa-em-profundidade, mas não são bypasses de limite de segurança.
- Relatórios cuja única alegação é drift heurístico/paridade em detecção de risco de comando (por exemplo, verificações de padrão de ofuscação) através de superfícies exec, sem um bypass de limite de confiança demonstrado. Estes são achados apenas de endurecimento e não são vulnerabilidades; triagem pode fechá-los como `invalid`/`no-action` ou rastreá-los separadamente como endurecimento baixo/informacional.
- Relatórios cuja única alegação é que aprovações exec não modelam semanticamente cada forma de carregador de intérprete/runtime, subcomando, combinação de flag, script de pacote ou importação de módulo/config transitiva. Aprovações exec vinculam contexto exato de solicitação e operandos de arquivo local direto de melhor esforço; elas não são um modelo semântico completo de tudo o que um runtime pode carregar.
- Segredos expostos que são credenciais controladas por terceiros/usuário (não propriedade do OpenCraft e não concedendo acesso à infraestrutura/serviços operados pelo OpenCraft) sem impacto demonstrado do OpenCraft
- Relatórios cuja única alegação é exec do lado do host quando o runtime sandbox está desabilitado/indisponível (comportamento padrão documentado no modelo de operador confiável), sem um bypass de limite.
- Relatórios cuja única alegação é que uma URL de destino de upload fornecida pela plataforma não é confiável (por exemplo, Microsoft Teams `fileConsent/invoke` `uploadInfo.uploadUrl`) sem provar controle de atacante em um fluxo de produção autenticado.

## Suposições de Deployment

A orientação de segurança do OpenCraft assume:

- O host onde OpenCraft é executado está dentro de um limite de SO/administrador confiável.
- Qualquer pessoa que possa modificar estado/config `~/.opencraft` (incluindo `opencraft.json`) é efetivamente um operador confiável.
- Um Gateway único compartilhado por pessoas mutuamente não confiáveis é **não recomendado**. Use gateways separados (ou no mínimo usuários/hosts de SO separados) por limite de confiança.
- Chamadores de Gateway autenticados são tratados como operadores confiáveis. Identificadores de sessão (por exemplo, `sessionKey`) são controles de roteamento, não limites de autorização por usuário.
- Múltiplas instâncias do gateway podem ser executadas em uma máquina, mas o modelo recomendado é isolamento limpo por usuário (prefira um host/VPS por usuário).

## Modelo de Confiança de Um Usuário (Assistente Pessoal)

O modelo de segurança do OpenCraft é "assistente pessoal" (um operador confiável, potencialmente muitos agents), não "barramento multi-tenant compartilhado."

- Se múltiplas pessoas podem enviar mensagens para o mesmo agent habilitado por ferramentas (por exemplo, um workspace Slack compartilhado), todas podem direcionar aquele agent dentro de suas permissões concedidas.
- Status de remetente não proprietário apenas afeta ferramentas/comandos apenas do proprietário. Se um não proprietário ainda puder acessar uma ferramenta não apenas do proprietário no mesmo agent (por exemplo, `canvas`), isso está dentro do limite de ferramenta concedido, a menos que o relatório demonstre um auth, política, allowlist, aprovação ou bypass de sandbox.
- Escopo de sessão ou memória reduz vazamento de contexto, mas **não** cria limites de autorização de host por usuário.
- Para usuários de confiança mista ou adversariais, isole por usuário/host/gateway de SO e use credenciais separadas por limite.
- Um agent compartilhado por empresa pode ser uma configuração válida quando usuários estão no mesmo limite de confiança e o agent é estritamente apenas para negócios.
- Para configurações compartilhadas por empresa, use uma máquina/VM/container dedicada e contas dedicadas; evite misturar dados pessoais naquele runtime.
- Se aquele host/perfil de navegador estiver conectado em contas pessoais (por exemplo, Apple/Google/gerenciador de senha pessoal), você colapsou o limite e aumentou o risco de exposição de dados pessoais.

## Suposições de Agent e Modelo

- O modelo/agent é **não** um principal confiável. Assuma que injeção de prompt/conteúdo pode manipular comportamento.
- Limites de segurança vêm de confiança de host/config, auth, política de ferramenta, sandboxing e aprovações exec.
- Injeção de prompt por si só não é um relatório de vulnerabilidade a menos que atravesse um desses limites.
- Payloads acionados por hook/webhook devem ser tratados como conteúdo não confiável; mantenha flags de bypass não seguro desabilitadas a menos que estejam fazendo debugging estritamente escopo (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`).
- Níveis de modelo fraco são geralmente mais fáceis de prompt-injetar. Para agents habilitados por ferramentas ou acionados por hook, prefira níveis de modelo moderno forte e política de ferramenta rigorosa (por exemplo, `tools.profile: "messaging"` ou mais rigoroso), além de sandboxing onde possível.

## Conceito de Confiança de Gateway e Node

OpenCraft separa roteamento de execução, mas ambos permanecem dentro do mesmo limite de confiança de operador:

- **Gateway** é o plano de controle. Se um chamador passa auth do Gateway, ele é tratado como um operador confiável para aquele Gateway.
- **Node** é uma extensão de execução do Gateway. Parear um node concede capacidade remota no nível de operador naquele node.
- **Aprovações Exec** (allowlist/ask UI) são proteções de operador para reduzir execução de comando acidental, não um limite de autorização multi-tenant.
- Aprovações exec vinculam contexto exato de comando/cwd/env e, quando OpenCraft pode identificar um operando de arquivo/script local concreto, aquele snapshot de arquivo também. Este é endurecimento de integridade de melhor esforço, não um modelo semântico completo de cada caminho de carregador de intérprete/runtime.
- Diferenças em heurística de aviso de risco de comando entre superfícies exec (`gateway`, `node`, `sandbox`) não, por si só, constituem um bypass de limite de segurança.
- Para isolamento de usuário não confiável, divida por limite de confiança: gateways separados e usuários/hosts de SO separados por limite.

## Limite de Confiança de Memória de Workspace

`MEMORY.md` e `memory/*.md` são arquivos de workspace simples e são tratados como estado de operador local confiável.

- Se alguém pode editar arquivos de memória de workspace, eles já cruzaram o limite de operador confiável.
- Indexação/recall de busca de memória sobre aqueles arquivos é comportamento esperado, não um limite de sandbox/segurança.
- Padrão de relatório de exemplo considerado fora de escopo: "atacante escreve conteúdo malicioso em `memory/*.md`, então `memory_search` o retorna."
- Se você precisa de isolamento entre usuários mutuamente não confiáveis, divida por usuário de SO ou host e execute gateways separados.

## Limite de Confiança de Plugin

Plugins/extensões são carregados **in-process** com o Gateway e são tratados como código confiável.

- Plugins podem executar com os mesmos privilégios de SO que o processo OpenCraft.
- Ajudantes de runtime (por exemplo, `runtime.system.runCommandWithTimeout`) são APIs de conveniência, não um limite de sandbox.
- Apenas instale plugins que você confia e prefira `plugins.allow` para fixar IDs de plugin confiáveis explícitos.

## Limite de Pasta Temporária (Mídia/Sandbox)

OpenCraft usa uma raiz temp dedicada para handoff de mídia local e artefatos temp sandbox-adjacentes:

- Raiz temp preferida: `/tmp/opencraft` (quando disponível e seguro no host).
- Raiz temp fallback: `os.tmpdir()/opencraft` (ou `opencraft-<uid>` em hosts multi-usuário).

Notas sobre limite de segurança:

- Validação de mídia sandbox permite caminhos temp absolutos apenas sob a raiz temp gerenciada pelo OpenCraft.
- Caminhos tmp de host arbitrários não são tratados como raízes de mídia confiáveis.
- Código de plugin/extensão deve usar ajudantes temp do OpenCraft (`resolvePreferredOpenCraftTmpDir`, `buildRandomTempFilePath`, `withTempDownloadPath`) em vez de padrões brutos de `os.tmpdir()` ao lidar com arquivos de mídia.
- Pontos de referência de imposição:
  - resolvedor de raiz temp: `src/infra/tmp-opencraft-dir.ts`
  - ajudantes de SDK temp: `src/plugin-sdk/temp-path.ts`
  - guardrail tmp de mensagens/canal: `scripts/check-no-random-messaging-tmp.mjs`

## Orientação Operacional

Para orientação de modelo de ameaça + endurecimento (incluindo `opencraft security audit --deep` e `--fix`), consulte:

- `https://docs.opencraft.ai/gateway/security`

### Endurecimento de sistema de arquivos de ferramentas

- `tools.exec.applyPatch.workspaceOnly: true` (recomendado): mantém escritas/exclusões de `apply_patch` dentro do diretório de workspace configurado.
- `tools.fs.workspaceOnly: true` (opcional): restringe caminhos de `read`/`write`/`edit`/`apply_patch` e caminhos de auto-carregamento de imagem de prompt nativo ao diretório de workspace.
- Evite definir `tools.exec.applyPatch.workspaceOnly: false` a menos que você confie plenamente em quem pode desencadear execução de ferramentas.

### Endurecimento de delegação de sub-agent

- Mantenha `sessions_spawn` negado a menos que você explicitamente precise de execuções delegadas.
- Mantenha `agents.list[].subagents.allowAgents` estreito e inclua apenas agents com configurações de sandbox que você confia.
- Quando delegação deve permanecer em sandbox, chame `sessions_spawn` com `sandbox: "require"` (padrão é `inherit`).
  - `sandbox: "require"` rejeita o spawn a menos que o runtime filho alvo esteja em sandbox.
  - Isso previne uma sessão menos restrita de delegar trabalho em um filho não em sandbox por engano.

### Segurança de Interface Web

A interface web do OpenCraft (Gateway Control UI + HTTP endpoints) é destinada **apenas para uso local**.

- Recomendado: mantenha o Gateway **apenas loopback** (`127.0.0.1` / `::1`).
  - Config: `gateway.bind="loopback"` (padrão).
  - CLI: `opencraft gateway run --bind loopback`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth` é destinado para uso break-glass apenas localhost.
  - OpenCraft mantém flexibilidade de deployment por design e não proíbe duro setups não locais.
  - Configurações não locais e outras arriscadas são surfaced por `opencraft security audit` como achados perigosos.
  - Este tradeoff selecionado por operador é por design e não, por si só, uma vulnerabilidade de segurança.
- Nota de host canvas: canvas visível em rede é **intencional** para cenários de node confiável (LAN/tailnet).
  - Setup esperado: bind não loopback + auth de Gateway (token/senha/trusted-proxy) + controles de firewall/tailnet.
  - Rotas esperadas: `/__opencraft__/canvas/`, `/__opencraft__/a2ui/`.
  - Este modelo de deployment sozinho não é uma vulnerabilidade de segurança.
- **Não** o exponha à internet pública (sem bind direto a `0.0.0.0`, sem proxy reverso público). Não está endurecido para exposição pública.
- Se você precisar de acesso remoto, prefira um túnel SSH ou Tailscale serve/funnel (para que o Gateway ainda se vincule a loopback), além de auth de Gateway forte.
- A superfície HTTP do Gateway inclui o host canvas (`/__opencraft__/canvas/`, `/__opencraft__/a2ui/`). Trate conteúdo canvas como sensível/não confiável e evite expô-lo além de loopback a menos que você entenda o risco.

## Requisitos de Runtime

### Versão Node.js

OpenCraft requer **Node.js 22.12.0 ou posterior** (LTS). Esta versão inclui patches de segurança importantes:

- CVE-2025-59466: vulnerabilidade async_hooks DoS
- CVE-2026-21636: vulnerabilidade de bypass de modelo de permissão

Verifique sua versão Node.js:

```bash
node --version  # Should be v22.12.0 or later
```

### Segurança Docker

Ao executar OpenCraft no Docker:

1. A imagem oficial é executada como usuário não-root (`node`) para superfície de ataque reduzida
2. Use flag `--read-only` quando possível para proteção adicional do sistema de arquivos
3. Limite capacidades de container com `--cap-drop=ALL`

Exemplo de execução Docker segura:

```bash
docker run --read-only --cap-drop=ALL \
  -v opencraft-data:/app/data \
  editzffaleta/OpenCraft:latest
```

## Scanning de Segurança

Este projeto usa `detect-secrets` para detecção automática de segredos em CI/CD.
Consulte `.detect-secrets.cfg` para configuração e `.secrets.baseline` para a linha de base.

Execute localmente:

```bash
pip install detect-secrets==1.5.0
detect-secrets scan --baseline .secrets.baseline
```
