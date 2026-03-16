---
summary: "Instalar o OpenCraft declarativamente com Nix"
read_when:
  - Você quer instalações reproduzíveis e com rollback
  - Você já usa Nix/NixOS/Home Manager
  - Você quer tudo fixado e gerenciado declarativamente
title: "Nix"
---

# Instalação via Nix

A forma recomendada de executar o OpenCraft com Nix é via **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — um módulo Home Manager completo.

## Início rápido

Cole isto para o seu agente de IA (Claude, Cursor, etc.):

```text
Quero configurar o nix-openclaw no meu Mac.
Repositório: github:openclaw/nix-openclaw

O que preciso que você faça:
1. Verificar se o Determinate Nix está instalado (se não, instalar)
2. Criar um flake local em ~/code/openclaw-local usando templates/agent-first/flake.nix
3. Me ajudar a criar um bot do Telegram (@BotFather) e obter meu chat ID (@userinfobot)
4. Configurar segredos (token do bot, chave de API do provedor de modelo) - arquivos simples em ~/.secrets/ está bom
5. Preencher os placeholders do template e executar home-manager switch
6. Verificar: launchd em execução, bot responde às mensagens

Consulte o README do nix-openclaw para opções de módulo.
```

> **📦 Guia completo: [github.com/openclaw/nix-openclaw](https://github.com/openclaw/nix-openclaw)**
>
> O repositório nix-openclaw é a fonte da verdade para instalação via Nix. Esta página é apenas uma visão geral rápida.

## O que você obtém

- Gateway + app macOS + ferramentas (whisper, spotify, câmeras) — tudo fixado
- Serviço Launchd que sobrevive a reinicializações
- Sistema de plugins com config declarativa
- Rollback instantâneo: `home-manager switch --rollback`

---

## Comportamento de runtime do Modo Nix

Quando `OPENCLAW_NIX_MODE=1` está definido (automático com nix-openclaw):

O OpenCraft suporta um **modo Nix** que torna a configuração determinística e desabilita fluxos de instalação automática.
Habilite exportando:

```bash
OPENCLAW_NIX_MODE=1
```

No macOS, o app GUI não herda automaticamente variáveis de ambiente do shell. Você também pode
habilitar o modo Nix via defaults:

```bash
defaults write ai.opencraft.mac opencraft.nixMode -bool true
```

### Caminhos de config + estado

O OpenCraft lê config JSON5 de `OPENCLAW_CONFIG_PATH` e armazena dados mutáveis em `OPENCLAW_STATE_DIR`.
Quando necessário, você também pode definir `OPENCLAW_HOME` para controlar o diretório base home usado para resolução de caminho interno.

- `OPENCLAW_HOME` (precedência padrão: `HOME` / `USERPROFILE` / `os.homedir()`)
- `OPENCLAW_STATE_DIR` (padrão: `~/.opencraft`)
- `OPENCLAW_CONFIG_PATH` (padrão: `$OPENCLAW_STATE_DIR/opencraft.json`)

Ao executar sob Nix, defina esses explicitamente para locais gerenciados pelo Nix para que o estado de runtime e a config
fiquem fora do armazenamento imutável.

### Comportamento de runtime no modo Nix

- Fluxos de instalação automática e auto-mutação são desabilitados
- Dependências ausentes exibem mensagens de remediação específicas para Nix
- Superfícies de UI mostram um banner de modo Nix somente leitura quando presente

## Nota de empacotamento (macOS)

O fluxo de empacotamento para macOS espera um template estável de Info.plist em:

```
apps/macos/Sources/OpenClaw/Resources/Info.plist
```

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) copia este template para o bundle do app e corrige campos dinâmicos
(bundle ID, versão/build, SHA do Git, chaves Sparkle). Isso mantém o plist determinístico para
empacotamento SwiftPM e builds Nix (que não dependem de um toolchain Xcode completo).

## Relacionados

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — guia completo de configuração
- [Wizard](/start/wizard) — configuração via CLI (sem Nix)
- [Docker](/install/docker) — configuração em contêiner
