# Política de Segurança

Se você acredita ter encontrado um problema de segurança no OpenCraft, reporte-o de forma privada.

## Reportando

Reporte vulnerabilidades diretamente no repositório onde o problema vive:

- **Core CLI e gateway** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft)
- **App desktop macOS** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) (apps/macos)
- **App iOS** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) (apps/ios)
- **App Android** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) (apps/android)

Para problemas que não se encaixam em um repo específico, ou se não tiver certeza, abra uma issue privada no GitHub.

### Campos Obrigatórios no Reporte

1. **Título**
2. **Avaliação de Severidade**
3. **Impacto**
4. **Componente Afetado**
5. **Reprodução Técnica**
6. **Impacto Demonstrado**
7. **Ambiente**
8. **Conselho de Remediação**

Reportes sem passos de reprodução, impacto demonstrado e conselho de remediação serão despriorizados. Dado o volume de descobertas de scanners geradas por IA, precisamos garantir que estamos recebendo reportes verificados de pesquisadores que entendem os problemas.

### Requisitos para Triagem Rápida

Para triagem mais rápida, inclua todos os seguintes:

- Caminho vulnerável exato (`arquivo`, função e intervalo de linhas) numa revisão atual.
- Detalhes da versão testada (versão do OpenCraft e/ou commit SHA).
- PoC reproduzível contra o `main` mais recente ou versão lançada mais recente.
- Se a alegação tem como alvo uma versão lançada, evidência da tag enviada e artefato/pacote publicado para aquela versão exata.
- Impacto demonstrado vinculado aos limites de confiança documentados do OpenCraft.
- Declaração explícita de que o reporte não depende de operadores adversariais compartilhando um host/config de gateway.
- Verificação de escopo explicando por que o reporte **não** está coberto pela seção Fora do Escopo abaixo.

Reportes que não atendem esses requisitos podem ser fechados como `invalid` ou `no-action`.

### Padrões Comuns de Falso Positivo

Estes são frequentemente reportados mas tipicamente fechados sem mudança de código:

- Cadeias de prompt-injection-only sem bypass de limite (prompt injection está fora do escopo).
- Funcionalidades locais intencionais do operador apresentadas como injeção remota.
- Reportes que tratam superfícies de controle explícitas do operador (ex: `canvas.eval`, execução de browser evaluate/script, ou primitivos de execução direta `node.invoke`) como vulnerabilidades sem demonstrar bypass de limite de auth/política/sandbox.
- Ações locais disparadas por usuário autorizado apresentadas como escalada de privilégio.
- Reportes que mostram apenas um plugin malicioso executando ações privilegiadas após um operador confiável instalá-lo/habilitá-lo.
- Reportes que assumem autorização multi-tenant por usuário num host/config de gateway compartilhado.
- Alegações ReDoS/DoS que requerem entrada de configuração de operador confiável sem bypass de limite de confiança.
- Descobertas de HSTS ausente em deployments padrão locais/loopback.
- Alegações somente de scanner contra caminhos obsoletos/inexistentes, ou alegações sem reprodução funcionando.

### Tratamento de Reportes Duplicados

- Pesquise avisos existentes antes de registrar.
- Inclua IDs GHSA prováveis de duplicata no seu reporte quando aplicável.
- Mantenedores podem fechar duplicatas de menor qualidade/posteriores em favor do reporte canônico original de maior qualidade.

## Bug Bounties

O OpenCraft é um projeto de código aberto. Não há programa de bug bounty e sem orçamento para reportes pagos. Por favor ainda divulgue de forma responsável para que possamos corrigir problemas rapidamente.
A melhor forma de ajudar o projeto agora é enviando PRs.

## Modelo de Confiança do Operador (Importante)

O OpenCraft **não** modela um gateway como um limite de usuário multi-tenant adversarial.

- Chamadores autenticados do Gateway são tratados como operadores confiáveis para aquela instância de gateway.
- Os endpoints de compatibilidade HTTP (`POST /v1/chat/completions`, `POST /v1/responses`) estão no mesmo bucket de operador confiável.
- Identificadores de sessão (`sessionKey`, IDs de sessão, labels) são controles de roteamento, não limites de autorização por usuário.
- Se um operador pode ver dados de outro operador no mesmo gateway, isso é esperado neste modelo de confiança.
- Modo recomendado: um usuário por máquina/host (ou VPS), um gateway para aquele usuário, e um ou mais agentes dentro daquele gateway.
- Se múltiplos usuários precisam do OpenCraft, use um VPS (ou limite de usuário/host de SO) por usuário.

## Conceito de Plugin Confiável (Core)

Plugins/extensões fazem parte da base computacional confiável do OpenCraft para um gateway.

- Instalar ou habilitar um plugin concede a ele o mesmo nível de confiança que código local rodando naquele host de gateway.
- Comportamento de plugin como leitura de env/arquivos ou execução de comandos do host é esperado dentro deste limite de confiança.
- Reportes de segurança devem mostrar um bypass de limite, não apenas comportamento malicioso de um plugin instalado confiável.

## Fora do Escopo

- Exposição pública na Internet
- Usar o OpenCraft de formas que a documentação recomenda não usar
- Deployments onde operadores mutuamente não confiáveis/adversariais compartilham um host e config de gateway
- Ataques de prompt-injection-only (sem bypass de política/auth/sandbox)
- Reportes que requerem acesso de escrita ao estado local confiável (`~/.opencraft`, arquivos de workspace como `MEMORY.md` / `memory/*.md`)
- Secrets expostos que são credenciais de terceiros/controladas pelo usuário (não pertencentes ao OpenCraft e não concedendo acesso à infraestrutura/serviços operados pelo OpenCraft) sem impacto demonstrado no OpenCraft
- Qualquer reporte cujo único argumento é que uma opção de configuração `dangerous*`/`dangerously*` habilitada pelo operador enfraquece os padrões (essas são trocas explícitas de break-glass por design)

## Pressupostos de Deployment

A orientação de segurança do OpenCraft pressupõe:

- O host onde o OpenCraft roda está dentro de um limite de SO/admin confiável.
- Qualquer pessoa que pode modificar o estado/config `~/.opencraft` (incluindo `opencraft.json`) é efetivamente um operador confiável.
- Um único Gateway compartilhado por pessoas mutuamente não confiáveis **não é um setup recomendado**. Use gateways separados (ou no mínimo usuários/hosts de SO separados) por limite de confiança.
- Chamadores autenticados do Gateway são tratados como operadores confiáveis. Identificadores de sessão são controles de roteamento, não limites de autorização por usuário.

## Modelo de Confiança de Usuário Único (Assistente Pessoal)

O modelo de segurança do OpenCraft é "assistente pessoal" (um operador confiável, potencialmente muitos agentes), não "barramento multi-tenant compartilhado."

- Se múltiplas pessoas podem enviar mensagem ao mesmo agente com ferramentas habilitadas, elas podem todas guiar aquele agente dentro das permissões concedidas.
- Status de remetente não-owner afeta apenas ferramentas/comandos exclusivos do owner.
- Para usuários de confiança mista ou adversariais, isole por usuário de SO/host/gateway e use credenciais separadas por limite.

## Pressupostos de Agente e Modelo

- O modelo/agente **não** é um principal confiável. Assuma que injeção de prompt/conteúdo pode manipular o comportamento.
- Limites de segurança vêm de confiança de host/config, auth, política de ferramentas, sandboxing e aprovações de exec.
- Injeção de prompt por si só não é um reporte de vulnerabilidade a menos que cruze um desses limites.

## Conceito de Confiança de Gateway e Node

O OpenCraft separa roteamento de execução, mas ambos permanecem dentro do mesmo limite de confiança do operador:

- **Gateway** é o plano de controle. Se um chamador passa autenticação do Gateway, ele é tratado como operador confiável para aquele Gateway.
- **Node** é uma extensão de execução do Gateway. Parear um node concede capacidade remota de nível operador naquele node.
- **Aprovações de exec** (allowlist/ask UI) são guardrails do operador para reduzir execução acidental de comandos, não um limite de autorização multi-tenant.

## Limite de Confiança de Memória do Workspace

`MEMORY.md` e `memory/*.md` são arquivos de workspace simples e são tratados como estado de operador local confiável.

- Se alguém pode editar arquivos de memória do workspace, eles já cruzaram o limite de operador confiável.
- Indexação/recall de busca de memória sobre esses arquivos é comportamento esperado, não um limite de sandbox/segurança.

## Limite de Confiança de Plugin

Plugins/extensões são carregados **in-process** com o Gateway e são tratados como código confiável.

- Plugins podem executar com os mesmos privilégios de SO que o processo OpenCraft.
- Helpers de runtime são APIs de conveniência, não um limite de sandbox.
- Instale apenas plugins em que você confia, e prefira `plugins.allow` para fixar IDs de plugins confiáveis explícitos.

## Limite de Pasta Temporária (Mídia/Sandbox)

O OpenCraft usa uma raiz temp dedicada para handoff de mídia local e artefatos temp adjacentes ao sandbox:

- Raiz temp preferida: `/tmp/opencraft` (quando disponível e segura no host).
- Raiz temp fallback: `os.tmpdir()/opencraft` (ou `opencraft-<uid>` em hosts multi-usuário).

## Orientação Operacional

Para modelo de ameaça + orientação de hardening (incluindo `opencraft security audit --deep` e `--fix`), veja:

- `https://docs.openclaw.ai/gateway/security`

### Hardening do filesystem de ferramentas

- `tools.exec.applyPatch.workspaceOnly: true` (recomendado): mantém escritas/deleções do `apply_patch` dentro do diretório de workspace configurado.
- `tools.fs.workspaceOnly: true` (opcional): restringe caminhos de `read`/`write`/`edit`/`apply_patch` ao diretório de workspace.

### Hardening de delegação de sub-agente

- Mantenha `sessions_spawn` negado a menos que precise explicitamente de execuções delegadas.
- Mantenha `agents.list[].subagents.allowAgents` estreito, e inclua apenas agentes com configurações de sandbox que você confia.

### Segurança da Interface Web

A interface web do OpenCraft (Gateway Control UI + endpoints HTTP) é destinada **apenas para uso local**.

- Recomendado: mantenha o Gateway **apenas no loopback** (`127.0.0.1` / `::1`).
  - Config: `gateway.bind="loopback"` (padrão).
  - CLI: `opencraft gateway run --bind loopback`.
- **Não** exponha na internet pública. Não é endurecido para exposição pública.
- Se precisar de acesso remoto, prefira um túnel SSH ou Tailscale serve/funnel (para que o Gateway ainda fique vinculado ao loopback), mais autenticação forte do Gateway.

## Requisitos de Runtime

### Versão do Node.js

O OpenCraft requer **Node.js 22.12.0 ou posterior** (LTS). Esta versão inclui patches de segurança importantes.

Verifique sua versão do Node.js:

```bash
node --version  # Deve ser v22.12.0 ou posterior
```

### Segurança do Docker

Ao executar o OpenCraft no Docker:

1. A imagem oficial roda como usuário não-root (`node`) para superfície de ataque reduzida
2. Use o flag `--read-only` quando possível para proteção adicional do filesystem
3. Limite capacidades do container com `--cap-drop=ALL`

Exemplo de execução segura no Docker:

```bash
docker run --read-only --cap-drop=ALL \
  -v opencraft-data:/app/data \
  opencraft/opencraft:latest
```

## Scanning de Segurança

Este projeto usa `detect-secrets` para detecção automatizada de secrets no CI/CD.
Veja `.detect-secrets.cfg` para configuração e `.secrets.baseline` para a baseline.

Execute localmente:

```bash
pip install detect-secrets==1.5.0
detect-secrets scan --baseline .secrets.baseline
```
