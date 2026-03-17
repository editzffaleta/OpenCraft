---
summary: "Audite o que pode gastar dinheiro, quais chaves são usadas e como visualizar o uso"
read_when:
  - Você quer entender quais recursos podem chamar APIs pagas
  - Você precisa auditar chaves, custos e visibilidade de uso
  - Você está explicando relatórios de custo /status ou /usage
title: "Uso e Custos de API"
---

# Uso e custos de API

Este documento lista **recursos que podem invocar chaves de API** e onde seus custos aparecem. Ele foca em
recursos do OpenCraft que podem gerar uso de provedor ou chamadas de API pagas.

## Onde os custos aparecem (chat + CLI)

**Snapshot de custo por sessão**

- `/status` mostra o modelo da sessão atual, uso de contexto e tokens da última resposta.
- Se o modelo usa **autenticação por chave de API**, `/status` também mostra o **custo estimado** da última resposta.

**Rodapé de custo por mensagem**

- `/usage full` adiciona um rodapé de uso a cada resposta, incluindo **custo estimado** (apenas chave de API).
- `/usage tokens` mostra apenas tokens; fluxos OAuth ocultam o custo em dólares.

**Janelas de uso do CLI (cotas de provedor)**

- `opencraft status --usage` e `opencraft channels list` mostram **janelas de uso** do provedor
  (snapshots de cota, não custos por mensagem).

Veja [Uso e custos de Token](/reference/token-use) para detalhes e exemplos.

## Como as chaves são descobertas

O OpenCraft pode obter credenciais de:

- **Perfis de autenticação** (por agente, armazenados em `auth-profiles.json`).
- **Variáveis de ambiente** (ex.: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `tools.web.search.*`, `tools.web.fetch.firecrawl.*`,
  `memorySearch.*`, `talk.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) que podem exportar chaves para o env do processo da skill.

## Recursos que podem gastar chaves

### 1) Respostas do modelo principal (chat + ferramentas)

Cada resposta ou chamada de ferramenta usa o **provedor de modelo atual** (OpenAI, Anthropic, etc). Esta é a
fonte principal de uso e custo.

Veja [Modelos](/providers/models) para configuração de preços e [Uso e custos de Token](/reference/token-use) para exibição.

### 2) Compreensão de mídia (áudio/imagem/vídeo)

Mídia recebida pode ser resumida/transcrita antes da resposta ser executada. Isso usa APIs de modelo/provedor.

- Áudio: OpenAI / Groq / Deepgram (agora **habilitado automaticamente** quando as chaves existem).
- Imagem: OpenAI / Anthropic / Google.
- Vídeo: Google.

Veja [Compreensão de mídia](/nodes/media-understanding).

### 3) Embeddings de memória + busca semântica

A busca semântica de memória usa **APIs de embedding** quando configurada para provedores remotos:

- `memorySearch.provider = "openai"` → embeddings OpenAI
- `memorySearch.provider = "gemini"` → embeddings Gemini
- `memorySearch.provider = "voyage"` → embeddings Voyage
- `memorySearch.provider = "mistral"` → embeddings Mistral
- `memorySearch.provider = "ollama"` → embeddings Ollama (local/auto-hospedado; tipicamente sem cobrança de API hospedada)
- Fallback opcional para um provedor remoto se os embeddings locais falharem

Você pode manter local com `memorySearch.provider = "local"` (sem uso de API).

Veja [Memória](/concepts/memory).

### 4) Ferramenta de busca web

`web_search` usa chaves de API e pode gerar cobranças de uso dependendo do seu provedor:

- **Brave Search API**: `BRAVE_API_KEY` ou `tools.web.search.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` ou `tools.web.search.gemini.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` ou `tools.web.search.grok.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` ou `tools.web.search.kimi.apiKey`
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` ou `tools.web.search.perplexity.apiKey`

**Crédito gratuito do Brave Search:** Cada plano Brave inclui \$5/mês em crédito
gratuito renovável. O plano Search custa \$5 por 1.000 requisições, então o crédito cobre
1.000 requisições/mês sem custo. Defina seu limite de uso no painel do Brave
para evitar cobranças inesperadas.

Veja [Ferramentas web](/tools/web).

### 5) Ferramenta de busca web (Firecrawl)

`web_fetch` pode chamar o **Firecrawl** quando uma chave de API está presente:

- `FIRECRAWL_API_KEY` ou `tools.web.fetch.firecrawl.apiKey`

Se o Firecrawl não estiver configurado, a ferramenta usa fetch direto + readability (sem API paga).

Veja [Ferramentas web](/tools/web).

### 6) Snapshots de uso do provedor (status/saúde)

Alguns comandos de status chamam **endpoints de uso do provedor** para exibir janelas de cota ou saúde de autenticação.
Essas são tipicamente chamadas de baixo volume, mas ainda acessam APIs de provedor:

- `opencraft status --usage`
- `opencraft models status --json`

Veja [CLI de Modelos](/cli/models).

### 7) Sumarização de proteção de compactação

A proteção de compactação pode resumir o histórico da sessão usando o **modelo atual**, o que
invoca APIs de provedor quando é executada.

Veja [Gerenciamento de sessão + compactação](/reference/session-management-compaction).

### 8) Varredura / probe de modelo

`opencraft models scan` pode sondar modelos OpenRouter e usa `OPENROUTER_API_KEY` quando
o probing está habilitado.

Veja [CLI de Modelos](/cli/models).

### 9) Fala (Talk)

O modo Talk pode invocar o **ElevenLabs** quando configurado:

- `ELEVENLABS_API_KEY` ou `talk.apiKey`

Veja [Modo Talk](/nodes/talk).

### 10) Skills (APIs de terceiros)

Skills podem armazenar `apiKey` em `skills.entries.<name>.apiKey`. Se uma skill usa essa chave para APIs
externas, ela pode gerar custos de acordo com o provedor da skill.

Veja [Skills](/tools/skills).
