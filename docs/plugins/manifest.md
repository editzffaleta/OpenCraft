---
summary: "Manifesto de plugin + requisitos de schema JSON (validação estrita de config)"
read_when:
  - Você está construindo um plugin OpenCraft
  - Você precisa incluir um schema de config de plugin ou depurar erros de validação de plugin
title: "Manifesto de Plugin"
---

# Manifesto de plugin (openclaw.plugin.json)

Todo plugin **deve** incluir um arquivo `openclaw.plugin.json` na **raiz do plugin**.
O OpenCraft usa este manifesto para validar a configuração **sem executar o
código do plugin**. Manifestos ausentes ou inválidos são tratados como erros de plugin e bloqueiam
a validação de config.

Veja o guia completo do sistema de plugins: [Plugins](/tools/plugin).

## Campos obrigatórios

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Chaves obrigatórias:

- `id` (string): id canônico do plugin.
- `configSchema` (object): Schema JSON para a config do plugin (inline).

Chaves opcionais:

- `kind` (string): tipo do plugin (exemplos: `"memory"`, `"context-engine"`).
- `channels` (array): ids de canal registrados por este plugin (exemplo: `["matrix"]`).
- `providers` (array): ids de provedor registrados por este plugin.
- `skills` (array): diretórios de skill a carregar (relativos à raiz do plugin).
- `name` (string): nome de exibição do plugin.
- `description` (string): resumo curto do plugin.
- `uiHints` (object): labels/placeholders/flags de sensibilidade de campo de config para renderização de UI.
- `version` (string): versão do plugin (informacional).

## Requisitos de Schema JSON

- **Todo plugin deve incluir um Schema JSON**, mesmo que não aceite config.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/escrita de config, não em runtime.

## Comportamento de validação

- Chaves desconhecidas de `channels.*` são **erros**, a menos que o id de canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar ids de plugin **descobríveis**. Ids desconhecidos são **erros**.
- Se um plugin está instalado mas tem manifesto ou schema quebrado ou ausente,
  a validação falha e o Doctor reporta o erro do plugin.
- Se a config do plugin existe mas o plugin está **desabilitado**, a config é mantida e
  um **aviso** é exibido no Doctor + logs.

## Notas

- O manifesto é **obrigatório para todos os plugins**, incluindo carregamentos do sistema de arquivos local.
- O runtime ainda carrega o módulo do plugin separadamente; o manifesto é apenas para
  descoberta + validação.
- Tipos exclusivos de plugin são selecionados através de `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` embutido).
- Se seu plugin depende de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, `allow-build-scripts` do pnpm -
  `pnpm rebuild <pacote>`).
