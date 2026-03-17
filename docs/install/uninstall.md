---
summary: "Desinstalar o OpenCraft completamente (CLI, serviço, estado, workspace)"
read_when:
  - Você quer remover o OpenCraft de uma máquina
  - O serviço do gateway ainda está rodando após desinstalação
title: "Desinstalação"
---

# Desinstalação

Dois caminhos:

- **Caminho fácil** se o `opencraft` ainda está instalado.
- **Remoção manual do serviço** se o CLI foi removido mas o serviço ainda está rodando.

## Caminho fácil (CLI ainda instalado)

Recomendado: use o desinstalador embutido:

```bash
opencraft uninstall
```

Não-interativo (automação / npx):

```bash
opencraft uninstall --all --yes --non-interactive
npx -y opencraft uninstall --all --yes --non-interactive
```

Etapas manuais (mesmo resultado):

1. Pare o serviço do gateway:

```bash
opencraft gateway stop
```

2. Desinstale o serviço do gateway (launchd/systemd/schtasks):

```bash
opencraft gateway uninstall
```

3. Delete estado + configuração:

```bash
rm -rf "${OPENCRAFT_STATE_DIR:-$HOME/.opencraft}"
```

Se você definiu `OPENCRAFT_CONFIG_PATH` para uma localização personalizada fora do diretório de estado, delete esse arquivo também.

4. Delete seu workspace (opcional, remove arquivos do agente):

```bash
rm -rf ~/.opencraft/workspace
```

5. Remova a instalação do CLI (escolha a que você usou):

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

- Se você usou perfis (`--profile` / `OPENCRAFT_PROFILE`), repita a etapa 3 para cada diretório de estado (padrões são `~/.opencraft-<profile>`).
- No modo remoto, o diretório de estado fica no **host do gateway**, então execute as etapas 1-4 lá também.

## Remoção manual do serviço (CLI não instalado)

Use isso se o serviço do gateway continua rodando mas `opencraft` está faltando.

### macOS (launchd)

O label padrão é `ai.opencraft.gateway` (ou `ai.opencraft.<profile>`; o legado `com.opencraft.*` pode ainda existir):

```bash
launchctl bootout gui/$UID/ai.opencraft.gateway
rm -f ~/Library/LaunchAgents/ai.opencraft.gateway.plist
```

Se você usou um perfil, substitua o label e nome do plist por `ai.opencraft.<profile>`. Remova quaisquer plists legados `com.opencraft.*` se presentes.

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

Se você usou um perfil, delete o nome da tarefa correspondente e `~\.opencraft-<profile>\gateway.cmd`.

## Instalação normal vs checkout do código-fonte

### Instalação normal (install.sh / npm / pnpm / bun)

Se você usou `https://opencraft.ai/install.sh` ou `install.ps1`, o CLI foi instalado com `npm install -g opencraft@latest`.
Remova com `npm rm -g opencraft` (ou `pnpm remove -g` / `bun remove -g` se instalou dessa forma).

### Checkout do código-fonte (git clone)

Se você roda a partir de um checkout do repositório (`git clone` + `opencraft ...` / `bun run opencraft ...`):

1. Desinstale o serviço do gateway **antes** de deletar o repositório (use o caminho fácil acima ou remoção manual do serviço).
2. Delete o diretório do repositório.
3. Remova estado + workspace conforme mostrado acima.
