---
summary: "Checklist de release macOS do OpenCraft (feed Sparkle, empacotamento, assinatura)"
read_when:
  - Criando ou validando um release macOS do OpenCraft
  - Atualizando o appcast Sparkle ou assets do feed
title: "Release macOS"
---

# Release macOS do OpenCraft (Sparkle)

Este app agora inclui auto-atualizações Sparkle. Builds de release devem ser assinados com Developer ID, compactados em zip, e publicados com uma entrada de appcast assinada.

## Pré-requisitos

- Certificado Developer ID Application instalado (exemplo: `Developer ID Application: <Nome do Desenvolvedor> (<TEAMID>)`).
- Caminho da chave privada Sparkle definido no ambiente como `SPARKLE_PRIVATE_KEY_FILE` (caminho para sua chave privada ed25519 do Sparkle; chave pública embutida no Info.plist). Se estiver ausente, verifique `~/.profile`.
- Credenciais de notarização (perfil keychain ou chave API) para `xcrun notarytool` se quiser distribuição de DMG/zip segura para Gatekeeper.
  - Usamos um perfil Keychain chamado `opencraft-notary`, criado a partir de variáveis de ambiente da chave API do App Store Connect no seu perfil de shell:
    - `APP_STORE_CONNECT_API_KEY_P8`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`
    - `echo "$APP_STORE_CONNECT_API_KEY_P8" | sed 's/\\n/\n/g' > /tmp/opencraft-notary.p8`
    - `xcrun notarytool store-credentials "opencraft-notary" --key /tmp/opencraft-notary.p8 --key-id "$APP_STORE_CONNECT_KEY_ID" --issuer "$APP_STORE_CONNECT_ISSUER_ID"`
- Deps `pnpm` instaladas (`pnpm install --config.node-linker=hoisted`).
- As ferramentas Sparkle são obtidas automaticamente via SwiftPM em `apps/macos/.build/artifacts/sparkle/Sparkle/bin/` (`sign_update`, `generate_appcast`, etc.).

## Build e empacotamento

Notas:

- `APP_BUILD` mapeia para `CFBundleVersion`/`sparkle:version`; mantenha numérico + monotônico (sem `-beta`), ou o Sparkle o compara como igual.
- Se `APP_BUILD` for omitido, `scripts/package-mac-app.sh` deriva um padrão seguro para Sparkle de `APP_VERSION` (`YYYYMMDDNN`: estável usa `90` como padrão, pré-lançamentos usam um sufixo derivado do lane) e usa o maior desse valor e a contagem de commits git.
- Você ainda pode sobrescrever `APP_BUILD` explicitamente quando a engenharia de release precisa de um valor monotônico específico.
- Para `BUILD_CONFIG=release`, `scripts/package-mac-app.sh` agora usa universal (`arm64 x86_64`) automaticamente. Você ainda pode sobrescrever com `BUILD_ARCHS=arm64` ou `BUILD_ARCHS=x86_64`. Para builds locais/dev (`BUILD_CONFIG=debug`), usa como padrão a arquitetura atual (`$(uname -m)`).
- Use `scripts/package-mac-dist.sh` para artefatos de release (zip + DMG + notarização). Use `scripts/package-mac-app.sh` para empacotamento local/dev.

```bash
# Da raiz do repositório; defina os IDs de release para que o feed Sparkle seja habilitado.
# Este comando cria artefatos de release sem notarização.
# APP_BUILD deve ser numérico + monotônico para comparação Sparkle.
# O padrão é derivado automaticamente de APP_VERSION quando omitido.
SKIP_NOTARIZE=1 \
BUNDLE_ID=ai.opencraft.mac \
APP_VERSION=2026.3.13 \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Nome do Desenvolvedor> (<TEAMID>)" \
scripts/package-mac-dist.sh

# `package-mac-dist.sh` já cria o zip + DMG.
# Se você usou `package-mac-app.sh` diretamente, crie-os manualmente:
# Se quiser notarização/stapling nesta etapa, use o comando NOTARIZE abaixo.
ditto -c -k --sequesterRsrc --keepParent dist/OpenCraft.app dist/OpenCraft-2026.3.13.zip

# Opcional: criar um DMG estilizado para humanos (arrastar para /Applications)
scripts/create-dmg.sh dist/OpenCraft.app dist/OpenCraft-2026.3.13.dmg

# Recomendado: build + notarizar/staple zip + DMG
# Primeiro, crie um perfil keychain uma vez:
#   xcrun notarytool store-credentials "opencraft-notary" \
#     --apple-id "<apple-id>" --team-id "<team-id>" --password "<app-specific-password>"
NOTARIZE=1 NOTARYTOOL_PROFILE=opencraft-notary \
BUNDLE_ID=ai.opencraft.mac \
APP_VERSION=2026.3.13 \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Nome do Desenvolvedor> (<TEAMID>)" \
scripts/package-mac-dist.sh

# Opcional: incluir dSYM junto ao release
ditto -c -k --keepParent apps/macos/.build/release/OpenCraft.app.dSYM dist/OpenCraft-2026.3.13.dSYM.zip
```

## Entrada do appcast

Use o gerador de notas de release para que o Sparkle renderize notas HTML formatadas:

```bash
SPARKLE_PRIVATE_KEY_FILE=/caminho/para/chave-privada-ed25519 scripts/make_appcast.sh dist/OpenCraft-2026.3.13.zip https://raw.githubusercontent.com/editzffaleta/OpenCraft/main/appcast.xml
```

Gera notas de release HTML a partir do `CHANGELOG.md` (via [`scripts/changelog-to-html.sh`](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/changelog-to-html.sh)) e as incorpora na entrada do appcast.
Faça commit do `appcast.xml` atualizado junto com os assets de release (zip + dSYM) ao publicar.

## Publicar e verificar

- Faça upload de `OpenCraft-2026.3.13.zip` (e `OpenCraft-2026.3.13.dSYM.zip`) para o release GitHub da tag `v2026.3.13`.
- Certifique-se de que a URL bruta do appcast corresponde ao feed embutido: `https://raw.githubusercontent.com/editzffaleta/OpenCraft/main/appcast.xml`.
- Verificações de sanidade:
  - `curl -I https://raw.githubusercontent.com/editzffaleta/OpenCraft/main/appcast.xml` retorna 200.
  - `curl -I <url do enclosure>` retorna 200 após o upload dos assets.
  - Em um build público anterior, execute "Verificar Atualizações…" na aba Sobre e verifique se o Sparkle instala o novo build corretamente.

Definição de concluído: app assinado + appcast publicados, fluxo de atualização funciona a partir de uma versão instalada mais antiga, e assets de release estão anexados ao release GitHub.
