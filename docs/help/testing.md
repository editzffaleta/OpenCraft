---
summary: "Kit de testes: suites unit/e2e/live, runners Docker e o que cada teste cobre"
read_when:
  - Executando testes localmente ou em CI
  - Adicionando regressões para bugs de modelo/provedor
  - Depurando comportamento do gateway + agente
title: "Testes"
---

# Testes

O OpenCraft tem três suites Vitest (unit/integração, e2e, live) e um pequeno conjunto de runners Docker.

Este documento é um guia de "como testamos":

- O que cada suite cobre (e o que deliberadamente _não_ cobre)
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração)
- Como os testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes de push): `pnpm build && pnpm check && pnpm test`

Quando você toca em testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suite e2e: `pnpm test:e2e`

Quando depurando provedores/modelos reais (requer credenciais reais):

- Suite live (modelos + probes de ferramenta/imagem do gateway): `pnpm test:live`

Dica: quando você precisa de apenas um caso com falha, prefira restringir testes live via variáveis de allowlist descritas abaixo.

## Suites de teste (o que roda onde)

Pense nas suites como "realismo crescente" (e crescente instabilidade/custo):

### Unit / integração (padrão)

- Comando: `pnpm test`
- Config: `scripts/test-parallel.mjs` (roda `vitest.unit.config.ts`, `vitest.extensions.config.ts`, `vitest.gateway.config.ts`)
- Arquivos: `src/**/*.test.ts`, `extensions/**/*.test.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (auth do gateway, roteamento, tooling, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Sem necessidade de chaves reais
  - Deve ser rápido e estável
- Nota de pool:
  - O OpenCraft usa `vmForks` do Vitest no Node 22, 23 e 24 para shards unitários mais rápidos.
  - No Node 25+, o OpenCraft automaticamente reverte para `forks` regular até que o repositório seja revalidado.
  - Substitua manualmente com `OPENCLAW_TEST_VM_FORKS=0` (forçar `forks`) ou `OPENCLAW_TEST_VM_FORKS=1` (forçar `vmForks`).

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa `vmForks` do Vitest para inicialização de arquivo mais rápida.
  - Usa workers adaptativos (CI: 2-4, local: 4-8).
  - Roda em modo silencioso por padrão para reduzir sobrecarga de I/O no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar contagem de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída verbose no console.
- Escopo:
  - Comportamento end-to-end do gateway multi-instância
  - Superfícies WebSocket/HTTP, pareamento de nós e rede mais pesada
- Expectativas:
  - Roda em CI (quando habilitado no pipeline)
  - Sem necessidade de chaves reais
  - Mais partes móveis que testes unitários (pode ser mais lento)

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - "Este provedor/modelo realmente funciona _hoje_ com credenciais reais?"
  - Capturar mudanças de formato de provedor, peculiaridades de chamada de ferramenta, problemas de auth e comportamento de rate limit
- Expectativas:
  - Não estável em CI por design (redes reais, políticas reais de provedor, cotas, interrupções)
  - Custa dinheiro / usa rate limits
  - Prefira executar subconjuntos restritos em vez de "tudo"
  - Runs live vão ler `~/.profile` para obter chaves de API ausentes
- Rotação de chave de API (específica por provedor): defina `*_API_KEYS` com formato vírgula/ponto-vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; testes fazem retry em respostas de rate limit.

## Qual suite devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se mudou muito)
- Tocando em rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando "meu bot está fora" / falhas específicas de provedor / chamada de ferramenta: execute um `pnpm test:live` restrito

## Live: varredura de capacidades do nó Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando atualmente anunciado** por um nó Android conectado e verificar o comportamento do contrato do comando.
- Escopo:
  - Configuração pré-condicionada/manual (a suite não instala/executa/pareia o app).
  - Validação `node.invoke` do gateway por comando para o nó Android selecionado.
- Configuração prévia necessária:
  - App Android já conectado + pareado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para capacidades que você espera que passem.
- Substituições de target opcionais:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração Android: [App Android](/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para isolar falhas:

- "Modelo direto" nos diz se o provedor/modelo consegue responder com a chave fornecida.
- "Smoke do gateway" nos diz se o pipeline completo gateway+agente funciona para aquele modelo (sessões, histórico, ferramentas, política de sandbox, etc.).

### Camada 1: Completação direta de modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena completação por modelo (e regressões direcionadas onde necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocando o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suite; caso contrário, ela é pulada para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist de vírgulas)
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist de vírgulas)
- De onde vêm as chaves:
  - Por padrão: store de perfil e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para aplicar **apenas** o store de perfil
- Por que isso existe:
  - Separa "API do provedor está quebrada / chave é inválida" de "pipeline do agente do gateway está quebrado"
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio OpenAI Responses/Codex Responses + fluxos de chamada de ferramenta)

### Camada 2: Gateway + smoke do agente dev (o que "@opencraft" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar um gateway em processo
  - Criar/corrigir uma sessão `agent:dev:*` (substituição de modelo por run)
  - Iterar modelos com chaves e verificar:
    - Resposta "significativa" (sem ferramentas)
    - Uma invocação de ferramenta real funciona (probe de leitura)
    - Probes de ferramenta extras opcionais (probe exec+read)
    - Caminhos de regressão OpenAI (tool-call-only → follow-up) continuam funcionando
- Detalhes do probe (para que você possa explicar falhas rapidamente):
  - Probe `read`: o teste escreve um arquivo nonce no workspace e pede ao agente para `read` e ecoar o nonce de volta.
  - Probe `exec+read`: o teste pede ao agente para `exec`-escrever um nonce em um arquivo temporário, depois `read` de volta.
  - Probe de imagem: o teste anexa um PNG gerado (cat + código randomizado) e espera o modelo retornar `cat <CÓDIGO>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocando o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provedor/modelo"` (ou lista de vírgulas) para restringir
- Como selecionar provedores (evitar "tudo via OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist de vírgulas)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos de `provider/model`), execute:

```bash
opencraft models list
opencraft models list --json
```

## Live: smoke de setup-token Anthropic

- Teste: `src/agents/anthropic.setup-token.live.test.ts`
- Objetivo: verificar se o setup-token do Claude Code CLI (ou um perfil de setup-token colado) pode completar um prompt Anthropic.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocando o Vitest diretamente)
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- Fontes de token (escolha uma):
  - Perfil: `OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - Token bruto: `OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- Substituição de modelo (opcional):
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-6`

Exemplo de configuração:

```bash
opencraft models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## Live: smoke de backend CLI

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend CLI local, sem tocar na sua config padrão.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocando o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Modelo: `claude-cli/claude-sonnet-4-6`
  - Comando: `claude`
  - Args: `["-p","--output-format","json","--permission-mode","bypassPermissions"]`

Exemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

## Runners Docker (verificações opcionais "funciona no Linux")

Estes executam `pnpm test:live` dentro da imagem Docker do repositório, montando seu diretório de config local e workspace (e carregando `~/.profile` se montado):

- Modelos diretos: `pnpm test:docker:live-models`
- Gateway + agente dev: `pnpm test:docker:live-gateway`
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard`
- Rede do gateway (dois containers, auth WS + saúde): `pnpm test:docker:gateway-network`
- Plugins (carga de extensão personalizada + smoke de registro): `pnpm test:docker:plugins`

## Sanidade de docs

Execute verificações de docs após edições de documentação: `pnpm docs:list`.

## Regressão offline (segura para CI)

Estas são regressões de "pipeline real" sem provedores reais:

- Chamada de ferramenta do gateway (OpenAI mock, gateway real + loop de agente): `src/gateway/gateway.test.ts`
- Gateway wizard (WS `wizard.start`/`wizard.next`, escreve config + auth aplicado): `src/gateway/gateway.test.ts`

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI se possível (provedor mock/stub, ou capture a transformação exata de formato de requisição)
- Se for inerentemente apenas live (rate limits, políticas de auth), mantenha o teste live restrito e opt-in via variáveis de env
- Prefira apontar para a menor camada que captura o bug:
  - Bug de conversão/replay de requisição do provedor → teste de modelos diretos
  - Bug de pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste mock do gateway seguro para CI
