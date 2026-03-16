---
summary: "Corrigir problemas de inicialização do CDP do Chrome/Brave/Edge/Chromium para controle de browser do OpenCraft no Linux"
read_when: "Controle de browser falha no Linux, especialmente com Chromium snap"
title: "Solução de Problemas do Browser"
---

# Solução de Problemas do Browser (Linux)

## Problema: "Failed to start Chrome CDP on port 18800"

O servidor de controle de browser do OpenCraft falha ao iniciar o Chrome/Brave/Edge/Chromium com o erro:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Causa raiz

No Ubuntu (e em muitas distribuições Linux), a instalação padrão do Chromium é um **pacote snap**. O confinamento AppArmor do snap interfere na forma como o OpenCraft inicia e monitora o processo do browser.

O comando `apt install chromium` instala um pacote stub que redireciona para o snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Isso NÃO é um browser real — é apenas um wrapper.

### Solução 1: Instalar o Google Chrome (Recomendado)

Instale o pacote `.deb` oficial do Google Chrome, que não é sandboxado pelo snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # se houver erros de dependência
```

Então atualize sua configuração do OpenCraft (`~/.opencraft/opencraft.json`):

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

### Solução 2: Usar o Chromium snap com modo somente-attach

Se você deve usar o Chromium snap, configure o OpenCraft para se conectar a um browser iniciado manualmente:

1. Atualize a configuração:

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
  --user-data-dir=$HOME/.opencraft/browser/openclaw/user-data \
  about:blank &
```

3. Opcionalmente crie um serviço systemd de usuário para iniciar o Chrome automaticamente:

```ini
# ~/.config/systemd/user/opencraft-browser.service
[Unit]
Description=OpenCraft Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.opencraft/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Habilite com: `systemctl --user enable --now opencraft-browser.service`

### Verificando se o Browser Funciona

Verificar status:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Testar navegação:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referência de configuração

| Opção                    | Descrição                                                             | Padrão                                                     |
| ------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `browser.enabled`        | Habilitar controle de browser                                         | `true`                                                     |
| `browser.executablePath` | Caminho para um binário de browser baseado em Chromium (Chrome/Brave/Edge/Chromium) | detectado automaticamente (prefere browser padrão quando baseado em Chromium) |
| `browser.headless`       | Executar sem GUI                                                      | `false`                                                    |
| `browser.noSandbox`      | Adicionar flag `--no-sandbox` (necessário para algumas configurações Linux) | `false`                                                |
| `browser.attachOnly`     | Não iniciar browser, apenas conectar ao existente                     | `false`                                                    |
| `browser.cdpPort`        | Porta do Chrome DevTools Protocol                                     | `18800`                                                    |

### Problema: "Chrome extension relay is running, but no tab is connected"

Você está usando um perfil de relay de extensão. Ele espera que a extensão de browser do OpenCraft esteja conectada a uma aba ativa.

Opções de correção:

1. **Use o browser gerenciado:** `opencraft browser start --browser-profile openclaw`
   (ou defina `browser.defaultProfile: "openclaw"`).
2. **Use o relay de extensão:** instale a extensão, abra uma aba, e clique no
   ícone da extensão do OpenCraft para conectá-la.

Notas:

- O perfil `chrome-relay` usa seu **browser Chromium padrão do sistema** quando possível.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl`; defina esses apenas para CDP remoto.
