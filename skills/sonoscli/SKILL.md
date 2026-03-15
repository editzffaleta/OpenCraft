---
name: sonoscli
description: Controle caixas de som Sonos (descoberta/status/reprodução/volume/grupo).
homepage: https://sonoscli.sh
metadata:
  {
    "opencraft":
      {
        "emoji": "🔊",
        "requires": { "bins": ["sonos"] },
        "install":
          [
            {
              "id": "go",
              "kind": "go",
              "module": "github.com/steipete/sonoscli/cmd/sonos@latest",
              "bins": ["sonos"],
              "label": "Instalar sonoscli (go)",
            },
          ],
      },
  }
---

# Sonos CLI

Use `sonos` para controlar caixas de som Sonos na rede local.

## Início rápido

- `sonos discover`
- `sonos status --name "Cozinha"`
- `sonos play|pause|stop --name "Cozinha"`
- `sonos volume set 15 --name "Cozinha"`

## Tarefas comuns

- Agrupamento: `sonos group status|join|unjoin|party|solo`
- Favoritos: `sonos favorites list|open`
- Fila: `sonos queue list|play|clear`
- Pesquisa no Spotify (via SMAPI): `sonos smapi search --service "Spotify" --category tracks "consulta"`

## Notas

- Se SSDP falhar, especifique `--ip <ip-da-caixa>`.
- Pesquisa na Web API do Spotify é opcional e requer `SPOTIFY_CLIENT_ID/SECRET`.
- Se houver um erro, verifique a seção de solução de problemas e ofereça orientação se houver correspondência.

## Solução de Problemas

### `sonos discover` - `no route to host`

- No erro `Error: write udp4 0.0.0.0:64326->239.255.255.250:1900: sendto: no route to host (Command exited with code 1)`
  - Note que o número da porta após `0.0.0.0:` é efêmero e mudará, e a máscara de rede pode não corresponder exatamente
  - O `sendto: no route to host` deve permanecer consistente
- Oriente o usuário que no modo `direct` (sem sandbox Docker) no Mac OS, Configurações -> Privacidade e Segurança -> Rede Local precisará ser habilitado para o processo pai do Gateway
  - `node` se executando via `launchd`
  - `Terminal` se executando o gateway diretamente no terminal
  - `Visual Studio Code` se executando via terminal no VS Code
- Uma alternativa é usar `sandbox` (container docker) com acesso à rede permitido para esse sandbox

### `sonos discover` - `bind: operation not permitted`

- No erro `Error: listen udp4 0.0.0.0:0: bind: operation not permitted`
- Oriente o usuário que pode estar executando via sandbox do Codex ou outro sandbox que não permite acesso à rede (isso pode ser replicado executando `sonos discover` dentro de uma sessão Codex CLI com sandbox habilitado e não aprovando a solicitação de escalação)
