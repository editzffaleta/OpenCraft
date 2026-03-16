---
summary: "Rodar o Gateway OpenCraft no exe.dev (VM + proxy HTTPS) para acesso remoto"
read_when:
  - Você quer um host Linux sempre ativo e barato para o Gateway
  - Você quer acesso remoto à UI de Controle sem gerenciar seu próprio VPS
title: "exe.dev"
---

# exe.dev

Objetivo: Gateway OpenCraft rodando em uma VM exe.dev, acessível do seu laptop via: `https://<nome-da-vm>.exe.xyz`

Esta página assume a imagem padrão **exeuntu** do exe.dev. Se você escolheu uma distro diferente, adapte os pacotes conforme necessário.

## Caminho rápido para iniciantes

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Preencha sua chave de auth/token conforme necessário
3. Clique em "Agent" ao lado da sua VM e aguarde...
4. ???
5. Lucro

## O que você precisa

- Conta exe.dev
- Acesso `ssh exe.dev` às máquinas virtuais [exe.dev](https://exe.dev) (opcional)

## Instalação automatizada com Shelley

Shelley, o agente do [exe.dev](https://exe.dev), pode instalar o OpenCraft instantaneamente com nosso
prompt. O prompt utilizado é o seguinte:

```
Configure o OpenCraft (https://docs.openclaw.ai/install) nesta VM. Use as flags não-interativas e de aceitar risco para o onboarding do opencraft. Adicione a auth ou token fornecida conforme necessário. Configure o nginx para redirecionar da porta padrão 18789 para o local raiz na configuração do site habilitado por padrão, garantindo que o suporte a WebSocket esteja ativado. O pareamento é feito com "opencraft devices list" e "opencraft devices approve <request id>". Certifique-se de que o dashboard mostre que a saúde do OpenCraft está OK. O exe.dev cuida do redirecionamento da porta 8000 para a porta 80/443 e HTTPS para nós, então o "reachable" final deve ser <nome-da-vm>.exe.xyz, sem especificação de porta.
```

## Instalação manual

## 1) Criar a VM

Do seu dispositivo:

```bash
ssh exe.dev new
```

Depois conecte:

```bash
ssh <nome-da-vm>.exe.xyz
```

Dica: mantenha esta VM **stateful**. O OpenCraft armazena estado em `~/.opencraft/` e `~/.opencraft/workspace/`.

## 2) Instalar pré-requisitos (na VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Instalar o OpenCraft

Execute o script de instalação do OpenCraft:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Configurar nginx para fazer proxy do OpenCraft na porta 8000

Edite `/etc/nginx/sites-enabled/default` com:

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

        # Headers padrão de proxy
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

Acesse `https://<nome-da-vm>.exe.xyz/` (veja a saída da UI de Controle do onboarding). Se solicitar auth, cole o
token de `gateway.auth.token` na VM (recupere com `opencraft config get gateway.auth.token`, ou gere um
com `opencraft doctor --generate-gateway-token`). Aprove dispositivos com `opencraft devices list` e
`opencraft devices approve <requestId>`. Em caso de dúvida, use Shelley no seu navegador!

## Acesso remoto

O acesso remoto é gerenciado pela autenticação do [exe.dev](https://exe.dev). Por
padrão, o tráfego HTTP da porta 8000 é redirecionado para `https://<nome-da-vm>.exe.xyz`
com autenticação por email.

## Atualizando

```bash
npm i -g opencraft@latest
opencraft doctor
opencraft gateway restart
opencraft health
```

Guia: [Atualizando](/install/updating)
