---
summary: "OpenCraft na Oracle Cloud (ARM Always Free)"
read_when:
  - Configurando o OpenCraft na Oracle Cloud
  - Procurando hospedagem VPS de baixo custo para o OpenCraft
  - Quer OpenCraft 24/7 num servidor pequeno
title: "Oracle Cloud"
---

# OpenCraft na Oracle Cloud (OCI)

## Objetivo

Rodar um Gateway OpenCraft persistente no tier **Always Free** ARM da Oracle Cloud.

O tier gratuito da Oracle pode ser uma ótima opção para o OpenCraft (especialmente se você já tem uma conta OCI), mas vem com trade-offs:

- Arquitetura ARM (a maioria das coisas funciona, mas alguns binários podem ser apenas x86)
- Capacidade e cadastro podem ser complicados

## Comparação de Custos (2026)

| Provedor     | Plano           | Especificações         | Preço/mês | Notas                      |
| ------------ | --------------- | ---------------------- | --------- | -------------------------- |
| Oracle Cloud | Always Free ARM | até 4 OCPU, 24GB RAM   | $0        | ARM, capacidade limitada   |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~$4       | Opção paga mais barata     |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6        | UI simples, bons docs      |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6        | Muitas localizações        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5        | Agora parte da Akamai      |

---

## Pré-requisitos

- Conta Oracle Cloud ([cadastro](https://www.oracle.com/cloud/free/)) — veja o [guia de cadastro da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se tiver problemas
- Conta Tailscale (gratuito em [tailscale.com](https://tailscale.com))
- ~30 minutos

## 1) Criar uma Instância OCI

1. Faça login no [Console Oracle Cloud](https://cloud.oracle.com/)
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

**Dica:** Se a criação da instância falhar com "Out of capacity", tente um domínio de disponibilidade diferente ou tente novamente mais tarde. A capacidade do tier gratuito é limitada.

## 2) Conectar e Atualizar

```bash
# Conectar via IP público
ssh ubuntu@SEU_IP_PUBLICO

# Atualizar sistema
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Nota:** `build-essential` é necessário para compilação ARM de algumas dependências.

## 3) Configurar Usuário e Hostname

```bash
# Definir hostname
sudo hostnamectl set-hostname opencraft

# Definir senha para o usuário ubuntu
sudo passwd ubuntu

# Habilitar lingering (mantém serviços do usuário rodando após logout)
sudo loginctl enable-linger ubuntu
```

## 4) Instalar Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=opencraft
```

Isso habilita SSH pelo Tailscale, para você poder conectar via `ssh opencraft` de qualquer dispositivo na sua tailnet — sem precisar do IP público.

Verifique:

```bash
tailscale status
```

**A partir de agora, conecte via Tailscale:** `ssh ubuntu@opencraft` (ou use o IP do Tailscale).

## 5) Instalar o OpenCraft

```bash
curl -fsSL https://opencraft.ai/install.sh | bash
source ~/.bashrc
```

Quando perguntado "How do you want to hatch your bot?", selecione **"Do this later"**.

> Nota: Se tiver problemas de build ARM nativos, comece com pacotes do sistema (ex: `sudo apt install -y build-essential`) antes de recorrer ao Homebrew.

## 6) Configurar Gateway (loopback + auth por token) e habilitar Tailscale Serve

Use auth por token como padrão. É previsível e evita precisar de flags "insecure auth" na Control UI.

```bash
# Manter o Gateway privado na VM
opencraft config set gateway.bind loopback

# Exigir auth para o Gateway + Control UI
opencraft config set gateway.auth.mode token
opencraft doctor --generate-gateway-token

# Expor via Tailscale Serve (HTTPS + acesso tailnet)
opencraft config set gateway.tailscale.mode serve
opencraft config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway
```

## 7) Verificar

```bash
# Verificar versão
opencraft --version

# Verificar status do daemon
systemctl --user status openclaw-gateway

# Verificar Tailscale Serve
tailscale serve status

# Testar resposta local
curl http://localhost:18789
```

## 8) Bloquear Segurança da VCN

Agora que tudo está funcionando, bloqueie a VCN para bloquear todo o tráfego exceto Tailscale. A Virtual Cloud Network da OCI age como firewall na borda da rede — o tráfego é bloqueado antes de alcançar sua instância.

1. Vá para **Networking → Virtual Cloud Networks** no Console OCI
2. Clique na sua VCN → **Security Lists** → Default Security List
3. **Remova** todas as regras de ingresso exceto:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Mantenha as regras de egresso padrão (permitir tudo de saída)

Isso bloqueia SSH na porta 22, HTTP, HTTPS e tudo mais na borda da rede. A partir de agora, você só pode conectar via Tailscale.

---

## Acessar a Control UI

De qualquer dispositivo na sua rede Tailscale:

```
https://opencraft.<nome-tailnet>.ts.net/
```

Substitua `<nome-tailnet>` pelo nome da sua tailnet (visível em `tailscale status`).

Sem necessidade de túnel SSH. O Tailscale fornece:

- Criptografia HTTPS (certificados automáticos)
- Autenticação via identidade Tailscale
- Acesso de qualquer dispositivo na sua tailnet (laptop, telefone, etc.)

---

## Segurança: VCN + Tailscale (baseline recomendado)

Com a VCN bloqueada (apenas UDP 41641 aberto) e o Gateway vinculado ao loopback, você tem forte defesa em profundidade: tráfego público é bloqueado na borda da rede, e acesso admin acontece pela sua tailnet.

Esta configuração frequentemente elimina a _necessidade_ de regras extras de firewall no host apenas para parar brute force SSH na Internet — mas você ainda deve manter o OS atualizado, rodar `opencraft security audit` e verificar se não está acidentalmente escutando em interfaces públicas.

### O que já está protegido

| Passo Tradicional      | Necessário? | Por quê                                                                     |
| ---------------------- | ----------- | --------------------------------------------------------------------------- |
| Firewall UFW           | Não         | VCN bloqueia antes do tráfego alcançar a instância                          |
| fail2ban               | Não         | Sem brute force se porta 22 bloqueada na VCN                                |
| Endurecimento do sshd  | Não         | Tailscale SSH não usa sshd                                                  |
| Desabilitar login root | Não         | Tailscale usa identidade Tailscale, não usuários do sistema                 |
| Auth somente chave SSH | Não         | Tailscale autentica via sua tailnet                                         |
| Endurecimento IPv6     | Geralmente não | Depende das configurações da sua VCN/subnet; verifique o que está atribuído |

### Ainda recomendado

- **Permissões de credenciais:** `chmod 700 ~/.opencraft`
- **Auditoria de segurança:** `opencraft security audit`
- **Atualizações do sistema:** `sudo apt update && sudo apt upgrade` regularmente
- **Monitorar Tailscale:** Revise dispositivos no [console admin do Tailscale](https://login.tailscale.com/admin)

### Verificar Postura de Segurança

```bash
# Confirmar que não há portas públicas escutando
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verificar se SSH Tailscale está ativo
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH ativo"

# Opcional: desabilitar sshd completamente
sudo systemctl disable --now ssh
```

---

## Fallback: Túnel SSH

Se o Tailscale Serve não estiver funcionando, use um túnel SSH:

```bash
# Da sua máquina local (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@opencraft
```

Depois abra `http://localhost:18789`.

---

## Troubleshooting

### Criação da instância falha ("Out of capacity")

Instâncias ARM de tier gratuito são populares. Tente:

- Domínio de disponibilidade diferente
- Tente novamente em horários fora do pico (início da manhã)
- Use o filtro "Always Free" ao selecionar shape

### Tailscale não conecta

```bash
# Verificar status
sudo tailscale status

# Re-autenticar
sudo tailscale up --ssh --hostname=opencraft --reset
```

### Gateway não inicia

```bash
opencraft gateway status
opencraft doctor --non-interactive
journalctl --user -u openclaw-gateway -n 50
```

### Não consegue acessar a Control UI

```bash
# Verificar se Tailscale Serve está rodando
tailscale serve status

# Verificar se o gateway está escutando
curl http://localhost:18789

# Reiniciar se necessário
systemctl --user restart openclaw-gateway
```

### Problemas com binários ARM

Algumas ferramentas podem não ter builds ARM. Verifique:

```bash
uname -m  # Deve mostrar aarch64
```

A maioria dos pacotes npm funciona bem. Para binários, procure releases `linux-arm64` ou `aarch64`.

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
- [Integração Tailscale](/gateway/tailscale) — docs completos do Tailscale
- [Configuração do Gateway](/gateway/configuration) — todas as opções de config
- [Guia DigitalOcean](/platforms/digitalocean) — se quiser pago + cadastro mais fácil
- [Guia Hetzner](/install/hetzner) — alternativa baseada em Docker
