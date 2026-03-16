---
title: Fly.io
description: Implante o OpenCraft no Fly.io
summary: "Implantação passo a passo no Fly.io para OpenCraft com armazenamento persistente e HTTPS"
read_when:
  - Implantando o OpenCraft no Fly.io
  - Configurando volumes, secrets e config inicial no Fly
---

# Implantação no Fly.io

**Objetivo:** Gateway OpenCraft rodando em uma máquina [Fly.io](https://fly.io) com armazenamento persistente, HTTPS automático e acesso ao Discord/canais.

## O que você precisa

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) instalada
- Conta Fly.io (plano gratuito funciona)
- Auth de modelo: chave de API para o provedor de modelo escolhido
- Credenciais de canal: token de bot Discord, token Telegram, etc.

## Caminho rápido para iniciantes

1. Clone o repositório → personalize `fly.toml`
2. Crie o app + volume → defina secrets
3. Implante com `fly deploy`
4. Acesse via SSH para criar a config ou use a UI de Controle

## 1) Criar o app Fly

```bash
# Clonar o repositório
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Criar um novo app Fly (escolha seu próprio nome)
fly apps create meu-opencraft

# Criar um volume persistente (1GB geralmente é suficiente)
fly volumes create openclaw_data --size 1 --region iad
```

**Dica:** Escolha uma região próxima a você. Opções comuns: `gru` (São Paulo), `lhr` (Londres), `iad` (Virgínia), `sjc` (San Jose).

## 2) Configurar fly.toml

Edite `fly.toml` para corresponder ao nome do seu app e requisitos.

**Nota de segurança:** A configuração padrão expõe uma URL pública. Para uma implantação reforçada sem IP público, veja [Implantação privada](#implantacao-privada-reforçada) ou use `fly.private.toml`.

```toml
app = "meu-opencraft"  # Nome do seu app
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  OPENCLAW_PREFER_PNPM = "1"
  OPENCLAW_STATE_DIR = "/data"
  NODE_OPTIONS = "--max-old-space-size=1536"

[processes]
  app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  size = "shared-cpu-2x"
  memory = "2048mb"

[mounts]
  source = "openclaw_data"
  destination = "/data"
```

**Configurações principais:**

| Configuração                   | Por quê                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `--bind lan`                   | Faz bind para `0.0.0.0` para que o proxy do Fly possa alcançar o gateway          |
| `--allow-unconfigured`         | Inicia sem um arquivo de config (você criará um depois)                           |
| `internal_port = 3000`         | Deve corresponder a `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) para health checks |
| `memory = "2048mb"`            | 512MB é muito pouco; 2GB recomendado                                              |
| `OPENCLAW_STATE_DIR = "/data"` | Persiste estado no volume                                                         |

## 3) Definir secrets

```bash
# Obrigatório: token do Gateway (para bind não-loopback)
fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

# Chaves de API do provedor de modelo
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# Opcional: outros provedores
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set GOOGLE_API_KEY=...

# Tokens de canal
fly secrets set DISCORD_BOT_TOKEN=MTQ...
```

**Notas:**

- Binds não-loopback (`--bind lan`) requerem `OPENCLAW_GATEWAY_TOKEN` por segurança.
- Trate esses tokens como senhas.
- **Prefira variáveis de ambiente ao invés do arquivo de config** para todas as chaves de API e tokens. Isso mantém os secrets fora do `opencraft.json` onde poderiam ser acidentalmente expostos ou registrados em log.

## 4) Implantar

```bash
fly deploy
```

O primeiro deploy constrói a imagem Docker (~2-3 minutos). Deploys subsequentes são mais rápidos.

Após a implantação, verifique:

```bash
fly status
fly logs
```

Você deve ver:

```
[gateway] listening on ws://0.0.0.0:3000 (PID xxx)
[discord] logged in to discord as xxx
```

## 5) Criar arquivo de config

Acesse a máquina via SSH para criar uma config adequada:

```bash
fly ssh console
```

Crie o diretório de config e o arquivo:

```bash
mkdir -p /data
cat > /data/opencraft.json << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": ["anthropic/claude-sonnet-4-5", "openai/gpt-4o"]
      },
      "maxConcurrent": 4
    },
    "list": [
      {
        "id": "main",
        "default": true
      }
    ]
  },
  "auth": {
    "profiles": {
      "anthropic:default": { "mode": "token", "provider": "anthropic" },
      "openai:default": { "mode": "token", "provider": "openai" }
    }
  },
  "bindings": [
    {
      "agentId": "main",
      "match": { "channel": "discord" }
    }
  ],
  "channels": {
    "discord": {
      "enabled": true,
      "groupPolicy": "allowlist",
      "guilds": {
        "SEU_GUILD_ID": {
          "channels": { "general": { "allow": true } },
          "requireMention": false
        }
      }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "auto"
  },
  "meta": {
    "lastTouchedVersion": "2026.1.29"
  }
}
EOF
```

**Nota:** Com `OPENCLAW_STATE_DIR=/data`, o caminho da config é `/data/opencraft.json`.

**Nota:** O token do Discord pode vir de:

- Variável de ambiente: `DISCORD_BOT_TOKEN` (recomendado para secrets)
- Arquivo de config: `channels.discord.token`

Se usar variável de ambiente, não é necessário adicionar o token à config. O gateway lê `DISCORD_BOT_TOKEN` automaticamente.

Reinicie para aplicar:

```bash
exit
fly machine restart <machine-id>
```

## 6) Acessar o Gateway

### UI de Controle

Abra no navegador:

```bash
fly open
```

Ou acesse `https://meu-opencraft.fly.dev/`

Cole seu token do gateway (o de `OPENCLAW_GATEWAY_TOKEN`) para autenticar.

### Logs

```bash
fly logs              # Logs em tempo real
fly logs --no-tail    # Logs recentes
```

### Console SSH

```bash
fly ssh console
```

## Solução de problemas

### "App is not listening on expected address"

O gateway está fazendo bind para `127.0.0.1` em vez de `0.0.0.0`.

**Solução:** Adicione `--bind lan` ao comando do processo em `fly.toml`.

### Health checks falhando / conexão recusada

O Fly não consegue alcançar o gateway na porta configurada.

**Solução:** Certifique-se de que `internal_port` corresponde à porta do gateway (defina `--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Problemas de memória

O container fica reiniciando ou sendo encerrado. Sinais: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, ou reinicializações silenciosas.

**Solução:** Aumente a memória em `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Ou atualize uma máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Nota:** 512MB é muito pouco. 1GB pode funcionar mas pode ter OOM sob carga ou com logging verboso. **2GB é recomendado.**

### Problemas de Lock do Gateway

O gateway se recusa a iniciar com erros de "already running".

Isso acontece quando o container reinicia mas o arquivo de lock do PID persiste no volume.

**Solução:** Delete o arquivo de lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

O arquivo de lock fica em `/data/gateway.*.lock` (não em um subdiretório).

### Config não sendo lida

Se usar `--allow-unconfigured`, o gateway cria uma config mínima. Sua config personalizada em `/data/opencraft.json` deve ser lida ao reiniciar.

Verifique se a config existe:

```bash
fly ssh console --command "cat /data/opencraft.json"
```

### Escrevendo config via SSH

O comando `fly ssh console -C` não suporta redirecionamento de shell. Para escrever um arquivo de config:

```bash
# Usar echo + tee (pipe do local para remoto)
echo '{"sua":"config"}' | fly ssh console -C "tee /data/opencraft.json"

# Ou usar sftp
fly sftp shell
> put /caminho/local/config.json /data/opencraft.json
```

**Nota:** `fly sftp` pode falhar se o arquivo já existir. Delete primeiro:

```bash
fly ssh console --command "rm /data/opencraft.json"
```

### Estado não persistindo

Se você perder credenciais ou sessões após reinicialização, o diretório de estado está escrevendo no sistema de arquivos do container.

**Solução:** Certifique-se de que `OPENCLAW_STATE_DIR=/data` está definido em `fly.toml` e reimplante.

## Atualizações

```bash
# Obter últimas mudanças
git pull

# Reimplantar
fly deploy

# Verificar saúde
fly status
fly logs
```

### Atualizando o comando da máquina

Se você precisar mudar o comando de inicialização sem um redeploy completo:

```bash
# Obter ID da máquina
fly machines list

# Atualizar comando
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Ou com aumento de memória
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Nota:** Após `fly deploy`, o comando da máquina pode ser redefinido para o que está em `fly.toml`. Se você fez mudanças manuais, reaplicá-las após o deploy.

## Implantação privada (reforçada) {#implantacao-privada-reforçada}

Por padrão, o Fly aloca IPs públicos, tornando seu gateway acessível em `https://seu-app.fly.dev`. Isso é conveniente mas significa que sua implantação é descobrível por scanners de internet (Shodan, Censys, etc.).

Para uma implantação reforçada **sem exposição pública**, use o template privado.

### Quando usar implantação privada

- Você faz apenas chamadas/mensagens **de saída** (sem webhooks de entrada)
- Você usa túneis **ngrok ou Tailscale** para qualquer callback de webhook
- Você acessa o gateway via **SSH, proxy ou WireGuard** em vez do navegador
- Você quer a implantação **oculta de scanners de internet**

### Configuração

Use `fly.private.toml` em vez da config padrão:

```bash
# Implantar com config privada
fly deploy -c fly.private.toml
```

Ou converta uma implantação existente:

```bash
# Listar IPs atuais
fly ips list -a meu-opencraft

# Liberar IPs públicos
fly ips release <public-ipv4> -a meu-opencraft
fly ips release <public-ipv6> -a meu-opencraft

# Mudar para config privada para que deploys futuros não realocem IPs públicos
# (remova [http_service] ou implante com o template privado)
fly deploy -c fly.private.toml

# Alocar IPv6 apenas privado
fly ips allocate-v6 --private -a meu-opencraft
```

Após isso, `fly ips list` deve mostrar apenas um IP do tipo `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Acessando uma implantação privada

Como não há URL pública, use um destes métodos:

**Opção 1: Proxy local (mais simples)**

```bash
# Redirecionar porta local 3000 para o app
fly proxy 3000:3000 -a meu-opencraft

# Depois abra http://localhost:3000 no navegador
```

**Opção 2: VPN WireGuard**

```bash
# Criar config WireGuard (uma vez)
fly wireguard create

# Importe para o cliente WireGuard, depois acesse via IPv6 interno
# Exemplo: http://[fdaa:x:x:x:x::x]:3000
```

**Opção 3: Apenas SSH**

```bash
fly ssh console -a meu-opencraft
```

### Webhooks com implantação privada

Se você precisar de callbacks de webhook (Twilio, Telnyx, etc.) sem exposição pública:

1. **Túnel ngrok** - Execute o ngrok dentro do container ou como sidecar
2. **Tailscale Funnel** - Exponha caminhos específicos via Tailscale
3. **Apenas saída** - Alguns provedores (Twilio) funcionam bem para chamadas de saída sem webhooks

Exemplo de config de chamada de voz com ngrok:

```json
{
  "plugins": {
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "twilio",
          "tunnel": { "provider": "ngrok" },
          "webhookSecurity": {
            "allowedHosts": ["example.ngrok.app"]
          }
        }
      }
    }
  }
}
```

O túnel ngrok roda dentro do container e fornece uma URL pública de webhook sem expor o app Fly em si. Defina `webhookSecurity.allowedHosts` com o hostname do túnel público para que os headers de host redirecionados sejam aceitos.

### Benefícios de segurança

| Aspecto             | Pública      | Privada      |
| ------------------- | ------------ | ------------ |
| Scanners de internet | Descobrível  | Oculta       |
| Ataques diretos     | Possível     | Bloqueado    |
| Acesso à UI         | Navegador    | Proxy/VPN    |
| Entrega de webhooks | Direta       | Via túnel    |

## Notas

- O Fly.io usa arquitetura **x86** (não ARM)
- O Dockerfile é compatível com ambas as arquiteturas
- Para onboarding de WhatsApp/Telegram, use `fly ssh console`
- Dados persistentes ficam no volume em `/data`
- Signal requer Java + signal-cli; use uma imagem personalizada e mantenha a memória em 2GB+.

## Custo

Com a config recomendada (`shared-cpu-2x`, 2GB RAM):

- ~$10-15/mês dependendo do uso
- O plano gratuito inclui alguma cota

Veja [preços do Fly.io](https://fly.io/docs/about/pricing/) para detalhes.
