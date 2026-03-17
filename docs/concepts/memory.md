---
title: "Memory"
summary: "Como a memória do OpenCraft funciona (arquivos do workspace + flush automático de memória)"
read_when:
  - Você quer o layout dos arquivos de memória e o fluxo de trabalho
  - Você quer ajustar o flush automático de memória pré-compactação
---

# Memória

A memória do OpenCraft é **Markdown simples no workspace do agente**. Os arquivos são a
fonte de verdade; o modelo só "lembra" o que é escrito no disco.

Ferramentas de busca de memória são fornecidas pelo Plugin de memória ativo (padrão:
`memory-core`). Desabilite Plugins de memória com `plugins.slots.memory = "none"`.

## Arquivos de memória (Markdown)

O layout padrão do workspace usa duas camadas de memória:

- `memory/YYYY-MM-DD.md`
  - Log diário (append-only).
  - Leia hoje + ontem no início da sessão.
- `MEMORY.md` (opcional)
  - Memória curada de longo prazo.
  - Se ambos `MEMORY.md` e `memory.md` existirem na raiz do workspace, o OpenCraft carrega apenas `MEMORY.md`.
  - O `memory.md` em minúsculas é usado apenas como fallback quando `MEMORY.md` está ausente.
  - **Carregue apenas na sessão principal e privada** (nunca em contextos de grupo).

Estes arquivos ficam no workspace (`agents.defaults.workspace`, padrão
`~/.opencraft/workspace`). Veja [Workspace do agente](/concepts/agent-workspace) para o layout completo.

## Ferramentas de memória

O OpenCraft expõe duas ferramentas voltadas ao agente para estes arquivos Markdown:

- `memory_search` — busca semântica sobre trechos indexados.
- `memory_get` — leitura direcionada de um arquivo Markdown específico/intervalo de linhas.

`memory_get` agora **degrada graciosamente quando um arquivo não existe** (por exemplo,
o log diário de hoje antes da primeira escrita). Tanto o gerenciador integrado quanto o
backend QMD retornam `{ text: "", path }` em vez de lançar `ENOENT`, então os agentes podem
lidar com "nada registrado ainda" e continuar seu fluxo de trabalho sem envolver a
chamada de ferramenta em lógica try/catch.

## Quando escrever na memória

- Decisões, preferências e fatos duráveis vão para `MEMORY.md`.
- Notas do dia a dia e contexto corrente vão para `memory/YYYY-MM-DD.md`.
- Se alguém disser "lembre disso", escreva (não mantenha apenas na RAM).
- Esta área ainda está evoluindo. Ajuda lembrar o modelo de armazenar memórias; ele saberá o que fazer.
- Se você quer que algo persista, **peça ao bot para escrever** na memória.

## Flush automático de memória (ping pré-compactação)

Quando uma sessão está **próxima da auto-compactação**, o OpenCraft aciona um **turno
silencioso e agentic** que lembra o modelo de escrever memória durável **antes** do
contexto ser compactado. Os prompts padrão dizem explicitamente que o modelo _pode responder_,
mas geralmente `NO_REPLY` é a resposta correta para que o usuário nunca veja este turno.

Isso é controlado por `agents.defaults.compaction.memoryFlush`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

Detalhes:

- **Limiar suave**: o flush é acionado quando a estimativa de tokens da sessão cruza
  `contextWindow - reserveTokensFloor - softThresholdTokens`.
- **Silencioso** por padrão: os prompts incluem `NO_REPLY` para que nada seja entregue.
- **Dois prompts**: um prompt de usuário mais um prompt de sistema adicionam o lembrete.
- **Um flush por ciclo de compactação** (rastreado em `sessions.json`).
- **Workspace deve ser gravável**: se a sessão roda em sandbox com
  `workspaceAccess: "ro"` ou `"none"`, o flush é ignorado.

Para o ciclo de vida completo da compactação, veja
[Gerenciamento de sessão + compactação](/reference/session-management-compaction).

## Busca de memória vetorial

O OpenCraft pode construir um pequeno índice vetorial sobre `MEMORY.md` e `memory/*.md` para que
consultas semânticas possam encontrar notas relacionadas mesmo quando a redação difere.

Padrões:

- Habilitado por padrão.
- Monitora arquivos de memória para alterações (com debounce).
- Configure a busca de memória em `agents.defaults.memorySearch` (não no nível raiz
  `memorySearch`).
- Usa embeddings remotos por padrão. Se `memorySearch.provider` não estiver definido, o OpenCraft auto-seleciona:
  1. `local` se um `memorySearch.local.modelPath` estiver configurado e o arquivo existir.
  2. `openai` se uma chave OpenAI puder ser resolvida.
  3. `gemini` se uma chave Gemini puder ser resolvida.
  4. `voyage` se uma chave Voyage puder ser resolvida.
  5. `mistral` se uma chave Mistral puder ser resolvida.
  6. Caso contrário, a busca de memória permanece desabilitada até ser configurada.
- Modo local usa node-llama-cpp e pode requerer `pnpm approve-builds`.
- Usa sqlite-vec (quando disponível) para acelerar busca vetorial dentro do SQLite.
- `memorySearch.provider = "ollama"` também é suportado para embeddings Ollama locais/auto-hospedados
  (`/api/embeddings`), mas não é auto-selecionado.

Embeddings remotos **requerem** uma chave de API para o provedor de embeddings. O OpenCraft
resolve chaves de perfis de autenticação, `models.providers.*.apiKey` ou variáveis de
ambiente. O Codex OAuth cobre apenas chat/completions e **não** satisfaz
embeddings para busca de memória. Para Gemini, use `GEMINI_API_KEY` ou
`models.providers.google.apiKey`. Para Voyage, use `VOYAGE_API_KEY` ou
`models.providers.voyage.apiKey`. Para Mistral, use `MISTRAL_API_KEY` ou
`models.providers.mistral.apiKey`. Ollama tipicamente não requer uma chave de API
real (um placeholder como `OLLAMA_API_KEY=ollama-local` é suficiente quando necessário pela
política local).
Ao usar um endpoint personalizado compatível com OpenAI,
defina `memorySearch.remote.apiKey` (e opcionalmente `memorySearch.remote.headers`).

### Backend QMD (experimental)

Defina `memory.backend = "qmd"` para trocar o indexador SQLite integrado pelo
[QMD](https://github.com/tobi/qmd): um sidecar de busca local-first que combina
BM25 + vetores + reranking. O Markdown permanece como fonte de verdade; o OpenCraft delega
ao QMD para recuperação. Pontos principais:

**Pré-requisitos**

- Desabilitado por padrão. Opte por configuração (`memory.backend = "qmd"`).
- Instale o CLI do QMD separadamente (`bun install -g https://github.com/tobi/qmd` ou baixe
  um release) e certifique-se de que o binário `qmd` está no `PATH` do Gateway.
- O QMD precisa de um build do SQLite que permita extensões (`brew install sqlite` no
  macOS).
- O QMD roda totalmente local via Bun + `node-llama-cpp` e baixa automaticamente modelos GGUF
  do HuggingFace no primeiro uso (nenhum daemon Ollama separado é necessário).
- O Gateway roda o QMD em um home XDG autocontido em
  `~/.opencraft/agents/<agentId>/qmd/` definindo `XDG_CONFIG_HOME` e
  `XDG_CACHE_HOME`.
- Suporte de SO: macOS e Linux funcionam imediatamente após Bun + SQLite serem
  instalados. Windows é melhor suportado via WSL2.

**Como o sidecar roda**

- O Gateway escreve um home QMD autocontido em
  `~/.opencraft/agents/<agentId>/qmd/` (config + cache + banco SQLite).
- Collections são criadas via `qmd collection add` de `memory.qmd.paths`
  (mais arquivos de memória padrão do workspace), então `qmd update` + `qmd embed` rodam
  na inicialização e em um intervalo configurável (`memory.qmd.update.interval`,
  padrão 5 m).
- O Gateway agora inicializa o gerenciador QMD na inicialização, então timers de atualização
  periódica são armados mesmo antes da primeira chamada `memory_search`.
- A atualização de boot agora roda em background por padrão para que a inicialização do chat não seja
  bloqueada; defina `memory.qmd.update.waitForBootSync = true` para manter o comportamento
  bloqueante anterior.
- Buscas rodam via `memory.qmd.searchMode` (padrão `qmd search --json`; também
  suporta `vsearch` e `query`). Se o modo selecionado rejeitar flags no seu
  build do QMD, o OpenCraft tenta novamente com `qmd query`. Se o QMD falhar ou o binário estiver
  ausente, o OpenCraft automaticamente volta para o gerenciador SQLite integrado para que
  as ferramentas de memória continuem funcionando.
- O OpenCraft não expõe ajuste de batch-size de embed do QMD hoje; o comportamento de batch é
  controlado pelo próprio QMD.
- **A primeira busca pode ser lenta**: o QMD pode baixar modelos GGUF locais (reranker/query
  expansion) na primeira execução de `qmd query`.
  - O OpenCraft define `XDG_CONFIG_HOME`/`XDG_CACHE_HOME` automaticamente quando roda o QMD.
  - Se você quiser pré-baixar modelos manualmente (e aquecer o mesmo índice que o OpenCraft
    usa), execute uma query avulsa com os dirs XDG do agente.

    O estado QMD do OpenCraft fica no seu **diretório de estado** (padrão `~/.opencraft`).
    Você pode apontar o `qmd` para exatamente o mesmo índice exportando as mesmas variáveis XDG
    que o OpenCraft usa:

    ```bash
    # Escolha o mesmo diretório de estado que o OpenCraft usa
    STATE_DIR="${OPENCRAFT_STATE_DIR:-$HOME/.opencraft}"

    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"

    # (Opcional) forçar atualização de índice + embeddings
    qmd update
    qmd embed

    # Aquecer / acionar downloads de modelos na primeira vez
    qmd query "test" -c memory-root --json >/dev/null 2>&1
    ```

**Superfície de configuração (`memory.qmd.*`)**

- `command` (padrão `qmd`): sobrescrever o caminho do executável.
- `searchMode` (padrão `search`): escolher qual comando QMD alimenta
  `memory_search` (`search`, `vsearch`, `query`).
- `includeDefaultMemory` (padrão `true`): auto-indexar `MEMORY.md` + `memory/**/*.md`.
- `paths[]`: adicionar diretórios/arquivos extras (`path`, `pattern` opcional, `name` estável
  opcional).
- `sessions`: optar pela indexação de JSONL de sessão (`enabled`, `retentionDays`,
  `exportDir`).
- `update`: controla cadência de atualização e execução de manutenção:
  (`interval`, `debounceMs`, `onBoot`, `waitForBootSync`, `embedInterval`,
  `commandTimeoutMs`, `updateTimeoutMs`, `embedTimeoutMs`).
- `limits`: limitar payload de recall (`maxResults`, `maxSnippetChars`,
  `maxInjectedChars`, `timeoutMs`).
- `scope`: mesmo schema que [`session.sendPolicy`](/gateway/configuration#session).
  O padrão é somente DM (`deny` tudo, `allow` chats diretos); flexibilize para surfar
  hits do QMD em grupos/canais.
  - `match.keyPrefix` corresponde à chave de sessão **normalizada** (minúsculas, com qualquer
    prefixo `agent:<id>:` removido). Exemplo: `discord:channel:`.
  - `match.rawKeyPrefix` corresponde à chave de sessão **bruta** (minúsculas), incluindo
    `agent:<id>:`. Exemplo: `agent:main:discord:`.
  - Legado: `match.keyPrefix: "agent:..."` ainda é tratado como um prefixo de chave bruta,
    mas prefira `rawKeyPrefix` para clareza.
- Quando `scope` nega uma busca, o OpenCraft registra um warning com o
  `channel`/`chatType` derivado para que resultados vazios sejam mais fáceis de depurar.
- Trechos originados fora do workspace aparecem como
  `qmd/<collection>/<relative-path>` nos resultados de `memory_search`; `memory_get`
  entende esse prefixo e lê da raiz da collection QMD configurada.
- Quando `memory.qmd.sessions.enabled = true`, o OpenCraft exporta transcrições de sessão
  sanitizadas (turnos Usuário/Assistente) para uma collection QMD dedicada em
  `~/.opencraft/agents/<id>/qmd/sessions/`, então `memory_search` pode recordar conversas
  recentes sem tocar no índice SQLite integrado.
- Trechos de `memory_search` agora incluem um rodapé `Source: <path#line>` quando
  `memory.citations` é `auto`/`on`; defina `memory.citations = "off"` para manter
  os metadados de caminho internos (o agente ainda recebe o caminho para
  `memory_get`, mas o texto do trecho omite o rodapé e o prompt do sistema
  avisa o agente para não citá-lo).

**Exemplo**

```json5
memory: {
  backend: "qmd",
  citations: "auto",
  qmd: {
    includeDefaultMemory: true,
    update: { interval: "5m", debounceMs: 15000 },
    limits: { maxResults: 6, timeoutMs: 4000 },
    scope: {
      default: "deny",
      rules: [
        { action: "allow", match: { chatType: "direct" } },
        // Prefixo de chave de sessão normalizado (remove `agent:<id>:`).
        { action: "deny", match: { keyPrefix: "discord:channel:" } },
        // Prefixo de chave de sessão bruto (inclui `agent:<id>:`).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ]
    },
    paths: [
      { name: "docs", path: "~/notes", pattern: "**/*.md" }
    ]
  }
}
```

**Citações e fallback**

- `memory.citations` se aplica independentemente do backend (`auto`/`on`/`off`).
- Quando o `qmd` roda, marcamos `status().backend = "qmd"` para que diagnósticos mostrem qual
  motor serviu os resultados. Se o subprocesso QMD sair ou a saída JSON não puder ser
  parseada, o gerenciador de busca registra um warning e retorna o provedor integrado
  (embeddings Markdown existentes) até o QMD se recuperar.

### Caminhos adicionais de memória

Se você quiser indexar arquivos Markdown fora do layout padrão do workspace, adicione
caminhos explícitos:

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

Notas:

- Caminhos podem ser absolutos ou relativos ao workspace.
- Diretórios são escaneados recursivamente para arquivos `.md`.
- Por padrão, apenas arquivos Markdown são indexados.
- Se `memorySearch.multimodal.enabled = true`, o OpenCraft também indexa arquivos de imagem/áudio suportados em `extraPaths` apenas. Raízes de memória padrão (`MEMORY.md`, `memory.md`, `memory/**/*.md`) permanecem somente Markdown.
- Symlinks são ignorados (arquivos ou diretórios).

### Arquivos de memória multimodais (Gemini imagem + áudio)

O OpenCraft pode indexar arquivos de imagem e áudio de `memorySearch.extraPaths` ao usar Gemini embedding 2:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      extraPaths: ["assets/reference", "voice-notes"],
      multimodal: {
        enabled: true,
        modalities: ["image", "audio"], // ou ["all"]
        maxFileBytes: 10000000
      },
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

Notas:

- Memória multimodal é atualmente suportada apenas para `gemini-embedding-2-preview`.
- Indexação multimodal se aplica apenas a arquivos descobertos através de `memorySearch.extraPaths`.
- Modalidades suportadas nesta fase: imagem e áudio.
- `memorySearch.fallback` deve permanecer `"none"` enquanto memória multimodal estiver habilitada.
- Bytes de arquivos de imagem/áudio correspondentes são enviados ao endpoint de embeddings Gemini configurado durante a indexação.
- Extensões de imagem suportadas: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`.
- Extensões de áudio suportadas: `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`.
- Consultas de busca permanecem em texto, mas o Gemini pode comparar essas consultas de texto contra embeddings de imagem/áudio indexados.
- `memory_get` ainda lê apenas Markdown; arquivos binários são pesquisáveis mas não retornados como conteúdo bruto de arquivo.

### Embeddings Gemini (nativo)

Defina o provedor como `gemini` para usar a API de embeddings Gemini diretamente:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

Notas:

- `remote.baseUrl` é opcional (padrão é a URL base da API Gemini).
- `remote.headers` permite adicionar headers extras se necessário.
- Modelo padrão: `gemini-embedding-001`.
- `gemini-embedding-2-preview` também é suportado: limite de 8192 tokens e dimensões configuráveis (768 / 1536 / 3072, padrão 3072).

#### Gemini Embedding 2 (preview)

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      outputDimensionality: 3072,  // opcional: 768, 1536 ou 3072 (padrão)
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

> **⚠️ Reindexação necessária:** Trocar de `gemini-embedding-001` (768 dimensões)
> para `gemini-embedding-2-preview` (3072 dimensões) muda o tamanho do vetor. O mesmo vale se você
> alterar `outputDimensionality` entre 768, 1536 e 3072.
> O OpenCraft reindexará automaticamente quando detectar uma mudança de modelo ou dimensão.

Se você quiser usar um **endpoint personalizado compatível com OpenAI** (OpenRouter, vLLM ou um proxy),
pode usar a configuração `remote` com o provedor OpenAI:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_OPENAI_COMPAT_API_KEY",
        headers: { "X-Custom-Header": "value" }
      }
    }
  }
}
```

Se você não quiser definir uma chave de API, use `memorySearch.provider = "local"` ou defina
`memorySearch.fallback = "none"`.

Fallbacks:

- `memorySearch.fallback` pode ser `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local` ou `none`.
- O provedor de fallback é usado apenas quando o provedor de embeddings primário falha.

Indexação em lote (OpenAI + Gemini + Voyage):

- Desabilitado por padrão. Defina `agents.defaults.memorySearch.remote.batch.enabled = true` para habilitar para indexação de corpus grande (OpenAI, Gemini e Voyage).
- O comportamento padrão aguarda a conclusão do lote; ajuste `remote.batch.wait`, `remote.batch.pollIntervalMs` e `remote.batch.timeoutMinutes` se necessário.
- Defina `remote.batch.concurrency` para controlar quantos jobs de lote são enviados em paralelo (padrão: 2).
- O modo batch se aplica quando `memorySearch.provider = "openai"` ou `"gemini"` e usa a chave de API correspondente.
- Jobs batch do Gemini usam o endpoint de batch de embeddings assíncronos e requerem disponibilidade da Gemini Batch API.

Por que o batch da OpenAI é rápido + barato:

- Para backfills grandes, a OpenAI é tipicamente a opção mais rápida que suportamos porque podemos enviar muitas requisições de embeddings em um único job batch e deixar a OpenAI processá-las assincronamente.
- A OpenAI oferece preços com desconto para cargas de trabalho da Batch API, então execuções grandes de indexação são geralmente mais baratas do que enviar as mesmas requisições sincronamente.
- Veja a documentação e preços da OpenAI Batch API para detalhes:
  - [https://platform.openai.com/docs/api-reference/batch](https://platform.openai.com/docs/api-reference/batch)
  - [https://platform.openai.com/pricing](https://platform.openai.com/pricing)

Exemplo de configuração:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      fallback: "openai",
      remote: {
        batch: { enabled: true, concurrency: 2 }
      },
      sync: { watch: true }
    }
  }
}
```

Ferramentas:

- `memory_search` — retorna trechos com arquivo + intervalos de linha.
- `memory_get` — lê conteúdo de arquivo de memória por caminho.

Modo local:

- Defina `agents.defaults.memorySearch.provider = "local"`.
- Forneça `agents.defaults.memorySearch.local.modelPath` (GGUF ou URI `hf:`).
- Opcional: defina `agents.defaults.memorySearch.fallback = "none"` para evitar fallback remoto.

### Como as ferramentas de memória funcionam

- `memory_search` busca semanticamente chunks Markdown (~400 tokens alvo, 80 tokens de sobreposição) de `MEMORY.md` + `memory/**/*.md`. Retorna texto do trecho (limitado ~700 chars), caminho do arquivo, intervalo de linhas, pontuação, provedor/modelo e se houve fallback de embeddings local → remoto. Nenhum payload de arquivo completo é retornado.
- `memory_get` lê um arquivo Markdown de memória específico (relativo ao workspace), opcionalmente a partir de uma linha inicial e por N linhas. Caminhos fora de `MEMORY.md` / `memory/` são rejeitados.
- Ambas as ferramentas são habilitadas apenas quando `memorySearch.enabled` resolve como true para o agente.

### O que é indexado (e quando)

- Tipo de arquivo: apenas Markdown (`MEMORY.md`, `memory/**/*.md`).
- Armazenamento do índice: SQLite por agente em `~/.opencraft/memory/<agentId>.sqlite` (configurável via `agents.defaults.memorySearch.store.path`, suporta token `{agentId}`).
- Frescor: watcher em `MEMORY.md` + `memory/` marca o índice como sujo (debounce 1.5s). Sync é agendado no início da sessão, na busca ou em um intervalo e roda assincronamente. Transcrições de sessão usam limiares de delta para acionar sync em background.
- Gatilhos de reindexação: o índice armazena o **provedor/modelo de embeddings + fingerprint de endpoint + parâmetros de chunking**. Se algum deles mudar, o OpenCraft automaticamente reseta e reindexa todo o armazenamento.

### Busca híbrida (BM25 + vetor)

Quando habilitada, o OpenCraft combina:

- **Similaridade vetorial** (correspondência semântica, a redação pode diferir)
- **Relevância de palavras-chave BM25** (tokens exatos como IDs, variáveis de ambiente, símbolos de código)

Se a busca full-text não estiver disponível na sua plataforma, o OpenCraft volta para busca somente vetorial.

#### Por que híbrida?

Busca vetorial é ótima em "isso significa a mesma coisa":

- "Mac Studio gateway host" vs "a máquina rodando o Gateway"
- "debounce file updates" vs "evitar indexação a cada escrita"

Mas pode ser fraca em tokens exatos de alto sinal:

- IDs (`a828e60`, `b3b9895a…`)
- símbolos de código (`memorySearch.query.hybrid`)
- strings de erro ("sqlite-vec unavailable")

BM25 (full-text) é o oposto: forte em tokens exatos, mais fraco em paráfrases.
Busca híbrida é o meio-termo pragmático: **usar ambos os sinais de recuperação** para obter
bons resultados tanto para consultas em "linguagem natural" quanto para consultas "agulha no palheiro".

#### Como mesclamos resultados (o design atual)

Esboço da implementação:

1. Recuperar um pool de candidatos de ambos os lados:

- **Vetor**: top `maxResults * candidateMultiplier` por similaridade cosseno.
- **BM25**: top `maxResults * candidateMultiplier` por rank BM25 FTS5 (menor é melhor).

2. Converter rank BM25 em uma pontuação 0..1-ish:

- `textScore = 1 / (1 + max(0, bm25Rank))`

3. Unir candidatos por chunk id e computar uma pontuação ponderada:

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

Notas:

- `vectorWeight` + `textWeight` é normalizado para 1.0 na resolução de config, então pesos se comportam como porcentagens.
- Se embeddings não estiverem disponíveis (ou o provedor retornar um zero-vector), ainda rodamos BM25 e retornamos correspondências por palavra-chave.
- Se o FTS5 não puder ser criado, mantemos busca somente vetorial (sem falha grave).

Isso não é "perfeito pela teoria de RI", mas é simples, rápido e tende a melhorar recall/precisão em notas reais.
Se quisermos algo mais sofisticado depois, próximos passos comuns são Reciprocal Rank Fusion (RRF) ou normalização de pontuação
(min/max ou z-score) antes da mistura.

#### Pipeline de pós-processamento

Após mesclar pontuações vetoriais e de palavras-chave, dois estágios opcionais de pós-processamento
refinam a lista de resultados antes de chegar ao agente:

```
Vetor + Palavra-chave → Mesclagem Ponderada → Decaimento Temporal → Ordenação → MMR → Top-K Resultados
```

Ambos os estágios estão **desligados por padrão** e podem ser habilitados independentemente.

#### Re-ranking MMR (diversidade)

Quando a busca híbrida retorna resultados, múltiplos chunks podem conter conteúdo similar ou sobreposto.
Por exemplo, buscar "home network setup" pode retornar cinco trechos quase idênticos
de diferentes notas diárias que mencionam a mesma configuração de roteador.

**MMR (Maximal Marginal Relevance)** re-ranqueia os resultados para balancear relevância com diversidade,
garantindo que os principais resultados cubram diferentes aspectos da consulta em vez de repetir a mesma informação.

Como funciona:

1. Resultados são pontuados pela sua relevância original (pontuação ponderada vetor + BM25).
2. MMR iterativamente seleciona resultados que maximizam: `λ × relevância − (1−λ) × max_similaridade_com_selecionados`.
3. Similaridade entre resultados é medida usando similaridade de texto Jaccard em conteúdo tokenizado.

O parâmetro `lambda` controla o trade-off:

- `lambda = 1.0` → relevância pura (sem penalidade de diversidade)
- `lambda = 0.0` → diversidade máxima (ignora relevância)
- Padrão: `0.7` (equilibrado, leve viés de relevância)

**Exemplo — consulta: "home network setup"**

Dados estes arquivos de memória:

```
memory/2026-02-10.md  → "Configured Omada router, set VLAN 10 for IoT devices"
memory/2026-02-08.md  → "Configured Omada router, moved IoT to VLAN 10"
memory/2026-02-05.md  → "Set up AdGuard DNS on 192.168.10.2"
memory/network.md     → "Router: Omada ER605, AdGuard: 192.168.10.2, VLAN 10: IoT"
```

Sem MMR — top 3 resultados:

```
1. memory/2026-02-10.md  (score: 0.92)  ← router + VLAN
2. memory/2026-02-08.md  (score: 0.89)  ← router + VLAN (quase duplicata!)
3. memory/network.md     (score: 0.85)  ← doc de referência
```

Com MMR (λ=0.7) — top 3 resultados:

```
1. memory/2026-02-10.md  (score: 0.92)  ← router + VLAN
2. memory/network.md     (score: 0.85)  ← doc de referência (diverso!)
3. memory/2026-02-05.md  (score: 0.78)  ← AdGuard DNS (diverso!)
```

A quase duplicata de 8 de fevereiro sai, e o agente obtém três informações distintas.

**Quando habilitar:** Se você notar que `memory_search` retorna trechos redundantes ou quase duplicados,
especialmente com notas diárias que frequentemente repetem informações similares entre dias.

#### Decaimento temporal (boost de recência)

Agentes com notas diárias acumulam centenas de arquivos datados ao longo do tempo. Sem decaimento,
uma nota bem redigida de seis meses atrás pode superar a atualização de ontem sobre o mesmo tópico.

**Decaimento temporal** aplica um multiplicador exponencial às pontuações baseado na idade de cada resultado,
então memórias recentes naturalmente ranqueiam mais alto enquanto as antigas desvanecem:

```
decayedScore = score × e^(-λ × idadeEmDias)
```

onde `λ = ln(2) / halfLifeDays`.

Com a meia-vida padrão de 30 dias:

- Notas de hoje: **100%** da pontuação original
- 7 dias atrás: **~84%**
- 30 dias atrás: **50%**
- 90 dias atrás: **12.5%**
- 180 dias atrás: **~1.6%**

**Arquivos perenes nunca sofrem decaimento:**

- `MEMORY.md` (arquivo de memória raiz)
- Arquivos não datados em `memory/` (ex.: `memory/projects.md`, `memory/network.md`)
- Estes contêm informações de referência duráveis que devem sempre ranquear normalmente.

**Arquivos diários datados** (`memory/YYYY-MM-DD.md`) usam a data extraída do nome do arquivo.
Outras fontes (ex.: transcrições de sessão) usam o tempo de modificação do arquivo (`mtime`).

**Exemplo — consulta: "what's Rod's work schedule?"**

Dados estes arquivos de memória (hoje é 10 de fevereiro):

```
memory/2025-09-15.md  → "Rod works Mon-Fri, standup at 10am, pairing at 2pm"  (148 dias atrás)
memory/2026-02-10.md  → "Rod has standup at 14:15, 1:1 with Zeb at 14:45"    (hoje)
memory/2026-02-03.md  → "Rod started new team, standup moved to 14:15"        (7 dias atrás)
```

Sem decaimento:

```
1. memory/2025-09-15.md  (score: 0.91)  ← melhor correspondência semântica, mas defasada!
2. memory/2026-02-10.md  (score: 0.82)
3. memory/2026-02-03.md  (score: 0.80)
```

Com decaimento (halfLife=30):

```
1. memory/2026-02-10.md  (score: 0.82 × 1.00 = 0.82)  ← hoje, sem decaimento
2. memory/2026-02-03.md  (score: 0.80 × 0.85 = 0.68)  ← 7 dias, decaimento leve
3. memory/2025-09-15.md  (score: 0.91 × 0.03 = 0.03)  ← 148 dias, quase zerado
```

A nota defasada de setembro cai para o final apesar de ter a melhor correspondência semântica bruta.

**Quando habilitar:** Se o seu agente tem meses de notas diárias e você percebe que informações
velhas e defasadas superam o contexto recente. Uma meia-vida de 30 dias funciona bem para
fluxos de trabalho com muitas notas diárias; aumente (ex.: 90 dias) se você referencia notas mais antigas com frequência.

#### Configuração

Ambos os recursos são configurados em `memorySearch.query.hybrid`:

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4,
          // Diversidade: reduzir resultados redundantes
          mmr: {
            enabled: true,    // padrão: false
            lambda: 0.7       // 0 = máx diversidade, 1 = máx relevância
          },
          // Recência: dar boost em memórias mais novas
          temporalDecay: {
            enabled: true,    // padrão: false
            halfLifeDays: 30  // pontuação cai pela metade a cada 30 dias
          }
        }
      }
    }
  }
}
```

Você pode habilitar qualquer recurso independentemente:

- **Somente MMR** — útil quando você tem muitas notas similares mas a idade não importa.
- **Somente decaimento temporal** — útil quando recência importa mas seus resultados já são diversos.
- **Ambos** — recomendado para agentes com históricos grandes e de longa duração de notas diárias.

### Cache de embeddings

O OpenCraft pode armazenar em cache **embeddings de chunk** no SQLite para que reindexações e atualizações frequentes (especialmente transcrições de sessão) não re-embdem texto inalterado.

Configuração:

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: {
        enabled: true,
        maxEntries: 50000
      }
    }
  }
}
```

### Busca de memória de sessão (experimental)

Você pode opcionalmente indexar **transcrições de sessão** e exibi-las via `memory_search`.
Isso está protegido por uma flag experimental.

```json5
agents: {
  defaults: {
    memorySearch: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"]
    }
  }
}
```

Notas:

- A indexação de sessão é **opt-in** (desligada por padrão).
- Atualizações de sessão são debounced e **indexadas assincronamente** quando cruzam limiares de delta (melhor esforço).
- `memory_search` nunca bloqueia na indexação; resultados podem estar levemente defasados até o sync em background terminar.
- Resultados ainda incluem apenas trechos; `memory_get` permanece limitado a arquivos de memória.
- A indexação de sessão é isolada por agente (apenas os logs de sessão daquele agente são indexados).
- Logs de sessão ficam no disco (`~/.opencraft/agents/<agentId>/sessions/*.jsonl`). Qualquer processo/usuário com acesso ao filesystem pode lê-los, então trate o acesso ao disco como a fronteira de confiança. Para isolamento mais rigoroso, execute agentes sob usuários ou hosts separados do SO.

Limiares de delta (padrões mostrados):

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // linhas JSONL
        }
      }
    }
  }
}
```

### Aceleração vetorial SQLite (sqlite-vec)

Quando a extensão sqlite-vec está disponível, o OpenCraft armazena embeddings em uma
tabela virtual SQLite (`vec0`) e realiza consultas de distância vetorial no
banco de dados. Isso mantém a busca rápida sem carregar todos os embeddings no JS.

Configuração (opcional):

```json5
agents: {
  defaults: {
    memorySearch: {
      store: {
        vector: {
          enabled: true,
          extensionPath: "/path/to/sqlite-vec"
        }
      }
    }
  }
}
```

Notas:

- `enabled` é true por padrão; quando desabilitado, a busca volta para similaridade
  cosseno em processo sobre embeddings armazenados.
- Se a extensão sqlite-vec estiver ausente ou falhar ao carregar, o OpenCraft registra o
  erro e continua com o fallback JS (sem tabela vetorial).
- `extensionPath` sobrescreve o caminho do sqlite-vec empacotado (útil para builds personalizados
  ou locais de instalação não padrão).

### Auto-download de embeddings locais

- Modelo de embedding local padrão: `hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB).
- Quando `memorySearch.provider = "local"`, `node-llama-cpp` resolve `modelPath`; se o GGUF estiver ausente, ele **baixa automaticamente** para o cache (ou `local.modelCacheDir` se definido), então o carrega. Downloads são retomados na retentativa.
- Requisito de build nativo: execute `pnpm approve-builds`, escolha `node-llama-cpp`, então `pnpm rebuild node-llama-cpp`.
- Fallback: se a configuração local falhar e `memorySearch.fallback = "openai"`, trocamos automaticamente para embeddings remotos (`openai/text-embedding-3-small` a menos que sobrescrito) e registramos o motivo.

### Exemplo de endpoint personalizado compatível com OpenAI

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_REMOTE_API_KEY",
        headers: {
          "X-Organization": "org-id",
          "X-Project": "project-id"
        }
      }
    }
  }
}
```

Notas:

- `remote.*` tem precedência sobre `models.providers.openai.*`.
- `remote.headers` é mesclado com os headers da OpenAI; remote vence em conflitos de chave. Omita `remote.headers` para usar os padrões da OpenAI.
