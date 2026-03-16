---
summary: "Etapas compartilhadas de runtime Docker em VM para hosts de Gateway OpenCraft de longa duração"
read_when:
  - Você está implantando o OpenCraft em uma VM cloud com Docker
  - Você precisa do fluxo compartilhado de bake de binários, persistência e atualização
title: "Runtime Docker em VM"
---

# Runtime Docker em VM

Etapas de runtime compartilhadas para instalações Docker em VM, como GCP, Hetzner e provedores VPS similares.

## Compilar binários necessários na imagem

Instalar binários dentro de um container em execução é uma armadilha.
Qualquer coisa instalada em runtime será perdida ao reiniciar.

Todos os binários externos necessários por skills devem ser instalados no momento da construção da imagem.

Os exemplos abaixo mostram apenas três binários comuns:

- `gog` para acesso ao Gmail
- `goplaces` para Google Places
- `wacli` para WhatsApp

Estes são exemplos, não uma lista completa.
Você pode instalar quantos binários forem necessários usando o mesmo padrão.

Se você adicionar novos skills posteriormente que dependem de binários adicionais, você deve:

1. Atualizar o Dockerfile
2. Reconstruir a imagem
3. Reiniciar os containers

**Exemplo de Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Exemplo de binário 1: CLI do Gmail
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Exemplo de binário 2: CLI do Google Places
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Exemplo de binário 3: CLI do WhatsApp
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

## Construir e iniciar

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Se a build falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória.
Use uma classe de máquina maior antes de tentar novamente.

Verificar binários:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Saída esperada:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verificar Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Saída esperada:

```
[gateway] listening on ws://0.0.0.0:18789
```

## O que persiste onde

O OpenCraft roda em Docker, mas o Docker não é a fonte da verdade.
Todo estado de longa duração deve sobreviver a reinicializações, reconstruções e reboots.

| Componente          | Localização                            | Mecanismo de persistência | Notas                               |
| ------------------- | -------------------------------------- | ------------------------- | ----------------------------------- |
| Config do gateway   | `/home/node/.opencraft/`              | Mount de volume no host   | Inclui `opencraft.json`, tokens     |
| Perfis de auth      | `/home/node/.opencraft/`              | Mount de volume no host   | Tokens OAuth, chaves de API         |
| Configs de skills   | `/home/node/.opencraft/skills/`       | Mount de volume no host   | Estado no nível do skill            |
| Workspace do agente | `/home/node/.opencraft/workspace/`    | Mount de volume no host   | Código e artefatos do agente        |
| Sessão WhatsApp     | `/home/node/.opencraft/`              | Mount de volume no host   | Preserva login por QR               |
| Keyring Gmail       | `/home/node/.opencraft/`              | Volume no host + senha    | Requer `GOG_KEYRING_PASSWORD`       |
| Binários externos   | `/usr/local/bin/`                     | Imagem Docker             | Devem ser compilados no build time  |
| Runtime Node        | Sistema de arquivos do container      | Imagem Docker             | Reconstruído a cada build de imagem |
| Pacotes SO          | Sistema de arquivos do container      | Imagem Docker             | Não instale em runtime              |
| Container Docker    | Efêmero                               | Reiniciável               | Seguro para destruir                |

## Atualizações

Para atualizar o OpenCraft na VM:

```bash
git pull
docker compose build
docker compose up -d
```
