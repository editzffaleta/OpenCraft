---
summary: "Pipeline de formatação Markdown para canais de saída"
read_when:
  - Você está alterando a formatação ou chunking de Markdown para canais de saída
  - Você está adicionando um novo formatador de canal ou mapeamento de estilo
  - Você está depurando regressões de formatação entre canais
title: "Markdown Formatting"
---

# Formatação Markdown

O OpenCraft formata Markdown de saída convertendo-o em uma representação intermediária (IR)
compartilhada antes de renderizar a saída específica do canal. A IR mantém o
texto-fonte intacto enquanto carrega spans de estilo/link para que o chunking e a renderização possam
permanecer consistentes entre canais.

## Objetivos

- **Consistência:** uma etapa de parse, múltiplos renderizadores.
- **Chunking seguro:** dividir o texto antes de renderizar para que a formatação inline nunca
  quebre entre chunks.
- **Adequação ao canal:** mapear a mesma IR para Slack mrkdwn, Telegram HTML e Signal
  style ranges sem re-parse do Markdown.

## Pipeline

1. **Parse Markdown -> IR**
   - IR é texto simples mais spans de estilo (negrito/itálico/riscado/código/spoiler) e spans de link.
   - Offsets são em unidades de código UTF-16 para que os style ranges do Signal se alinhem com sua API.
   - Tabelas são parseadas apenas quando um canal opta pela conversão de tabelas.
2. **Chunk IR (format-first)**
   - O chunking acontece no texto da IR antes da renderização.
   - Formatação inline não se divide entre chunks; spans são fatiados por chunk.
3. **Renderizar por canal**
   - **Slack:** tokens mrkdwn (negrito/itálico/riscado/código), links como `<url|label>`.
   - **Telegram:** tags HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** texto simples + ranges `text-style`; links se tornam `label (url)` quando o label difere.

## Exemplo de IR

Markdown de entrada:

```markdown
Hello **world** — see [docs](https://docs.opencraft.ai).
```

IR (esquemática):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.opencraft.ai" }]
}
```

## Onde é usado

- Adaptadores de saída do Slack, Telegram e Signal renderizam a partir da IR.
- Outros canais (WhatsApp, iMessage, MS Teams, Discord) ainda usam texto simples ou
  suas próprias regras de formatação, com conversão de tabela Markdown aplicada antes
  do chunking quando habilitada.

## Tratamento de tabelas

Tabelas Markdown não são suportadas de forma consistente entre clientes de chat. Use
`markdown.tables` para controlar a conversão por canal (e por conta).

- `code`: renderiza tabelas como blocos de código (padrão para a maioria dos canais).
- `bullets`: converte cada linha em pontos com marcadores (padrão para Signal + WhatsApp).
- `off`: desabilita o parse e conversão de tabelas; o texto bruto da tabela passa direto.

Chaves de configuração:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Regras de chunking

- Limites de chunk vêm dos adaptadores/configuração do canal e são aplicados ao texto da IR.
- Blocos de código cercados são preservados como um único bloco com uma nova linha final para que os canais
  os renderizem corretamente.
- Prefixos de lista e prefixos de blockquote fazem parte do texto da IR, então o chunking
  não divide no meio de um prefixo.
- Estilos inline (negrito/itálico/riscado/código-inline/spoiler) nunca se dividem entre
  chunks; o renderizador reabre estilos dentro de cada chunk.

Se você precisa de mais informações sobre o comportamento de chunking entre canais, veja
[Streaming + chunking](/concepts/streaming).

## Política de links

- **Slack:** `[label](url)` -> `<url|label>`; URLs sem formatação permanecem assim. Autolink
  é desabilitado durante o parse para evitar links duplicados.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de parse HTML).
- **Signal:** `[label](url)` -> `label (url)` a menos que o label corresponda à URL.

## Spoilers

Marcadores de spoiler (`||spoiler||`) são parseados apenas para Signal, onde mapeiam para
ranges de estilo SPOILER. Outros canais os tratam como texto simples.

## Como adicionar ou atualizar um formatador de canal

1. **Parse uma vez:** use o helper compartilhado `markdownToIR(...)` com opções
   apropriadas do canal (autolink, estilo de heading, prefixo de blockquote).
2. **Renderize:** implemente um renderizador com `renderMarkdownWithMarkers(...)` e um
   mapa de marcadores de estilo (ou Signal style ranges).
3. **Chunk:** chame `chunkMarkdownIR(...)` antes de renderizar; renderize cada chunk.
4. **Conecte o adaptador:** atualize o adaptador de saída do canal para usar o novo chunker
   e renderizador.
5. **Teste:** adicione ou atualize testes de formato e um teste de entrega de saída se o
   canal usa chunking.

## Armadilhas comuns

- Tokens de colchete angular do Slack (`<@U123>`, `<#C123>`, `<https://...>`) devem ser
  preservados; escape HTML bruto de forma segura.
- HTML do Telegram requer escape de texto fora de tags para evitar markup quebrado.
- Ranges de estilo do Signal dependem de offsets UTF-16; não use offsets de code point.
- Preserve novas linhas finais para blocos de código cercados para que os marcadores de fechamento fiquem em
  sua própria linha.
