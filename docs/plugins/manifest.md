---
summary: "Manifesto de Plugin + requisitos de JSON schema (validação estrita de config)"
read_when:
  - Você está construindo um Plugin para o OpenCraft
  - Você precisa enviar um schema de config de Plugin ou depurar erros de validação de Plugin
title: "Plugin Manifest"
---

# Manifesto de Plugin (opencraft.plugin.json)

Esta página é apenas para o **manifesto nativo de Plugin do OpenCraft**.

Para layouts de bundle compatíveis, veja [Bundles de Plugin](/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem manifesto
- Bundle Cursor: `.cursor-plugin/plugin.json`

O OpenCraft também detecta automaticamente esses layouts de bundle, mas eles não são validados
contra o schema `opencraft.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenCraft atualmente lê metadados do bundle mais raízes de Skill
declaradas, raízes de comando Claude, padrões de `settings.json` do bundle Claude, e
pacotes de hook suportados quando o layout corresponde às expectativas de runtime do OpenCraft.

Todo Plugin nativo do OpenCraft **deve** enviar um arquivo `opencraft.plugin.json` na
**raiz do Plugin**. O OpenCraft usa este manifesto para validar configuração
**sem executar código do Plugin**. Manifestos ausentes ou inválidos são tratados como
erros de Plugin e bloqueiam a validação de config.

Veja o guia completo do sistema de Plugins: [Plugins](/tools/plugin).

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

- `id` (string): id canônico do Plugin.
- `configSchema` (object): JSON Schema para config do Plugin (inline).

Chaves opcionais:

- `kind` (string): tipo de Plugin (exemplos: `"memory"`, `"context-engine"`).
- `channels` (array): ids de canal registrados por este Plugin (exemplo: `["matrix"]`).
- `providers` (array): ids de provedor registrados por este Plugin.
- `providerAuthEnvVars` (object): variáveis de ambiente de autenticação organizadas por id de provedor. Use quando
  o OpenCraft deve resolver credenciais de provedor do ambiente sem carregar
  o runtime do Plugin primeiro.
- `providerAuthChoices` (array): metadados baratos de onboarding/escolha de autenticação organizados por
  provedor + método de autenticação. Use quando o OpenCraft deve mostrar um provedor em
  seletores de escolha de autenticação, resolução de provedor preferido, e ajuda do CLI sem
  carregar o runtime do Plugin primeiro.
- `skills` (array): diretórios de Skill para carregar (relativos à raiz do Plugin).
- `name` (string): nome de exibição do Plugin.
- `description` (string): resumo curto do Plugin.
- `uiHints` (object): rótulos/placeholders/flags de sensibilidade de campos de config para renderização na interface.
- `version` (string): versão do Plugin (informativa).

### Formato de `providerAuthChoices`

Cada entrada pode declarar:

- `provider`: id do provedor
- `method`: id do método de autenticação
- `choiceId`: id estável de onboarding/escolha de autenticação
- `choiceLabel` / `choiceHint`: rótulo do seletor + dica curta
- `groupId` / `groupLabel` / `groupHint`: metadados de agrupamento de onboarding
- `optionKey` / `cliFlag` / `cliOption` / `cliDescription`: fiação opcional de flag única
  no CLI para fluxos de autenticação simples como API keys

Exemplo:

```json
{
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key"
    }
  ]
}
```

## Requisitos de JSON Schema

- **Todo Plugin deve enviar um JSON Schema**, mesmo que não aceite config.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/escrita do config, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o id de canal seja declarado por
  um manifesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, e `plugins.slots.*`
  devem referenciar ids de Plugin **descobríveis**. IDs desconhecidos são **erros**.
- Se um Plugin está instalado mas tem um manifesto ou schema quebrado ou ausente,
  a validação falha e o Doctor reporta o erro do Plugin.
- Se config de Plugin existe mas o Plugin está **desabilitado**, o config é mantido e
  um **aviso** é exibido no Doctor + logs.

## Notas

- O manifesto é **obrigatório para Plugins nativos do OpenCraft**, incluindo carregamentos do sistema de arquivos local.
- O runtime ainda carrega o módulo do Plugin separadamente; o manifesto é apenas para
  descoberta + validação.
- `providerAuthEnvVars` é o caminho barato de metadados para sondagens de autenticação, validação de
  marcadores de ambiente, e superfícies similares de autenticação de provedor que não devem iniciar o runtime do Plugin
  apenas para inspecionar nomes de variáveis de ambiente.
- `providerAuthChoices` é o caminho barato de metadados para seletores de escolha de autenticação,
  resolução de `--auth-choice`, mapeamento de provedor preferido, e registro simples de
  flag de CLI de onboarding antes do carregamento do runtime do provedor.
- Tipos exclusivos de Plugin são selecionados através de `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` embutido).
- Se seu Plugin depende de módulos nativos, documente os passos de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).
