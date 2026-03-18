---
name: sonoscli
description: Controlar caixas de som Sonos (descobrir/status/reproduzir/volume/agrupar).
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
- `sonos status --name "Kitchen"`
- `sonos play|pause|stop --name "Kitchen"`
- `sonos volume set 15 --name "Kitchen"`

## Tarefas comuns

- Agrupamento: `sonos group status|join|unjoin|party|solo`
- Favoritos: `sonos favorites list|open`
- Fila: `sonos queue list|play|clear`
- Busca no Spotify (via SMAPI): `sonos smapi search --service "Spotify" --category tracks "query"`

## Observações

- Se o SSDP falhar, especifique `--ip <speaker-ip>`.
- A busca via Spotify Web API é opcional e requer `SPOTIFY_CLIENT_ID/SECRET`.
- Se ocorrer um erro, verifique a seção de solução de problemas e ofereça orientação se houver correspondência adequada.

## Solução de problemas

### `sonos discover` - `no route to host`

- No erro `Error: write udp4 0.0.0.0:64326->239.255.255.250:1900: sendto: no route to host (Command exited with code 1)`
  - Observe que o número de porta após `0.0.0.0:` é efêmero e vai mudar, e a máscara de rede também pode não corresponder exatamente
  - O `sendto: no route to host` deve permanecer consistente
- Oriente o usuário que no modo `direct` (sem sandbox Docker) no Mac OS, será necessário habilitar em Configurações -> Privacidade e Segurança -> Rede Local para o processo pai de nível superior do Gateway
  - `node` se estiver executando via `launchd`
  - `Terminal` se estiver executando o gateway diretamente no terminal
  - `Visual Studio Code` se estiver executando via terminal no VS Code
- Uma opção alternativa é usar o `sandbox` (contêiner docker) com acesso à rede permitido para aquele sandbox

### `sonos discover` - `bind: operation not permitted`

- No erro `Error: listen udp4 0.0.0.0:0: bind: operation not permitted`
- Oriente o usuário que ele pode estar executando via Codex ou outro sandbox que não permite acesso à rede (isso pode ser reproduzido executando `sonos discover` dentro de uma sessão do Codex CLI com sandbox habilitado sem aprovar a solicitação de escalada)
