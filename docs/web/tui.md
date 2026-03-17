---
summary: "TUI (Terminal UI): conecte-se ao Gateway de qualquer máquina"
read_when:
  - Você quer um passo a passo amigável para iniciantes sobre a TUI
  - Você precisa da lista completa de funcionalidades, comandos e atalhos da TUI
title: "TUI"
---

# TUI (Terminal UI)

## Início rápido

1. Inicie o Gateway.

```bash
opencraft gateway
```

2. Abra a TUI.

```bash
opencraft tui
```

3. Digite uma mensagem e pressione Enter.

Gateway remoto:

```bash
opencraft tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` se seu Gateway usa autenticação por senha.

## O que você vê

- Cabeçalho: URL de conexão, agente atual, sessão atual.
- Log de chat: mensagens do usuário, respostas do assistente, avisos do sistema, cartões de ferramentas.
- Linha de status: estado de conexão/execução (conectando, executando, transmitindo, ocioso, erro).
- Rodapé: estado de conexão + agente + sessão + modelo + think/fast/verbose/reasoning + contagem de Tokens + entrega.
- Entrada: editor de texto com autocompletar.

## Modelo mental: agentes + sessões

- Agentes são slugs únicos (ex.: `main`, `research`). O Gateway expõe a lista.
- Sessões pertencem ao agente atual.
- Chaves de sessão são armazenadas como `agent:<agentId>:<sessionKey>`.
  - Se você digitar `/session main`, a TUI expande para `agent:<currentAgent>:main`.
  - Se você digitar `/session agent:other:main`, você troca para aquela sessão de agente explicitamente.
- Escopo de sessão:
  - `per-sender` (padrão): cada agente tem muitas sessões.
  - `global`: a TUI sempre usa a sessão `global` (o seletor pode estar vazio).
- O agente + sessão atual estão sempre visíveis no rodapé.

## Envio + entrega

- Mensagens são enviadas ao Gateway; a entrega para provedores está desligada por padrão.
- Ativar entrega:
  - `/deliver on`
  - ou o painel de Configurações
  - ou inicie com `opencraft tui --deliver`

## Seletores + overlays

- Seletor de modelo: listar modelos disponíveis e definir a sobrescrita da sessão.
- Seletor de agente: escolher um agente diferente.
- Seletor de sessão: mostra apenas sessões do agente atual.
- Configurações: alternar entrega, expansão de saída de ferramentas e visibilidade de thinking.

## Atalhos de teclado

- Enter: enviar mensagem
- Esc: abortar execução ativa
- Ctrl+C: limpar entrada (pressione duas vezes para sair)
- Ctrl+D: sair
- Ctrl+L: seletor de modelo
- Ctrl+G: seletor de agente
- Ctrl+P: seletor de sessão
- Ctrl+O: alternar expansão de saída de ferramentas
- Ctrl+T: alternar visibilidade de thinking (recarrega histórico)

## Comandos slash

Principais:

- `/help`
- `/status`
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Controles de sessão:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Ciclo de vida da sessão:

- `/new` ou `/reset` (resetar a sessão)
- `/abort` (abortar a execução ativa)
- `/settings`
- `/exit`

Outros comandos slash do Gateway (por exemplo, `/context`) são encaminhados ao Gateway e exibidos como saída do sistema. Veja [Comandos slash](/tools/slash-commands).

## Comandos de shell local

- Prefixe uma linha com `!` para executar um comando de shell local no host da TUI.
- A TUI solicita uma vez por sessão para permitir execução local; recusar mantém `!` desabilitado para a sessão.
- Comandos rodam em um shell novo, não interativo, no diretório de trabalho da TUI (sem `cd`/env persistente).
- Comandos de shell local recebem `OPENCRAFT_SHELL=tui-local` no seu ambiente.
- Um `!` sozinho é enviado como mensagem normal; espaços iniciais não ativam exec local.

## Saída de ferramentas

- Chamadas de ferramentas aparecem como cartões com argumentos + resultados.
- Ctrl+O alterna entre visualizações recolhidas/expandidas.
- Enquanto ferramentas executam, atualizações parciais são transmitidas no mesmo cartão.

## Cores do terminal

- A TUI mantém o texto do corpo do assistente na cor de primeiro plano padrão do seu terminal para que terminais escuros e claros permaneçam legíveis.
- Se seu terminal usa fundo claro e a detecção automática está errada, defina `OPENCRAFT_THEME=light` antes de iniciar `opencraft tui`.
- Para forçar a paleta escura original, defina `OPENCRAFT_THEME=dark`.

## Histórico + streaming

- Ao conectar, a TUI carrega o histórico mais recente (200 mensagens por padrão).
- Respostas em streaming atualizam no local até serem finalizadas.
- A TUI também escuta eventos de ferramentas do agente para cartões de ferramentas mais ricos.

## Detalhes de conexão

- A TUI se registra no Gateway como `mode: "tui"`.
- Reconexões mostram uma mensagem do sistema; lacunas de eventos são exibidas no log.

## Opções

- `--url <url>`: URL WebSocket do Gateway (padrão é config ou `ws://127.0.0.1:<port>`)
- `--token <token>`: Token do Gateway (se necessário)
- `--password <password>`: senha do Gateway (se necessário)
- `--session <key>`: chave de sessão (padrão: `main`, ou `global` quando o escopo é global)
- `--deliver`: entregar respostas do assistente ao provedor (padrão desligado)
- `--thinking <level>`: sobrescrever nível de thinking para envios
- `--timeout-ms <ms>`: timeout do agente em ms (padrão é `agents.defaults.timeoutSeconds`)

Nota: quando você define `--url`, a TUI não faz fallback para credenciais de config ou ambiente.
Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes é um erro.

## Solução de problemas

Sem saída após enviar uma mensagem:

- Execute `/status` na TUI para confirmar que o Gateway está conectado e ocioso/ocupado.
- Verifique os logs do Gateway: `opencraft logs --follow`.
- Confirme que o agente pode executar: `opencraft status` e `opencraft models status`.
- Se você espera mensagens em um canal de chat, habilite a entrega (`/deliver on` ou `--deliver`).
- `--history-limit <n>`: entradas de histórico para carregar (padrão 200)

## Solução de problemas de conexão

- `disconnected`: certifique-se de que o Gateway está rodando e que seu `--url/--token/--password` estão corretos.
- Sem agentes no seletor: verifique `opencraft agents list` e sua configuração de roteamento.
- Seletor de sessão vazio: você pode estar no escopo global ou não ter sessões ainda.
