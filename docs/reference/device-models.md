---
summary: "Como o OpenCraft vende identificadores de modelo de dispositivo Apple para nomes amigáveis no app macOS."
read_when:
  - Atualizando mapeamentos de identificadores de modelo de dispositivo ou arquivos NOTICE/licença
  - Alterando como a UI de Instâncias exibe nomes de dispositivos
title: "Banco de Dados de Modelos de Dispositivo"
---

# Banco de dados de modelos de dispositivo (nomes amigáveis)

O app companion macOS mostra nomes amigáveis de dispositivos Apple na UI de **Instâncias** mapeando identificadores de modelo Apple (ex: `iPad16,6`, `Mac16,6`) para nomes legíveis por humanos.

O mapeamento é vendido como JSON em:

- `apps/macos/Sources/OpenCraft/Resources/DeviceModels/`

## Fonte de dados

Atualmente vendemos o mapeamento do repositório com licença MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Para manter builds determinísticos, os arquivos JSON estão fixados em commits específicos do upstream (registrados em `apps/macos/Sources/OpenCraft/Resources/DeviceModels/NOTICE.md`).

## Atualizando o banco de dados

1. Escolha os commits do upstream nos quais deseja fixar (um para iOS, um para macOS).
2. Atualize os hashes de commit em `apps/macos/Sources/OpenCraft/Resources/DeviceModels/NOTICE.md`.
3. Baixe novamente os arquivos JSON, fixados nesses commits:

```bash
IOS_COMMIT="<commit sha para ios-device-identifiers.json>"
MAC_COMMIT="<commit sha para mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenCraft/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenCraft/Resources/DeviceModels/mac-device-identifiers.json
```

4. Certifique-se de que `apps/macos/Sources/OpenCraft/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` ainda corresponde ao upstream (substitua-o se a licença do upstream mudar).
5. Verifique se o app macOS compila limpo (sem avisos):

```bash
swift build --package-path apps/macos
```
