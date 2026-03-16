---
summary: "TUI (Terminal UI): conecte ao Gateway de qualquer máquina"
read_when:
  - Você quer um guia amigável para iniciantes do TUI
  - Você precisa da lista completa de recursos, comandos e atalhos do TUI
title: "TUI"
---

# TUI (Terminal UI)

## Início rápido

1. Inicie o Gateway.

```bash
opencraft gateway
```

2. Abra o TUI.

```bash
opencraft tui
```

3. Digite uma mensagem e pressione Enter.

Gateway remoto:

```bash
opencraft tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` se seu Gateway usa auth por senha.

## O que você vê

- Cabeçalho: URL de conexão, agente atual, sessão atual.
- Log de chat: mensagens do usuário, respostas do assistente, avisos do sistema, cards de tool.
- Linha de status: estado de conexão/execução (conectando, rodando, streaming, inativo, erro).
- Rodapé: estado de conexão + agente + sessão + modelo + think/fast/verbose/reasoning + contagens de tokens + entrega.
- Entrada: editor de texto com autocompletar.

## Modelo mental: agentes + sessões

- Agentes são slugs únicos (ex.: `main`, `research`). O Gateway expõe a lista.
- Sessões pertencem ao agente atual.
- Chaves de sessão são armazenadas como `agent:<agentId>:<sessionKey>`.
  - Se você digitar `/session main`, o TUI expande para `agent:<agenteAtual>:main`.
  - Se você digitar `/session agent:outro:main`, você muda para aquela sessão de agente explicitamente.
- Escopo de sessão:
  - `per-sender` (padrão): cada agente tem muitas sessões.
  - `global`: o TUI sempre usa a sessão `global` (o seletor pode estar vazio).
- O agente + sessão atual são sempre visíveis no rodapé.

## Envio + entrega

- Mensagens são enviadas ao Gateway; a entrega para provedores está desligada por padrão.
- Ativar entrega:
  - `/deliver on`
  - ou o painel de Configurações
  - ou iniciar com `opencraft tui --deliver`

## Seletores + overlays

- Seletor de modelo: listar modelos disponíveis e definir a sobrescrição de sessão.
- Seletor de agente: escolher um agente diferente.
- Seletor de sessão: mostra apenas sessões para o agente atual.
- Configurações: alternar entrega, expansão de saída de tool e visibilidade de thinking.

## Atalhos de teclado

- Enter: enviar mensagem
- Esc: abortar execução ativa
- Ctrl+C: limpar entrada (pressionar duas vezes para sair)
- Ctrl+D: sair
- Ctrl+L: seletor de modelo
- Ctrl+G: seletor de agente
- Ctrl+P: seletor de sessão
- Ctrl+O: alternar expansão de saída de tool
- Ctrl+T: alternar visibilidade de thinking (recarrega histórico)

## Slash commands

Principais:

- `/help`
- `/status`
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provedor/modelo>` (ou `/models`)

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

Outros slash commands do Gateway (por exemplo, `/context`) são encaminhados ao Gateway e mostrados como saída do sistema. Veja [Slash commands](/tools/slash-commands).

## Comandos de shell local

- Prefixe uma linha com `!` para rodar um comando de shell local no host do TUI.
- O TUI solicita uma vez por sessão para permitir execução local; recusar mantém `!` desabilitado para a sessão.
- Comandos rodam em um shell novo e não-interativo no diretório de trabalho do TUI (sem `cd`/env persistente).
- Comandos de shell local recebem `OPENCLAW_SHELL=tui-local` em seu ambiente.
- Um `!` sozinho é enviado como mensagem normal; espaços iniciais não acionam exec local.

## Saída de tool

- Chamadas de tool aparecem como cards com args + resultados.
- Ctrl+O alterna entre visualizações recolhida/expandida.
- Enquanto tools rodam, atualizações parciais fazem stream no mesmo card.

## Cores do terminal

- O TUI mantém o texto do corpo do assistente na cor de primeiro plano padrão do seu terminal para que terminais escuros e claros permaneçam legíveis.
- Se seu terminal usa um fundo claro e a auto-detecção estiver errada, defina `OPENCLAW_THEME=light` antes de iniciar `opencraft tui`.
- Para forçar a paleta escura original, defina `OPENCLAW_THEME=dark`.

## Histórico + streaming

- Ao conectar, o TUI carrega o histórico mais recente (padrão: 200 mensagens).
- Respostas em streaming são atualizadas no lugar até finalizadas.
- O TUI também escuta eventos de tool do agente para cards de tool mais ricos.

## Detalhes de conexão

- O TUI se registra no Gateway como `mode: "tui"`.
- Reconexões mostram uma mensagem do sistema; lacunas de eventos são surfaceadas no log.

## Opções

- `--url <url>`: URL WebSocket do Gateway (padrão: config ou `ws://127.0.0.1:<porta>`)
- `--token <token>`: Token do Gateway (se necessário)
- `--password <senha>`: Senha do Gateway (se necessária)
- `--session <key>`: Chave de sessão (padrão: `main`, ou `global` quando escopo é global)
- `--deliver`: Entregar respostas do assistente ao provedor (padrão: desligado)
- `--thinking <nível>`: Sobrescrever nível de thinking para envios
- `--timeout-ms <ms>`: Timeout do agente em ms (padrão: `agents.defaults.timeoutSeconds`)

Nota: quando você define `--url`, o TUI não cai de volta para credenciais de config ou ambiente.
Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes é um erro.

## Resolução de problemas

Sem saída após enviar uma mensagem:

- Rode `/status` no TUI para confirmar que o Gateway está conectado e inativo/ocupado.
- Verifique os logs do Gateway: `opencraft logs --follow`.
- Confirme que o agente pode rodar: `opencraft status` e `opencraft models status`.
- Se você espera mensagens em um canal de chat, habilite a entrega (`/deliver on` ou `--deliver`).
- `--history-limit <n>`: Entradas de histórico a carregar (padrão: 200)

## Resolução de problemas de conexão

- `disconnected`: certifique-se de que o Gateway está rodando e seu `--url/--token/--password` estão corretos.
- Sem agentes no seletor: verifique `opencraft agents list` e sua config de roteamento.
- Seletor de sessão vazio: você pode estar no escopo global ou não ter sessões ainda.
