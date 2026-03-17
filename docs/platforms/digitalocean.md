---
summary: "OpenCraft no DigitalOcean (opção simples de VPS pago)"
read_when:
  - Configurando OpenCraft no DigitalOcean
  - Procurando hospedagem VPS barata para OpenCraft
title: "DigitalOcean"
---

# OpenCraft no DigitalOcean

## Objetivo

Execute um Gateway OpenCraft persistente no DigitalOcean por **$6/mês** (ou $4/mês com preço reservado).

Se você quiser uma opção de $0/mês e não se importar com ARM + configuração específica do provedor, veja o [guia do Oracle Cloud](/platforms/oracle).

## Comparação de custos (2026)

| Provedor     | Plano           | Especificações           | Preço/mês   | Notas                                 |
| ------------ | --------------- | ------------------------ | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | até 4 OCPU, 24GB RAM    | $0          | ARM, capacidade limitada / problemas de cadastro |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM         | €3,79 (~$4) | Opção paga mais barata                |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM         | $6          | UI fácil, boa documentação            |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM         | $6          | Muitas localizações                   |
| Linode       | Nanode          | 1 vCPU, 1GB RAM         | $5          | Agora parte da Akamai                 |

**Escolhendo um provedor:**

- DigitalOcean: UX mais simples + configuração previsível (este guia)
- Hetzner: bom custo-benefício (veja o [guia do Hetzner](/install/hetzner))
- Oracle Cloud: pode ser $0/mês, mas é mais complicado e somente ARM (veja o [guia do Oracle](/platforms/oracle))

---

## Pré-requisitos

- Conta no DigitalOcean ([cadastre-se com $200 de crédito grátis](https://m.do.co/c/signup))
- Par de chaves SSH (ou disposição para usar autenticação por senha)
- ~20 minutos

## 1) Crie um Droplet

<Warning>
Use uma imagem base limpa (Ubuntu 24.04 LTS). Evite imagens 1-click do Marketplace de terceiros, a menos que você tenha revisado seus scripts de inicialização e padrões de firewall.
</Warning>

1. Faça login no [DigitalOcean](https://cloud.digitalocean.com/)
2. Clique em **Create → Droplets**
3. Escolha:
   - **Região:** A mais próxima de você (ou dos seus usuários)
   - **Imagem:** Ubuntu 24.04 LTS
   - **Tamanho:** Basic → Regular → **$6/mês** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Autenticação:** Chave SSH (recomendado) ou senha
4. Clique em **Create Droplet**
5. Anote o endereço IP

## 2) Conecte via SSH

```bash
ssh root@SEU_IP_DO_DROPLET
```

## 3) Instale o OpenCraft

```bash
# Atualize o sistema
apt update && apt upgrade -y

# Instale Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Instale o OpenCraft
curl -fsSL https://opencraft.ai/install.sh | bash

# Verifique
opencraft --version
```

## 4) Execute o Onboarding

```bash
opencraft onboard --install-daemon
```

O assistente vai guiá-lo através de:

- Autenticação de modelo (chaves API ou OAuth)
- Configuração de canal (Telegram, WhatsApp, Discord, etc.)
- Token do Gateway (gerado automaticamente)
- Instalação do daemon (systemd)

## 5) Verifique o Gateway

```bash
# Verifique o status
opencraft status

# Verifique o serviço
systemctl --user status opencraft-gateway.service

# Veja os logs
journalctl --user -u opencraft-gateway.service -f
```

## 6) Acesse o Painel de Controle

O Gateway se vincula ao loopback por padrão. Para acessar a Control UI:

**Opção A: Túnel SSH (recomendado)**

```bash
# Da sua máquina local
ssh -L 18789:localhost:18789 root@SEU_IP_DO_DROPLET

# Depois abra: http://localhost:18789
```

**Opção B: Tailscale Serve (HTTPS, somente loopback)**

```bash
# No droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure o Gateway para usar Tailscale Serve
opencraft config set gateway.tailscale.mode serve
opencraft gateway restart
```

Abra: `https://<magicdns>/`

Notas:

- Serve mantém o Gateway somente em loopback e autentica o tráfego da Control UI/WebSocket via cabeçalhos de identidade do Tailscale (autenticação sem token assume host de Gateway confiável; APIs HTTP ainda exigem token/senha).
- Para exigir token/senha em vez disso, defina `gateway.auth.allowTailscale: false` ou use `gateway.auth.mode: "password"`.

**Opção C: Bind na tailnet (sem Serve)**

```bash
opencraft config set gateway.bind tailnet
opencraft gateway restart
```

Abra: `http://<tailscale-ip>:18789` (token obrigatório).

## 7) Conecte seus canais

### Telegram

```bash
opencraft pairing list telegram
opencraft pairing approve telegram <CÓDIGO>
```

### WhatsApp

```bash
opencraft channels login whatsapp
# Escaneie o código QR
```

Veja [Canais](/channels) para outros provedores.

---

## Otimizações para 1GB de RAM

O droplet de $6 tem apenas 1GB de RAM. Para manter tudo funcionando bem:

### Adicione swap (recomendado)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Use um modelo mais leve

Se você estiver tendo OOMs, considere:

- Usar modelos baseados em API (Claude, GPT) em vez de modelos locais
- Definir `agents.defaults.model.primary` para um modelo menor

### Monitore a memória

```bash
free -h
htop
```

---

## Persistência

Todo o estado fica em:

- `~/.opencraft/` — config, credenciais, dados de sessão
- `~/.opencraft/workspace/` — workspace (SOUL.md, memória, etc.)

Esses sobrevivem a reinicializações. Faça backup periodicamente:

```bash
tar -czvf opencraft-backup.tar.gz ~/.opencraft ~/.opencraft/workspace
```

---

## Alternativa gratuita do Oracle Cloud

O Oracle Cloud oferece instâncias ARM **Always Free** que são significativamente mais poderosas do que qualquer opção paga aqui — por $0/mês.

| O que você obtém    | Especificações             |
| ------------------- | -------------------------- |
| **4 OCPUs**         | ARM Ampere A1              |
| **24GB RAM**        | Mais que suficiente        |
| **200GB de armazenamento** | Volume de bloco      |
| **Grátis para sempre** | Sem cobranças no cartão |

**Ressalvas:**

- O cadastro pode ser complicado (tente novamente se falhar)
- Arquitetura ARM — a maioria das coisas funciona, mas alguns binários precisam de builds ARM

Para o guia completo de configuração, veja [Oracle Cloud](/platforms/oracle). Para dicas de cadastro e solução de problemas do processo de inscrição, veja este [guia da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Solução de problemas

### O Gateway não inicia

```bash
opencraft gateway status
opencraft doctor --non-interactive
journalctl -u opencraft --no-pager -n 50
```

### Porta já em uso

```bash
lsof -i :18789
kill <PID>
```

### Sem memória

```bash
# Verifique a memória
free -h

# Adicione mais swap
# Ou atualize para o droplet de $12/mês (2GB RAM)
```

---

## Veja também

- [Guia do Hetzner](/install/hetzner) — mais barato, mais poderoso
- [Instalação com Docker](/install/docker) — configuração containerizada
- [Tailscale](/gateway/tailscale) — acesso remoto seguro
- [Configuração](/gateway/configuration) — referência completa de configuração
