---
summary: "Execute o Gateway OpenCraft no exe.dev (VM + proxy HTTPS) para acesso remoto"
read_when:
  - Você quer um host Linux sempre ativo e barato para o Gateway
  - Você quer acesso remoto à Control UI sem rodar seu próprio VPS
title: "exe.dev"
---

# exe.dev

Objetivo: Gateway OpenCraft rodando em uma VM exe.dev, acessível do seu laptop via: `https://<vm-name>.exe.xyz`

Esta página assume a imagem padrão **exeuntu** do exe.dev. Se você escolheu outra distribuição, adapte os pacotes conforme necessário.

## Caminho rápido para iniciantes

1. [https://exe.new/opencraft](https://exe.new/opencraft)
2. Preencha sua chave/token de autenticação conforme necessário
3. Clique em "Agent" ao lado da sua VM e aguarde...
4. ???
5. Pronto

## O que você precisa

- Conta no exe.dev
- Acesso via `ssh exe.dev` às máquinas virtuais do [exe.dev](https://exe.dev) (opcional)

## Instalação automatizada com Shelley

Shelley, o agente do [exe.dev](https://exe.dev), pode instalar o OpenCraft instantaneamente com nosso
prompt. O prompt usado é o seguinte:

```
Set up OpenCraft (https://docs.opencraft.ai/install) on this VM. Use the non-interactive and accept-risk flags for opencraft onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "opencraft devices list" and "opencraft devices approve <request id>". Make sure the dashboard shows that OpenCraft's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalação manual

## 1) Criar a VM

Do seu dispositivo:

```bash
ssh exe.dev new
```

Depois conecte:

```bash
ssh <vm-name>.exe.xyz
```

Dica: mantenha esta VM **com estado**. O OpenCraft armazena estado em `~/.opencraft/` e `~/.opencraft/workspace/`.

## 2) Instalar pré-requisitos (na VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Instalar o OpenCraft

Execute o script de instalação do OpenCraft:

```bash
curl -fsSL https://opencraft.ai/install.sh | bash
```

## 4) Configurar nginx para fazer proxy do OpenCraft na porta 8000

Edite `/etc/nginx/sites-enabled/default` com

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # Suporte a WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Headers de proxy padrão
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Configurações de timeout para conexões de longa duração
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## 5) Acessar o OpenCraft e conceder privilégios

Acesse `https://<vm-name>.exe.xyz/` (veja a saída da Control UI do onboarding). Se solicitar autenticação, cole o
token de `gateway.auth.token` na VM (obtenha com `opencraft config get gateway.auth.token`, ou gere um
com `opencraft doctor --generate-gateway-token`). Aprove dispositivos com `opencraft devices list` e
`opencraft devices approve <requestId>`. Em caso de dúvida, use o Shelley do seu navegador!

## Acesso remoto

O acesso remoto é gerenciado pela autenticação do [exe.dev](https://exe.dev). Por
padrão, o tráfego HTTP da porta 8000 é encaminhado para `https://<vm-name>.exe.xyz`
com autenticação por email.

## Atualização

```bash
npm i -g opencraft@latest
opencraft doctor
opencraft gateway restart
opencraft health
```

Guia: [Atualização](/install/updating)
