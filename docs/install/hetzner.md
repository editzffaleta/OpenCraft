---
summary: "Execute o Gateway OpenCraft 24/7 em um VPS Hetzner barato (Docker) com estado durável e binários incorporados"
read_when:
  - Você quer o OpenCraft rodando 24/7 em um VPS na nuvem (não no seu laptop)
  - Você quer um Gateway sempre ativo e pronto para produção no seu próprio VPS
  - Você quer controle total sobre persistência, binários e comportamento de reinicialização
  - Você está rodando o OpenCraft em Docker no Hetzner ou provedor similar
title: "Hetzner"
---

# OpenCraft no Hetzner (Docker, Guia de VPS para Produção)

## Objetivo

Executar um Gateway OpenCraft persistente em um VPS Hetzner usando Docker, com estado durável, binários incorporados e comportamento seguro de reinicialização.

Se você quer "OpenCraft 24/7 por ~$5", esta é a configuração confiável mais simples.
Os preços do Hetzner mudam; escolha o menor VPS Debian/Ubuntu e escale se encontrar OOMs.

Lembrete do modelo de segurança:

- Agentes compartilhados por empresa são ok quando todos estão no mesmo limite de confiança e o runtime é apenas para uso comercial.
- Mantenha separação rigorosa: VPS/runtime dedicado + contas dedicadas; sem perfis pessoais de Apple/Google/navegador/gerenciador de senhas nesse host.
- Se os usuários são adversários entre si, separe por gateway/host/usuário de SO.

Veja [Segurança](/gateway/security) e [Hospedagem VPS](/vps).

## O que estamos fazendo (termos simples)?

- Alugar um pequeno servidor Linux (VPS Hetzner)
- Instalar Docker (runtime isolado para aplicações)
- Iniciar o Gateway OpenCraft em Docker
- Persistir `~/.opencraft` + `~/.opencraft/workspace` no host (sobrevive a reinicializações/rebuilds)
- Acessar a Control UI do seu laptop via túnel SSH

O Gateway pode ser acessado via:

- Encaminhamento de porta SSH do seu laptop
- Exposição direta de porta se você gerenciar firewall e tokens por conta própria

Este guia assume Ubuntu ou Debian no Hetzner.
Se você está em outro VPS Linux, adapte os pacotes conforme necessário.
Para o fluxo genérico Docker, veja [Docker](/install/docker).

---

## Caminho rápido (operadores experientes)

1. Provisionar VPS Hetzner
2. Instalar Docker
3. Clonar o repositório OpenCraft
4. Criar diretórios persistentes no host
5. Configurar `.env` e `docker-compose.yml`
6. Incorporar binários necessários na imagem
7. `docker compose up -d`
8. Verificar persistência e acesso ao Gateway

---

## O que você precisa

- VPS Hetzner com acesso root
- Acesso SSH do seu laptop
- Conforto básico com SSH + copiar/colar
- ~20 minutos
- Docker e Docker Compose
- Credenciais de autenticação de modelo
- Credenciais opcionais de provedor
  - QR do WhatsApp
  - Token de Bot do Telegram
  - OAuth do Gmail

---

## 1) Provisionar o VPS

Crie um VPS Ubuntu ou Debian no Hetzner.

Conecte como root:

```bash
ssh root@YOUR_VPS_IP
```

Este guia assume que o VPS mantém estado.
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
git clone https://github.com/editzffaleta/OpenCraft.git
cd opencraft
```

Este guia assume que você vai construir uma imagem personalizada para garantir a persistência dos binários.

---

## 4) Criar diretórios persistentes no host

Contêineres Docker são efêmeros.
Todo estado de longa duração deve ficar no host.

```bash
mkdir -p /root/.opencraft/workspace

# Definir propriedade para o usuário do contêiner (uid 1000):
chown -R 1000:1000 /root/.opencraft
```

---

## 5) Configurar variáveis de ambiente

Crie `.env` na raiz do repositório.

```bash
OPENCRAFT_IMAGE=opencraft:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCRAFT_GATEWAY_BIND=lan
OPENCRAFT_GATEWAY_PORT=18789

OPENCRAFT_CONFIG_DIR=/root/.opencraft
OPENCRAFT_WORKSPACE_DIR=/root/.opencraft/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.opencraft
```

Gere secrets fortes:

```bash
openssl rand -hex 32
```

**Não faça commit deste arquivo.**

---

## 6) Configuração do Docker Compose

Crie ou atualize `docker-compose.yml`.

```yaml
services:
  opencraft-gateway:
    image: ${OPENCRAFT_IMAGE}
    build: .
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - HOME=/home/node
      - NODE_ENV=production
      - TERM=xterm-256color
      - OPENCRAFT_GATEWAY_BIND=${OPENCRAFT_GATEWAY_BIND}
      - OPENCRAFT_GATEWAY_PORT=${OPENCRAFT_GATEWAY_PORT}
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
      - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
      - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
      - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    volumes:
      - ${OPENCRAFT_CONFIG_DIR}:/home/node/.opencraft
      - ${OPENCRAFT_WORKSPACE_DIR}:/home/node/.opencraft/workspace
    ports:
      # Recomendado: manter o Gateway somente loopback no VPS; acesse via túnel SSH.
      # Para expor publicamente, remova o prefixo `127.0.0.1:` e configure o firewall adequadamente.
      - "127.0.0.1:${OPENCRAFT_GATEWAY_PORT}:18789"
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "${OPENCRAFT_GATEWAY_BIND}",
        "--port",
        "${OPENCRAFT_GATEWAY_PORT}",
        "--allow-unconfigured",
      ]
```

`--allow-unconfigured` é apenas por conveniência no bootstrap, não substitui uma configuração adequada do gateway. Ainda defina autenticação (`gateway.auth.token` ou senha) e use configurações seguras de bind para sua implantação.

---

## 7) Etapas compartilhadas de runtime Docker VM

Use o guia de runtime compartilhado para o fluxo comum de host Docker:

- [Incorporar binários necessários na imagem](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
- [Build e inicialização](/install/docker-vm-runtime#build-and-launch)
- [O que persiste e onde](/install/docker-vm-runtime#what-persists-where)
- [Atualizações](/install/docker-vm-runtime#updates)

---

## 8) Acesso específico do Hetzner

Após as etapas compartilhadas de build e inicialização, crie um túnel do seu laptop:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

Abra:

`http://127.0.0.1:18789/`

Cole seu token do gateway.

---

O mapa de persistência compartilhado está em [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Infraestrutura como Código (Terraform)

Para equipes que preferem fluxos de trabalho de infraestrutura como código, uma configuração Terraform mantida pela comunidade fornece:

- Configuração modular Terraform com gerenciamento de estado remoto
- Provisionamento automatizado via cloud-init
- Scripts de implantação (bootstrap, deploy, backup/restauração)
- Hardening de segurança (firewall, UFW, acesso somente SSH)
- Configuração de túnel SSH para acesso ao gateway

**Repositórios:**

- Infraestrutura: [opencraft-terraform-hetzner](https://github.com/andreesg/opencraft-terraform-hetzner)
- Configuração Docker: [opencraft-docker-config](https://github.com/andreesg/opencraft-docker-config)

Esta abordagem complementa a configuração Docker acima com implantações reproduzíveis, infraestrutura versionada e recuperação automatizada de desastres.

> **Nota:** Mantido pela comunidade. Para problemas ou contribuições, veja os links dos repositórios acima.
