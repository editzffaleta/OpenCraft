---
summary: "Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre"
read_when:
  - Executando testes localmente ou em CI
  - Adicionando regressões para bugs de modelo/provedor
  - Depurando comportamento do gateway + agente
title: "Testes"
---

# Testes

O OpenCraft tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto de runners Docker.

Esta documentação é um guia "como testamos":

- O que cada suíte cobre (e o que deliberadamente _não_ cobre)
- Quais comandos executar para fluxos comuns (local, pré-push, depuração)
- Como testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes de push): `pnpm build && pnpm check && pnpm test`

Quando você mexe em testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Quando depurando provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + probes de ferramenta/imagem do gateway): `pnpm test:live`

Dica: quando você precisa apenas de um caso falhando, prefira restringir testes live via as variáveis de ambiente de allowlist descritas abaixo.

## Suítes de teste (o que roda onde)

Pense nas suítes como "realismo crescente" (e custo/flakiness crescentes):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Config: `scripts/test-parallel.mjs` (roda `vitest.unit.config.ts`, `vitest.extensions.config.ts`, `vitest.gateway.config.ts`)
- Arquivos: `src/**/*.test.ts`, `extensions/**/*.test.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração in-process (auth do gateway, roteamento, ferramentas, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Sem chaves reais necessárias
  - Deve ser rápido e estável
- Nota sobre pool:
  - O OpenCraft usa Vitest `vmForks` no Node 22, 23 e 24 para shards unitários mais rápidos.
  - No Node 25+, o OpenCraft automaticamente faz fallback para `forks` regulares até o repositório ser revalidado lá.
  - Sobrescreva manualmente com `OPENCRAFT_TEST_VM_FORKS=0` (forçar `forks`) ou `OPENCRAFT_TEST_VM_FORKS=1` (forçar `vmForks`).

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa Vitest `vmForks` para inicialização mais rápida de arquivos.
  - Usa workers adaptativos (CI: 2-4, local: 4-8).
  - Roda em modo silencioso por padrão para reduzir overhead de I/O no console.
- Overrides úteis:
  - `OPENCRAFT_E2E_WORKERS=<n>` para forçar contagem de workers (limitado a 16).
  - `OPENCRAFT_E2E_VERBOSE=1` para reabilitar saída verbosa no console.
- Escopo:
  - Comportamento end-to-end de gateway multi-instância
  - Superfícies WebSocket/HTTP, pareamento de nodes e networking mais pesado
- Expectativas:
  - Roda em CI (quando habilitado no pipeline)
  - Sem chaves reais necessárias
  - Mais partes móveis que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenCraft sobre `sandbox ssh-config` + SSH exec reais
  - Verifica comportamento de filesystem remote-canonical através da bridge fs do sandbox
- Expectativas:
  - Somente opt-in; não faz parte do `pnpm test:e2e` padrão
  - Requer CLI `openshell` local mais daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway de teste e sandbox
- Overrides úteis:
  - `OPENCRAFT_E2E_OPENSHELL=1` para habilitar o teste ao rodar a suíte e2e mais ampla manualmente
  - `OPENCRAFT_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI ou script wrapper não-padrão

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCRAFT_LIVE_TEST=1`)
- Escopo:
  - "Este provedor/modelo realmente funciona _hoje_ com credenciais reais?"
  - Capturar mudanças de formato de provedor, peculiaridades de chamada de ferramentas, problemas de autenticação e comportamento de rate limit
- Expectativas:
  - Não é estável em CI por design (redes reais, políticas reais de provedor, cotas, outages)
  - Custa dinheiro / usa rate limits
  - Prefira rodar subconjuntos restritos ao invés de "tudo"
  - Execuções live vão usar source de `~/.profile` para pegar chaves de API faltantes
- Rotação de chave de API (específica por provedor): defina `*_API_KEYS` com formato vírgula/ponto-e-vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou override por live via `OPENCRAFT_LIVE_*_KEY`; testes tentam novamente em respostas de rate limit.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: rode `pnpm test` (e `pnpm test:coverage` se mudou muito)
- Mexendo em networking do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando "meu bot está fora do ar" / falhas específicas de provedor / chamada de ferramentas: rode um `pnpm test:live` restrito

## Live: varredura de capacidades do node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando atualmente anunciado** por um node Android conectado e verificar comportamento de contrato do comando.
- Escopo:
  - Setup pré-condicionado/manual (a suíte não instala/roda/pareia o app).
  - Validação comando-por-comando de `node.invoke` no gateway para o node Android selecionado.
- Setup prévio necessário:
  - App Android já conectado + pareado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para capacidades que você espera passar.
- Overrides de alvo opcionais:
  - `OPENCRAFT_ANDROID_NODE_ID` ou `OPENCRAFT_ANDROID_NODE_NAME`.
  - `OPENCRAFT_ANDROID_GATEWAY_URL` / `OPENCRAFT_ANDROID_GATEWAY_TOKEN` / `OPENCRAFT_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos do setup Android: [App Android](/platforms/android)

## Live: smoke de modelos (chaves de perfil)

Testes live são divididos em duas camadas para isolar falhas:

- "Modelo direto" nos diz se o provedor/modelo consegue responder com a chave dada.
- "Smoke do gateway" nos diz se o pipeline completo gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox, etc.).

### Camada 1: Completação direta de modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Rodar uma completação pequena por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCRAFT_LIVE_TEST=1` se invocando Vitest diretamente)
- Defina `OPENCRAFT_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente rodar esta suíte; caso contrário pula para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCRAFT_LIVE_MODELS=modern` para rodar a allowlist moderna (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4)
  - `OPENCRAFT_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCRAFT_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist por vírgula)
- Como selecionar provedores:
  - `OPENCRAFT_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist por vírgula)
- De onde vêm as chaves:
  - Por padrão: store de perfis e fallbacks de env
  - Defina `OPENCRAFT_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar **somente store de perfis**
- Por que existe:
  - Separa "API do provedor está quebrada / chave é inválida" de "pipeline do agente gateway está quebrado"
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio OpenAI Responses/Codex Responses + fluxos de chamada de ferramentas)

### Camada 2: Gateway + smoke de agente dev (o que "@opencraft" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway in-process
  - Criar/modificar uma sessão `agent:dev:*` (override de modelo por execução)
  - Iterar modelos-com-chaves e verificar:
    - resposta "significativa" (sem ferramentas)
    - uma invocação real de ferramenta funciona (probe de leitura)
    - probes extras opcionais de ferramentas (probe exec+leitura)
    - caminhos de regressão OpenAI (chamada-de-ferramenta-only → seguimento) continuam funcionando
- Detalhes dos probes (para você poder explicar falhas rapidamente):
  - probe `read`: o teste escreve um arquivo nonce no workspace e pede ao agente para `read` e ecoar o nonce de volta.
  - probe `exec+read`: o teste pede ao agente para `exec`-escrever um nonce em um arquivo temp, depois `read` de volta.
  - probe de imagem: o teste anexa um PNG gerado (gato + código randomizado) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCRAFT_LIVE_TEST=1` se invocando Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4)
  - `OPENCRAFT_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCRAFT_LIVE_GATEWAY_MODELS="provider/model"` (ou lista por vírgula) para restringir
- Como selecionar provedores (evitar "OpenRouter tudo"):
  - `OPENCRAFT_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist por vírgula)
- Probes de ferramentas + imagem estão sempre ligados neste teste live:
  - probe `read` + probe `exec+read` (stress de ferramentas)
  - probe de imagem roda quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - Teste gera um PNG pequeno com "CAT" + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parseia anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agente embutido encaminha uma mensagem de usuário multimodal ao modelo
    - Asserção: resposta contém `cat` + o código (tolerância OCR: erros menores permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), rode:

```bash
opencraft models list
opencraft models list --json
```

## Live: smoke de setup-token Anthropic

- Teste: `src/agents/anthropic.setup-token.live.test.ts`
- Objetivo: verificar que setup-token do Claude Code CLI (ou um perfil de setup-token colado) consegue completar um prompt Anthropic.
- Habilitar:
  - `pnpm test:live` (ou `OPENCRAFT_LIVE_TEST=1` se invocando Vitest diretamente)
  - `OPENCRAFT_LIVE_SETUP_TOKEN=1`
- Fontes de token (escolha uma):
  - Perfil: `OPENCRAFT_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - Token bruto: `OPENCRAFT_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- Override de modelo (opcional):
  - `OPENCRAFT_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-6`

Exemplo de setup:

```bash
opencraft models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCRAFT_LIVE_SETUP_TOKEN=1 OPENCRAFT_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## Live: smoke de backend CLI (Claude Code CLI ou outros CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend CLI local, sem mexer na sua config padrão.
- Habilitar:
  - `pnpm test:live` (ou `OPENCRAFT_LIVE_TEST=1` se invocando Vitest diretamente)
  - `OPENCRAFT_LIVE_CLI_BACKEND=1`
- Padrões:
  - Modelo: `claude-cli/claude-sonnet-4-6`
  - Comando: `claude`
  - Args: `["-p","--output-format","json","--permission-mode","bypassPermissions"]`
- Overrides (opcionais):
  - `OPENCRAFT_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCRAFT_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCRAFT_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCRAFT_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCRAFT_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCRAFT_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (caminhos são injetados no prompt).
  - `OPENCRAFT_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args CLI ao invés de injeção no prompt.
  - `OPENCRAFT_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCRAFT_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar fluxo de retomada.
- `OPENCRAFT_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` para manter config MCP do Claude Code CLI habilitada (padrão desabilita config MCP com arquivo vazio temporário).

Exemplo:

```bash
OPENCRAFT_LIVE_CLI_BACKEND=1 \
  OPENCRAFT_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### Receitas live recomendadas

Allowlists estreitas e explícitas são mais rápidas e menos flaky:

- Modelo único, direto (sem gateway):
  - `OPENCRAFT_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do gateway:
  - `OPENCRAFT_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramentas entre vários provedores:
  - `OPENCRAFT_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCRAFT_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCRAFT_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notas:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a bridge OAuth Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa o CLI Gemini local na sua máquina (autenticação + peculiaridades de ferramentas separadas).
- API Gemini vs CLI Gemini:
  - API: OpenCraft chama a API Gemini hospedada do Google via HTTP (chave de API / auth de perfil); isso é o que a maioria dos usuários quer dizer com "Gemini".
  - CLI: OpenCraft delega para um binário `gemini` local; tem sua própria autenticação e pode se comportar diferente (streaming/suporte a ferramentas/diferença de versão).

## Live: matriz de modelos (o que cobrimos)

Não há uma "lista de modelos CI" fixa (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina dev com chaves.

### Conjunto de smoke moderno (chamada de ferramentas + imagem)

Esta é a execução de "modelos comuns" que esperamos manter funcionando:

- OpenAI (não-Codex): `openai/gpt-5.2` (opcional: `openai/gpt-5.1`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-5`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.5`

Rode smoke do gateway com ferramentas + imagem:
`OPENCRAFT_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: chamada de ferramentas (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

- OpenAI: `openai/gpt-5.2` (ou `openai/gpt-5-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-5`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.5`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou último disponível)
- Mistral: `mistral/`... (escolha um modelo capaz de "tools" que você tem habilitado)
- Cerebras: `cerebras/`... (se você tem acesso)
- LM Studio: `lmstudio/`... (local; chamada de ferramentas depende do modo de API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo capaz de imagem em `OPENCRAFT_LIVE_GATEWAY_MODELS` (variantes de Claude/Gemini/OpenAI capazes de visão, etc.) para exercitar o probe de imagem.

### Agregadores / gateways alternativos

Se você tem chaves habilitadas, também suportamos teste via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `opencraft models scan` para encontrar candidatos capazes de tool+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tem credenciais/config):

- Built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints customizados): `minimax` (cloud/API), mais qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Dica: não tente codificar "todos os modelos" na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina + quaisquer chaves disponíveis.

## Credenciais (nunca faça commit)

Testes live descobrem credenciais da mesma forma que o CLI. Implicações práticas:

- Se o CLI funciona, testes live devem encontrar as mesmas chaves.
- Se um teste live diz "sem credenciais", depure da mesma forma que depuraria `opencraft models list` / seleção de modelo.

- Store de perfis: `~/.opencraft/credentials/` (preferido; o que "chaves de perfil" significa nos testes)
- Config: `~/.editzffaleta/OpenCraft.json` (ou `OPENCRAFT_CONFIG_PATH`)

Se você quer depender de chaves de env (ex.: exportadas no seu `~/.profile`), rode testes locais após `source ~/.profile`, ou use os runners Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Live Deepgram (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live plano de codificação BytePlus

- Teste: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override de modelo opcional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Runners Docker (verificações opcionais "funciona no Linux")

Estes rodam `pnpm test:live` dentro da imagem Docker do repositório, montando seu diretório de config local e workspace (e fazendo source de `~/.profile` se montado). Eles também bind-mount homes de autenticação CLI como `~/.codex`, `~/.claude`, `~/.qwen` e `~/.minimax` quando presentes para que OAuth de CLIs externos fique disponível dentro do contêiner:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Wizard de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking do gateway (dois contêineres, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Plugins (carga de extensão customizada + smoke de registro): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os runners Docker de live-model também bind-mount o checkout atual como somente-leitura e
fazem staging dele em um workdir temporário dentro do contêiner. Isso mantém a imagem runtime
enxuta enquanto ainda roda Vitest contra seu código-fonte/config local exato.

Smoke ACP plain-language thread manual (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Pode ser necessário novamente para validação de roteamento de thread ACP, então não o delete.

Variáveis de ambiente úteis:

- `OPENCRAFT_CONFIG_DIR=...` (padrão: `~/.opencraft`) montado em `/home/node/.opencraft`
- `OPENCRAFT_WORKSPACE_DIR=...` (padrão: `~/.opencraft/workspace`) montado em `/home/node/.opencraft/workspace`
- `OPENCRAFT_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e source antes de rodar testes
- Diretórios de auth CLI externos sob `$HOME` (`.codex`, `.claude`, `.qwen`, `.minimax`) são montados somente-leitura nos caminhos correspondentes `/home/node/...` quando presentes
- `OPENCRAFT_LIVE_GATEWAY_MODELS=...` / `OPENCRAFT_LIVE_MODELS=...` para restringir a execução
- `OPENCRAFT_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que credenciais venham do store de perfis (não env)

## Verificação de documentação

Rode verificações de documentação após edições de docs: `pnpm docs:list`.

## Regressão offline (segura para CI)

Estas são regressões de "pipeline real" sem provedores reais:

- Chamada de ferramentas do gateway (mock OpenAI, gateway + loop de agente reais): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard do gateway (WS `wizard.start`/`wizard.next`, escreve config + auth forçada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como "evals de confiabilidade do agente":

- Chamada de ferramentas mock pelo gateway + loop de agente reais (`src/gateway/gateway.test.ts`).
- Fluxos de wizard end-to-end que validam fiação de sessão e efeitos de config (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/tools/skills)):

- **Decisão:** quando Skills estão listados no prompt, o agente escolhe o Skill certo (ou evita irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes de usar e segue etapas/args obrigatórios?
- **Contratos de workflow:** cenários multi-turno que verificam ordem de ferramentas, carregamento de histórico de sessão e limites de sandbox.

Evals futuros devem ser determinísticos primeiro:

- Um executor de cenários usando provedores mock para verificar chamadas de ferramentas + ordem, leituras de arquivo de Skill e fiação de sessão.
- Uma suíte pequena de cenários focados em Skills (usar vs evitar, gating, injeção de prompt).
- Evals live opcionais (opt-in, gated por env) apenas após a suíte segura para CI estar em vigor.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI se possível (provedor mock/stub, ou capture a transformação exata de shape de request)
- Se for inerentemente somente-live (rate limits, políticas de auth), mantenha o teste live estreito e opt-in via variáveis de ambiente
- Prefira mirar na menor camada que captura o bug:
  - bug de conversão/replay de request de provedor → teste direto de modelos
  - bug de pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste mock de gateway seguro para CI
- Guardrail de travessia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe SecretRef de metadados do registro (`listSecretTargetRegistryEntries()`), depois verifica que ids exec de segmentos de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` naquele teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser puladas silenciosamente.
