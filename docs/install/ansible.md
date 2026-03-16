---
summary: "Instalação automatizada e reforçada do OpenCraft com Ansible, VPN Tailscale e isolamento por firewall"
read_when:
  - Você quer implantação automatizada em servidores com hardening de segurança
  - Você precisa de configuração isolada por firewall com acesso via VPN
  - Você está implantando em servidores remotos Debian/Ubuntu
title: "Ansible"
---

# Instalação via Ansible

A forma recomendada de implantar o OpenCraft em servidores de produção é via **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — um instalador automatizado com arquitetura de segurança em primeiro lugar.

## Início rápido

Instalação em um único comando:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

> **📦 Guia completo: [github.com/openclaw/openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**
>
> O repositório openclaw-ansible é a fonte da verdade para implantação com Ansible. Esta página é uma visão geral rápida.

## O que você obtém

- 🔒 **Segurança com firewall em primeiro lugar**: UFW + isolamento Docker (apenas SSH + Tailscale acessíveis)
- 🔐 **VPN Tailscale**: Acesso remoto seguro sem expor serviços publicamente
- 🐳 **Docker**: Containers sandbox isolados, bindings apenas para localhost
- 🛡️ **Defesa em profundidade**: Arquitetura de segurança em 4 camadas
- 🚀 **Configuração em um comando**: Implantação completa em minutos
- 🔧 **Integração com Systemd**: Inicialização automática com hardening

## Requisitos

- **SO**: Debian 11+ ou Ubuntu 20.04+
- **Acesso**: Privilégios root ou sudo
- **Rede**: Conexão à internet para instalação de pacotes
- **Ansible**: 2.14+ (instalado automaticamente pelo script de início rápido)

## O que é instalado

O playbook Ansible instala e configura:

1. **Tailscale** (VPN em malha para acesso remoto seguro)
2. **Firewall UFW** (apenas portas SSH + Tailscale)
3. **Docker CE + Compose V2** (para sandboxes de agentes)
4. **Node.js 24 + pnpm** (dependências de runtime; Node 22 LTS, atualmente `22.16+`, permanece suportado por compatibilidade)
5. **OpenCraft** (direto no host, não em container)
6. **Serviço Systemd** (inicialização automática com hardening de segurança)

Nota: O gateway roda **diretamente no host** (não no Docker), mas os sandboxes de agentes usam Docker para isolamento. Veja [Sandboxing](/gateway/sandboxing) para detalhes.

## Configuração pós-instalação

Após a conclusão da instalação, mude para o usuário opencraft:

```bash
sudo -i -u opencraft
```

O script pós-instalação guiará você por:

1. **Wizard de onboarding**: Configurar as definições do OpenCraft
2. **Login do provedor**: Conectar WhatsApp/Telegram/Discord/Signal
3. **Teste do gateway**: Verificar a instalação
4. **Configuração do Tailscale**: Conectar à sua malha VPN

### Comandos rápidos

```bash
# Verificar status do serviço
sudo systemctl status opencraft

# Ver logs em tempo real
sudo journalctl -u opencraft -f

# Reiniciar gateway
sudo systemctl restart opencraft

# Login do provedor (execute como usuário opencraft)
sudo -i -u opencraft
opencraft channels login
```

## Arquitetura de segurança

### Defesa em 4 camadas

1. **Firewall (UFW)**: Apenas SSH (22) + Tailscale (41641/udp) expostos publicamente
2. **VPN (Tailscale)**: Gateway acessível apenas via malha VPN
3. **Isolamento Docker**: Cadeia iptables DOCKER-USER impede exposição de portas externas
4. **Hardening Systemd**: NoNewPrivileges, PrivateTmp, usuário sem privilégios

### Verificação

Teste a superfície de ataque externa:

```bash
nmap -p- SEU_IP_DO_SERVIDOR
```

Deve mostrar **apenas a porta 22** (SSH) aberta. Todos os outros serviços (gateway, Docker) estão bloqueados.

### Disponibilidade do Docker

O Docker é instalado para **sandboxes de agentes** (execução isolada de ferramentas), não para rodar o gateway em si. O gateway faz bind apenas para localhost e é acessível via VPN Tailscale.

Veja [Sandbox Multi-Agente e Ferramentas](/tools/multi-agent-sandbox-tools) para configuração de sandbox.

## Instalação manual

Se preferir controle manual sobre a automação:

```bash
# 1. Instalar pré-requisitos
sudo apt update && sudo apt install -y ansible git

# 2. Clonar repositório
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# 3. Instalar coleções Ansible
ansible-galaxy collection install -r requirements.yml

# 4. Executar playbook
./run-playbook.sh

# Ou executar diretamente (depois execute /tmp/opencraft-setup.sh manualmente)
# ansible-playbook playbook.yml --ask-become-pass
```

## Atualizando o OpenCraft

O instalador Ansible configura o OpenCraft para atualizações manuais. Veja [Atualizando](/install/updating) para o fluxo padrão de atualização.

Para reexecutar o playbook Ansible (ex.: para mudanças de configuração):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Nota: Esta operação é idempotente e segura para executar múltiplas vezes.

## Solução de problemas

### Firewall bloqueia minha conexão

Se você for bloqueado:

- Certifique-se de que consegue acessar via VPN Tailscale primeiro
- Acesso SSH (porta 22) é sempre permitido
- O gateway é **somente** acessível via Tailscale por design

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

# Verificar imagem sandbox
sudo docker images | grep openclaw-sandbox

# Construir imagem sandbox se ausente
cd /opt/opencraft/opencraft
sudo -u opencraft ./scripts/sandbox-setup.sh
```

### Login do provedor falha

Certifique-se de estar rodando como usuário `opencraft`:

```bash
sudo -i -u opencraft
opencraft channels login
```

## Configuração avançada

Para arquitetura de segurança detalhada e solução de problemas:

- [Arquitetura de Segurança](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detalhes Técnicos](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guia de Solução de Problemas](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Relacionados

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — guia completo de implantação
- [Docker](/install/docker) — configuração de gateway em container
- [Sandboxing](/gateway/sandboxing) — configuração de sandbox de agentes
- [Sandbox Multi-Agente e Ferramentas](/tools/multi-agent-sandbox-tools) — isolamento por agente
