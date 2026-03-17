---
summary: "Instalação automatizada e reforçada do OpenCraft com Ansible, VPN Tailscale e isolamento por firewall"
read_when:
  - Você quer deployment automatizado de servidor com reforço de segurança
  - Você precisa de setup isolado por firewall com acesso VPN
  - Você está fazendo deploy em servidores Debian/Ubuntu remotos
title: "Ansible"
---

# Instalação com Ansible

A forma recomendada de fazer deploy do OpenCraft em servidores de produção é via **[opencraft-ansible](https://github.com/editzffaleta/OpenCraft-ansible)** — um instalador automatizado com arquitetura security-first.

## Início Rápido

Instalação com um comando:

```bash
curl -fsSL https://raw.githubusercontent.com/editzffaleta/OpenCraft-ansible/main/install.sh | bash
```

> **📦 Guia completo: [github.com/editzffaleta/OpenCraft-ansible](https://github.com/editzffaleta/OpenCraft-ansible)**
>
> O repositório opencraft-ansible é a fonte da verdade para deployment com Ansible. Esta página é apenas uma visão geral rápida.

## O Que Você Recebe

- 🔒 **Segurança com firewall primeiro**: UFW + isolamento Docker (apenas SSH + Tailscale acessíveis)
- 🔐 **VPN Tailscale**: Acesso remoto seguro sem expor serviços publicamente
- 🐳 **Docker**: Containers sandbox isolados, bindings apenas em localhost
- 🛡️ **Defesa em profundidade**: Arquitetura de segurança em 4 camadas
- 🚀 **Setup com um comando**: Deployment completo em minutos
- 🔧 **Integração com Systemd**: Auto-start na inicialização com reforço

## Requisitos

- **SO**: Debian 11+ ou Ubuntu 20.04+
- **Acesso**: Privilégios root ou sudo
- **Rede**: Conexão com internet para instalação de pacotes
- **Ansible**: 2.14+ (instalado automaticamente pelo script de início rápido)

## O Que É Instalado

O playbook Ansible instala e configura:

1. **Tailscale** (VPN mesh para acesso remoto seguro)
2. **Firewall UFW** (apenas portas SSH + Tailscale)
3. **Docker CE + Compose V2** (para sandboxes de agent)
4. **Node.js 24 + pnpm** (dependências de runtime; Node 22 LTS, atualmente `22.16+`, permanece suportado para compatibilidade)
5. **OpenCraft** (baseado no host, não containerizado)
6. **Serviço Systemd** (auto-start com reforço de segurança)

Nota: O Gateway roda **diretamente no host** (não em Docker), mas sandboxes de agent usam Docker para isolamento. Veja [Sandboxing](/gateway/sandboxing) para detalhes.

## Setup Pós-Instalação

Após a instalação completar, mude para o usuário opencraft:

```bash
sudo -i -u opencraft
```

O script pós-instalação irá guiá-lo através de:

1. **Assistente de onboarding**: Configure as definições do OpenCraft
2. **Login de provider**: Conecte WhatsApp/Telegram/Discord/Signal
3. **Teste do Gateway**: Verifique a instalação
4. **Setup do Tailscale**: Conecte à sua mesh VPN

### Comandos rápidos

```bash
# Verificar status do serviço
sudo systemctl status opencraft

# Ver logs ao vivo
sudo journalctl -u opencraft -f

# Reiniciar gateway
sudo systemctl restart opencraft

# Login de provider (execute como usuário opencraft)
sudo -i -u opencraft
opencraft channels login
```

## Arquitetura de Segurança

### Defesa em 4 Camadas

1. **Firewall (UFW)**: Apenas SSH (22) + Tailscale (41641/udp) expostos publicamente
2. **VPN (Tailscale)**: Gateway acessível apenas via mesh VPN
3. **Isolamento Docker**: Cadeia iptables DOCKER-USER previne exposição de porta externa
4. **Reforço Systemd**: NoNewPrivileges, PrivateTmp, usuário não-privilegiado

### Verificação

Teste a superfície de ataque externa:

```bash
nmap -p- YOUR_SERVER_IP
```

Deve mostrar **apenas a porta 22** (SSH) aberta. Todos os outros serviços (Gateway, Docker) estão bloqueados.

### Disponibilidade do Docker

Docker é instalado para **sandboxes de agent** (execução isolada de ferramentas), não para rodar o Gateway em si. O Gateway faz bind apenas em localhost e é acessível via VPN Tailscale.

Veja [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) para configuração de sandbox.

## Instalação Manual

Se você preferir controle manual sobre a automação:

```bash
# 1. Instalar pré-requisitos
sudo apt update && sudo apt install -y ansible git

# 2. Clonar repositório
git clone https://github.com/editzffaleta/OpenCraft-ansible.git
cd opencraft-ansible

# 3. Instalar coleções Ansible
ansible-galaxy collection install -r requirements.yml

# 4. Executar playbook
./run-playbook.sh

# Ou execute diretamente (depois execute manualmente /tmp/opencraft-setup.sh após)
# ansible-playbook playbook.yml --ask-become-pass
```

## Atualizando o OpenCraft

O instalador Ansible configura o OpenCraft para atualizações manuais. Veja [Atualizando](/install/updating) para o fluxo padrão de atualização.

Para re-executar o playbook Ansible (por exemplo, para mudanças de configuração):

```bash
cd opencraft-ansible
./run-playbook.sh
```

Nota: Isto é idempotente e seguro para executar múltiplas vezes.

## Solução de Problemas

### Firewall bloqueia minha conexão

Se você está bloqueado:

- Certifique-se de que pode acessar via VPN Tailscale primeiro
- Acesso SSH (porta 22) é sempre permitido
- O Gateway é **apenas** acessível via Tailscale por design

### Serviço não inicia

```bash
# Verificar logs
sudo journalctl -u opencraft -n 100

# Verificar permissões
sudo ls -la /opt/opencraft

# Testar inicialização manual
sudo -i -u opencraft
cd ~/opencraft
pnpm start
```

### Problemas com sandbox Docker

```bash
# Verificar se Docker está rodando
sudo systemctl status docker

# Verificar imagem de sandbox
sudo docker images | grep openclaw-sandbox

# Construir imagem de sandbox se ausente
cd /opt/editzffaleta/OpenCraft
sudo -u opencraft ./scripts/sandbox-setup.sh
```

### Login de provider falha

Certifique-se de que está rodando como o usuário `opencraft`:

```bash
sudo -i -u opencraft
opencraft channels login
```

## Configuração Avançada

Para arquitetura de segurança detalhada e solução de problemas:

- [Arquitetura de Segurança](https://github.com/editzffaleta/OpenCraft-ansible/blob/main/docs/security.md)
- [Detalhes Técnicos](https://github.com/editzffaleta/OpenCraft-ansible/blob/main/docs/architecture.md)
- [Guia de Solução de Problemas](https://github.com/editzffaleta/OpenCraft-ansible/blob/main/docs/troubleshooting.md)

## Relacionado

- [opencraft-ansible](https://github.com/editzffaleta/OpenCraft-ansible) — guia completo de deployment
- [Docker](/install/docker) — setup containerizado do Gateway
- [Sandboxing](/gateway/sandboxing) — configuração de sandbox de agent
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) — isolamento por agent
