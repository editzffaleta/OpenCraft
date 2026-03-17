---
summary: "Etapas compartilhadas de runtime Docker VM para hosts de Gateway OpenCraft de longa duração"
read_when:
  - Você está implantando o OpenCraft em uma VM na nuvem com Docker
  - Você precisa do fluxo compartilhado de bake de binários, persistência e atualização
title: "Docker VM Runtime"
---

# Docker VM Runtime

Etapas de runtime compartilhadas para instalações Docker baseadas em VM, como GCP, Hetzner e provedores VPS similares.

## Incorporar binários necessários na imagem

Instalar binários dentro de um contêiner em execução é uma armadilha.
Qualquer coisa instalada em tempo de execução será perdida na reinicialização.

Todos os binários externos necessários por Skills devem ser instalados no momento do build da imagem.

Os exemplos abaixo mostram apenas três binários comuns:

- `gog` para acesso ao Gmail
- `goplaces` para Google Places
- `wacli` para WhatsApp

Estes são exemplos, não uma lista completa.
Você pode instalar quantos binários precisar usando o mesmo padrão.

Se você adicionar novos Skills posteriormente que dependam de binários adicionais, você deve:

1. Atualizar o Dockerfile
2. Reconstruir a imagem
3. Reiniciar os contêineres

**Exemplo de Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Exemplo de binário 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Exemplo de binário 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Exemplo de binário 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Adicione mais binários abaixo usando o mesmo padrão

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

## Build e inicialização

```bash
docker compose build
docker compose up -d opencraft-gateway
```

Se o build falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória.
Use uma máquina maior antes de tentar novamente.

Verificar binários:

```bash
docker compose exec opencraft-gateway which gog
docker compose exec opencraft-gateway which goplaces
docker compose exec opencraft-gateway which wacli
```

Saída esperada:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verificar o Gateway:

```bash
docker compose logs -f opencraft-gateway
```

Saída esperada:

```
[gateway] listening on ws://0.0.0.0:18789
```

## O que persiste e onde

O OpenCraft roda em Docker, mas o Docker não é a fonte de verdade.
Todo estado de longa duração deve sobreviver a reinicializações, rebuilds e reboots.

| Componente          | Localização                        | Mecanismo de persistência | Notas                           |
| ------------------- | ---------------------------------- | ------------------------- | ------------------------------- |
| Config do Gateway   | `/home/node/.opencraft/`           | Volume do host montado    | Inclui `opencraft.json`, tokens |
| Perfis de auth      | `/home/node/.opencraft/`           | Volume do host montado    | Tokens OAuth, chaves de API     |
| Configs de Skills   | `/home/node/.opencraft/skills/`    | Volume do host montado    | Estado por Skill                |
| Workspace do agente | `/home/node/.opencraft/workspace/` | Volume do host montado    | Código e artefatos do agente    |
| Sessão WhatsApp     | `/home/node/.opencraft/`           | Volume do host montado    | Preserva login por QR           |
| Keyring do Gmail    | `/home/node/.opencraft/`           | Volume do host + senha    | Requer `GOG_KEYRING_PASSWORD`   |
| Binários externos   | `/usr/local/bin/`                  | Imagem Docker             | Deve ser incorporado no build   |
| Runtime Node.js     | Sistema de arquivos do contêiner   | Imagem Docker             | Reconstruído a cada build       |
| Pacotes do SO       | Sistema de arquivos do contêiner   | Imagem Docker             | Não instale em runtime          |
| Contêiner Docker    | Efêmero                            | Reiniciável               | Seguro para destruir            |

## Atualizações

Para atualizar o OpenCraft na VM:

```bash
git pull
docker compose build
docker compose up -d
```
