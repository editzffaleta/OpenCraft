---
summary: "OpenCraft no Oracle Cloud (Always Free ARM)"
read_when:
  - Configurando OpenCraft no Oracle Cloud
  - Procurando hospedagem VPS de baixo custo para OpenCraft
  - Quer OpenCraft 24/7 em um servidor pequeno
title: "Oracle Cloud"
---

# OpenCraft no Oracle Cloud (OCI)

## Objetivo

Execute um Gateway OpenCraft persistente no nível **Always Free** ARM do Oracle Cloud.

O nível gratuito do Oracle pode ser uma ótima opção para o OpenCraft (especialmente se você já tem uma conta OCI), mas vem com tradeoffs:

- Arquitetura ARM (a maioria das coisas funciona, mas alguns binários podem ser somente x86)
- Capacidade e cadastro podem ser complicados

## Comparação de custos (2026)

| Provedor     | Plano           | Especificações           | Preço/mês | Notas                 |
| ------------ | --------------- | ------------------------ | --------- | --------------------- |
| Oracle Cloud | Always Free ARM | até 4 OCPU, 24GB RAM    | $0        | ARM, capacidade limitada |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM         | ~ $4      | Opção paga mais barata  |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM         | $6        | UI fácil, boa documentação |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM         | $6        | Muitas localizações     |
| Linode       | Nanode          | 1 vCPU, 1GB RAM         | $5        | Agora parte da Akamai   |

---

## Pré-requisitos

- Conta Oracle Cloud ([cadastro](https://www.oracle.com/cloud/free/)) — veja o [guia de cadastro da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se tiver problemas
- Conta Tailscale (gratuita em [tailscale.com](https://tailscale.com))
- ~30 minutos

## 1) Crie uma instância OCI

1. Faça login no [Oracle Cloud Console](https://cloud.oracle.com/)
2. Navegue para **Compute → Instances → Create Instance**
3. Configure:
   - **Nome:** `opencraft`
   - **Imagem:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (ou até 4)
   - **Memória:** 12 GB (ou até 24 GB)
   - **Volume de boot:** 50 GB (até 200 GB grátis)
   - **Chave SSH:** Adicione sua chave pública
4. Clique em **Create**
5. Anote o endereço IP público

**Dica:** Se a criação da instância falhar com "Out of capacity", tente um domínio de disponibilidade diferente ou tente novamente mais tarde. A capacidade do nível gratuito é limitada.

## 2) Conecte e atualize

```bash
# Conecte via IP público
ssh ubuntu@SEU_IP_PÚBLICO

# Atualize o sistema
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Nota:** `build-essential` é necessário para compilação ARM de algumas dependências.

## 3) Configure usuário e hostname

```bash
# Defina o hostname
sudo hostnamectl set-hostname opencraft

# Defina a senha do usuário ubuntu
sudo passwd ubuntu

# Ative lingering (mantém serviços do usuário em execução após logout)
sudo loginctl enable-linger ubuntu
```

## 4) Instale o Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=opencraft
```

Isso ativa o SSH do Tailscale, permitindo que você conecte via `ssh opencraft` de qualquer dispositivo na sua tailnet — sem IP público necessário.

Verifique:

```bash
tailscale status
```

**A partir de agora, conecte via Tailscale:** `ssh ubuntu@opencraft` (ou use o IP do Tailscale).

## 5) Instale o OpenCraft

```bash
curl -fsSL https://opencraft.ai/install.sh | bash
source ~/.bashrc
```

Quando perguntado "How do you want to hatch your bot?", selecione **"Do this later"**.

> Nota: Se você tiver problemas de build nativo ARM, comece com pacotes do sistema (por exemplo `sudo apt install -y build-essential`) antes de recorrer ao Homebrew.

## 6) Configure o Gateway (loopback + autenticação por token) e ative o Tailscale Serve

Use autenticação por token como padrão. É previsível e evita a necessidade de flags de "autenticação insegura" na Control UI.

```bash
# Mantenha o Gateway privado na VM
opencraft config set gateway.bind loopback

# Exija autenticação para o Gateway + Control UI
opencraft config set gateway.auth.mode token
opencraft doctor --generate-gateway-token

# Exponha via Tailscale Serve (HTTPS + acesso pela tailnet)
opencraft config set gateway.tailscale.mode serve
opencraft config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart opencraft-gateway
```

## 7) Verifique

```bash
# Verifique a versão
opencraft --version

# Verifique o status do daemon
systemctl --user status opencraft-gateway

# Verifique o Tailscale Serve
tailscale serve status

# Teste a resposta local
curl http://localhost:18789
```

## 8) Bloqueie a segurança da VCN

Agora que tudo está funcionando, bloqueie a VCN para bloquear todo o tráfego exceto Tailscale. A Virtual Cloud Network do OCI atua como um firewall na borda da rede — o tráfego é bloqueado antes de chegar à sua instância.

1. Vá para **Networking → Virtual Cloud Networks** no Console OCI
2. Clique na sua VCN → **Security Lists** → Default Security List
3. **Remova** todas as regras de ingress exceto:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Mantenha as regras de egress padrão (permitir todo tráfego de saída)

Isso bloqueia SSH na porta 22, HTTP, HTTPS e todo o resto na borda da rede. A partir de agora, você só pode conectar via Tailscale.

---

## Acesse a Control UI

De qualquer dispositivo na sua rede Tailscale:

```
https://opencraft.<nome-da-tailnet>.ts.net/
```

Substitua `<nome-da-tailnet>` pelo nome da sua tailnet (visível em `tailscale status`).

Sem necessidade de túnel SSH. O Tailscale fornece:

- Criptografia HTTPS (certificados automáticos)
- Autenticação via identidade Tailscale
- Acesso de qualquer dispositivo na sua tailnet (laptop, telefone, etc.)

---

## Segurança: VCN + Tailscale (baseline recomendado)

Com a VCN bloqueada (apenas UDP 41641 aberto) e o Gateway vinculado ao loopback, você tem uma forte defesa em profundidade: tráfego público é bloqueado na borda da rede, e acesso administrativo acontece pela sua tailnet.

Esta configuração frequentemente remove a _necessidade_ de regras extras de firewall no host puramente para parar ataques de força bruta SSH da Internet — mas você ainda deve manter o SO atualizado, executar `opencraft security audit` e verificar que não está acidentalmente escutando em interfaces públicas.

### O que já está protegido

| Etapa tradicional         | Necessário? | Por quê                                                                          |
| ------------------------- | ----------- | -------------------------------------------------------------------------------- |
| Firewall UFW              | Não         | VCN bloqueia antes do tráfego chegar à instância                                 |
| fail2ban                  | Não         | Sem força bruta se a porta 22 estiver bloqueada na VCN                           |
| Endurecimento do sshd     | Não         | SSH do Tailscale não usa sshd                                                    |
| Desativar login root      | Não         | Tailscale usa identidade Tailscale, não usuários do sistema                      |
| Auth somente por chave SSH| Não         | Tailscale autentica via sua tailnet                                              |
| Endurecimento IPv6        | Geralmente não | Depende das configurações da sua VCN/subnet; verifique o que está realmente atribuído/exposto |

### Ainda recomendado

- **Permissões de credenciais:** `chmod 700 ~/.opencraft`
- **Auditoria de segurança:** `opencraft security audit`
- **Atualizações do sistema:** `sudo apt update && sudo apt upgrade` regularmente
- **Monitore o Tailscale:** Revise dispositivos no [console admin do Tailscale](https://login.tailscale.com/admin)

### Verifique a postura de segurança

```bash
# Confirme que não há portas públicas escutando
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verifique que SSH do Tailscale está ativo
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Opcional: desative o sshd inteiramente
sudo systemctl disable --now ssh
```

---

## Fallback: túnel SSH

Se o Tailscale Serve não estiver funcionando, use um túnel SSH:

```bash
# Da sua máquina local (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@opencraft
```

Depois abra `http://localhost:18789`.

---

## Solução de problemas

### Criação da instância falha ("Out of capacity")

Instâncias ARM do nível gratuito são populares. Tente:

- Domínio de disponibilidade diferente
- Tente novamente em horários de baixa demanda (madrugada)
- Use o filtro "Always Free" ao selecionar o shape

### Tailscale não conecta

```bash
# Verifique o status
sudo tailscale status

# Re-autentique
sudo tailscale up --ssh --hostname=opencraft --reset
```

### O Gateway não inicia

```bash
opencraft gateway status
opencraft doctor --non-interactive
journalctl --user -u opencraft-gateway -n 50
```

### Não consegue acessar a Control UI

```bash
# Verifique se o Tailscale Serve está em execução
tailscale serve status

# Verifique se o Gateway está escutando
curl http://localhost:18789

# Reinicie se necessário
systemctl --user restart opencraft-gateway
```

### Problemas com binários ARM

Algumas ferramentas podem não ter builds ARM. Verifique:

```bash
uname -m  # Deve mostrar aarch64
```

A maioria dos pacotes npm funciona normalmente. Para binários, procure releases `linux-arm64` ou `aarch64`.

---

## Persistência

Todo o estado fica em:

- `~/.opencraft/` — config, credenciais, dados de sessão
- `~/.opencraft/workspace/` — workspace (SOUL.md, memória, artefatos)

Faça backup periodicamente:

```bash
tar -czvf opencraft-backup.tar.gz ~/.opencraft ~/.opencraft/workspace
```

---

## Veja também

- [Acesso remoto ao Gateway](/gateway/remote) — outros padrões de acesso remoto
- [Integração Tailscale](/gateway/tailscale) — documentação completa do Tailscale
- [Configuração do Gateway](/gateway/configuration) — todas as opções de configuração
- [Guia do DigitalOcean](/platforms/digitalocean) — se quiser pago + cadastro mais fácil
- [Guia do Hetzner](/install/hetzner) — alternativa baseada em Docker
