---
summary: "Etapas de assinatura para builds debug do macOS gerados pelos scripts de empacotamento"
read_when:
  - Compilando ou assinando builds debug do macOS
title: "Assinatura macOS"
---

# Assinatura macOS (builds debug)

Este aplicativo é geralmente compilado a partir de [`scripts/package-mac-app.sh`](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/package-mac-app.sh), que agora:

- define um identificador de bundle debug estável: `ai.opencraft.mac.debug`
- escreve o Info.plist com esse bundle id (substitua via `BUNDLE_ID=...`)
- chama [`scripts/codesign-mac-app.sh`](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/codesign-mac-app.sh) para assinar o binário principal e o bundle do aplicativo para que o macOS trate cada recompilação como o mesmo bundle assinado e mantenha as permissões TCC (notificações, acessibilidade, gravação de tela, microfone, fala). Para permissões estáveis, use uma identidade de assinatura real; ad-hoc é opt-in e frágil (veja [permissões macOS](/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` por padrão; habilita timestamps confiáveis para assinaturas de Developer ID. Defina `CODESIGN_TIMESTAMP=off` para pular timestamping (builds debug offline).
- injeta metadados de build no Info.plist: `OpenCraftBuildTimestamp` (UTC) e `OpenCraftGitCommit` (hash curto) para que o painel Sobre possa mostrar build, git e canal debug/release.
- **O empacotamento usa Node 24 por padrão**: o script executa builds TS e o build da Control UI. Node 22 LTS, atualmente `22.16+`, permanece suportado para compatibilidade.
- lê `SIGN_IDENTITY` do ambiente. Adicione `export SIGN_IDENTITY="Apple Development: Seu Nome (TEAMID)"` (ou seu certificado Developer ID Application) ao seu shell rc para sempre assinar com seu certificado. A assinatura ad-hoc requer opt-in explícito via `ALLOW_ADHOC_SIGNING=1` ou `SIGN_IDENTITY="-"` (não recomendado para teste de permissões).
- executa uma auditoria de Team ID após assinar e falha se algum Mach-O dentro do bundle do aplicativo estiver assinado por um Team ID diferente. Defina `SKIP_TEAM_ID_CHECK=1` para ignorar.

## Uso

```bash
# da raiz do repositório
scripts/package-mac-app.sh               # seleciona identidade automaticamente; erro se nenhuma encontrada
SIGN_IDENTITY="Developer ID Application: Seu Nome" scripts/package-mac-app.sh   # certificado real
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissões não persistirão)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc explícito (mesma ressalva)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # solução de desenvolvimento para incompatibilidade de Team ID do Sparkle
```

### Nota sobre assinatura ad-hoc

Ao assinar com `SIGN_IDENTITY="-"` (ad-hoc), o script desabilita automaticamente o **Hardened Runtime** (`--options runtime`). Isso é necessário para evitar crashes quando o aplicativo tenta carregar frameworks incorporados (como Sparkle) que não compartilham o mesmo Team ID. Assinaturas ad-hoc também quebram a persistência de permissões TCC; veja [permissões macOS](/platforms/mac/permissions) para etapas de recuperação.

## Metadados de build para Sobre

`package-mac-app.sh` marca o bundle com:

- `OpenCraftBuildTimestamp`: ISO8601 UTC no momento do empacotamento
- `OpenCraftGitCommit`: hash git curto (ou `unknown` se indisponível)

A aba Sobre lê essas chaves para mostrar versão, data de build, commit git e se é um build debug (via `#if DEBUG`). Execute o empacotador para atualizar esses valores após mudanças no código.

## Por quê

As permissões TCC estão vinculadas ao identificador de bundle _e_ à assinatura de código. Builds debug não assinados com UUIDs mutáveis faziam o macOS esquecer as concessões após cada recompilação. Assinar os binários (ad-hoc por padrão) e manter um bundle id/caminho fixo (`dist/OpenCraft.app`) preserva as concessões entre builds, correspondendo à abordagem VibeTunnel.
