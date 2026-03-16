---
summary: "Auditar o que pode gastar dinheiro, quais chaves são usadas e como ver o uso"
read_when:
  - Você quer entender quais recursos podem chamar APIs pagas
  - Você precisa auditar chaves, custos e visibilidade de uso
  - Você está explicando relatórios de /status ou /usage cost
title: "Uso de API e Custos"
---

# Uso de API e custos

Este doc lista **recursos que podem invocar chaves de API** e onde seus custos aparecem. Foca em
recursos do OpenCraft que podem gerar uso do provedor ou chamadas de API pagas.

## Onde os custos aparecem (chat + CLI)

**Snapshot de custo por sessão**

- `/status` mostra o modelo de sessão atual, uso do contexto e tokens da última resposta.
- Se o modelo usa **auth por chave de API**, `/status` também mostra **custo estimado** para a última resposta.

**Rodapé de custo por mensagem**

- `/usage full` adiciona um rodapé de uso a cada resposta, incluindo **custo estimado** (somente chave de API).
- `/usage tokens` mostra apenas tokens; fluxos OAuth ocultam o custo em dólar.

**Janelas de uso CLI (cotas do provedor)**

- `opencraft status --usage` e `opencraft channels list` mostram **janelas de uso** do provedor
  (snapshots de cota, não custos por mensagem).

Veja [Uso de tokens e custos](/reference/token-use) para detalhes e exemplos.

## Como as chaves são descobertas

O OpenCraft pode capturar credenciais de:

- **Perfis de auth** (por agente, armazenados em `auth-profiles.json`).
- **Variáveis de ambiente** (ex: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `tools.web.search.*`, `tools.web.fetch.firecrawl.*`,
  `memorySearch.*`, `talk.apiKey`).
- **Skills** (`skills.entries.<nome>.apiKey`) que podem exportar chaves para o ambiente do processo de skill.

## Recursos que podem gastar chaves

### 1) Respostas do modelo principal (chat + tools)

Cada resposta ou tool call usa o **provedor de modelo atual** (OpenAI, Anthropic, etc). Esta é a
principal fonte de uso e custo.

Veja [Modelos](/providers/models) para configuração de preços e [Uso de tokens e custos](/reference/token-use) para exibição.

### 2) Compreensão de mídia (áudio/imagem/vídeo)

Mídia de entrada pode ser resumida/transcrita antes da resposta ser executada. Isso usa APIs do modelo/provedor.

- Áudio: OpenAI / Groq / Deepgram (agora **habilitado automaticamente** quando as chaves existem).
- Imagem: OpenAI / Anthropic / Google.
- Vídeo: Google.

Veja [Compreensão de mídia](/nodes/media-understanding).

### 3) Embeddings de memória + pesquisa semântica

A pesquisa semântica de memória usa **APIs de embedding** quando configurada para provedores remotos:

- `memorySearch.provider = "openai"` → embeddings OpenAI
- `memorySearch.provider = "gemini"` → embeddings Gemini
- `memorySearch.provider = "voyage"` → embeddings Voyage
- `memorySearch.provider = "mistral"` → embeddings Mistral
- `memorySearch.provider = "ollama"` → embeddings Ollama (local/self-hosted; geralmente sem cobrança de API hospedada)
- Fallback opcional para um provedor remoto se os embeddings locais falharem

Você pode mantê-lo local com `memorySearch.provider = "local"` (sem uso de API).

Veja [Memória](/concepts/memory).

### 4) Tool de pesquisa web

`web_search` usa chaves de API e pode incorrer em cobranças de uso dependendo do seu provedor:

- **Brave Search API**: `BRAVE_API_KEY` ou `tools.web.search.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` ou `tools.web.search.gemini.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` ou `tools.web.search.grok.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` ou `tools.web.search.kimi.apiKey`
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` ou `tools.web.search.perplexity.apiKey`

**Crédito gratuito do Brave Search:** Cada plano Brave inclui \$5/mês em
crédito gratuito recorrente. O plano Search custa \$5 por 1.000 requisições, então o crédito cobre
1.000 requisições/mês sem custo. Defina seu limite de uso no painel do Brave
para evitar cobranças inesperadas.

Veja [Ferramentas web](/tools/web).

### 5) Tool de fetch web (Firecrawl)

`web_fetch` pode chamar o **Firecrawl** quando uma chave de API estiver presente:

- `FIRECRAWL_API_KEY` ou `tools.web.fetch.firecrawl.apiKey`

Se o Firecrawl não estiver configurado, a tool faz fallback para fetch direto + readability (sem API paga).

Veja [Ferramentas web](/tools/web).

### 6) Snapshots de uso do provedor (status/saúde)

Alguns comandos de status chamam **endpoints de uso do provedor** para exibir janelas de cota ou saúde de auth.
Geralmente são chamadas de baixo volume, mas ainda atingem APIs do provedor:

- `opencraft status --usage`
- `opencraft models status --json`

Veja [CLI de Modelos](/cli/models).

### 7) Sumarização de proteção de compactação

A proteção de compactação pode resumir o histórico de sessão usando o **modelo atual**, o que
invoca APIs do provedor quando é executado.

Veja [Gerenciamento de sessão + compactação](/reference/session-management-compaction).

### 8) Scan / probe de modelo

`opencraft models scan` pode sondar modelos do OpenRouter e usa `OPENROUTER_API_KEY` quando
a sondagem está habilitada.

Veja [CLI de Modelos](/cli/models).

### 9) Talk (voz)

O modo Talk pode invocar o **ElevenLabs** quando configurado:

- `ELEVENLABS_API_KEY` ou `talk.apiKey`

Veja [Modo Talk](/nodes/talk).

### 10) Skills (APIs de terceiros)

As Skills podem armazenar `apiKey` em `skills.entries.<nome>.apiKey`. Se uma skill usar essa chave para APIs
externas, pode incorrer em custos de acordo com o provedor da skill.

Veja [Skills](/tools/skills).
