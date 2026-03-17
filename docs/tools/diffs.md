---
title: "Diffs"
summary: "Visualizador de diff somente leitura e renderizador de arquivo para agentes (ferramenta de Plugin opcional)"
description: "Use o Plugin opcional Diffs para renderizar texto antes e depois ou patches unificados como uma visualização de diff hospedada no Gateway, um arquivo (PNG ou PDF) ou ambos."
read_when:
  - Você quer que agentes mostrem edições de código ou markdown como diffs
  - Você quer uma URL de visualizador pronta para canvas ou um arquivo de diff renderizado
  - Você precisa de artefatos de diff temporários e controlados com padrões seguros
---

# Diffs

`diffs` é uma ferramenta de Plugin opcional com orientação de sistema integrada curta e uma Skill complementar que transforma conteúdo de alteração em um artefato de diff somente leitura para agentes.

Aceita tanto:

- texto `before` e `after`
- um `patch` unificado

Pode retornar:

- uma URL de visualizador do Gateway para apresentação em canvas
- um caminho de arquivo renderizado (PNG ou PDF) para entrega de mensagem
- ambas as saídas em uma chamada

Quando habilitado, o Plugin prepende orientação de uso concisa no espaço do system-prompt e também expõe uma Skill detalhada para casos onde o agente precisa de instruções mais completas.

## Início rápido

1. Habilite o Plugin.
2. Chame `diffs` com `mode: "view"` para fluxos com prioridade de canvas.
3. Chame `diffs` com `mode: "file"` para fluxos de entrega de arquivo via chat.
4. Chame `diffs` com `mode: "both"` quando precisar de ambos os artefatos.

## Habilitar o Plugin

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## Desabilitar orientação de sistema integrada

Se você quiser manter a ferramenta `diffs` habilitada mas desabilitar sua orientação de system-prompt integrada, defina `plugins.entries.diffs.hooks.allowPromptInjection` como `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Isso bloqueia o hook `before_prompt_build` do Plugin diffs enquanto mantém o Plugin, ferramenta e Skill complementar disponíveis.

Se você quiser desabilitar tanto a orientação quanto a ferramenta, desabilite o Plugin em vez disso.

## Fluxo de trabalho típico do agente

1. Agente chama `diffs`.
2. Agente lê campos `details`.
3. Agente:
   - abre `details.viewerUrl` com `canvas present`
   - envia `details.filePath` com `message` usando `path` ou `filePath`
   - faz ambos

## Exemplos de entrada

Antes e depois:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Referência de entrada da ferramenta

Todos os campos são opcionais a menos que indicado:

- `before` (`string`): texto original. Obrigatório com `after` quando `patch` é omitido.
- `after` (`string`): texto atualizado. Obrigatório com `before` quando `patch` é omitido.
- `patch` (`string`): texto de diff unificado. Mutuamente exclusivo com `before` e `after`.
- `path` (`string`): nome de arquivo de exibição para modo antes e depois.
- `lang` (`string`): dica de substituição de linguagem para modo antes e depois.
- `title` (`string`): substituição de título do visualizador.
- `mode` (`"view" | "file" | "both"`): modo de saída. Padrão é o padrão do Plugin `defaults.mode`.
- `theme` (`"light" | "dark"`): tema do visualizador. Padrão é o padrão do Plugin `defaults.theme`.
- `layout` (`"unified" | "split"`): layout do diff. Padrão é o padrão do Plugin `defaults.layout`.
- `expandUnchanged` (`boolean`): expandir seções inalteradas quando contexto completo está disponível. Opção apenas por chamada (não é uma chave padrão do Plugin).
- `fileFormat` (`"png" | "pdf"`): formato de arquivo renderizado. Padrão é o padrão do Plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): preset de qualidade para renderização PNG ou PDF.
- `fileScale` (`number`): substituição de escala do dispositivo (`1`-`4`).
- `fileMaxWidth` (`number`): largura máxima de renderização em pixels CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL do artefato do visualizador em segundos. Padrão 1800, máximo 21600.
- `baseUrl` (`string`): substituição de origem da URL do visualizador. Deve ser `http` ou `https`, sem query/hash.

Validação e limites:

- `before` e `after` cada um com máximo de 512 KiB.
- `patch` máximo de 2 MiB.
- `path` máximo de 2048 bytes.
- `lang` máximo de 128 bytes.
- `title` máximo de 1024 bytes.
- Limite de complexidade de patch: máximo de 128 arquivos e 120000 linhas totais.
- `patch` e `before` ou `after` juntos são rejeitados.
- Limites de segurança de arquivo renderizado (aplicam-se a PNG e PDF):
  - `fileQuality: "standard"`: máximo 8 MP (8.000.000 pixels renderizados).
  - `fileQuality: "hq"`: máximo 14 MP (14.000.000 pixels renderizados).
  - `fileQuality: "print"`: máximo 24 MP (24.000.000 pixels renderizados).
  - PDF também tem máximo de 50 páginas.

## Contrato de detalhes de saída

A ferramenta retorna metadados estruturados em `details`.

Campos compartilhados para modos que criam um visualizador:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`

Campos de arquivo quando PNG ou PDF é renderizado:

- `filePath`
- `path` (mesmo valor que `filePath`, para compatibilidade com ferramenta de mensagem)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Resumo de comportamento por modo:

- `mode: "view"`: apenas campos do visualizador.
- `mode: "file"`: apenas campos de arquivo, sem artefato de visualizador.
- `mode: "both"`: campos do visualizador mais campos de arquivo. Se a renderização de arquivo falhar, o visualizador ainda retorna com `fileError`.

## Seções inalteradas colapsadas

- O visualizador pode mostrar linhas como `N unmodified lines`.
- Controles de expansão nessas linhas são condicionais e não garantidos para todo tipo de entrada.
- Controles de expansão aparecem quando o diff renderizado tem dados de contexto expansíveis, o que é típico para entrada antes e depois.
- Para muitas entradas de patch unificado, corpos de contexto omitidos não estão disponíveis nos hunks parseados, então a linha pode aparecer sem controles de expansão. Isso é comportamento esperado.
- `expandUnchanged` se aplica apenas quando contexto expansível existe.

## Padrões do Plugin

Defina padrões do Plugin em `~/.editzffaleta/OpenCraft.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

Padrões suportados:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

Parâmetros explícitos da ferramenta substituem esses padrões.

## Config de segurança

- `security.allowRemoteViewer` (`boolean`, padrão `false`)
  - `false`: requisições não-loopback para rotas do visualizador são negadas.
  - `true`: visualizadores remotos são permitidos se o caminho tokenizado for válido.

Exemplo:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Ciclo de vida e armazenamento de artefatos

- Artefatos são armazenados na subpasta temporária: `$TMPDIR/opencraft-diffs`.
- Metadados de artefato do visualizador contêm:
  - id de artefato aleatório (20 caracteres hex)
  - Token aleatório (48 caracteres hex)
  - `createdAt` e `expiresAt`
  - caminho de `viewer.html` armazenado
- TTL padrão do visualizador é 30 minutos quando não especificado.
- TTL máximo aceito do visualizador é 6 horas.
- Limpeza executa oportunisticamente após criação de artefato.
- Artefatos expirados são excluídos.
- Limpeza de fallback remove pastas obsoletas com mais de 24 horas quando metadados estão ausentes.

## URL do visualizador e comportamento de rede

Rota do visualizador:

- `/plugins/diffs/view/{artifactId}/{token}`

Assets do visualizador:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Comportamento de construção de URL:

- Se `baseUrl` for fornecido, é usado após validação estrita.
- Sem `baseUrl`, URL do visualizador usa loopback `127.0.0.1` por padrão.
- Se o modo de bind do Gateway for `custom` e `gateway.customBindHost` estiver definido, esse host é usado.

Regras do `baseUrl`:

- Deve ser `http://` ou `https://`.
- Query e hash são rejeitados.
- Origem mais caminho base opcional é permitido.

## Modelo de segurança

Endurecimento do visualizador:

- Apenas loopback por padrão.
- Caminhos tokenizados do visualizador com validação estrita de ID e Token.
- CSP da resposta do visualizador:
  - `default-src 'none'`
  - scripts e assets apenas de self
  - sem `connect-src` de saída
- Limitação de falhas remotas quando acesso remoto está habilitado:
  - 40 falhas por 60 segundos
  - lockout de 60 segundos (`429 Too Many Requests`)

Endurecimento de renderização de arquivo:

- Roteamento de requisição do browser de screenshot é deny-por-padrão.
- Apenas assets locais do visualizador de `http://127.0.0.1/plugins/diffs/assets/*` são permitidos.
- Requisições de rede externas são bloqueadas.

## Requisitos de browser para modo arquivo

`mode: "file"` e `mode: "both"` precisam de um browser compatível com Chromium.

Ordem de resolução:

1. `browser.executablePath` na config do OpenCraft.
2. Variáveis de ambiente:
   - `OPENCRAFT_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Fallback de descoberta de comando/caminho da plataforma.

Texto de falha comum:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrija instalando Chrome, Chromium, Edge ou Brave, ou definindo uma das opções de caminho de executável acima.

## Solução de problemas

Erros de validação de entrada:

- `Provide patch or both before and after text.`
  - Inclua ambos `before` e `after`, ou forneça `patch`.
- `Provide either patch or before/after input, not both.`
  - Não misture modos de entrada.
- `Invalid baseUrl: ...`
  - Use origem `http(s)` com caminho opcional, sem query/hash.
- `{field} exceeds maximum size (...)`
  - Reduza o tamanho do payload.
- Rejeição de patch grande
  - Reduza a contagem de arquivos ou total de linhas do patch.

Problemas de acessibilidade do visualizador:

- URL do visualizador resolve para `127.0.0.1` por padrão.
- Para cenários de acesso remoto:
  - passe `baseUrl` por chamada de ferramenta, ou
  - use `gateway.bind=custom` e `gateway.customBindHost`
- Habilite `security.allowRemoteViewer` apenas quando pretender acesso externo ao visualizador.

Linha de linhas inalteradas sem botão de expansão:

- Isso pode acontecer para entrada de patch quando o patch não carrega contexto expansível.
- Isso é esperado e não indica falha do visualizador.

Artefato não encontrado:

- Artefato expirou pelo TTL.
- Token ou caminho mudou.
- Limpeza removeu dados obsoletos.

## Orientação operacional

- Prefira `mode: "view"` para revisões interativas locais em canvas.
- Prefira `mode: "file"` para canais de chat de saída que precisam de anexo.
- Mantenha `allowRemoteViewer` desabilitado a menos que sua implantação requeira URLs remotas de visualizador.
- Defina `ttlSeconds` curtos explícitos para diffs sensíveis.
- Evite enviar segredos na entrada de diff quando não necessário.
- Se seu canal comprime imagens agressivamente (por exemplo Telegram ou WhatsApp), prefira saída PDF (`fileFormat: "pdf"`).

Motor de renderização de diff:

- Desenvolvido por [Diffs](https://diffs.com).

## Documentação relacionada

- [Visão geral de ferramentas](/tools)
- [Plugins](/tools/plugin)
- [Browser](/tools/browser)
