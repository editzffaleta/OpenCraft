---
summary: "Proxy comunitário para expor credenciais de assinatura Claude como um endpoint compatível com OpenAI"
read_when:
  - Você quer usar a assinatura Claude Max com ferramentas compatíveis com OpenAI
  - Você quer um servidor de API local que encapsula o Claude Code CLI
  - Você quer avaliar acesso baseado em assinatura vs baseado em chave de API da Anthropic
title: "Claude Max API Proxy"
---

# Claude Max API Proxy

**claude-max-api-proxy** é uma ferramenta comunitária que expõe sua assinatura Claude Max/Pro como um endpoint de API compatível com OpenAI. Isso permite que você use sua assinatura com qualquer ferramenta que suporte o formato da API OpenAI.

<Warning>
Este caminho é apenas para compatibilidade técnica. A Anthropic já bloqueou alguns usos de assinatura
fora do Claude Code no passado. Você deve decidir por conta própria se quer usar
e verificar os termos atuais da Anthropic antes de depender disso.
</Warning>

## Por que usar isso?

| Abordagem                | Custo                                                       | Ideal para                                    |
| ------------------------ | ----------------------------------------------------------- | --------------------------------------------- |
| API da Anthropic         | Pago por token (~$15/M entrada, $75/M saída para Opus)      | Apps em produção, alto volume                 |
| Assinatura Claude Max    | $200/mês fixo                                               | Uso pessoal, desenvolvimento, uso ilimitado   |

Se você tem uma assinatura Claude Max e quer usá-la com ferramentas compatíveis com OpenAI, este proxy pode reduzir custos para alguns fluxos de trabalho. Chaves de API continuam sendo o caminho mais claro em termos de política para uso em produção.

## Como funciona

```
Seu App → claude-max-api-proxy → Claude Code CLI → Anthropic (via assinatura)
     (formato OpenAI)              (converte formato)      (usa seu login)
```

O proxy:

1. Aceita requisições no formato OpenAI em `http://localhost:3456/v1/chat/completions`
2. Converte-as em comandos do Claude Code CLI
3. Retorna respostas no formato OpenAI (streaming suportado)

## Instalação

```bash
# Requer Node.js 20+ e Claude Code CLI
npm install -g claude-max-api-proxy

# Verificar se o Claude CLI está autenticado
claude --version
```

## Uso

### Iniciar o servidor

```bash
claude-max-api
# O servidor roda em http://localhost:3456
```

### Testar

```bash
# Verificação de saúde
curl http://localhost:3456/health

# Listar modelos
curl http://localhost:3456/v1/models

# Completação de chat
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Com OpenCraft

Você pode apontar o OpenCraft para o proxy como um endpoint customizado compatível com OpenAI:

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

## Modelos disponíveis

| ID do Modelo      | Mapeia para      |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## Inicialização automática no macOS

Crie um LaunchAgent para executar o proxy automaticamente:

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## Links

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Notas

- Esta é uma **ferramenta comunitária**, não suportada oficialmente pela Anthropic ou OpenCraft
- Requer uma assinatura ativa do Claude Max/Pro com o Claude Code CLI autenticado
- O proxy roda localmente e não envia dados para servidores de terceiros
- Respostas em streaming são totalmente suportadas

## Veja também

- [Provider Anthropic](/providers/anthropic) - Integração nativa do OpenCraft com setup-token ou chaves de API do Claude
- [Provider OpenAI](/providers/openai) - Para assinaturas OpenAI/Codex
