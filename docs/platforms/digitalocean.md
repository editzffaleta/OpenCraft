---
summary: "OpenCraft na DigitalOcean (opção VPS paga simples)"
read_when:
  - Configurando o OpenCraft na DigitalOcean
  - Procurando hospedagem VPS barata para o OpenCraft
title: "DigitalOcean"
---

# OpenCraft na DigitalOcean

## Objetivo

Rodar um Gateway OpenCraft persistente na DigitalOcean por **$6/mês** (ou $4/mês com precificação reservada).

Se quiser uma opção de $0/mês e não se importar com ARM + configuração específica do provedor, veja o [guia Oracle Cloud](/platforms/oracle).

## Comparação de Custos (2026)

| Provedor     | Plano           | Especificações         | Preço/mês   | Notas                                |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------ |
| Oracle Cloud | Always Free ARM | até 4 OCPU, 24GB RAM   | $0          | ARM, capacidade limitada / cadastro  |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3,79 (~$4) | Opção paga mais barata               |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | UI simples, bons docs                |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | Muitas localizações                  |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | Agora parte da Akamai                |

**Escolhendo um provedor:**

- DigitalOcean: UX mais simples + configuração previsível (este guia)
- Hetzner: boa relação custo/desempenho (veja [guia Hetzner](/install/hetzner))
- Oracle Cloud: pode ser $0/mês, mas é mais complicado e somente ARM (veja [guia Oracle](/platforms/oracle))

---

## Pré-requisitos

- Conta DigitalOcean ([cadastro com $200 de crédito grátis](https://m.do.co/c/signup))
- Par de chaves SSH (ou disposição para usar auth por senha)
- ~20 minutos

## 1) Criar um Droplet

<Warning>
Use uma imagem base limpa (Ubuntu 24.04 LTS). Evite imagens 1-click de Marketplace de terceiros a menos que tenha revisado seus scripts de inicialização e padrões de firewall.
</Warning>

1. Faça login na [DigitalOcean](https://cloud.digitalocean.com/)
2. Clique em **Create → Droplets**
3. Escolha:
   - **Região:** Mais próxima de você (ou seus usuários)
   - **Imagem:** Ubuntu 24.04 LTS
   - **Tamanho:** Basic → Regular → **$6/mês** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Autenticação:** Chave SSH (recomendado) ou senha
4. Clique em **Create Droplet**
5. Anote o endereço IP

## 2) Conectar via SSH

```bash
ssh root@IP_DO_SEU_DROPLET
```

## 3) Instalar o OpenCraft

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Instalar OpenCraft
curl -fsSL https://opencraft.ai/install.sh | bash

# Verificar
opencraft --version
```

## 4) Executar Onboarding

```bash
opencraft onboard --install-daemon
```

O wizard vai orientar você por:

- Auth do modelo (chaves de API ou OAuth)
- Configuração de canal (Telegram, WhatsApp, Discord, etc.)
- Token do gateway (gerado automaticamente)
- Instalação do daemon (systemd)

## 5) Verificar o Gateway

```bash
# Verificar status
opencraft status

# Verificar serviço
systemctl --user status openclaw-gateway.service

# Ver logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Acessar o Dashboard

O gateway vincula ao loopback por padrão. Para acessar a Control UI:

**Opção A: Túnel SSH (recomendado)**

```bash
# Da sua máquina local
ssh -L 18789:localhost:18789 root@IP_DO_SEU_DROPLET

# Depois abra: http://localhost:18789
```

**Opção B: Tailscale Serve (HTTPS, somente loopback)**

```bash
# No droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configurar Gateway para usar Tailscale Serve
opencraft config set gateway.tailscale.mode serve
opencraft gateway restart
```

Abra: `https://<magicdns>/`

Notas:

- Serve mantém o Gateway somente loopback e autentica tráfego da Control UI/WebSocket via headers de identidade Tailscale (auth sem token assume host gateway confiável; APIs HTTP ainda requerem token/senha).
- Para exigir token/senha em vez disso, defina `gateway.auth.allowTailscale: false` ou use `gateway.auth.mode: "password"`.

**Opção C: Bind tailnet (sem Serve)**

```bash
opencraft config set gateway.bind tailnet
opencraft gateway restart
```

Abra: `http://<ip-tailscale>:18789` (token necessário).

## 7) Conectar seus Canais

### Telegram

```bash
opencraft pairing list telegram
opencraft pairing approve telegram <CÓDIGO>
```

### WhatsApp

```bash
opencraft channels login whatsapp
# Escanear QR code
```

Veja [Canais](/channels) para outros provedores.

---

## Otimizações para 1GB RAM

O droplet de $6 tem apenas 1GB RAM. Para manter tudo rodando suavemente:

### Adicionar swap (recomendado)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Use um modelo mais leve

Se estiver tendo OOMs, considere:

- Usar modelos baseados em API (Claude, GPT) em vez de modelos locais
- Definir `agents.defaults.model.primary` para um modelo menor

### Monitorar memória

```bash
free -h
htop
```

---

## Persistência

Todo o estado fica em:

- `~/.opencraft/` — config, credenciais, dados de sessão
- `~/.opencraft/workspace/` — workspace (SOUL.md, memória, etc.)

Sobrevivem a reinicializações. Faça backup periodicamente:

```bash
tar -czvf opencraft-backup.tar.gz ~/.opencraft ~/.opencraft/workspace
```

---

## Alternativa Gratuita Oracle Cloud

A Oracle Cloud oferece instâncias ARM **Always Free** significativamente mais poderosas do que qualquer opção paga aqui — por $0/mês.

| O que você recebe   | Especificações         |
| ------------------- | ---------------------- |
| **4 OCPUs**         | ARM Ampere A1          |
| **24GB RAM**        | Mais do que suficiente |
| **200GB storage**   | Volume em bloco        |
| **Para sempre grátis** | Sem cobranças no cartão |

**Ressalvas:**

- Cadastro pode ser complicado (tente novamente se falhar)
- Arquitetura ARM — a maioria das coisas funciona, mas alguns binários precisam de builds ARM

Para o guia completo de configuração, veja [Oracle Cloud](/platforms/oracle). Para dicas de cadastro e solução de problemas do processo de inscrição, veja este [guia da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Troubleshooting

### Gateway não inicia

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

### Falta de memória

```bash
# Verificar memória
free -h

# Adicionar mais swap
# Ou fazer upgrade para droplet de $12/mês (2GB RAM)
```

---

## Veja também

- [Guia Hetzner](/install/hetzner) — mais barato, mais poderoso
- [Instalação Docker](/install/docker) — configuração em container
- [Tailscale](/gateway/tailscale) — acesso remoto seguro
- [Configuração](/gateway/configuration) — referência completa de config
