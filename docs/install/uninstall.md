---
summary: "Desinstalar o OpenCraft completamente (CLI, serviço, estado, workspace)"
read_when:
  - Você quer remover o OpenCraft de uma máquina
  - O serviço do gateway ainda está em execução após a desinstalação
title: "Desinstalar"
---

# Desinstalar

Dois caminhos:

- **Caminho fácil** se `opencraft` ainda estiver instalado.
- **Remoção manual do serviço** se o CLI não estiver mais presente mas o serviço ainda estiver em execução.

## Caminho fácil (CLI ainda instalado)

Recomendado: use o desinstalador integrado:

```bash
opencraft uninstall
```

Não interativo (automação / npx):

```bash
opencraft uninstall --all --yes --non-interactive
npx -y opencraft uninstall --all --yes --non-interactive
```

Etapas manuais (mesmo resultado):

1. Parar o serviço do gateway:

```bash
opencraft gateway stop
```

2. Desinstalar o serviço do gateway (launchd/systemd/schtasks):

```bash
opencraft gateway uninstall
```

3. Excluir estado + config:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.opencraft}"
```

Se você definiu `OPENCLAW_CONFIG_PATH` para um local personalizado fora do diretório de estado, exclua esse arquivo também.

4. Excluir seu workspace (opcional, remove arquivos do agente):

```bash
rm -rf ~/.opencraft/workspace
```

5. Remover a instalação do CLI (escolha a que você usou):

```bash
npm rm -g opencraft
pnpm remove -g opencraft
bun remove -g opencraft
```

6. Se você instalou o app macOS:

```bash
rm -rf /Applications/OpenCraft.app
```

Notas:

- Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), repita a etapa 3 para cada diretório de estado (os padrões são `~/.opencraft-<profile>`).
- No modo remoto, o diretório de estado fica no **host do gateway**, então execute as etapas 1-4 também lá.

## Remoção manual do serviço (CLI não instalado)

Use isto se o serviço do gateway continua em execução mas `opencraft` está ausente.

### macOS (launchd)

O label padrão é `ai.opencraft.gateway` (ou `ai.opencraft.<profile>`; o legado `com.opencraft.*` pode ainda existir):

```bash
launchctl bootout gui/$UID/ai.opencraft.gateway
rm -f ~/Library/LaunchAgents/ai.opencraft.gateway.plist
```

Se você usou um perfil, substitua o label e o nome do plist por `ai.opencraft.<profile>`. Remova quaisquer plists `com.opencraft.*` legados se presentes.

### Linux (unidade de usuário systemd)

O nome padrão da unidade é `opencraft-gateway.service` (ou `opencraft-gateway-<profile>.service`):

```bash
systemctl --user disable --now opencraft-gateway.service
rm -f ~/.config/systemd/user/opencraft-gateway.service
systemctl --user daemon-reload
```

### Windows (Tarefa Agendada)

O nome padrão da tarefa é `OpenCraft Gateway` (ou `OpenCraft Gateway (<profile>)`).
O script da tarefa fica no seu diretório de estado.

```powershell
schtasks /Delete /F /TN "OpenCraft Gateway"
Remove-Item -Force "$env:USERPROFILE\.opencraft\gateway.cmd"
```

Se você usou um perfil, exclua o nome da tarefa correspondente e `~\.opencraft-<profile>\gateway.cmd`.

## Instalação normal vs checkout de código-fonte

### Instalação normal (install.sh / npm / pnpm / bun)

Se você usou `https://openclaw.ai/install.sh` ou `install.ps1`, o CLI foi instalado com `npm install -g opencraft@latest`.
Remova com `npm rm -g opencraft` (ou `pnpm remove -g` / `bun remove -g` se instalou dessa forma).

### Checkout de código-fonte (git clone)

Se você executa a partir de um checkout do repositório (`git clone` + `opencraft ...` / `bun run opencraft ...`):

1. Desinstale o serviço do gateway **antes** de excluir o repositório (use o caminho fácil acima ou a remoção manual do serviço).
2. Exclua o diretório do repositório.
3. Remova o estado + workspace conforme mostrado acima.
