---
summary: "Hub de hospedagem VPS para o OpenCraft (Oracle/Fly/Hetzner/GCP/exe.dev)"
read_when:
  - Você quer rodar o Gateway na nuvem
  - Você precisa de um mapa rápido de guias de VPS/hospedagem
title: "Hospedagem VPS"
---

# Hospedagem VPS

Este hub linka os guias suportados de VPS/hospedagem e explica como
deployments em nuvem funcionam em alto nível.

## Escolha um provedor

- **Railway** (um clique + setup no browser): [Railway](/install/railway)
- **Northflank** (um clique + setup no browser): [Northflank](/install/northflank)
- **Oracle Cloud (Sempre Gratuito)**: [Oracle](/platforms/oracle) — $0/mês (Always Free, ARM; capacidade/cadastro pode ser complicado)
- **Fly.io**: [Fly.io](/install/fly)
- **Hetzner (Docker)**: [Hetzner](/install/hetzner)
- **GCP (Compute Engine)**: [GCP](/install/gcp)
- **exe.dev** (VM + proxy HTTPS): [exe.dev](/install/exe-dev)
- **AWS (EC2/Lightsail/free tier)**: funciona bem também. Guia em vídeo:
  [https://x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)

## Como funcionam os setups em nuvem

- O **Gateway roda no VPS** e é dono do estado + workspace.
- Você conecta do seu laptop/telefone via **Control UI** ou **Tailscale/SSH**.
- Trate o VPS como fonte da verdade e **faça backup** do estado + workspace.
- Padrão seguro: mantenha o Gateway no loopback e acesse via túnel SSH ou Tailscale Serve.
  Se você fizer bind para `lan`/`tailnet`, exija `gateway.auth.token` ou `gateway.auth.password`.

Acesso remoto: [Gateway remoto](/gateway/remote)
Hub de plataformas: [Plataformas](/platforms)

## Agente corporativo compartilhado em um VPS

Esta é uma configuração válida quando os usuários estão em um único limite de confiança (por exemplo, uma equipe de uma empresa), e o agente é apenas para negócios.

- Mantenha em um runtime dedicado (VPS/VM/container + usuário/contas de OS dedicados).
- Não faça login nesse runtime em contas pessoais da Apple/Google ou perfis pessoais de browser/gerenciador de senhas.
- Se os usuários são adversariais entre si, divida por gateway/host/usuário de OS.

Detalhes do modelo de segurança: [Segurança](/gateway/security)

## Usando nodes com um VPS

Você pode manter o Gateway na nuvem e parear **nodes** nos seus dispositivos locais
(Mac/iOS/Android/headless). Os nodes fornecem tela/câmera/canvas local e capacidades `system.run`
enquanto o Gateway permanece na nuvem.

Docs: [Nodes](/nodes), [CLI de Nodes](/cli/nodes)

## Ajuste de inicialização para VMs pequenas e hosts ARM

Se os comandos CLI parecerem lentos em VMs de baixa potência (ou hosts ARM), habilite o cache de compilação de módulo do Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` melhora os tempos de inicialização de comandos repetidos.
- `OPENCLAW_NO_RESPAWN=1` evita overhead extra de inicialização de um caminho de self-respawn.
- O primeiro comando aquece o cache; execuções subsequentes são mais rápidas.
- Para especificidades do Raspberry Pi, veja [Raspberry Pi](/platforms/raspberry-pi).

### Checklist de ajuste do systemd (opcional)

Para hosts de VM usando `systemd`, considere:

- Adicionar env de serviço para caminho de inicialização estável:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Manter comportamento de reinicialização explícito:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferir discos com SSD para caminhos de estado/cache para reduzir penalidades de cold-start por I/O aleatório.

Exemplo:

```bash
sudo systemctl edit opencraft
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Como as políticas `Restart=` ajudam na recuperação automática:
[o systemd pode automatizar a recuperação de serviços](https://www.redhat.com/en/blog/systemd-automate-recovery).
