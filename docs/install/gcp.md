---
summary: "Execute o Gateway OpenCraft 24/7 em uma VM GCP Compute Engine (Docker) com estado durável"
read_when:
  - Você quer o OpenCraft rodando 24/7 no GCP
  - Você quer um Gateway sempre ativo e pronto para produção na sua própria VM
  - Você quer controle total sobre persistência, binários e comportamento de reinicialização
title: "GCP"
---

# OpenCraft no GCP Compute Engine (Docker, Guia de VPS para Produção)

## Objetivo

Executar um Gateway OpenCraft persistente em uma VM GCP Compute Engine usando Docker, com estado durável, binários incorporados e comportamento seguro de reinicialização.

Se você quer "OpenCraft 24/7 por ~$5-12/mês", esta é uma configuração confiável no Google Cloud.
Os preços variam por tipo de máquina e região; escolha a menor VM que atenda sua carga de trabalho e escale se encontrar OOMs.

## O que estamos fazendo (termos simples)?

- Criar um projeto GCP e ativar o faturamento
- Criar uma VM Compute Engine
- Instalar Docker (runtime isolado para aplicações)
- Iniciar o Gateway OpenCraft em Docker
- Persistir `~/.opencraft` + `~/.opencraft/workspace` no host (sobrevive a reinicializações/rebuilds)
- Acessar a Control UI do seu laptop via túnel SSH

O Gateway pode ser acessado via:

- Encaminhamento de porta SSH do seu laptop
- Exposição direta de porta se você gerenciar firewall e tokens por conta própria

Este guia usa Debian no GCP Compute Engine.
Ubuntu também funciona; adapte os pacotes conforme necessário.
Para o fluxo genérico Docker, veja [Docker](/install/docker).

---

## Caminho rápido (operadores experientes)

1. Criar projeto GCP + ativar API do Compute Engine
2. Criar VM Compute Engine (e2-small, Debian 12, 20GB)
3. Conectar via SSH na VM
4. Instalar Docker
5. Clonar o repositório OpenCraft
6. Criar diretórios persistentes no host
7. Configurar `.env` e `docker-compose.yml`
8. Incorporar binários necessários, construir e iniciar

---

## O que você precisa

- Conta GCP (elegível ao plano gratuito para e2-micro)
- gcloud CLI instalado (ou use o Cloud Console)
- Acesso SSH do seu laptop
- Conforto básico com SSH + copiar/colar
- ~20-30 minutos
- Docker e Docker Compose
- Credenciais de autenticação de modelo
- Credenciais opcionais de provedor
  - QR do WhatsApp
  - Token de Bot do Telegram
  - OAuth do Gmail

---

## 1) Instalar gcloud CLI (ou use o Console)

**Opção A: gcloud CLI** (recomendado para automação)

Instale em [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

Inicialize e autentique:

```bash
gcloud init
gcloud auth login
```

**Opção B: Cloud Console**

Todas as etapas podem ser feitas pela interface web em [https://console.cloud.google.com](https://console.cloud.google.com)

---

## 2) Criar um projeto GCP

**CLI:**

```bash
gcloud projects create my-opencraft-project --name="OpenCraft Gateway"
gcloud config set project my-opencraft-project
```

Ative o faturamento em [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (necessário para Compute Engine).

Ative a API do Compute Engine:

```bash
gcloud services enable compute.googleapis.com
```

**Console:**

1. Vá em IAM & Admin > Create Project
2. Nomeie e crie
3. Ative o faturamento para o projeto
4. Navegue até APIs & Services > Enable APIs > pesquise "Compute Engine API" > Enable

---

## 3) Criar a VM

**Tipos de máquina:**

| Tipo      | Especificações                  | Custo                      | Notas                                                   |
| --------- | ------------------------------- | -------------------------- | ------------------------------------------------------- |
| e2-medium | 2 vCPU, 4GB RAM                 | ~$25/mês                   | Mais confiável para builds Docker locais                |
| e2-small  | 2 vCPU, 2GB RAM                 | ~$12/mês                   | Mínimo recomendado para build Docker                    |
| e2-micro  | 2 vCPU (compartilhado), 1GB RAM | Elegível ao plano gratuito | Frequentemente falha com OOM no build Docker (exit 137) |

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

1. Vá em Compute Engine > VM instances > Create instance
2. Nome: `opencraft-gateway`
3. Região: `us-central1`, Zona: `us-central1-a`
4. Tipo de máquina: `e2-small`
5. Disco de boot: Debian 12, 20GB
6. Criar

---

## 4) Conectar via SSH na VM

**CLI:**

```bash
gcloud compute ssh opencraft-gateway --zone=us-central1-a
```

**Console:**

Clique no botão "SSH" ao lado da sua VM no painel do Compute Engine.

Nota: A propagação da chave SSH pode levar 1-2 minutos após a criação da VM. Se a conexão for recusada, aguarde e tente novamente.

---

## 5) Instalar Docker (na VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Faça logout e login novamente para a mudança de grupo ter efeito:

```bash
exit
```

Depois conecte via SSH novamente:

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
git clone https://github.com/editzffaleta/OpenCraft.git
cd opencraft
```

Este guia assume que você vai construir uma imagem personalizada para garantir a persistência dos binários.

---

## 7) Criar diretórios persistentes no host

Contêineres Docker são efêmeros.
Todo estado de longa duração deve ficar no host.

```bash
mkdir -p ~/.opencraft
mkdir -p ~/.opencraft/workspace
```

---

## 8) Configurar variáveis de ambiente

Crie `.env` na raiz do repositório.

```bash
OPENCRAFT_IMAGE=opencraft:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCRAFT_GATEWAY_BIND=lan
OPENCRAFT_GATEWAY_PORT=18789

OPENCRAFT_CONFIG_DIR=/home/$USER/.opencraft
OPENCRAFT_WORKSPACE_DIR=/home/$USER/.opencraft/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.opencraft
```

Gere secrets fortes:

```bash
openssl rand -hex 32
```

**Não faça commit deste arquivo.**

---

## 9) Configuração do Docker Compose

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
      # Recomendado: manter o Gateway somente loopback na VM; acesse via túnel SSH.
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
      ]
```

---

## 10) Etapas compartilhadas de runtime Docker VM

Use o guia de runtime compartilhado para o fluxo comum de host Docker:

- [Incorporar binários necessários na imagem](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
- [Build e inicialização](/install/docker-vm-runtime#build-and-launch)
- [O que persiste e onde](/install/docker-vm-runtime#what-persists-where)
- [Atualizações](/install/docker-vm-runtime#updates)

---

## 11) Notas de inicialização específicas do GCP

No GCP, se o build falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória. Use no mínimo `e2-small`, ou `e2-medium` para builds iniciais mais confiáveis.

Ao vincular à LAN (`OPENCRAFT_GATEWAY_BIND=lan`), configure uma origem confiável do navegador antes de continuar:

```bash
docker compose run --rm opencraft-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
```

Se você alterou a porta do gateway, substitua `18789` pela sua porta configurada.

## 12) Acessar do seu laptop

Crie um túnel SSH para encaminhar a porta do Gateway:

```bash
gcloud compute ssh opencraft-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```

Abra no seu navegador:

`http://127.0.0.1:18789/`

Obtenha um link tokenizado atualizado do dashboard:

```bash
docker compose run --rm opencraft-cli dashboard --no-open
```

Cole o token dessa URL.

Se a Control UI mostrar `unauthorized` ou `disconnected (1008): pairing required`, aprove o dispositivo do navegador:

```bash
docker compose run --rm opencraft-cli devices list
docker compose run --rm opencraft-cli devices approve <requestId>
```

Precisa da referência de persistência e atualização compartilhada novamente?
Veja [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) e [Atualizações Docker VM Runtime](/install/docker-vm-runtime#updates).

---

## Solução de problemas

**Conexão SSH recusada**

A propagação da chave SSH pode levar 1-2 minutos após a criação da VM. Aguarde e tente novamente.

**Problemas com OS Login**

Verifique seu perfil OS Login:

```bash
gcloud compute os-login describe-profile
```

Certifique-se de que sua conta tem as permissões IAM necessárias (Compute OS Login ou Compute OS Admin Login).

**Sem memória (OOM)**

Se o build Docker falhar com `Killed` e `exit code 137`, a VM foi encerrada por OOM. Atualize para e2-small (mínimo) ou e2-medium (recomendado para builds locais confiáveis):

```bash
# Pare a VM primeiro
gcloud compute instances stop opencraft-gateway --zone=us-central1-a

# Altere o tipo de máquina
gcloud compute instances set-machine-type opencraft-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Inicie a VM
gcloud compute instances start opencraft-gateway --zone=us-central1-a
```

---

## Contas de serviço (melhor prática de segurança)

Para uso pessoal, sua conta de usuário padrão funciona bem.

Para automação ou pipelines CI/CD, crie uma conta de serviço dedicada com permissões mínimas:

1. Crie uma conta de serviço:

   ```bash
   gcloud iam service-accounts create opencraft-deploy \
     --display-name="OpenCraft Deployment"
   ```

2. Conceda a role Compute Instance Admin (ou uma role personalizada mais restrita):

   ```bash
   gcloud projects add-iam-policy-binding my-opencraft-project \
     --member="serviceAccount:opencraft-deploy@my-opencraft-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Evite usar a role Owner para automação. Use o princípio de menor privilégio.

Veja [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) para detalhes sobre roles IAM.

---

## Próximos passos

- Configure canais de mensagem: [Canais](/channels)
- Pareie dispositivos locais como nodes: [Nodes](/nodes)
- Configure o Gateway: [Configuração do Gateway](/gateway/configuration)
