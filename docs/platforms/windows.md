---
summary: "Suporte Windows (WSL2) + status do app companion"
read_when:
  - Instalando o OpenCraft no Windows
  - Procurando status do app companion Windows
title: "Windows (WSL2)"
---

# Windows (WSL2)

O OpenCraft no Windows é recomendado **via WSL2** (Ubuntu recomendado). O
CLI + Gateway rodam dentro do Linux, o que mantém o runtime consistente e deixa
as ferramentas muito mais compatíveis (Node/Bun/pnpm, binários Linux, skills). O Windows
nativo pode ser mais complicado. O WSL2 oferece a experiência Linux completa — um comando
para instalar: `wsl --install`.

Apps companion nativos para Windows estão planejados.

## Instalação (WSL2)

- [Primeiros Passos](/start/getting-started) (use dentro do WSL)
- [Instalar e atualizar](/install/updating)
- Guia oficial do WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status do Windows nativo

Os fluxos nativos do Windows CLI estão melhorando, mas o WSL2 ainda é o caminho recomendado.

O que funciona bem no Windows nativo hoje:

- instalador do site via `install.ps1`
- uso local do CLI como `opencraft --version`, `opencraft doctor` e `opencraft plugins list --json`
- smoke de agente/provedor local embutido como:

```powershell
opencraft agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Ressalvas atuais:

- `opencraft onboard --non-interactive` ainda espera um gateway local acessível a menos que você passe `--skip-health`
- `opencraft onboard --non-interactive --install-daemon` e `opencraft gateway install` tentam o Windows Scheduled Tasks primeiro
- se a criação do Scheduled Task for negada, o OpenCraft usa como fallback um item de login na pasta Startup do usuário e inicia o gateway imediatamente
- se `schtasks` travar ou parar de responder, o OpenCraft agora aborta esse caminho rapidamente e usa fallback em vez de travar para sempre
- Scheduled Tasks ainda são preferidos quando disponíveis porque fornecem melhor status de supervisor

Se quiser apenas o CLI nativo, sem instalação do serviço gateway, use um destes:

```powershell
opencraft onboard --non-interactive --skip-health
opencraft gateway run
```

Se quiser inicialização gerenciada no Windows nativo:

```powershell
opencraft gateway install
opencraft gateway status --json
```

Se a criação do Scheduled Task for bloqueada, o modo de serviço de fallback ainda inicia automaticamente após o login pela pasta Startup do usuário atual.

## Gateway

- [Runbook do Gateway](/gateway)
- [Configuração](/gateway/configuration)

## Instalação do serviço Gateway (CLI)

Dentro do WSL2:

```
opencraft onboard --install-daemon
```

Ou:

```
opencraft gateway install
```

Ou:

```
opencraft configure
```

Selecione **Gateway service** quando solicitado.

Reparar/migrar:

```
opencraft doctor
```

## Auto-inicialização do Gateway antes do login no Windows

Para setups headless, garanta que a cadeia de inicialização completa rode mesmo quando ninguém faz login no
Windows.

### 1) Manter serviços de usuário rodando sem login

Dentro do WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Instalar o serviço de usuário do gateway OpenCraft

Dentro do WSL:

```bash
opencraft gateway install
```

### 3) Iniciar o WSL automaticamente na inicialização do Windows

No PowerShell como Administrador:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Substitua `Ubuntu` pelo nome da sua distro de:

```powershell
wsl --list --verbose
```

### Verificar cadeia de inicialização

Após uma reinicialização (antes do login no Windows), verifique no WSL:

```bash
systemctl --user is-enabled openclaw-gateway
systemctl --user status openclaw-gateway --no-pager
```

## Avançado: expor serviços WSL via LAN (portproxy)

O WSL tem sua própria rede virtual. Se outra máquina precisar acessar um serviço
rodando **dentro do WSL** (SSH, um servidor TTS local ou o Gateway), você deve
encaminhar uma porta do Windows para o IP atual do WSL. O IP do WSL muda após reinicializações,
então pode ser necessário atualizar a regra de encaminhamento.

Exemplo (PowerShell **como Administrador**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "IP do WSL não encontrado." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Permita a porta pelo Windows Firewall (uma vez):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Atualize o portproxy após reinicializações do WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Notas:

- SSH de outra máquina aponta para o **IP do host Windows** (exemplo: `ssh user@windows-host -p 2222`).
- Nós remotos devem apontar para uma URL de Gateway **acessível** (não `127.0.0.1`); use
  `opencraft status --all` para confirmar.
- Use `listenaddress=0.0.0.0` para acesso LAN; `127.0.0.1` mantém apenas local.
- Se quiser automatizar isso, registre uma Scheduled Task para rodar o passo de atualização
  no login.

## Instalação passo a passo do WSL2

### 1) Instalar WSL2 + Ubuntu

Abra o PowerShell (Admin):

```powershell
wsl --install
# Ou escolha uma distro explicitamente:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Reinicie se o Windows solicitar.

### 2) Habilitar systemd (necessário para instalação do gateway)

No seu terminal WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Depois no PowerShell:

```powershell
wsl --shutdown
```

Reabra o Ubuntu e verifique:

```bash
systemctl --user status
```

### 3) Instalar o OpenCraft (dentro do WSL)

Siga o fluxo Linux de Primeiros Passos dentro do WSL:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # instala deps da UI automaticamente na primeira execução
pnpm build
opencraft onboard
```

Guia completo: [Primeiros Passos](/start/getting-started)

## App companion Windows

Ainda não temos um app companion para Windows. Contribuições são bem-vindas se quiser
ajudar a fazer acontecer.
