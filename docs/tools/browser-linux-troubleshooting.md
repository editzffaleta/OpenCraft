---
summary: "Corrigir problemas de inicialização CDP do Chrome/Brave/Edge/Chromium para controle de browser do OpenCraft no Linux"
read_when: "Controle de browser falha no Linux, especialmente com Chromium snap"
title: "Solução de Problemas do Browser"
---

# Solução de Problemas do Browser (Linux)

## Problema: "Failed to start Chrome CDP on port 18800"

O servidor de controle de browser do OpenCraft falha ao iniciar Chrome/Brave/Edge/Chromium com o erro:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"opencraft\"."}
```

### Causa Raiz

No Ubuntu (e muitas distribuições Linux), a instalação padrão do Chromium é um **pacote snap**. O confinamento AppArmor do snap interfere na forma como o OpenCraft inicia e monitora o processo do browser.

O comando `apt install chromium` instala um pacote stub que redireciona para o snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Isso NÃO é um browser real - é apenas um wrapper.

### Solução 1: Instalar Google Chrome (Recomendado)

Instale o pacote `.deb` oficial do Google Chrome, que não é confinado pelo snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # se houver erros de dependência
```

Depois atualize sua config do OpenCraft (`~/.editzffaleta/OpenCraft.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Solução 2: Usar Chromium Snap com Modo Attach-Only

Se você precisar usar o Chromium snap, configure o OpenCraft para se conectar a um browser iniciado manualmente:

1. Atualize a config:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Inicie o Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.opencraft/browser/opencraft/user-data \
  about:blank &
```

3. Opcionalmente crie um serviço systemd de usuário para iniciar o Chrome automaticamente:

```ini
# ~/.config/systemd/user/opencraft-browser.service
[Unit]
Description=OpenCraft Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.opencraft/browser/opencraft/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Habilite com: `systemctl --user enable --now opencraft-browser.service`

### Verificando se o Browser Funciona

Verifique o status:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Teste a navegação:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referência de Config

| Opção                    | Descrição                                                                           | Padrão                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`        | Habilitar controle de browser                                                       | `true`                                                             |
| `browser.executablePath` | Caminho para um binário de browser baseado em Chromium (Chrome/Brave/Edge/Chromium) | auto-detectado (prefere browser padrão quando baseado em Chromium) |
| `browser.headless`       | Executar sem GUI                                                                    | `false`                                                            |
| `browser.noSandbox`      | Adicionar flag `--no-sandbox` (necessário para algumas configurações Linux)         | `false`                                                            |
| `browser.attachOnly`     | Não iniciar browser, apenas conectar ao existente                                   | `false`                                                            |
| `browser.cdpPort`        | Porta do Chrome DevTools Protocol                                                   | `18800`                                                            |

### Problema: "No Chrome tabs found for profile=\"user\""

Você está usando um perfil Chrome MCP `existing-session` / `user`. O OpenCraft pode ver o Chrome local,
mas não há abas abertas disponíveis para conexão.

Opções de correção:

1. **Use o browser gerenciado:** `opencraft browser start --browser-profile opencraft`
   (ou defina `browser.defaultProfile: "opencraft"`).
2. **Use Chrome MCP:** certifique-se de que o Chrome local está em execução com pelo menos uma aba aberta, depois tente novamente com `--browser-profile user`.

Notas:

- `user` é apenas para host local. Para servidores Linux, containers ou hosts remotos, prefira perfis CDP.
- Perfis `opencraft` locais atribuem automaticamente `cdpPort`/`cdpUrl`; defina esses apenas para CDP remoto.
