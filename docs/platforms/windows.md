---
summary: "Suporte do Windows (WSL2) + status do aplicativo complementar"
read_when:
  - Instalando OpenCraft no Windows
  - Procurando por status do aplicativo complementar do Windows
title: "Windows (WSL2)"
---

# Windows (WSL2)

OpenCraft no Windows é recomendado **via WSL2** (Ubuntu recomendado). O
CLI + Gateway são executados dentro do Linux, o que mantém o tempo de execução consistente e torna
a compatibilidade de ferramentas muito melhor (Node/Bun/pnpm, binários Linux, skills). Windows nativo
pode ser mais complicado. WSL2 oferece a experiência completa do Linux — um comando
para instalar: `wsl --install`.

Aplicativos complementares nativos do Windows estão planejados.

## Instalação (WSL2)

- [Guia de Introdução](/start/getting-started) (usar dentro do WSL)
- [Instalar & atualizações](/install/updating)
- Guia oficial de WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status do Windows nativo

Os fluxos de CLI do Windows nativo estão melhorando, mas WSL2 ainda é o caminho recomendado.

O que funciona bem no Windows nativo hoje:

- instalador de site via `install.ps1`
- uso de CLI local, como `opencraft --version`, `opencraft doctor` e `opencraft plugins list --json`
- fumaça local de agente integrado/provedor, como:

```powershell
opencraft agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Advertências atuais:

- `opencraft onboard --non-interactive` ainda espera um Gateway local acessível a menos que você passe `--skip-health`
- `opencraft onboard --non-interactive --install-daemon` e `opencraft gateway install` tentam Windows Scheduled Tasks primeiro
- se a criação de Scheduled Task for negada, OpenCraft volta para um item de pasta de inicialização por usuário e inicia o Gateway imediatamente
- se `schtasks` em si travar ou parar de responder, OpenCraft agora aborta esse caminho rapidamente e volta em vez de pendurar para sempre
- Tarefas Agendadas ainda são preferidas quando disponíveis porque fornecem melhor status de supervisor

Se você quiser apenas a CLI nativa, sem instalação de serviço Gateway, use uma destas:

```powershell
opencraft onboard --non-interactive --skip-health
opencraft gateway run
```

Se você quiser inicialização gerenciada no Windows nativo:

```powershell
opencraft gateway install
opencraft gateway status --json
```

Se a criação de Scheduled Task for bloqueada, o modo de serviço de fallback ainda inicia automaticamente após login através da pasta de inicialização do usuário atual.

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

Reparo/migração:

```
opencraft doctor
```

## Inicialização automática do Gateway antes do login do Windows

Para configurações headless, certifique-se de que a cadeia de inicialização completa é executada mesmo quando ninguém faz login no Windows.

### 1) Mantenha serviços de usuário em execução sem login

Dentro do WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Instale o serviço de usuário do Gateway OpenCraft

Dentro do WSL:

```bash
opencraft gateway install
```

### 3) Inicie WSL automaticamente na inicialização do Windows

No PowerShell como Administrador:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Substitua `Ubuntu` pelo nome da sua distribuição de:

```powershell
wsl --list --verbose
```

### Verifique a cadeia de inicialização

Após uma reinicialização (antes do login no Windows), verifique no WSL:

```bash
systemctl --user is-enabled opencraft-gateway
systemctl --user status opencraft-gateway --no-pager
```

## Avançado: exponha serviços WSL via LAN (portproxy)

WSL tem sua própria rede virtual. Se outra máquina precisar acessar um serviço
em execução **dentro do WSL** (SSH, servidor TTS local ou Gateway), você deve
encaminhar uma porta do Windows para o IP do WSL atual. O IP do WSL muda após reinicializações,
então você pode precisar atualizar a regra de encaminhamento.

Exemplo (PowerShell **como Administrador**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Permita a porta através do Firewall do Windows (uma única vez):

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

- SSH de outra máquina visa o **IP do host do Windows** (exemplo: `ssh user@windows-host -p 2222`).
- Nós remotos devem apontar para uma URL de Gateway **acessível** (não `127.0.0.1`); use
  `opencraft status --all` para confirmar.
- Use `listenaddress=0.0.0.0` para acesso LAN; `127.0.0.1` o mantém apenas localmente.
- Se você quiser isso automático, registre uma Tarefa Agendada para executar o atualizar
  passo no login.

## Instalação WSL2 passo a passo

### 1) Instale WSL2 + Ubuntu

Abra PowerShell (Admin):

```powershell
wsl --install
# Ou escolha uma distribuição explicitamente:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Reinicie se o Windows pedir.

### 2) Ative systemd (obrigatório para instalação do Gateway)

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

Reabra Ubuntu e verifique:

```bash
systemctl --user status
```

### 3) Instale OpenCraft (dentro do WSL)

Siga o fluxo de Guia de Introdução do Linux dentro do WSL:

```bash
git clone https://github.com/editzffaleta/OpenCraft.git
cd opencraft
pnpm install
pnpm ui:build # instala automaticamente dependências da UI na primeira execução
pnpm build
opencraft onboard
```

Guia completo: [Guia de Introdução](/start/getting-started)

## Aplicativo complementar do Windows

Ainda não temos um aplicativo complementar do Windows. Contribuições são bem-vindas se você quiser
contribuições para fazê-lo acontecer.
