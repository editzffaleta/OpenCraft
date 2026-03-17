---
summary: "CLI de Models: list, set, aliases, fallbacks, scan, status"
read_when:
  - Adicionando ou modificando CLI de modelos (models list/set/scan/aliases/fallbacks)
  - Alterando comportamento de fallback de modelo ou UX de selecao
  - Atualizando sondas de scan de modelo (ferramentas/imagens)
title: "Models CLI"
---

# CLI de Models

Veja [/concepts/model-failover](/concepts/model-failover) para rotacao de perfil de autenticacao,
cooldowns e como isso interage com fallbacks.
Visao geral rapida de provedores + exemplos: [/concepts/model-providers](/concepts/model-providers).

## Como funciona a selecao de modelo

O OpenCraft seleciona modelos nesta ordem:

1. Modelo **primario** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** em `agents.defaults.model.fallbacks` (em ordem).
3. **Failover de autenticacao do provedor** acontece dentro de um provedor antes de mover para o
   proximo modelo.

Relacionado:

- `agents.defaults.models` e a lista de permissoes/catalogo de modelos que o OpenCraft pode usar (mais aliases).
- `agents.defaults.imageModel` e usado **somente quando** o modelo primario nao aceita imagens.
- Padroes por agente podem substituir `agents.defaults.model` via `agents.list[].model` mais bindings (veja [/concepts/multi-agent](/concepts/multi-agent)).

## Politica rapida de modelos

- Defina seu primario como o modelo mais forte da geracao mais recente disponivel para voce.
- Use fallbacks para tarefas sensiveis a custo/latencia e chats de menor importancia.
- Para agentes habilitados com ferramentas ou entradas nao confiaveis, evite niveis de modelo mais antigos/fracos.

## Onboarding (recomendado)

Se voce nao quer editar a configuracao manualmente, execute o onboarding:

```bash
opencraft onboard
```

Ele pode configurar modelo + autenticacao para provedores comuns, incluindo **assinatura OpenAI Code (Codex)**
(OAuth) e **Anthropic** (chave de API ou `claude setup-token`).

## Chaves de configuracao (visao geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.models` (lista de permissoes + aliases + parametros do provedor)
- `models.providers` (provedores personalizados gravados em `models.json`)

Refs de modelo sao normalizadas para minusculas. Aliases de provedor como `z.ai/*` normalizam
para `zai/*`.

Exemplos de configuracao de provedor (incluindo OpenCode) estao em
[/gateway/configuration](/gateway/configuration#opencode).

## "Model is not allowed" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **lista de permissoes** para `/model` e para
substituicoes de sessao. Quando um usuario seleciona um modelo que nao esta nessa lista de permissoes,
o OpenCraft retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Isso acontece **antes** de uma resposta normal ser gerada, entao a mensagem pode parecer
que "nao respondeu". A correcao e:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a lista de permissoes (remover `agents.defaults.models`), ou
- Escolher um modelo de `/model list`.

Exemplo de configuracao de lista de permissoes:

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

## Trocando modelos no chat (`/model`)

Voce pode trocar modelos para a sessao atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

Notas:

- `/model` (e `/model list`) e um seletor compacto e numerado (familia de modelo + provedores disponiveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com dropdowns de provedor e modelo mais uma etapa de Enviar.
- `/model <#>` seleciona daquele seletor.
- `/model status` e a visualizacao detalhada (candidatos de autenticacao e, quando configurado, `baseUrl` do endpoint do provedor + modo `api`).
- Refs de modelo sao analisadas dividindo no **primeiro** `/`. Use `provider/model` ao digitar `/model <ref>`.
- Se o ID do modelo contem `/` (estilo OpenRouter), voce deve incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
- Se voce omitir o provedor, o OpenCraft trata a entrada como um alias ou um modelo para o **provedor padrao** (so funciona quando nao ha `/` no ID do modelo).

Comportamento/configuracao completa do comando: [Comandos slash](/tools/slash-commands).

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

`opencraft models` (sem subcomando) e um atalho para `models status`.

### `models list`

Mostra modelos configurados por padrao. Flags uteis:

- `--all`: catalogo completo
- `--local`: apenas provedores locais
- `--provider <name>`: filtrar por provedor
- `--plain`: um modelo por linha
- `--json`: saida legivel por maquina

### `models status`

Mostra o modelo primario resolvido, fallbacks, modelo de imagem e uma visao geral de autenticacao
dos provedores configurados. Tambem exibe o status de expiracao OAuth para perfis encontrados
no armazenamento de autenticacao (avisa dentro de 24h por padrao). `--plain` imprime apenas o
modelo primario resolvido.
O status OAuth e sempre exibido (e incluido na saida `--json`). Se um provedor configurado
nao tem credenciais, `models status` imprime uma secao **Autenticacao ausente**.
JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers`
(autenticacao efetiva por provedor).
Use `--check` para automacao (sai com `1` quando ausente/expirado, `2` quando expirando).

A escolha de autenticacao depende do provedor/conta. Para hosts de Gateway sempre ativos, chaves de API geralmente sao mais previsiveis; fluxos de Token de assinatura tambem sao suportados.

Exemplo (setup-token Anthropic):

```bash
claude setup-token
opencraft models status
```

## Escaneamento (modelos gratuitos OpenRouter)

`opencraft models scan` inspeciona o **catalogo de modelos gratuitos** do OpenRouter e pode
opcionalmente sondar modelos para suporte a ferramentas e imagens.

Flags principais:

- `--no-probe`: pular sondas ao vivo (apenas metadados)
- `--min-params <b>`: tamanho minimo de parametros (bilhoes)
- `--max-age-days <days>`: pular modelos mais antigos
- `--provider <name>`: filtro de prefixo de provedor
- `--max-candidates <n>`: tamanho da lista de fallback
- `--set-default`: definir `agents.defaults.model.primary` para a primeira selecao
- `--set-image`: definir `agents.defaults.imageModel.primary` para a primeira selecao de imagem

A sondagem requer uma chave de API do OpenRouter (de perfis de autenticacao ou
`OPENROUTER_API_KEY`). Sem uma chave, use `--no-probe` para listar apenas candidatos.

Os resultados do scan sao classificados por:

1. Suporte a imagens
2. Latencia de ferramentas
3. Tamanho do contexto
4. Contagem de parametros

Entrada

- Lista `/models` do OpenRouter (filtro `:free`)
- Requer chave de API do OpenRouter de perfis de autenticacao ou `OPENROUTER_API_KEY` (veja [/environment](/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de sondagem: `--timeout`, `--concurrency`

Quando executado em um TTY, voce pode selecionar fallbacks interativamente. No modo nao interativo,
passe `--yes` para aceitar os padroes.

## Registro de modelos (`models.json`)

Provedores personalizados em `models.providers` sao gravados em `models.json` sob o
diretorio do agente (padrao `~/.opencraft/agents/<agentId>/agent/models.json`). Este arquivo
e mesclado por padrao, a menos que `models.mode` esteja definido como `replace`.

Precedencia do modo de mesclagem para IDs de provedor correspondentes:

- `baseUrl` nao vazio ja presente no `models.json` do agente vence.
- `apiKey` nao vazio no `models.json` do agente vence apenas quando aquele provedor nao e gerenciado por SecretRef no contexto atual de configuracao/perfil de autenticacao.
- Valores de `apiKey` de provedores gerenciados por SecretRef sao atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec) em vez de persistir segredos resolvidos.
- Valores de cabecalho de provedores gerenciados por SecretRef sao atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec).
- `apiKey`/`baseUrl` vazios ou ausentes do agente recorrem ao `models.providers` da configuracao.
- Outros campos do provedor sao atualizados a partir da configuracao e dados normalizados do catalogo.

A persistencia de marcadores e autoritativa pela origem: o OpenCraft grava marcadores a partir do snapshot de configuracao de origem ativa (pre-resolucao), nao de valores de segredo de runtime resolvidos.
Isso se aplica sempre que o OpenCraft regenera `models.json`, incluindo caminhos orientados por comando como `opencraft agent`.
