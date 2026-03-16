---
summary: "CLI de Modelos: listar, definir, aliases, fallbacks, scan, status"
read_when:
  - Adicionando ou modificando CLI de modelos (models list/set/scan/aliases/fallbacks)
  - Alterando comportamento de fallback de modelo ou UX de seleção
  - Atualizando probes de scan de modelo (ferramentas/imagens)
title: "CLI de Modelos"
---

# CLI de Modelos

Veja [/concepts/model-failover](/concepts/model-failover) para rotação de perfil de auth,
cooldowns e como isso interage com fallbacks.
Visão geral rápida de provedores + exemplos: [/concepts/model-providers](/concepts/model-providers).

## Como funciona a seleção de modelo

O OpenCraft seleciona modelos nesta ordem:

1. Modelo **primário** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** em `agents.defaults.model.fallbacks` (em ordem).
3. **Failover de auth do provedor** acontece dentro de um provedor antes de mover para o
   próximo modelo.

Relacionado:

- `agents.defaults.models` é a allowlist/catálogo de modelos que o OpenCraft pode usar (mais aliases).
- `agents.defaults.imageModel` é usado **apenas quando** o modelo primário não aceita imagens.
- Padrões por agente podem sobrescrever `agents.defaults.model` via `agents.list[].model` mais bindings (veja [/concepts/multi-agent](/concepts/multi-agent)).

## Política rápida de modelo

- Defina seu primário para o modelo de última geração mais forte disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e chats de menor risco.
- Para agentes com ferramentas habilitadas ou entradas não confiáveis, evite tiers de modelo mais antigos/fracos.

## Assistente de configuração (recomendado)

Se você não quiser editar config manualmente, rode o assistente de onboarding:

```bash
opencraft onboard
```

Ele pode configurar modelo + auth para provedores comuns, incluindo **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (chave de API ou `claude setup-token`).

## Chaves de config (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + params de provedor)
- `models.providers` (provedores customizados escritos em `models.json`)

Refs de modelo são normalizadas para minúsculas. Aliases de provedor como `z.ai/*` normalizam
para `zai/*`.

Exemplos de configuração de provedor (incluindo OpenCode) ficam em
[/gateway/configuration](/gateway/configuration#opencode).

## "Model is not allowed" (e por que respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e para
overrides de sessão. Quando um usuário seleciona um modelo que não está nessa allowlist,
o OpenCraft retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode parecer
que "não respondeu". A correção é:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a allowlist (remover `agents.defaults.models`), ou
- Escolher um modelo de `/model list`.

Exemplo de config de allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-5" },
    models: {
      "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Trocar modelos no chat (`/model`)

Você pode trocar modelos para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

Notas:

- `/model` (e `/model list`) é um seletor compacto e numerado (família de modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com dropdowns de provedor e modelo mais uma etapa de Submit.
- `/model <#>` seleciona a partir desse seletor.
- `/model status` é a visão detalhada (candidatos de auth e, quando configurado, `baseUrl` + modo `api` do endpoint do provedor).
- Refs de modelo são analisadas dividindo no **primeiro** `/`. Use `provider/model` ao digitar `/model <ref>`.
- Se o ID do modelo em si contiver `/` (estilo OpenRouter), você deve incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenCraft trata a entrada como um alias ou um modelo para o **provedor padrão** (funciona apenas quando não há `/` no ID do modelo).

Comportamento/config completo do comando: [Comandos slash](/tools/slash-commands).

## Comandos CLI

```bash
opencraft models list
opencraft models status
opencraft models set <provider/model>
opencraft models set-image <provider/model>

opencraft models aliases list
opencraft models aliases add <alias> <provider/model>
opencraft models aliases remove <alias>

opencraft models fallbacks list
opencraft models fallbacks add <provider/model>
opencraft models fallbacks remove <provider/model>
opencraft models fallbacks clear

opencraft models image-fallbacks list
opencraft models image-fallbacks add <provider/model>
opencraft models image-fallbacks remove <provider/model>
opencraft models image-fallbacks clear
```

`opencraft models` (sem subcomando) é um atalho para `models status`.

### `models list`

Mostra modelos configurados por padrão. Flags úteis:

- `--all`: catálogo completo
- `--local`: apenas provedores locais
- `--provider <name>`: filtrar por provedor
- `--plain`: um modelo por linha
- `--json`: saída legível por máquina

### `models status`

Mostra o modelo primário resolvido, fallbacks, modelo de imagem e uma visão geral de auth
dos provedores configurados. Também mostra o status de expiração OAuth para perfis encontrados
no armazenamento de auth (avisa dentro de 24h por padrão). `--plain` imprime apenas o
modelo primário resolvido.
O status OAuth é sempre mostrado (e incluído na saída `--json`). Se um provedor configurado
não tiver credenciais, `models status` imprime uma seção **Missing auth**.
JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers`
(auth efetiva por provedor).
Use `--check` para automação (sai `1` quando ausente/expirado, `2` quando expirando).

A escolha de auth depende do provedor/conta. Para hosts de gateway sempre ligados, chaves de API são geralmente as mais previsíveis; fluxos de token de assinatura também são suportados.

Exemplo (Anthropic setup-token):

```bash
claude setup-token
opencraft models status
```

## Scanning (modelos gratuitos do OpenRouter)

`opencraft models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode
opcionalmente sondar modelos para suporte a ferramentas e imagens.

Flags principais:

- `--no-probe`: pular sondas ao vivo (apenas metadados)
- `--min-params <b>`: tamanho mínimo de parâmetros (bilhões)
- `--max-age-days <days>`: pular modelos mais antigos
- `--provider <name>`: filtro de prefixo de provedor
- `--max-candidates <n>`: tamanho da lista de fallback
- `--set-default`: define `agents.defaults.model.primary` para a primeira seleção
- `--set-image`: define `agents.defaults.imageModel.primary` para a primeira seleção de imagem

A sondagem requer uma chave de API do OpenRouter (de perfis de auth ou
`OPENROUTER_API_KEY`). Sem chave, use `--no-probe` para listar apenas candidatos.

Resultados do scan são classificados por:

1. Suporte a imagem
2. Latência de ferramenta
3. Tamanho de contexto
4. Contagem de parâmetros

Entrada

- Lista `/models` do OpenRouter (filtrar `:free`)
- Requer chave de API do OpenRouter de perfis de auth ou `OPENROUTER_API_KEY` (veja [/environment](/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de sonda: `--timeout`, `--concurrency`

Quando rodado em um TTY, você pode selecionar fallbacks interativamente. Em modo
não-interativo, passe `--yes` para aceitar os padrões.

## Registro de modelos (`models.json`)

Provedores customizados em `models.providers` são escritos em `models.json` no
diretório do agente (padrão `~/.opencraft/agents/<agentId>/agent/models.json`). Este arquivo
é mesclado por padrão a não ser que `models.mode` seja definido como `replace`.

Precedência do modo de mesclagem para IDs de provedor correspondentes:

- `baseUrl` não-vazio já presente no agente `models.json` vence.
- `apiKey` não-vazio no agente `models.json` vence apenas quando esse provedor não é SecretRef-gerenciado no contexto atual de config/auth-profile.
- Valores de `apiKey` de provedor SecretRef-gerenciado são atualizados de marcadores de fonte (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec) em vez de persistir segredos resolvidos.
- Valores de header de provedor SecretRef-gerenciado são atualizados de marcadores de fonte (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec).
- `apiKey`/`baseUrl` do agente vazio ou ausente faz fallback para `models.providers` de config.
- Outros campos de provedor são atualizados de dados normalizados de config e catálogo.

A persistência de marcador é autoritativa pela fonte: o OpenCraft escreve marcadores do snapshot de config fonte ativa (pré-resolução), não de valores de segredo de runtime resolvidos.
Isso se aplica sempre que o OpenCraft regenera `models.json`, incluindo caminhos acionados por comando como `opencraft agent`.
