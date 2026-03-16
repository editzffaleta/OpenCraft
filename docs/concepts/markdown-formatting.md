---
summary: "Pipeline de formatação Markdown para canais de saída"
read_when:
  - Você está alterando formatação markdown ou chunking para canais de saída
  - Você está adicionando um novo formatador de canal ou mapeamento de estilo
  - Você está depurando regressões de formatação entre canais
title: "Formatação Markdown"
---

# Formatação Markdown

O OpenCraft formata Markdown de saída convertendo-o em uma representação intermediária (IR) compartilhada antes de renderizar o output específico de cada canal. O IR mantém o texto fonte intacto enquanto carrega spans de estilo/link para que chunking e renderização possam permanecer consistentes entre os canais.

## Objetivos

- **Consistência:** um passo de análise, múltiplos renderizadores.
- **Chunking seguro:** dividir o texto antes de renderizar para que a formatação inline nunca quebre entre chunks.
- **Adaptação ao canal:** mapear o mesmo IR para Slack mrkdwn, HTML do Telegram e intervalos de estilo Signal sem re-analisar Markdown.

## Pipeline

1. **Analisar Markdown -> IR**
   - IR é texto simples mais spans de estilo (negrito/itálico/tachado/código/spoiler) e spans de link.
   - Offsets são unidades de código UTF-16 para que os intervalos de estilo Signal se alinhem com sua API.
   - Tabelas são analisadas apenas quando um canal opta pela conversão de tabelas.
2. **Chunk IR (formato primeiro)**
   - Chunking ocorre no texto IR antes da renderização.
   - A formatação inline não divide entre chunks; spans são fatiados por chunk.
3. **Renderizar por canal**
   - **Slack:** tokens mrkdwn (negrito/itálico/tachado/código), links como `<url|label>`.
   - **Telegram:** tags HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** texto simples + intervalos `text-style`; links tornam-se `label (url)` quando o label difere.

## Exemplo de IR

Markdown de entrada:

```markdown
Olá **mundo** — veja [docs](https://docs.openclaw.ai).
```

IR (esquemático):

```json
{
  "text": "Olá mundo — veja docs.",
  "styles": [{ "start": 4, "end": 9, "style": "bold" }],
  "links": [{ "start": 17, "end": 21, "href": "https://docs.openclaw.ai" }]
}
```

## Onde é usado

- Adaptadores de saída do Slack, Telegram e Signal renderizam a partir do IR.
- Outros canais (WhatsApp, iMessage, MS Teams, Discord) ainda usam texto simples ou suas próprias regras de formatação, com conversão de tabelas Markdown aplicada antes do chunking quando habilitado.

## Tratamento de tabelas

Tabelas Markdown não têm suporte consistente entre clientes de chat. Use
`markdown.tables` para controlar a conversão por canal (e por conta).

- `code`: renderizar tabelas como blocos de código (padrão para a maioria dos canais).
- `bullets`: converter cada linha em pontos de bala (padrão para Signal + WhatsApp).
- `off`: desabilitar análise e conversão de tabelas; texto bruto de tabela passa direto.

Chaves de config:

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

- Limites de chunk vêm de adaptadores/config de canal e são aplicados ao texto IR.
- Fences de código são preservados como um único bloco com newline no final para que os canais os renderizem corretamente.
- Prefixos de lista e prefixos de blockquote fazem parte do texto IR, portanto o chunking não divide no meio de um prefixo.
- Estilos inline (negrito/itálico/tachado/código inline/spoiler) nunca se dividem entre chunks; o renderizador reabre estilos dentro de cada chunk.

Se precisar de mais informações sobre o comportamento de chunking entre canais, veja
[Streaming + chunking](/concepts/streaming).

## Política de links

- **Slack:** `[label](url)` -> `<url|label>`; URLs simples permanecem simples. Autolink
  é desabilitado durante a análise para evitar dupla linkagem.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de análise HTML).
- **Signal:** `[label](url)` -> `label (url)` a menos que o label corresponda à URL.

## Spoilers

Marcadores de spoiler (`||spoiler||`) são analisados apenas para Signal, onde mapeiam para
intervalos de estilo SPOILER. Outros canais os tratam como texto simples.

## Como adicionar ou atualizar um formatador de canal

1. **Analisar uma vez:** use o helper compartilhado `markdownToIR(...)` com opções apropriadas para o canal (autolink, estilo de heading, prefixo de blockquote).
2. **Renderizar:** implementar um renderizador com `renderMarkdownWithMarkers(...)` e um mapa de marcadores de estilo (ou intervalos de estilo Signal).
3. **Chunk:** chamar `chunkMarkdownIR(...)` antes de renderizar; renderizar cada chunk.
4. **Conectar adaptador:** atualizar o adaptador de saída do canal para usar o novo chunker e renderizador.
5. **Testar:** adicionar ou atualizar testes de formato e um teste de entrega de saída se o canal usa chunking.

## Armadilhas comuns

- Tokens de colchete angular do Slack (`<@U123>`, `<#C123>`, `<https://...>`) devem ser preservados; escapar HTML bruto com segurança.
- HTML do Telegram requer escapar texto fora de tags para evitar marcação quebrada.
- Intervalos de estilo Signal dependem de offsets UTF-16; não use offsets de code point.
- Preservar newlines no final de blocos de código fenced para que marcadores de fechamento fiquem em sua própria linha.
