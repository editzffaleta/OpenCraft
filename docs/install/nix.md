---
summary: "Instale o OpenCraft declarativamente com Nix"
read_when:
  - Você quer instalações reproduzíveis e com rollback
  - Você já usa Nix/NixOS/Home Manager
  - Você quer tudo fixado e gerenciado declarativamente
title: "Nix"
---

# Instalação com Nix

A forma recomendada de rodar o OpenCraft com Nix é via **[nix-opencraft](https://github.com/opencraft/nix-opencraft)** - um módulo Home Manager completo.

## Início Rápido

Cole isso no seu agente de IA (Claude, Cursor, etc.):

```text
I want to set up nix-opencraft on my Mac.
Repository: github:opencraft/nix-opencraft

What I need you to do:
1. Check if Determinate Nix is installed (if not, install it)
2. Create a local flake at ~/code/opencraft-local using templates/agent-first/flake.nix
3. Help me create a Telegram bot (@BotFather) and get my chat ID (@userinfobot)
4. Set up secrets (bot token, model provider API key) - plain files at ~/.secrets/ is fine
5. Fill in the template placeholders and run home-manager switch
6. Verify: launchd running, bot responds to messages

Reference the nix-opencraft README for module options.
```

> **Guia completo: [github.com/opencraft/nix-opencraft](https://github.com/opencraft/nix-opencraft)**
>
> O repositório nix-opencraft é a fonte de verdade para instalação via Nix. Esta página é apenas uma visão geral rápida.

## O que você obtém

- Gateway + app macOS + ferramentas (whisper, spotify, cameras) - tudo fixado
- Serviço launchd que sobrevive a reboots
- Sistema de Plugin com configuração declarativa
- Rollback instantâneo: `home-manager switch --rollback`

---

## Comportamento de Runtime no Modo Nix

Quando `OPENCRAFT_NIX_MODE=1` está definido (automático com nix-opencraft):

O OpenCraft suporta um **modo Nix** que torna a configuração determinística e desabilita fluxos de auto-instalação.
Habilite exportando:

```bash
OPENCRAFT_NIX_MODE=1
```

No macOS, o app GUI não herda automaticamente variáveis de ambiente do shell. Você também pode
habilitar o modo Nix via defaults:

```bash
defaults write ai.opencraft.mac opencraft.nixMode -bool true
```

### Caminhos de config + estado

O OpenCraft lê configuração JSON5 de `OPENCRAFT_CONFIG_PATH` e armazena dados mutáveis em `OPENCRAFT_STATE_DIR`.
Quando necessário, você também pode definir `OPENCRAFT_HOME` para controlar o diretório home base usado para resolução interna de caminhos.

- `OPENCRAFT_HOME` (precedência padrão: `HOME` / `USERPROFILE` / `os.homedir()`)
- `OPENCRAFT_STATE_DIR` (padrão: `~/.opencraft`)
- `OPENCRAFT_CONFIG_PATH` (padrão: `$OPENCRAFT_STATE_DIR/opencraft.json`)

Ao rodar sob Nix, defina estes explicitamente para localizações gerenciadas pelo Nix para que estado de runtime e configuração
fiquem fora do store imutável.

### Comportamento de runtime no modo Nix

- Fluxos de auto-instalação e auto-mutação são desabilitados
- Dependências faltantes exibem mensagens de remediação específicas do Nix
- A UI exibe um banner somente-leitura do modo Nix quando presente

## Nota de empacotamento (macOS)

O fluxo de empacotamento macOS espera um template Info.plist estável em:

```
apps/macos/Sources/OpenCraft/Resources/Info.plist
```

[`scripts/package-mac-app.sh`](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/package-mac-app.sh) copia este template para o app bundle e modifica campos dinâmicos
(bundle ID, versão/build, Git SHA, chaves Sparkle). Isso mantém o plist determinístico para empacotamento SwiftPM
e builds Nix (que não dependem de uma toolchain Xcode completa).

## Relacionado

- [nix-opencraft](https://github.com/opencraft/nix-opencraft) - guia de configuração completo
- [Wizard](/start/wizard) - configuração CLI sem Nix
- [Docker](/install/docker) - configuração containerizada
