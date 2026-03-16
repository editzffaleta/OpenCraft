---
summary: "Guia de configuração para desenvolvedores trabalhando no app macOS do OpenCraft"
read_when:
  - Configurando o ambiente de desenvolvimento macOS
title: "Configuração Dev macOS"
---

# Configuração do Desenvolvedor macOS

Este guia cobre os passos necessários para compilar e executar o app macOS do OpenCraft a partir do código-fonte.

## Pré-requisitos

Antes de compilar o app, certifique-se de ter o seguinte instalado:

1. **Xcode 26.2+**: Necessário para desenvolvimento Swift.
2. **Node.js 24 & pnpm**: Recomendado para o gateway, CLI e scripts de empacotamento. Node 22 LTS, atualmente `22.16+`, permanece suportado para compatibilidade.

## 1. Instalar Dependências

Instale as dependências do projeto:

```bash
pnpm install
```

## 2. Compilar e Empacotar o App

Para compilar o app macOS e empacotá-lo em `dist/OpenCraft.app`, execute:

```bash
./scripts/package-mac-app.sh
```

Se você não tiver um certificado Apple Developer ID, o script usará automaticamente **assinatura ad-hoc** (`-`).

Para modos de execução dev, flags de assinatura e troubleshooting de Team ID, veja o README do app macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: Apps com assinatura ad-hoc podem disparar prompts de segurança. Se o app travar imediatamente com "Abort trap 6", veja a seção de [Troubleshooting](#troubleshooting).

## 3. Instalar o CLI

O app macOS espera uma instalação global do CLI `opencraft` para gerenciar tarefas em background.

**Para instalá-lo (recomendado):**

1. Abra o app OpenCraft.
2. Vá para a aba de configurações **Geral**.
3. Clique em **"Install CLI"**.

Alternativamente, instale manualmente:

```bash
npm install -g opencraft@<versão>
```

## Troubleshooting

### Falha no Build: Incompatibilidade de Toolchain ou SDK

O build do app macOS espera o SDK mais recente do macOS e o toolchain Swift 6.2.

**Dependências do sistema (necessárias):**

- **Última versão do macOS disponível em Atualização de Software** (necessária pelos SDKs do Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Verificações:**

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não corresponderem, atualize macOS/Xcode e execute o build novamente.

### App Trava ao Conceder Permissão

Se o app travar quando você tentar permitir acesso ao **Reconhecimento de Fala** ou **Microfone**, pode ser devido a um cache TCC corrompido ou incompatibilidade de assinatura.

**Solução:**

1. Redefina as permissões TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se isso falhar, altere o `BUNDLE_ID` temporariamente em [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forçar um "slate limpo" do macOS.

### Gateway preso em "Starting..." indefinidamente

Se o status do gateway permanecer em "Starting...", verifique se um processo zumbi está segurando a porta:

```bash
opencraft gateway status
opencraft gateway stop

# Se você não estiver usando um LaunchAgent (modo dev / execuções manuais), encontre o listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver segurando a porta, pare esse processo (Ctrl+C). Como último recurso, mate o PID encontrado acima.
