---
summary: "Como o OpenCraft inclui identificadores de modelo de dispositivos Apple para nomes amigáveis no app macOS."
read_when:
  - Atualizando mapeamentos de identificadores de modelo de dispositivo ou arquivos NOTICE/licença
  - Alterando como a UI de Instâncias exibe nomes de dispositivos
title: "Banco de Dados de Modelos de Dispositivos"
---

# Banco de dados de modelos de dispositivos (nomes amigáveis)

O app companheiro macOS mostra nomes amigáveis de modelos de dispositivos Apple na UI de **Instâncias** mapeando identificadores de modelo Apple (ex.: `iPad16,6`, `Mac16,6`) para nomes legíveis por humanos.

O mapeamento está incluído como JSON em:

- `apps/macos/Sources/OpenCraft/Resources/DeviceModels/`

## Fonte de dados

Atualmente incluímos o mapeamento do repositório licenciado sob MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Para manter builds determinísticos, os arquivos JSON são fixados em commits específicos do upstream (registrados em `apps/macos/Sources/OpenCraft/Resources/DeviceModels/NOTICE.md`).

## Atualizando o banco de dados

1. Escolha os commits upstream que deseja fixar (um para iOS, um para macOS).
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

4. Certifique-se de que `apps/macos/Sources/OpenCraft/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` ainda corresponde ao upstream (substitua se a licença upstream mudar).
5. Verifique se o app macOS compila sem problemas (sem avisos):

```bash
swift build --package-path apps/macos
```
