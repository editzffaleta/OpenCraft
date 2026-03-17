---
title: Fly.io
description: Implante o OpenCraft no Fly.io
summary: "Implantação passo a passo no Fly.io para OpenCraft com armazenamento persistente e HTTPS"
read_when:
  - Implantando o OpenCraft no Fly.io
  - Configurando volumes, secrets e primeira execução no Fly
---

# Implantação no Fly.io

**Objetivo:** Gateway OpenCraft rodando em uma máquina [Fly.io](https://fly.io) com armazenamento persistente, HTTPS automático e acesso a canais Discord.

## O que você precisa

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) instalado
- Conta no Fly.io (o plano gratuito funciona)
- Autenticação de modelo: chave de API para o provedor de modelo escolhido
- Credenciais de canal: token de Bot Discord, token do Telegram, etc.

## Caminho rápido para iniciantes

1. Clone o repositório → personalize `fly.toml`
2. Crie o app + volume → defina os secrets
3. Implante com `fly deploy`
4. Conecte via SSH para criar a config ou use a Control UI

## 1) Criar o app no Fly

```bash
# Clone o repositório
git clone https://github.com/editzffaleta/OpenCraft.git
cd opencraft

# Crie um novo app no Fly (escolha seu próprio nome)
fly apps create my-opencraft

# Crie um volume persistente (1GB geralmente é suficiente)
fly volumes create opencraft_data --size 1 --region iad
```

**Dica:** Escolha uma região próxima a você. Opções comuns: `lhr` (Londres), `iad` (Virgínia), `sjc` (San José).

## 2) Configurar fly.toml

Edite `fly.toml` para corresponder ao nome do seu app e requisitos.

**Nota de segurança:** A configuração padrão expõe uma URL pública. Para uma implantação reforçada sem IP público, veja [Implantação Privada](#private-deployment-hardened) ou use `fly.private.toml`.

```toml
app = "my-opencraft"  # Nome do seu app
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  OPENCRAFT_PREFER_PNPM = "1"
  OPENCRAFT_STATE_DIR = "/data"
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
  source = "opencraft_data"
  destination = "/data"
```

**Configurações principais:**

| Configuração                    | Por quê                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `--bind lan`                    | Vincula a `0.0.0.0` para que o proxy do Fly alcance o gateway                      |
| `--allow-unconfigured`          | Inicia sem arquivo de configuração (você criará um depois)                         |
| `internal_port = 3000`          | Deve corresponder a `--port 3000` (ou `OPENCRAFT_GATEWAY_PORT`) para health checks |
| `memory = "2048mb"`             | 512MB é muito pouco; 2GB é recomendado                                             |
| `OPENCRAFT_STATE_DIR = "/data"` | Persiste o estado no volume                                                        |

## 3) Definir secrets

```bash
# Obrigatório: Token do Gateway (para bind não-loopback)
fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

# Chaves de API do provedor de modelo
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# Opcional: Outros provedores
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set GOOGLE_API_KEY=...

# Tokens de canal
fly secrets set DISCORD_BOT_TOKEN=MTQ...
```

**Notas:**

- Binds não-loopback (`--bind lan`) requerem `OPENCLAW_GATEWAY_TOKEN` por segurança.
- Trate esses tokens como senhas.
- **Prefira variáveis de ambiente ao invés do arquivo de config** para todas as chaves de API e tokens. Isso mantém secrets fora do `opencraft.json` onde poderiam ser acidentalmente expostos ou registrados em log.

## 4) Implantar

```bash
fly deploy
```

A primeira implantação constrói a imagem Docker (~2-3 minutos). Implantações subsequentes são mais rápidas.

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

## 5) Criar arquivo de configuração

Conecte via SSH na máquina para criar uma configuração adequada:

```bash
fly ssh console
```

Crie o diretório e arquivo de configuração:

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
        "YOUR_GUILD_ID": {
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

**Nota:** Com `OPENCRAFT_STATE_DIR=/data`, o caminho da configuração é `/data/opencraft.json`.

**Nota:** O token do Discord pode vir de:

- Variável de ambiente: `DISCORD_BOT_TOKEN` (recomendado para secrets)
- Arquivo de configuração: `channels.discord.token`

Se usar variável de ambiente, não é necessário adicionar o token à config. O gateway lê `DISCORD_BOT_TOKEN` automaticamente.

Reinicie para aplicar:

```bash
exit
fly machine restart <machine-id>
```

## 6) Acessar o Gateway

### Control UI

Abra no navegador:

```bash
fly open
```

Ou visite `https://my-opencraft.fly.dev/`

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

O gateway está vinculando a `127.0.0.1` ao invés de `0.0.0.0`.

**Correção:** Adicione `--bind lan` ao comando do processo no `fly.toml`.

### Health checks falhando / conexão recusada

O Fly não consegue alcançar o gateway na porta configurada.

**Correção:** Certifique-se de que `internal_port` corresponde à porta do gateway (defina `--port 3000` ou `OPENCRAFT_GATEWAY_PORT=3000`).

### OOM / Problemas de memória

O contêiner continua reiniciando ou sendo encerrado. Sinais: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, ou reinicializações silenciosas.

**Correção:** Aumente a memória no `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Ou atualize uma máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Nota:** 512MB é muito pouco. 1GB pode funcionar mas pode dar OOM sob carga ou com logging verboso. **2GB é recomendado.**

### Problemas de lock do Gateway

O Gateway recusa iniciar com erros "already running".

Isso acontece quando o contêiner reinicia mas o arquivo de lock de PID persiste no volume.

**Correção:** Delete o arquivo de lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

O arquivo de lock fica em `/data/gateway.*.lock` (não em um subdiretório).

### Configuração não sendo lida

Se usar `--allow-unconfigured`, o gateway cria uma configuração mínima. Sua configuração personalizada em `/data/opencraft.json` deve ser lida na reinicialização.

Verifique se a configuração existe:

```bash
fly ssh console --command "cat /data/opencraft.json"
```

### Escrevendo configuração via SSH

O comando `fly ssh console -C` não suporta redirecionamento shell. Para escrever um arquivo de configuração:

```bash
# Use echo + tee (pipe do local para o remoto)
echo '{"your":"config"}' | fly ssh console -C "tee /data/opencraft.json"

# Ou use sftp
fly sftp shell
> put /local/path/config.json /data/opencraft.json
```

**Nota:** `fly sftp` pode falhar se o arquivo já existir. Delete primeiro:

```bash
fly ssh console --command "rm /data/opencraft.json"
```

### Estado não persistindo

Se você perder credenciais ou sessões após reinicialização, o diretório de estado está escrevendo no sistema de arquivos do contêiner.

**Correção:** Certifique-se de que `OPENCRAFT_STATE_DIR=/data` está definido no `fly.toml` e reimplante.

## Atualizações

```bash
# Baixar últimas alterações
git pull

# Reimplantar
fly deploy

# Verificar saúde
fly status
fly logs
```

### Atualizando comando da máquina

Se você precisar alterar o comando de inicialização sem uma reimplantação completa:

```bash
# Obter ID da máquina
fly machines list

# Atualizar comando
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Ou com aumento de memória
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Nota:** Após `fly deploy`, o comando da máquina pode ser resetado para o que está no `fly.toml`. Se você fez alterações manuais, reaplique-as após o deploy.

## Implantação Privada (Reforçada)

Por padrão, o Fly aloca IPs públicos, tornando seu gateway acessível em `https://your-app.fly.dev`. Isso é conveniente mas significa que sua implantação é descobrível por scanners de internet (Shodan, Censys, etc.).

Para uma implantação reforçada **sem exposição pública**, use o template privado.

### Quando usar implantação privada

- Você faz apenas chamadas/mensagens **de saída** (sem webhooks de entrada)
- Você usa túneis **ngrok ou Tailscale** para callbacks de webhook
- Você acessa o gateway via **SSH, proxy ou WireGuard** ao invés do navegador
- Você quer a implantação **oculta de scanners de internet**

### Configuração

Use `fly.private.toml` ao invés da configuração padrão:

```bash
# Implantar com configuração privada
fly deploy -c fly.private.toml
```

Ou converta uma implantação existente:

```bash
# Listar IPs atuais
fly ips list -a my-opencraft

# Liberar IPs públicos
fly ips release <public-ipv4> -a my-opencraft
fly ips release <public-ipv6> -a my-opencraft

# Mudar para configuração privada para que futuros deploys não realoquem IPs públicos
# (remova [http_service] ou implante com o template privado)
fly deploy -c fly.private.toml

# Alocar IPv6 somente privado
fly ips allocate-v6 --private -a my-opencraft
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
# Encaminhar porta local 3000 para o app
fly proxy 3000:3000 -a my-opencraft

# Depois abra http://localhost:3000 no navegador
```

**Opção 2: VPN WireGuard**

```bash
# Criar configuração WireGuard (uma vez)
fly wireguard create

# Importar para o cliente WireGuard, depois acesse via IPv6 interno
# Exemplo: http://[fdaa:x:x:x:x::x]:3000
```

**Opção 3: Somente SSH**

```bash
fly ssh console -a my-opencraft
```

### Webhooks com implantação privada

Se você precisa de callbacks de webhook (Twilio, Telnyx, etc.) sem exposição pública:

1. **Túnel ngrok** - Execute ngrok dentro do contêiner ou como sidecar
2. **Tailscale Funnel** - Exponha caminhos específicos via Tailscale
3. **Somente saída** - Alguns provedores (Twilio) funcionam bem para chamadas de saída sem webhooks

Exemplo de configuração de chamada de voz com ngrok:

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

O túnel ngrok roda dentro do contêiner e fornece uma URL pública de webhook sem expor o app Fly em si. Defina `webhookSecurity.allowedHosts` com o hostname público do túnel para que os headers de host encaminhados sejam aceitos.

### Benefícios de segurança

| Aspecto              | Público     | Privado   |
| -------------------- | ----------- | --------- |
| Scanners de internet | Descobrível | Oculto    |
| Ataques diretos      | Possível    | Bloqueado |
| Acesso Control UI    | Navegador   | Proxy/VPN |
| Entrega de Webhook   | Direta      | Via túnel |

## Notas

- Fly.io usa **arquitetura x86** (não ARM)
- O Dockerfile é compatível com ambas as arquiteturas
- Para onboarding de WhatsApp/Telegram, use `fly ssh console`
- Dados persistentes ficam no volume em `/data`
- Signal requer Java + signal-cli; use uma imagem personalizada e mantenha a memória em 2GB+.

## Custo

Com a configuração recomendada (`shared-cpu-2x`, 2GB RAM):

- ~$10-15/mês dependendo do uso
- O plano gratuito inclui alguma franquia

Veja [preços do Fly.io](https://fly.io/docs/about/pricing/) para detalhes.
