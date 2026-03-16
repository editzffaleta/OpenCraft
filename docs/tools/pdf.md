---
title: "Ferramenta PDF"
summary: "Analisar um ou mais documentos PDF com suporte nativo do provedor e fallback de extração"
read_when:
  - Você quer analisar PDFs a partir de agentes
  - Você precisa dos parâmetros e limites exatos da tool pdf
  - Você está depurando o modo PDF nativo vs fallback de extração
---

# Ferramenta pdf

`pdf` analisa um ou mais documentos PDF e retorna texto.

Comportamento rápido:

- Modo nativo do provedor para provedores de modelos Anthropic e Google.
- Modo de fallback de extração para outros provedores (extrai texto primeiro, depois imagens de página quando necessário).
- Suporta entrada única (`pdf`) ou múltipla (`pdfs`), máximo de 10 PDFs por chamada.

## Disponibilidade

A tool é registrada apenas quando o OpenCraft consegue resolver uma configuração de modelo compatível com PDF para o agente:

1. `agents.defaults.pdfModel`
2. fallback para `agents.defaults.imageModel`
3. fallback para padrões do provedor baseado na autenticação disponível (melhor esforço)

Se nenhum modelo utilizável puder ser resolvido, a tool `pdf` não é exposta.

## Referência de entrada

- `pdf` (`string`): um caminho ou URL de PDF
- `pdfs` (`string[]`): múltiplos caminhos ou URLs de PDF, até 10 no total
- `prompt` (`string`): prompt de análise, padrão `Analyze this PDF document.`
- `pages` (`string`): filtro de páginas como `1-5` ou `1,3,7-9`
- `model` (`string`): override de modelo opcional (`provedor/modelo`)
- `maxBytesMb` (`number`): limite de tamanho por PDF em MB

Notas de entrada:

- `pdf` e `pdfs` são mesclados e deduplicados antes do carregamento.
- Se nenhuma entrada PDF for fornecida, a tool retorna erro.
- `pages` é analisado como números de página baseados em 1, deduplicados, ordenados e limitados ao máximo de páginas configurado.
- `maxBytesMb` padrão é `agents.defaults.pdfMaxBytesMb` ou `10`.

## Referências de PDF suportadas

- caminho de arquivo local (incluindo expansão de `~`)
- URL `file://`
- URL `http://` e `https://`

Notas de referência:

- Outros esquemas URI (por exemplo `ftp://`) são rejeitados com `unsupported_pdf_reference`.
- No modo sandbox, URLs remotas `http(s)` são rejeitadas.
- Com política de apenas workspace habilitada, caminhos de arquivo local fora das raízes permitidas são rejeitados.

## Modos de execução

### Modo nativo do provedor

O modo nativo é usado para os provedores `anthropic` e `google`.
A tool envia bytes PDF brutos diretamente para as APIs do provedor.

Limites do modo nativo:

- `pages` não é suportado. Se definido, a tool retorna um erro.

### Modo de fallback de extração

O modo de fallback é usado para provedores não nativos.

Fluxo:

1. Extrair texto das páginas selecionadas (até `agents.defaults.pdfMaxPages`, padrão `20`).
2. Se o comprimento do texto extraído for menor que `200` chars, renderizar as páginas selecionadas como imagens PNG e incluí-las.
3. Enviar conteúdo extraído mais prompt para o modelo selecionado.

Detalhes do fallback:

- A extração de imagem de página usa um orçamento de pixels de `4.000.000`.
- Se o modelo alvo não suportar entrada de imagem e não houver texto extraível, a tool retorna erro.
- O fallback de extração requer `pdfjs-dist` (e `@napi-rs/canvas` para renderização de imagens).

## Configuração

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Veja a [Referência de Configuração](/gateway/configuration-reference) para detalhes completos dos campos.

## Detalhes de saída

A tool retorna texto em `content[0].text` e metadados estruturados em `details`.

Campos comuns de `details`:

- `model`: referência de modelo resolvida (`provedor/modelo`)
- `native`: `true` para modo nativo do provedor, `false` para fallback
- `attempts`: tentativas de fallback que falharam antes do sucesso

Campos de caminho:

- entrada de PDF único: `details.pdf`
- entradas de múltiplos PDFs: `details.pdfs[]` com entradas `pdf`
- metadados de reescrita de caminho sandbox (quando aplicável): `rewrittenFrom`

## Comportamento de erro

- Entrada PDF ausente: lança `pdf required: provide a path or URL to a PDF document`
- Muitos PDFs: retorna erro estruturado em `details.error = "too_many_pdfs"`
- Esquema de referência não suportado: retorna `details.error = "unsupported_pdf_reference"`
- Modo nativo com `pages`: lança erro claro `pages is not supported with native PDF providers`

## Exemplos

PDF único:

```json
{
  "pdf": "/tmp/relatorio.pdf",
  "prompt": "Resuma este relatório em 5 tópicos"
}
```

Múltiplos PDFs:

```json
{
  "pdfs": ["/tmp/t1.pdf", "/tmp/t2.pdf"],
  "prompt": "Compare riscos e mudanças de cronograma entre os dois documentos"
}
```

Modelo de fallback com filtro de páginas:

```json
{
  "pdf": "https://example.com/relatorio.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5-mini",
  "prompt": "Extraia apenas incidentes que afetam clientes"
}
```
