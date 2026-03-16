---
title: "Diffs"
summary: "Visualizador de diff somente leitura e renderizador de arquivo para agentes (tool de plugin opcional)"
description: "Use o plugin Diffs opcional para renderizar texto antes e depois ou patches unificados como uma visualização de diff hospedada no gateway, um arquivo (PNG ou PDF), ou ambos."
read_when:
  - Você quer que agentes mostrem edições de código ou markdown como diffs
  - Você quer uma URL de visualizador pronta para canvas ou um arquivo de diff renderizado
  - Você precisa de artefatos de diff temporários controlados com padrões seguros
---

# Diffs

`diffs` é uma tool de plugin opcional com orientação embutida concisa no sistema e uma skill complementar que transforma conteúdo de mudanças em um artefato de diff somente leitura para agentes.

Aceita:

- texto `before` e `after`
- um `patch` unificado

Pode retornar:

- uma URL de visualizador do gateway para apresentação no canvas
- um caminho de arquivo renderizado (PNG ou PDF) para entrega por mensagem
- ambas as saídas em uma única chamada

Quando habilitado, o plugin insere orientação de uso concisa no espaço do prompt do sistema e também expõe uma skill detalhada para casos em que o agente precisa de instruções mais completas.

## Início rápido

1. Habilite o plugin.
2. Chame `diffs` com `mode: "view"` para fluxos com canvas primeiro.
3. Chame `diffs` com `mode: "file"` para fluxos de entrega de arquivo por chat.
4. Chame `diffs` com `mode: "both"` quando precisar de ambos os artefatos.

## Habilitar o plugin

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

## Desabilitar orientação embutida do sistema

Se você quiser manter a tool `diffs` habilitada mas desabilitar sua orientação embutida no prompt do sistema, defina `plugins.entries.diffs.hooks.allowPromptInjection` como `false`:

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

Isso bloqueia o hook `before_prompt_build` do plugin diffs mantendo o plugin, a tool e a skill complementar disponíveis.

Se você quiser desabilitar tanto a orientação quanto a tool, desative o plugin.

## Fluxo típico do agente

1. Agente chama `diffs`.
2. Agente lê os campos `details`.
3. Agente:
   - abre `details.viewerUrl` com `canvas present`
   - envia `details.filePath` com `message` usando `path` ou `filePath`
   - faz ambos

## Exemplos de entrada

Antes e depois:

```json
{
  "before": "# Olá\n\nUm",
  "after": "# Olá\n\nDois",
  "path": "docs/exemplo.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/exemplo.ts b/src/exemplo.ts\n--- a/src/exemplo.ts\n+++ b/src/exemplo.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Referência de entrada da tool

Todos os campos são opcionais a menos que indicado:

- `before` (`string`): texto original. Obrigatório com `after` quando `patch` é omitido.
- `after` (`string`): texto atualizado. Obrigatório com `before` quando `patch` é omitido.
- `patch` (`string`): texto de diff unificado. Mutuamente exclusivo com `before` e `after`.
- `path` (`string`): nome de arquivo de exibição para o modo before e after.
- `lang` (`string`): dica de override de linguagem para o modo before e after.
- `title` (`string`): override do título do visualizador.
- `mode` (`"view" | "file" | "both"`): modo de saída. Padrão é `defaults.mode` do plugin.
- `theme` (`"light" | "dark"`): tema do visualizador. Padrão é `defaults.theme` do plugin.
- `layout` (`"unified" | "split"`): layout do diff. Padrão é `defaults.layout` do plugin.
- `expandUnchanged` (`boolean`): expandir seções sem alterações quando contexto completo disponível. Opção apenas por chamada (não é chave de padrão do plugin).
- `fileFormat` (`"png" | "pdf"`): formato do arquivo renderizado. Padrão é `defaults.fileFormat` do plugin.
- `fileQuality` (`"standard" | "hq" | "print"`): preset de qualidade para renderização PNG ou PDF.
- `fileScale` (`number`): override de escala do dispositivo (`1`-`4`).
- `fileMaxWidth` (`number`): largura máxima de renderização em pixels CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL do artefato do visualizador em segundos. Padrão 1800, máx 21600.
- `baseUrl` (`string`): override de origem da URL do visualizador. Deve ser `http` ou `https`, sem query/hash.

Validação e limites:

- `before` e `after` cada um com máx de 512 KiB.
- `patch` máx de 2 MiB.
- `path` máx de 2048 bytes.
- `lang` máx de 128 bytes.
- `title` máx de 1024 bytes.
- Limite de complexidade do patch: máx de 128 arquivos e 120000 linhas no total.
- `patch` e `before` ou `after` juntos são rejeitados.
- Limites de segurança para arquivos renderizados (aplicam-se a PNG e PDF):
  - `fileQuality: "standard"`: máx de 8 MP (8.000.000 pixels renderizados).
  - `fileQuality: "hq"`: máx de 14 MP (14.000.000 pixels renderizados).
  - `fileQuality: "print"`: máx de 24 MP (24.000.000 pixels renderizados).
  - PDF também tem máx de 50 páginas.

## Contrato de detalhes de saída

A tool retorna metadados estruturados em `details`.

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
- `path` (mesmo valor que `filePath`, para compatibilidade com a tool message)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Resumo de comportamento por modo:

- `mode: "view"`: apenas campos do visualizador.
- `mode: "file"`: apenas campos de arquivo, sem artefato de visualizador.
- `mode: "both"`: campos do visualizador mais campos de arquivo. Se a renderização de arquivo falhar, o visualizador ainda retorna com `fileError`.

## Seções de linhas sem alterações colapsadas

- O visualizador pode mostrar linhas como `N linhas não modificadas`.
- Controles de expansão nessas linhas são condicionais e não garantidos para todo tipo de entrada.
- Controles de expansão aparecem quando o diff renderizado tem dados de contexto expansíveis, o que é típico para entrada before e after.
- Para muitas entradas de patch unificado, corpos de contexto omitidos não estão disponíveis nos hunks do patch analisado, portanto a linha pode aparecer sem controles de expansão. Este é o comportamento esperado.
- `expandUnchanged` aplica-se apenas quando contexto expansível existe.

## Padrões do plugin

Defina padrões para todo o plugin em `~/.opencraft/opencraft.json`:

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

Parâmetros explícitos da tool sobrescrevem esses padrões.

## Configuração de segurança

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

- Artefatos são armazenados na subpasta temp: `$TMPDIR/openclaw-diffs`.
- Metadados do artefato do visualizador contém:
  - ID de artefato aleatório (20 chars hex)
  - token aleatório (48 chars hex)
  - `createdAt` e `expiresAt`
  - caminho `viewer.html` armazenado
- TTL padrão do visualizador é 30 minutos quando não especificado.
- TTL máximo aceito do visualizador é 6 horas.
- Limpeza é executada oportunisticamente após a criação do artefato.
- Artefatos expirados são deletados.
- Limpeza de fallback remove pastas antigas há mais de 24 horas quando metadados estão ausentes.

## URL do visualizador e comportamento de rede

Rota do visualizador:

- `/plugins/diffs/view/{artifactId}/{token}`

Assets do visualizador:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Comportamento de construção de URL:

- Se `baseUrl` for fornecido, é usado após validação estrita.
- Sem `baseUrl`, a URL do visualizador padrão é loopback `127.0.0.1`.
- Se o modo de bind do gateway for `custom` e `gateway.customBindHost` estiver definido, esse host é usado.

Regras de `baseUrl`:

- Deve ser `http://` ou `https://`.
- Query e hash são rejeitados.
- Origem mais caminho base opcional é permitido.

## Modelo de segurança

Hardening do visualizador:

- Somente loopback por padrão.
- Caminhos de visualizador tokenizados com validação estrita de ID e token.
- CSP da resposta do visualizador:
  - `default-src 'none'`
  - scripts e assets apenas de self
  - sem `connect-src` de saída
- Throttling de miss remoto quando acesso remoto está habilitado:
  - 40 falhas por 60 segundos
  - bloqueio de 60 segundos (`429 Too Many Requests`)

Hardening de renderização de arquivo:

- Roteamento de requisição do browser de screenshot é negado por padrão.
- Apenas assets do visualizador local de `http://127.0.0.1/plugins/diffs/assets/*` são permitidos.
- Requisições de rede externas são bloqueadas.

## Requisitos de browser para modo arquivo

`mode: "file"` e `mode: "both"` precisam de um browser compatível com Chromium.

Ordem de resolução:

1. `browser.executablePath` na configuração do OpenCraft.
2. Variáveis de ambiente:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Fallback de descoberta de comando/caminho de plataforma.

Texto comum de falha:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrija instalando Chrome, Chromium, Edge ou Brave, ou definindo uma das opções de caminho de executável acima.

## Solução de problemas

Erros de validação de entrada:

- `Provide patch or both before and after text.`
  - Inclua tanto `before` quanto `after`, ou forneça `patch`.
- `Provide either patch or before/after input, not both.`
  - Não misture modos de entrada.
- `Invalid baseUrl: ...`
  - Use origem `http(s)` com caminho opcional, sem query/hash.
- `{field} exceeds maximum size (...)`
  - Reduza o tamanho do payload.
- Rejeição de patch grande
  - Reduza a contagem de arquivos do patch ou o total de linhas.

Problemas de acessibilidade do visualizador:

- URL do visualizador resolve para `127.0.0.1` por padrão.
- Para cenários de acesso remoto:
  - passe `baseUrl` por chamada de tool, ou
  - use `gateway.bind=custom` e `gateway.customBindHost`
- Habilite `security.allowRemoteViewer` apenas quando você pretende acesso externo ao visualizador.

Linha de linhas não modificadas sem botão de expansão:

- Isso pode acontecer para entrada de patch quando o patch não carrega contexto expansível.
- Este é o comportamento esperado e não indica falha do visualizador.

Artefato não encontrado:

- Artefato expirou devido ao TTL.
- Token ou caminho mudou.
- Limpeza removeu dados obsoletos.

## Orientação operacional

- Prefira `mode: "view"` para revisões interativas locais no canvas.
- Prefira `mode: "file"` para canais de chat de saída que precisam de um anexo.
- Mantenha `allowRemoteViewer` desabilitado a menos que seu deployment exija URLs de visualizador remotas.
- Defina `ttlSeconds` curto explícito para diffs sensíveis.
- Evite enviar segredos na entrada de diff quando não necessário.
- Se seu canal comprime imagens agressivamente (por exemplo Telegram ou WhatsApp), prefira saída PDF (`fileFormat: "pdf"`).

Motor de renderização de diff:

- Powered by [Diffs](https://diffs.com).

## Documentação relacionada

- [Visão geral de tools](/tools)
- [Plugins](/tools/plugin)
- [Browser](/tools/browser)
