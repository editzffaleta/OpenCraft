---
summary: "Hub de hospedagem VPS para OpenCraft (Oracle/Fly/Hetzner/GCP/exe.dev)"
read_when:
  - Você quer executar o Gateway na nuvem
  - Você precisa de um mapa rápido dos guias de VPS/hospedagem
title: "Hospedagem VPS"
---

# Hospedagem VPS

Este hub vincula os guias de VPS/hospedagem suportados e explica como
implantações na nuvem funcionam em alto nível.

## Escolha um provedor

- **Railway** (um clique + configuração pelo navegador): [Railway](/install/railway)
- **Northflank** (um clique + configuração pelo navegador): [Northflank](/install/northflank)
- **Oracle Cloud (Always Free)**: [Oracle](/platforms/oracle) — $0/mês (Always Free, ARM; capacidade/cadastro pode ser instável)
- **Fly.io**: [Fly.io](/install/fly)
- **Hetzner (Docker)**: [Hetzner](/install/hetzner)
- **GCP (Compute Engine)**: [GCP](/install/gcp)
- **exe.dev** (VM + proxy HTTPS): [exe.dev](/install/exe-dev)
- **AWS (EC2/Lightsail/free tier)**: funciona bem também. Guia em vídeo:
  [https://x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)

## Como funcionam as configurações na nuvem

- O **Gateway roda no VPS** e é dono do estado + workspace.
- Você se conecta do seu laptop/celular via **Control UI** ou **Tailscale/SSH**.
- Trate o VPS como a fonte de verdade e **faça backup** do estado + workspace.
- Padrão seguro: mantenha o Gateway em loopback e acesse-o via túnel SSH ou Tailscale Serve.
  Se você vincular a `lan`/`tailnet`, exija `gateway.auth.token` ou `gateway.auth.password`.

Acesso remoto: [Gateway remoto](/gateway/remote)
Hub de plataformas: [Plataformas](/platforms)

## Agente compartilhado de empresa em um VPS

Esta é uma configuração válida quando os usuários estão em um mesmo limite de confiança (por exemplo, uma equipe de empresa), e o agente é apenas para negócios.

- Mantenha-o em um runtime dedicado (VPS/VM/container + usuário/contas de sistema operacional dedicados).
- Não faça login nesse runtime com contas pessoais Apple/Google ou perfis pessoais de navegador/gerenciador de senhas.
- Se os usuários são adversários entre si, separe por Gateway/host/usuário do sistema operacional.

Detalhes do modelo de segurança: [Segurança](/gateway/security)

## Usando Nodes com um VPS

Você pode manter o Gateway na nuvem e parear **Nodes** nos seus dispositivos locais
(Mac/iOS/Android/headless). Nodes fornecem tela/câmera/canvas local e capacidades de `system.run`
enquanto o Gateway permanece na nuvem.

Docs: [Nodes](/nodes), [CLI de Nodes](/cli/nodes)

## Ajuste de inicialização para VMs pequenas e hosts ARM

Se comandos CLI parecem lentos em VMs de baixa potência (ou hosts ARM), habilite o cache de compilação de módulos do Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/opencraft-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/opencraft-compile-cache
mkdir -p /var/tmp/opencraft-compile-cache
export OPENCRAFT_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` melhora os tempos de inicialização de comandos repetidos.
- `OPENCRAFT_NO_RESPAWN=1` evita overhead extra de inicialização de um caminho de auto-respawn.
- A primeira execução de comando aquece o cache; execuções subsequentes são mais rápidas.
- Para especificidades do Raspberry Pi, consulte [Raspberry Pi](/platforms/raspberry-pi).

### Checklist de ajuste systemd (opcional)

Para hosts VM usando `systemd`, considere:

- Adicionar variáveis de ambiente do serviço para caminho de inicialização estável:
  - `OPENCRAFT_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/opencraft-compile-cache`
- Manter comportamento de restart explícito:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferir discos com SSD para caminhos de estado/cache para reduzir penalidades de I/O aleatório na inicialização fria.

Exemplo:

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

Como políticas de `Restart=` ajudam na recuperação automatizada:
[systemd pode automatizar a recuperação de serviços](https://www.redhat.com/en/blog/systemd-automate-recovery).
