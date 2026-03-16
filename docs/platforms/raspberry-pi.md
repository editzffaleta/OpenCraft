---
summary: "OpenCraft no Raspberry Pi (configuração self-hosted econômica)"
read_when:
  - Configurando o OpenCraft num Raspberry Pi
  - Rodando o OpenCraft em dispositivos ARM
  - Construindo uma IA pessoal barata sempre ligada
title: "Raspberry Pi"
---

# OpenCraft no Raspberry Pi

## Objetivo

Rodar um Gateway OpenCraft persistente e sempre ligado num Raspberry Pi por **~$35-80** de custo único (sem mensalidades).

Perfeito para:

- Assistente de IA pessoal 24/7
- Hub de automação residencial
- Bot Telegram/WhatsApp de baixo consumo sempre disponível

## Requisitos de Hardware

| Modelo Pi       | RAM     | Funciona?     | Notas                              |
| --------------- | ------- | ------------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | Melhor        | Mais rápido, recomendado           |
| **Pi 4**        | 4GB     | Bom           | Ponto ideal para a maioria         |
| **Pi 4**        | 2GB     | OK            | Funciona, adicione swap            |
| **Pi 4**        | 1GB     | Apertado      | Possível com swap, config mínima   |
| **Pi 3B+**      | 1GB     | Lento         | Funciona mas devagar               |
| **Pi Zero 2 W** | 512MB   | Não recomendado | Não recomendado                  |

**Especificações mínimas:** 1GB RAM, 1 core, 500MB disco
**Recomendado:** 2GB+ RAM, OS 64-bit, cartão SD 16GB+ (ou SSD USB)

## O que você vai precisar

- Raspberry Pi 4 ou 5 (2GB+ recomendado)
- Cartão microSD (16GB+) ou SSD USB (melhor desempenho)
- Fonte de alimentação (PSU oficial do Pi recomendada)
- Conexão de rede (Ethernet ou WiFi)
- ~30 minutos

## 1) Gravar o OS

Use **Raspberry Pi OS Lite (64-bit)** — não precisa de desktop para um servidor headless.

1. Baixe o [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Escolha OS: **Raspberry Pi OS Lite (64-bit)**
3. Clique no ícone de engrenagem (⚙️) para pré-configurar:
   - Definir hostname: `gateway-host`
   - Habilitar SSH
   - Definir usuário/senha
   - Configurar WiFi (se não usar Ethernet)
4. Grave no cartão SD / unidade USB
5. Insira e inicialize o Pi

## 2) Conectar via SSH

```bash
ssh user@gateway-host
# ou use o endereço IP
ssh user@192.168.x.x
```

## 3) Configuração do Sistema

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar pacotes essenciais
sudo apt install -y git curl build-essential

# Definir fuso horário (importante para cron/lembretes)
sudo timedatectl set-timezone America/Sao_Paulo  # Mude para seu fuso horário
```

## 4) Instalar Node.js 24 (ARM64)

```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version  # Deve mostrar v24.x.x
npm --version
```

## 5) Adicionar Swap (Importante para 2GB ou menos)

O swap previne crashes por falta de memória:

```bash
# Criar arquivo de swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Otimizar para pouca RAM (reduzir swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Instalar o OpenCraft

### Opção A: Instalação Padrão (Recomendado)

```bash
curl -fsSL https://opencraft.ai/install.sh | bash
```

### Opção B: Instalação Hackável (Para quem gosta de mexer)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

A instalação hackável dá acesso direto a logs e código — útil para depurar problemas específicos do ARM.

## 7) Executar Onboarding

```bash
opencraft onboard --install-daemon
```

Siga o wizard:

1. **Modo Gateway:** Local
2. **Auth:** Chaves de API recomendadas (OAuth pode ser complicado em Pi headless)
3. **Canais:** Telegram é o mais fácil para começar
4. **Daemon:** Sim (systemd)

## 8) Verificar Instalação

```bash
# Verificar status
opencraft status

# Verificar serviço
sudo systemctl status opencraft

# Ver logs
journalctl -u opencraft -f
```

## 9) Acessar o Dashboard do OpenCraft

Substitua `user@gateway-host` pelo seu usuário e hostname/IP do Pi.

No seu computador, peça ao Pi para exibir uma URL de dashboard recente:

```bash
ssh user@gateway-host 'opencraft dashboard --no-open'
```

O comando exibe `Dashboard URL:`. Dependendo de como `gateway.auth.token`
está configurado, a URL pode ser um link simples `http://127.0.0.1:18789/` ou um que
inclui `#token=...`.

Em outro terminal no seu computador, crie o túnel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Depois abra a URL do Dashboard exibida no seu navegador local.

Se a UI pedir auth, cole o token de `gateway.auth.token`
(ou `OPENCLAW_GATEWAY_TOKEN`) nas configurações da Control UI.

Para acesso remoto sempre ativo, veja [Tailscale](/gateway/tailscale).

---

## Otimizações de Desempenho

### Use um SSD USB (Melhoria Enorme)

Cartões SD são lentos e se desgastam. Um SSD USB melhora dramaticamente o desempenho:

```bash
# Verificar se iniciando por USB
lsblk
```

Veja o [guia de boot USB do Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) para configuração.

### Acelerar inicialização do CLI (cache de compilação de módulo)

Em hosts Pi de menor potência, habilite o cache de compilação de módulo do Node para que execuções repetidas do CLI sejam mais rápidas:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/opencraft-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/opencraft-compile-cache
mkdir -p /var/tmp/opencraft-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Notas:

- `NODE_COMPILE_CACHE` acelera execuções subsequentes (`status`, `health`, `--help`).
- `/var/tmp` sobrevive a reinicializações melhor que `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` evita custo extra de inicialização do auto-respawn do CLI.
- A primeira execução aquece o cache; as seguintes se beneficiam mais.

### Ajuste de inicialização do systemd (opcional)

Se este Pi está principalmente rodando o OpenCraft, adicione um drop-in de serviço para reduzir
jitter de reinicialização e manter o ambiente de inicialização estável:

```bash
sudo systemctl edit opencraft
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/opencraft-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Depois aplique:

```bash
sudo systemctl daemon-reload
sudo systemctl restart opencraft
```

Se possível, mantenha estado/cache do OpenCraft em armazenamento com SSD para evitar
gargalos de I/O aleatório do cartão SD durante inicializações a frio.

### Reduzir Uso de Memória

```bash
# Desabilitar alocação de memória GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Desabilitar Bluetooth se não necessário
sudo systemctl disable bluetooth
```

### Monitorar Recursos

```bash
# Verificar memória
free -h

# Verificar temperatura da CPU
vcgencmd measure_temp

# Monitoramento ao vivo
htop
```

---

## Notas Específicas do ARM

### Compatibilidade de Binários

A maioria dos recursos do OpenCraft funciona no ARM64, mas alguns binários externos podem precisar de builds ARM:

| Ferramenta         | Status ARM64 | Notas                               |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | Funciona     | Ótimo                               |
| WhatsApp (Baileys) | Funciona     | JS puro, sem problemas              |
| Telegram           | Funciona     | JS puro, sem problemas              |
| gog (Gmail CLI)    | Verificar    | Verifique se há release ARM         |
| Chromium (browser) | Funciona     | `sudo apt install chromium-browser` |

Se uma skill falhar, verifique se seu binário tem build ARM. Muitas ferramentas Go/Rust têm; algumas não.

### 32-bit vs 64-bit

**Sempre use OS 64-bit.** Node.js e muitas ferramentas modernas exigem isso. Verifique com:

```bash
uname -m
# Deve mostrar: aarch64 (64-bit) não armv7l (32-bit)
```

---

## Configuração de Modelo Recomendada

Como o Pi é apenas o Gateway (os modelos rodam na nuvem), use modelos baseados em API:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514",
        "fallbacks": ["openai/gpt-4o-mini"]
      }
    }
  }
}
```

**Não tente rodar LLMs locais no Pi** — mesmo modelos pequenos são lentos demais. Deixe Claude/GPT fazer o trabalho pesado.

---

## Auto-Inicialização no Boot

O wizard de onboarding configura isso, mas para verificar:

```bash
# Verificar se o serviço está habilitado
sudo systemctl is-enabled opencraft

# Habilitar se não estiver
sudo systemctl enable opencraft

# Iniciar no boot
sudo systemctl start opencraft
```

---

## Troubleshooting

### Falta de Memória (OOM)

```bash
# Verificar memória
free -h

# Adicionar mais swap (veja Passo 5)
# Ou reduzir serviços rodando no Pi
```

### Desempenho Lento

- Use SSD USB em vez de cartão SD
- Desabilite serviços não usados: `sudo systemctl disable cups bluetooth avahi-daemon`
- Verifique throttling da CPU: `vcgencmd get_throttled` (deve retornar `0x0`)

### Serviço Não Inicia

```bash
# Verificar logs
journalctl -u opencraft --no-pager -n 100

# Correção comum: rebuildar
cd ~/openclaw  # se usar instalação hackável
npm run build
sudo systemctl restart opencraft
```

### Problemas com Binários ARM

Se uma skill falhar com "exec format error":

1. Verifique se o binário tem um build ARM64
2. Tente compilar do código-fonte
3. Ou use um container Docker com suporte ARM

### WiFi Cai

Para Pis headless no WiFi:

```bash
# Desabilitar gerenciamento de energia WiFi
sudo iwconfig wlan0 power off

# Tornar permanente
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Comparação de Custo

| Configuração   | Custo Único | Custo Mensal | Notas                     |
| -------------- | ----------- | ------------ | ------------------------- |
| **Pi 4 (2GB)** | ~$45        | $0           | + energia (~$5/ano)       |
| **Pi 4 (4GB)** | ~$55        | $0           | Recomendado               |
| **Pi 5 (4GB)** | ~$60        | $0           | Melhor desempenho         |
| **Pi 5 (8GB)** | ~$80        | $0           | Overkill mas à prova do futuro |
| DigitalOcean   | $0          | $6/mês       | $72/ano                   |
| Hetzner        | $0          | €3,79/mês    | ~$50/ano                  |

**Ponto de equilíbrio:** Um Pi se paga em ~6-12 meses vs VPS em nuvem.

---

## Veja também

- [Guia Linux](/platforms/linux) — configuração Linux geral
- [Guia DigitalOcean](/platforms/digitalocean) — alternativa em nuvem
- [Guia Hetzner](/install/hetzner) — configuração Docker
- [Tailscale](/gateway/tailscale) — acesso remoto
- [Nós](/nodes) — parear seu laptop/telefone com o gateway do Pi
