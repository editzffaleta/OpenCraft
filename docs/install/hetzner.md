---
summary: "Rodar o Gateway OpenCraft 24/7 em um VPS Hetzner barato (Docker) com estado durável e binários embutidos"
read_when:
  - Você quer o OpenCraft rodando 24/7 em um VPS cloud (não no seu laptop)
  - Você quer um Gateway sempre ativo e de nível produção em seu próprio VPS
  - Você quer controle total sobre persistência, binários e comportamento de reinicialização
  - Você está rodando o OpenCraft em Docker na Hetzner ou provedor similar
title: "Hetzner"
---

# OpenCraft na Hetzner (Docker, Guia de VPS para Produção)

## Objetivo

Rodar um Gateway OpenCraft persistente em um VPS Hetzner usando Docker, com estado durável, binários embutidos e comportamento seguro de reinicialização.

Se você quer "OpenCraft 24/7 por ~$5", esta é a configuração confiável mais simples.
Os preços da Hetzner mudam; escolha o menor VPS Debian/Ubuntu e escale se tiver OOMs.

Lembrete do modelo de segurança:

- Agentes compartilhados por empresa estão bem quando todos estão no mesmo limite de confiança e o runtime é apenas para negócios.
- Mantenha separação estrita: VPS/runtime dedicado + contas dedicadas; sem perfis pessoais de Apple/Google/navegador/gerenciador de senhas nesse host.
- Se os usuários são adversários entre si, separe por gateway/host/usuário do SO.

Veja [Segurança](/gateway/security) e [Hospedagem VPS](/vps).

## O que estamos fazendo (em termos simples)?

- Alugar um pequeno servidor Linux (VPS Hetzner)
- Instalar Docker (runtime de app isolado)
- Iniciar o Gateway OpenCraft no Docker
- Persistir `~/.opencraft` + `~/.opencraft/workspace` no host (sobrevive a reinicializações/reconstruções)
- Acessar a UI de Controle do seu laptop via túnel SSH

O Gateway pode ser acessado via:

- Port forwarding SSH do seu laptop
- Exposição direta de porta se você gerenciar firewall e tokens você mesmo

Este guia assume Ubuntu ou Debian na Hetzner.
Se você estiver em outro VPS Linux, adapte os pacotes conforme necessário.
Para o fluxo Docker genérico, veja [Docker](/install/docker).

---

## Caminho rápido (operadores experientes)

1. Provisionar VPS Hetzner
2. Instalar Docker
3. Clonar repositório OpenCraft
4. Criar diretórios persistentes no host
5. Configurar `.env` e `docker-compose.yml`
6. Compilar binários necessários na imagem
7. `docker compose up -d`
8. Verificar persistência e acesso ao Gateway

---

## O que você precisa

- VPS Hetzner com acesso root
- Acesso SSH do seu laptop
- Familiaridade básica com SSH + copiar/colar
- ~20 minutos
- Docker e Docker Compose
- Credenciais de auth do modelo
- Credenciais de provedor opcionais
  - QR do WhatsApp
  - Token de bot Telegram
  - OAuth do Gmail

---

## 1) Provisionar o VPS

Crie um VPS Ubuntu ou Debian na Hetzner.

Conecte como root:

```bash
ssh root@SEU_IP_DO_VPS
```

Este guia assume que o VPS é stateful.
Não o trate como infraestrutura descartável.

---

## 2) Instalar Docker (no VPS)

```bash
apt-get update
apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sh
```

Verifique:

```bash
docker --version
docker compose version
```

---

## 3) Clonar o repositório OpenCraft

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

Este guia assume que você construirá uma imagem personalizada para garantir a persistência de binários.

---

## 4) Criar diretórios persistentes no host

Containers Docker são efêmeros.
Todo estado de longa duração deve ficar no host.

```bash
mkdir -p /root/.opencraft/workspace

# Defina a propriedade para o usuário do container (uid 1000):
chown -R 1000:1000 /root/.opencraft
```

---

## 5) Configurar variáveis de ambiente

Crie `.env` na raiz do repositório.

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=mude-isso-agora
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/root/.opencraft
OPENCLAW_WORKSPACE_DIR=/root/.opencraft/workspace

GOG_KEYRING_PASSWORD=mude-isso-agora
XDG_CONFIG_HOME=/home/node/.opencraft
```

Gere secrets fortes:

```bash
openssl rand -hex 32
```

**Não commite este arquivo.**

---

## 6) Configuração do Docker Compose

Crie ou atualize `docker-compose.yml`.

```yaml
services:
  openclaw-gateway:
    image: ${OPENCLAW_IMAGE}
    build: .
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - HOME=/home/node
      - NODE_ENV=production
      - TERM=xterm-256color
      - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
      - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
      - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
      - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
      - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    volumes:
      - ${OPENCLAW_CONFIG_DIR}:/home/node/.opencraft
      - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.opencraft/workspace
    ports:
      # Recomendado: mantenha o Gateway apenas no loopback do VPS; acesse via túnel SSH.
      # Para expô-lo publicamente, remova o prefixo `127.0.0.1:` e configure o firewall.
      - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "${OPENCLAW_GATEWAY_BIND}",
        "--port",
        "${OPENCLAW_GATEWAY_PORT}",
        "--allow-unconfigured",
      ]
```

`--allow-unconfigured` é apenas por conveniência de bootstrap, não é substituto para uma configuração adequada do gateway. Ainda defina auth (`gateway.auth.token` ou senha) e use configurações de bind seguras para sua implantação.

---

## 7) Etapas compartilhadas de runtime Docker em VM

Use o guia de runtime compartilhado para o fluxo Docker em host comum:

- [Compilar binários necessários na imagem](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
- [Construir e iniciar](/install/docker-vm-runtime#build-and-launch)
- [O que persiste onde](/install/docker-vm-runtime#what-persists-where)
- [Atualizações](/install/docker-vm-runtime#updates)

---

## 8) Acesso específico da Hetzner

Após as etapas compartilhadas de build e inicialização, crie um túnel do seu laptop:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@SEU_IP_DO_VPS
```

Abra:

`http://127.0.0.1:18789/`

Cole seu token do gateway.

---

O mapa de persistência compartilhado fica em [Runtime Docker em VM](/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Para equipes que preferem fluxos de trabalho de infraestrutura como código, uma configuração Terraform mantida pela comunidade oferece:

- Configuração Terraform modular com gerenciamento de estado remoto
- Provisionamento automatizado via cloud-init
- Scripts de implantação (bootstrap, deploy, backup/restore)
- Hardening de segurança (firewall, UFW, acesso apenas por SSH)
- Configuração de túnel SSH para acesso ao gateway

**Repositórios:**

- Infraestrutura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Config Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Esta abordagem complementa a configuração Docker acima com implantações reproduzíveis, infraestrutura versionada e recuperação automática de desastres.

> **Nota:** Mantido pela comunidade. Para problemas ou contribuições, veja os links dos repositórios acima.
