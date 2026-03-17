---
summary: "Design para uma extensão Firecrawl opt-in que adiciona valor de busca/scrape sem hardwiring Firecrawl nos padrões do core"
read_when:
  - Projetando trabalho de integração Firecrawl
  - Avaliando costuras de Plugin web_search/web_fetch
  - Decidindo se Firecrawl pertence ao core ou como extensão
title: "Firecrawl Extension Design"
---

# Design da Extensão Firecrawl

## Objetivo

Enviar Firecrawl como uma **extensão opt-in** que adiciona:

- ferramentas Firecrawl explícitas para agentes,
- integração opcional de `web_search` baseada em Firecrawl,
- suporte a auto-hospedagem,
- padrões de segurança mais fortes que o caminho de fallback atual do core,

sem empurrar Firecrawl para o caminho padrão de setup/onboarding.

## Por que este formato

Issues/PRs recentes de Firecrawl se agrupam em três baldes:

1. **Drift de release/esquema**
   - Vários releases rejeitaram `tools.web.fetch.firecrawl` mesmo que documentação e código de runtime suportassem.
2. **Endurecimento de segurança**
   - O `fetchFirecrawlContent()` atual ainda posta para o endpoint Firecrawl com `fetch()` bruto, enquanto o caminho principal de web-fetch usa o guard SSRF.
3. **Pressão de produto**
   - Usuários querem fluxos nativos de busca/scrape Firecrawl, especialmente para setups auto-hospedados/privados.
   - Mantenedores rejeitaram explicitamente conectar Firecrawl profundamente nos padrões do core, fluxo de setup e comportamento do browser.

Essa combinação argumenta por uma extensão, não mais lógica específica de Firecrawl no caminho padrão do core.

## Princípios de design

- **Opt-in, escopo de vendor**: sem auto-habilitação, sem hijack de setup, sem ampliação de perfil de ferramentas padrão.
- **Extensão é dona da configuração específica de Firecrawl**: preferir configuração de Plugin sobre crescer `tools.web.*` novamente.
- **Útil desde o primeiro dia**: funciona mesmo se costuras core de `web_search` / `web_fetch` permanecerem inalteradas.
- **Segurança primeiro**: buscas de endpoint usam a mesma postura de rede protegida que outras ferramentas web.
- **Amigável a auto-hospedagem**: config + fallback de env, URL base explícita, sem suposições somente hospedado.

## Extensão proposta

ID do Plugin: `firecrawl`

### Capacidades MVP

Registrar ferramentas explícitas:

- `firecrawl_search`
- `firecrawl_scrape`

Opcional depois:

- `firecrawl_crawl`
- `firecrawl_map`

**Não** adicionar automação de browser Firecrawl na primeira versão. Essa foi a parte da PR #32543 que puxou Firecrawl muito para dentro do comportamento do core e levantou a maior preocupação de manutenção.

## Formato de configuração

Usar configuração com escopo de Plugin:

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          apiKey: "FIRECRAWL_API_KEY",
          baseUrl: "https://api.firecrawl.dev",
          timeoutSeconds: 60,
          maxAgeMs: 172800000,
          proxy: "auto",
          storeInCache: true,
          onlyMainContent: true,
          search: {
            enabled: true,
            defaultLimit: 5,
            sources: ["web"],
            categories: [],
            scrapeResults: false,
          },
          scrape: {
            formats: ["markdown"],
            fallbackForWebFetchLikeUse: false,
          },
        },
      },
    },
  },
}
```

### Resolução de credenciais

Precedência:

1. `plugins.entries.firecrawl.config.apiKey`
2. `FIRECRAWL_API_KEY`

Precedência de URL base:

1. `plugins.entries.firecrawl.config.baseUrl`
2. `FIRECRAWL_BASE_URL`
3. `https://api.firecrawl.dev`

### Ponte de compatibilidade

Para o primeiro release, a extensão também pode **ler** configuração core existente em `tools.web.fetch.firecrawl.*` como fonte de fallback para que usuários existentes não precisem migrar imediatamente.

Caminho de escrita permanece local ao Plugin. Não continue expandindo superfícies de configuração Firecrawl no core.

## Design de ferramentas

### `firecrawl_search`

Entradas:

- `query`
- `limit`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

Comportamento:

- Chama Firecrawl `v2/search`
- Retorna objetos de resultado normalizados e amigáveis ao OpenCraft:
  - `title`
  - `url`
  - `snippet`
  - `source`
  - `content` opcional
- Envolve conteúdo de resultado como conteúdo externo não confiável
- Chave de cache inclui consulta + parâmetros relevantes do provedor

Por que ferramenta explícita primeiro:

- Funciona hoje sem mudar `tools.web.search.provider`
- Evita restrições atuais de esquema/loader
- Dá aos usuários valor Firecrawl imediatamente

### `firecrawl_scrape`

Entradas:

- `url`
- `formats`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

Comportamento:

- Chama Firecrawl `v2/scrape`
- Retorna markdown/texto mais metadados:
  - `title`
  - `finalUrl`
  - `status`
  - `warning`
- Envolve conteúdo extraído da mesma forma que `web_fetch` faz
- Compartilha semânticas de cache com expectativas de ferramentas web onde prático

Por que ferramenta explícita de scrape:

- Contorna o bug não resolvido de ordenação `Readability -> Firecrawl -> basic HTML cleanup` no core `web_fetch`
- Dá aos usuários um caminho determinístico "sempre usar Firecrawl" para sites pesados em JS/protegidos contra bots

## O que a extensão não deve fazer

- Não auto-adicionar `browser`, `web_search` ou `web_fetch` a `tools.alsoAllow`
- Nenhum passo de onboarding padrão em `opencraft setup`
- Nenhum ciclo de vida de sessão de browser específico de Firecrawl no core
- Nenhuma mudança na semântica de fallback built-in de `web_fetch` no MVP da extensão

## Plano de fases

### Fase 1: somente extensão, sem mudanças de esquema do core

Implementar:

- `extensions/firecrawl/`
- esquema de configuração do Plugin
- `firecrawl_search`
- `firecrawl_scrape`
- testes para resolução de config, seleção de endpoint, cache, tratamento de erros e uso de guard SSRF

Esta fase é suficiente para enviar valor real ao usuário.

### Fase 2: integração opcional de provedor `web_search`

Suportar `tools.web.search.provider = "firecrawl"` somente após corrigir duas restrições do core:

1. `src/plugins/web-search-providers.ts` deve carregar Plugins de provedor de web-search configurados/instalados em vez de uma lista bundled hardcoded.
2. `src/config/types.tools.ts` e `src/config/zod-schema.agent-runtime.ts` devem parar de hardcodar o enum de provedor de forma que bloqueia IDs registrados por Plugin.

Formato recomendado:

- manter provedores built-in documentados,
- permitir qualquer ID de provedor de Plugin registrado em runtime,
- validar configuração específica do provedor via Plugin do provedor ou um bag genérico de provedor.

### Fase 3: costura opcional de provedor `web_fetch`

Fazer isso somente se mantenedores quiserem que backends de fetch específicos de vendor participem de `web_fetch`.

Adição core necessária:

- `registerWebFetchProvider` ou costura equivalente de backend de fetch

Sem essa costura, a extensão deve manter `firecrawl_scrape` como uma ferramenta explícita em vez de tentar patchar o `web_fetch` built-in.

## Requisitos de segurança

A extensão deve tratar Firecrawl como um **endpoint confiável configurado pelo operador**, mas ainda endurecer o transporte:

- Usar fetch protegido contra SSRF para a chamada de endpoint Firecrawl, não `fetch()` bruto
- Preservar compatibilidade de auto-hospedagem/rede privada usando a mesma política de endpoint de ferramentas web confiáveis usada em outros lugares
- Nunca registrar a API key
- Manter resolução de endpoint/URL base explícita e previsível
- Tratar conteúdo retornado pelo Firecrawl como conteúdo externo não confiável

Isso espelha a intenção por trás das PRs de endurecimento SSRF sem assumir que Firecrawl é uma superfície multi-tenant hostil.

## Por que não uma Skill

O repositório já fechou uma PR de Skill Firecrawl em favor de distribuição ClawHub. Isso é adequado para fluxos de trabalho de prompt opcionais instalados pelo usuário, mas não resolve:

- disponibilidade determinística de ferramenta,
- tratamento de configuração/credencial em nível de provedor,
- suporte a endpoint auto-hospedado,
- cache,
- saídas tipadas estáveis,
- revisão de segurança em comportamento de rede.

Isso pertence como uma extensão, não uma Skill somente de prompt.

## Critérios de sucesso

- Usuários podem instalar/habilitar uma extensão e obter busca/scrape Firecrawl confiável sem tocar nos padrões do core.
- Firecrawl auto-hospedado funciona com fallback de config/env.
- Buscas de endpoint da extensão usam rede protegida.
- Nenhum novo comportamento de onboarding/padrão específico de Firecrawl no core.
- Core pode depois adotar costuras nativas de Plugin para `web_search` / `web_fetch` sem redesenhar a extensão.

## Ordem de implementação recomendada

1. Construir `firecrawl_scrape`
2. Construir `firecrawl_search`
3. Adicionar documentação e exemplos
4. Se desejado, generalizar carregamento de provedor `web_search` para que a extensão possa ser backend de `web_search`
5. Somente então considerar uma verdadeira costura de provedor `web_fetch`
