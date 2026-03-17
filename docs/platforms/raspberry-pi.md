---
summary: "OpenCraft no Raspberry Pi (configuração auto-hospedada econômica)"
read_when:
  - Configurando OpenCraft em um Raspberry Pi
  - Executando OpenCraft em dispositivos ARM
  - Construindo uma IA pessoal sempre ligada e barata
title: "Raspberry Pi"
---

# OpenCraft no Raspberry Pi

## Objetivo

Execute um Gateway OpenCraft persistente e sempre ligado em um Raspberry Pi por **~$35-80** de custo único (sem taxas mensais).

Perfeito para:

- Assistente pessoal de IA 24/7
- Hub de automação residencial
- Bot de Telegram/WhatsApp sempre disponível e de baixo consumo

## Requisitos de hardware

| Modelo do Pi    | RAM     | Funciona? | Notas                              |
| --------------- | ------- | --------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Melhor | Mais rápido, recomendado           |
| **Pi 4**        | 4GB     | ✅ Bom    | Ponto ideal para a maioria         |
| **Pi 4**        | 2GB     | ✅ OK     | Funciona, adicione swap            |
| **Pi 4**        | 1GB     | ⚠️ Apertado | Possível com swap, config mínima |
| **Pi 3B+**      | 1GB     | ⚠️ Lento | Funciona mas é lento               |
| **Pi Zero 2 W** | 512MB   | ❌        | Não recomendado                    |

**Especificações mínimas:** 1GB RAM, 1 núcleo, 500MB de disco
**Recomendado:** 2GB+ RAM, SO 64-bit, cartão SD 16GB+ (ou SSD USB)

## O que você vai precisar

- Raspberry Pi 4 ou 5 (2GB+ recomendado)
- Cartão MicroSD (16GB+) ou SSD USB (melhor desempenho)
- Fonte de alimentação (fonte oficial do Pi recomendada)
- Conexão de rede (Ethernet ou WiFi)
- ~30 minutos

## 1) Grave o SO

Use **Raspberry Pi OS Lite (64-bit)** — sem desktop necessário para um servidor headless.

1. Baixe o [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Escolha o SO: **Raspberry Pi OS Lite (64-bit)**
3. Clique no ícone de engrenagem (⚙️) para pré-configurar:
   - Defina hostname: `gateway-host`
   - Ative SSH
   - Defina nome de usuário/senha
   - Configure WiFi (se não estiver usando Ethernet)
4. Grave no cartão SD / drive USB
5. Insira e ligue o Pi

## 2) Conecte via SSH

```bash
ssh user@gateway-host
# ou use o endereço IP
ssh user@192.168.x.x
```

## 3) Configuração do sistema

```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale pacotes essenciais
sudo apt install -y git curl build-essential

# Defina o fuso horário (importante para cron/lembretes)
sudo timedatectl set-timezone America/Sao_Paulo  # Altere para seu fuso horário
```

## 4) Instale Node.js 24 (ARM64)

```bash
# Instale Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verifique
node --version  # Deve mostrar v24.x.x
npm --version
```

## 5) Adicione swap (importante para 2GB ou menos)

O swap previne crashes por falta de memória:

```bash
# Crie um arquivo swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Torne permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Otimize para pouca RAM (reduza swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Instale o OpenCraft

### Opção A: Instalação padrão (recomendada)

```bash
curl -fsSL https://opencraft.ai/install.sh | bash
```

### Opção B: Instalação hackeável (para experimentar)

```bash
git clone https://github.com/editzffaleta/OpenCraft.git
cd opencraft
npm install
npm run build
npm link
```

A instalação hackeável oferece acesso direto a logs e código — útil para depurar problemas específicos de ARM.

## 7) Execute o onboarding

```bash
opencraft onboard --install-daemon
```

Siga o assistente:

1. **Modo do Gateway:** Local
2. **Autenticação:** Chaves API recomendadas (OAuth pode ser complicado em Pi headless)
3. **Canais:** Telegram é o mais fácil para começar
4. **Daemon:** Sim (systemd)

## 8) Verifique a instalação

```bash
# Verifique o status
opencraft status

# Verifique o serviço
sudo systemctl status opencraft

# Veja os logs
journalctl -u opencraft -f
```

## 9) Acesse o painel de controle do OpenCraft

Substitua `user@gateway-host` pelo nome de usuário e hostname ou endereço IP do seu Pi.

No seu computador, peça ao Pi para imprimir uma URL nova do painel:

```bash
ssh user@gateway-host 'opencraft dashboard --no-open'
```

O comando imprime `Dashboard URL:`. Dependendo de como `gateway.auth.token`
está configurado, a URL pode ser um link simples `http://127.0.0.1:18789/` ou um que
inclui `#token=...`.

Em outro terminal no seu computador, crie o túnel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Depois abra a URL do painel impressa no seu navegador local.

Se a UI pedir autenticação, cole o token de `gateway.auth.token`
(ou `OPENCLAW_GATEWAY_TOKEN`) nas configurações da Control UI.

Para acesso remoto sempre ativo, veja [Tailscale](/gateway/tailscale).

---

## Otimizações de desempenho

### Use um SSD USB (melhoria enorme)

Cartões SD são lentos e se desgastam. Um SSD USB melhora dramaticamente o desempenho:

```bash
# Verifique se está bootando via USB
lsblk
```

Veja o [guia de boot USB do Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) para configuração.

### Acelere a inicialização da CLI (cache de compilação de módulos)

Em hosts Pi de menor potência, ative o cache de compilação de módulos do Node para que execuções repetidas da CLI sejam mais rápidas:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/opencraft-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/opencraft-compile-cache
mkdir -p /var/tmp/opencraft-compile-cache
export OPENCRAFT_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Notas:

- `NODE_COMPILE_CACHE` acelera execuções subsequentes (`status`, `health`, `--help`).
- `/var/tmp` sobrevive a reinicializações melhor que `/tmp`.
- `OPENCRAFT_NO_RESPAWN=1` evita custo extra de inicialização do auto-respawn da CLI.
- A primeira execução aquece o cache; execuções posteriores se beneficiam mais.

### Ajuste de inicialização do systemd (opcional)

Se este Pi está principalmente executando OpenCraft, adicione um drop-in de serviço para reduzir
jitter de reinicialização e manter o ambiente de inicialização estável:

```bash
sudo systemctl edit opencraft
```

```ini
[Service]
Environment=OPENCRAFT_NO_RESPAWN=1
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

Se possível, mantenha o estado/cache do OpenCraft em armazenamento com SSD para evitar
gargalos de I/O aleatório do cartão SD durante inicializações a frio.

Como as políticas de `Restart=` ajudam na recuperação automatizada:
[o systemd pode automatizar a recuperação de serviços](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Reduza o uso de memória

```bash
# Desative alocação de memória GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Desative Bluetooth se não precisar
sudo systemctl disable bluetooth
```

### Monitore os recursos

```bash
# Verifique a memória
free -h

# Verifique a temperatura da CPU
vcgencmd measure_temp

# Monitoramento ao vivo
htop
```

---

## Notas específicas de ARM

### Compatibilidade de binários

A maioria dos recursos do OpenCraft funciona em ARM64, mas alguns binários externos podem precisar de builds ARM:

| Ferramenta         | Status ARM64 | Notas                               |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Funciona muito bem                  |
| WhatsApp (Baileys) | ✅           | JS puro, sem problemas              |
| Telegram           | ✅           | JS puro, sem problemas              |
| gog (Gmail CLI)    | ⚠️           | Verifique se há release ARM         |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Se uma Skill falhar, verifique se seu binário tem um build ARM. Muitas ferramentas Go/Rust têm; algumas não.

### 32-bit vs 64-bit

**Sempre use SO 64-bit.** Node.js e muitas ferramentas modernas o exigem. Verifique com:

```bash
uname -m
# Deve mostrar: aarch64 (64-bit) não armv7l (32-bit)
```

---

## Configuração de modelo recomendada

Como o Pi é apenas o Gateway (modelos rodam na nuvem), use modelos baseados em API:

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

**Não tente rodar LLMs locais em um Pi** — até modelos pequenos são muito lentos. Deixe o Claude/GPT fazer o trabalho pesado.

---

## Inicialização automática no boot

O onboarding configura isso, mas para verificar:

```bash
# Verifique se o serviço está habilitado
sudo systemctl is-enabled opencraft

# Habilite se não estiver
sudo systemctl enable opencraft

# Inicie no boot
sudo systemctl start opencraft
```

---

## Solução de problemas

### Falta de memória (OOM)

```bash
# Verifique a memória
free -h

# Adicione mais swap (veja a Etapa 5)
# Ou reduza serviços em execução no Pi
```

### Desempenho lento

- Use SSD USB em vez de cartão SD
- Desative serviços não usados: `sudo systemctl disable cups bluetooth avahi-daemon`
- Verifique throttling da CPU: `vcgencmd get_throttled` (deve retornar `0x0`)

### Serviço não inicia

```bash
# Verifique os logs
journalctl -u opencraft --no-pager -n 100

# Correção comum: recompile
cd ~/opencraft  # se usar instalação hackeável
npm run build
sudo systemctl restart opencraft
```

### Problemas com binários ARM

Se uma Skill falhar com "exec format error":

1. Verifique se o binário tem um build ARM64
2. Tente compilar a partir do código-fonte
3. Ou use um container Docker com suporte ARM

### Quedas de WiFi

Para Pis headless em WiFi:

```bash
# Desative gerenciamento de energia do WiFi
sudo iwconfig wlan0 power off

# Torne permanente
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Comparação de custos

| Configuração   | Custo único   | Custo mensal | Notas                     |
| -------------- | ------------- | ------------ | ------------------------- |
| **Pi 4 (2GB)** | ~$45          | $0           | + energia (~$5/ano)       |
| **Pi 4 (4GB)** | ~$55          | $0           | Recomendado               |
| **Pi 5 (4GB)** | ~$60          | $0           | Melhor desempenho         |
| **Pi 5 (8GB)** | ~$80          | $0           | Exagero mas à prova de futuro |
| DigitalOcean   | $0            | $6/mês       | $72/ano                   |
| Hetzner        | $0            | €3,79/mês    | ~$50/ano                  |

**Ponto de equilíbrio:** Um Pi se paga em ~6-12 meses versus VPS na nuvem.

---

## Veja também

- [Guia do Linux](/platforms/linux) — configuração geral do Linux
- [Guia do DigitalOcean](/platforms/digitalocean) — alternativa na nuvem
- [Guia do Hetzner](/install/hetzner) — configuração com Docker
- [Tailscale](/gateway/tailscale) — acesso remoto
- [Nós](/nodes) — emparelhe seu laptop/telefone com o Gateway do Pi
