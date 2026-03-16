---
summary: "Passos de assinatura para builds de debug macOS gerados pelos scripts de empacotamento"
read_when:
  - Criando ou assinando builds de debug do mac
title: "Assinatura macOS"
---

# Assinatura mac (builds de debug)

Este app geralmente é construído a partir de [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), que agora:

- define um identificador de bundle de debug estável: `ai.openclaw.mac.debug`
- escreve o Info.plist com esse bundle id (sobrescreva via `BUNDLE_ID=...`)
- chama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para assinar o binário principal e o bundle do app para que o macOS trate cada rebuild como o mesmo bundle assinado e mantenha as permissões TCC (notificações, acessibilidade, gravação de tela, microfone, voz). Para permissões estáveis, use uma identidade de assinatura real; ad-hoc é opcional e frágil (veja [permissões macOS](/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` por padrão; habilita timestamps confiáveis para assinaturas Developer ID. Defina `CODESIGN_TIMESTAMP=off` para pular timestamping (builds de debug offline).
- injeta metadados de build no Info.plist: `OpenCraftBuildTimestamp` (UTC) e `OpenCraftGitCommit` (hash curto) para que o painel Sobre possa mostrar build, git e canal de debug/release.
- **O empacotamento usa Node 24 como padrão**: o script executa builds TS e o build da Control UI. Node 22 LTS, atualmente `22.16+`, permanece suportado para compatibilidade.
- lê `SIGN_IDENTITY` do ambiente. Adicione `export SIGN_IDENTITY="Apple Development: Seu Nome (TEAMID)"` (ou seu cert Developer ID Application) ao seu rc de shell para sempre assinar com seu cert. A assinatura ad-hoc requer opt-in explícito via `ALLOW_ADHOC_SIGNING=1` ou `SIGN_IDENTITY="-"` (não recomendado para testes de permissão).
- executa uma auditoria de Team ID após a assinatura e falha se qualquer Mach-O dentro do bundle do app estiver assinado por um Team ID diferente. Defina `SKIP_TEAM_ID_CHECK=1` para ignorar.

## Uso

```bash
# da raiz do repositório
scripts/package-mac-app.sh               # seleciona identidade automaticamente; erro se nenhuma encontrada
SIGN_IDENTITY="Developer ID Application: Seu Nome" scripts/package-mac-app.sh   # cert real
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissões não vão persistir)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc explícito (mesma ressalva)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # apenas dev: contorno de incompatibilidade de Team ID do Sparkle
```

### Nota sobre Assinatura Ad-hoc

Ao assinar com `SIGN_IDENTITY="-"` (ad-hoc), o script desabilita automaticamente o **Hardened Runtime** (`--options runtime`). Isso é necessário para evitar crashes quando o app tenta carregar frameworks embutidos (como o Sparkle) que não compartilham o mesmo Team ID. Assinaturas ad-hoc também quebram a persistência de permissões TCC; veja [permissões macOS](/platforms/mac/permissions) para passos de recuperação.

## Metadados de build para o painel Sobre

`package-mac-app.sh` carimba o bundle com:

- `OpenCraftBuildTimestamp`: UTC ISO8601 no momento do empacotamento
- `OpenCraftGitCommit`: hash git curto (ou `unknown` se indisponível)

A aba Sobre lê essas chaves para mostrar versão, data de build, commit git, e se é um build de debug (via `#if DEBUG`). Execute o empacotador para atualizar esses valores após alterações no código.

## Por que

As permissões TCC estão vinculadas ao identificador do bundle _e_ à assinatura de código. Builds de debug não assinados com UUIDs variáveis faziam o macOS esquecer as concessões após cada rebuild. Assinar os binários (ad-hoc por padrão) e manter um bundle id/caminho fixo (`dist/OpenCraft.app`) preserva as concessões entre builds, seguindo a abordagem VibeTunnel.
