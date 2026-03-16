---
summary: "Rodar o Gateway OpenCraft 24/7 em uma VM GCP Compute Engine (Docker) com estado durável"
read_when:
  - Você quer o OpenCraft rodando 24/7 no GCP
  - Você quer um Gateway sempre ativo e de nível produção em sua própria VM
  - Você quer controle total sobre persistência, binários e comportamento de reinicialização
title: "GCP"
---

# OpenCraft no GCP Compute Engine (Docker, Guia de VPS para Produção)

## Objetivo

Rodar um Gateway OpenCraft persistente em uma VM GCP Compute Engine usando Docker, com estado durável, binários embutidos e comportamento seguro de reinicialização.

Se você quer "OpenCraft 24/7 por ~$5-12/mês", esta é uma configuração confiável no Google Cloud.
Os preços variam por tipo de máquina e região; escolha a menor VM que atenda à sua carga de trabalho e escale se tiver OOMs.

## O que estamos fazendo (em termos simples)?

- Criar um projeto GCP e habilitar cobrança
- Criar uma VM Compute Engine
- Instalar Docker (runtime de app isolado)
- Iniciar o Gateway OpenCraft no Docker
- Persistir `~/.opencraft` + `~/.opencraft/workspace` no host (sobrevive a reinicializações/reconstruções)
- Acessar a UI de Controle do seu laptop via túnel SSH

O Gateway pode ser acessado via:

- Port forwarding SSH do seu laptop
- Exposição direta de porta se você gerenciar firewall e tokens você mesmo

Este guia usa Debian no GCP Compute Engine.
Ubuntu também funciona; adapte os pacotes conforme necessário.
Para o fluxo Docker genérico, veja [Docker](/install/docker).

---

## Caminho rápido (operadores experientes)

1. Criar projeto GCP + habilitar API Compute Engine
2. Criar VM Compute Engine (e2-small, Debian 12, 20GB)
3. Acessar a VM via SSH
4. Instalar Docker
5. Clonar repositório OpenCraft
6. Criar diretórios persistentes no host
7. Configurar `.env` e `docker-compose.yml`
8. Compilar binários necessários, construir e iniciar

---

## O que você precisa

- Conta GCP (elegível ao plano gratuito para e2-micro)
- gcloud CLI instalada (ou use o Cloud Console)
- Acesso SSH do seu laptop
- Familiaridade básica com SSH + copiar/colar
- ~20-30 minutos
- Docker e Docker Compose
- Credenciais de auth do modelo
- Credenciais de provedor opcionais
  - QR do WhatsApp
  - Token de bot Telegram
  - OAuth do Gmail

---

## 1) Instalar gcloud CLI (ou usar o Console)

**Opção A: gcloud CLI** (recomendado para automação)

Instale a partir de [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

Inicialize e autentique:

```bash
gcloud init
gcloud auth login
```

**Opção B: Cloud Console**

Todos os passos podem ser feitos pela interface web em [https://console.cloud.google.com](https://console.cloud.google.com)

---

## 2) Criar um projeto GCP

**CLI:**

```bash
gcloud projects create meu-projeto-opencraft --name="OpenCraft Gateway"
gcloud config set project meu-projeto-opencraft
```

Habilite cobrança em [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (necessário para o Compute Engine).

Habilite a API Compute Engine:

```bash
gcloud services enable compute.googleapis.com
```

**Console:**

1. Vá para IAM & Admin > Criar Projeto
2. Nomeie e crie
3. Habilite cobrança para o projeto
4. Navegue para APIs & Serviços > Habilitar APIs > busque "Compute Engine API" > Habilitar

---

## 3) Criar a VM

**Tipos de máquina:**

| Tipo      | Especificações           | Custo               | Notas                                                    |
| --------- | ------------------------ | ------------------- | -------------------------------------------------------- |
| e2-medium | 2 vCPU, 4GB RAM          | ~$25/mês            | Mais confiável para builds Docker locais                 |
| e2-small  | 2 vCPU, 2GB RAM          | ~$12/mês            | Mínimo recomendado para build Docker                     |
| e2-micro  | 2 vCPU (compartilhado), 1GB RAM | Elegível plano gratuito | Frequentemente falha com OOM no build Docker (exit 137) |

**CLI:**

```bash
gcloud compute instances create opencraft-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --image-family=debian-12 \
  --image-project=debian-cloud
```

**Console:**

1. Vá para Compute Engine > Instâncias de VM > Criar instância
2. Nome: `opencraft-gateway`
3. Região: `us-central1`, Zona: `us-central1-a`
4. Tipo de máquina: `e2-small`
5. Disco de boot: Debian 12, 20GB
6. Criar

---

## 4) Acessar a VM via SSH

**CLI:**

```bash
gcloud compute ssh opencraft-gateway --zone=us-central1-a
```

**Console:**

Clique no botão "SSH" ao lado da sua VM no painel do Compute Engine.

Nota: A propagação de chave SSH pode levar 1-2 minutos após a criação da VM. Se a conexão for recusada, aguarde e tente novamente.

---

## 5) Instalar Docker (na VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Saia e entre novamente para a mudança de grupo ter efeito:

```bash
exit
```

Depois acesse via SSH novamente:

```bash
gcloud compute ssh opencraft-gateway --zone=us-central1-a
```

Verifique:

```bash
docker --version
docker compose version
```

---

## 6) Clonar o repositório OpenCraft

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

Este guia assume que você construirá uma imagem personalizada para garantir a persistência de binários.

---

## 7) Criar diretórios persistentes no host

Containers Docker são efêmeros.
Todo estado de longa duração deve ficar no host.

```bash
mkdir -p ~/.opencraft
mkdir -p ~/.opencraft/workspace
```

---

## 8) Configurar variáveis de ambiente

Crie `.env` na raiz do repositório.

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=mude-isso-agora
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/home/$USER/.opencraft
OPENCLAW_WORKSPACE_DIR=/home/$USER/.opencraft/workspace

GOG_KEYRING_PASSWORD=mude-isso-agora
XDG_CONFIG_HOME=/home/node/.opencraft
```

Gere secrets fortes:

```bash
openssl rand -hex 32
```

**Não commite este arquivo.**

---

## 9) Configuração do Docker Compose

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
      # Recomendado: mantenha o Gateway apenas no loopback da VM; acesse via túnel SSH.
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
      ]
```

---

## 10) Etapas compartilhadas de runtime Docker em VM

Use o guia de runtime compartilhado para o fluxo Docker em host comum:

- [Compilar binários necessários na imagem](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
- [Construir e iniciar](/install/docker-vm-runtime#build-and-launch)
- [O que persiste onde](/install/docker-vm-runtime#what-persists-where)
- [Atualizações](/install/docker-vm-runtime#updates)

---

## 11) Notas específicas do GCP

No GCP, se a build falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória. Use `e2-small` no mínimo, ou `e2-medium` para builds iniciais mais confiáveis.

Ao fazer bind para LAN (`OPENCLAW_GATEWAY_BIND=lan`), configure uma origem de navegador confiável antes de continuar:

```bash
docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
```

Se você mudou a porta do gateway, substitua `18789` pela porta configurada.

## 12) Acesso do seu laptop

Crie um túnel SSH para redirecionar a porta do Gateway:

```bash
gcloud compute ssh opencraft-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```

Abra no seu navegador:

`http://127.0.0.1:18789/`

Obtenha um link fresco do dashboard com token:

```bash
docker compose run --rm openclaw-cli dashboard --no-open
```

Cole o token daquela URL.

Se a UI de Controle mostrar `unauthorized` ou `disconnected (1008): pairing required`, aprove o dispositivo do navegador:

```bash
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

Precisa da referência de persistência e atualização compartilhadas novamente?
Veja [Runtime Docker em VM](/install/docker-vm-runtime#what-persists-where) e [atualizações do Runtime Docker em VM](/install/docker-vm-runtime#updates).

---

## Solução de problemas

**Conexão SSH recusada**

A propagação de chave SSH pode levar 1-2 minutos após a criação da VM. Aguarde e tente novamente.

**Problemas com OS Login**

Verifique seu perfil OS Login:

```bash
gcloud compute os-login describe-profile
```

Certifique-se de que sua conta tem as permissões IAM necessárias (Compute OS Login ou Compute OS Admin Login).

**Falta de memória (OOM)**

Se a build Docker falhar com `Killed` e `exit code 137`, a VM foi encerrada por OOM. Faça upgrade para e2-small (mínimo) ou e2-medium (recomendado para builds locais confiáveis):

```bash
# Pare a VM primeiro
gcloud compute instances stop opencraft-gateway --zone=us-central1-a

# Mude o tipo de máquina
gcloud compute instances set-machine-type opencraft-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Inicie a VM
gcloud compute instances start opencraft-gateway --zone=us-central1-a
```

---

## Contas de serviço (boas práticas de segurança)

Para uso pessoal, sua conta de usuário padrão funciona bem.

Para automação ou pipelines CI/CD, crie uma conta de serviço dedicada com permissões mínimas:

1. Crie uma conta de serviço:

   ```bash
   gcloud iam service-accounts create opencraft-deploy \
     --display-name="OpenCraft Deployment"
   ```

2. Conceda o papel Compute Instance Admin (ou papel personalizado mais restrito):

   ```bash
   gcloud projects add-iam-policy-binding meu-projeto-opencraft \
     --member="serviceAccount:opencraft-deploy@meu-projeto-opencraft.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Evite usar o papel Owner para automação. Use o princípio de menor privilégio.

Veja [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) para detalhes sobre papéis IAM.

---

## Próximos passos

- Configure canais de mensagens: [Canais](/channels)
- Emparelhe dispositivos locais como nós: [Nós](/nodes)
- Configure o Gateway: [Configuração do Gateway](/gateway/configuration)
