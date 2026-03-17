---
summary: "Guia de configuração para desenvolvedores trabalhando no aplicativo macOS do OpenCraft"
read_when:
  - Configurando o ambiente de desenvolvimento macOS
title: "Configuração de Desenvolvimento macOS"
---

# Configuração de Desenvolvimento macOS

Este guia cobre os passos necessários para compilar e executar o aplicativo macOS do OpenCraft a partir do código-fonte.

## Pré-requisitos

Antes de compilar o aplicativo, certifique-se de ter o seguinte instalado:

1. **Xcode 26.2+**: Necessário para desenvolvimento em Swift.
2. **Node.js 24 & pnpm**: Recomendado para o Gateway, CLI e scripts de empacotamento. Node 22 LTS, atualmente `22.16+`, permanece suportado para compatibilidade.

## 1. Instale as dependências

Instale as dependências de todo o projeto:

```bash
pnpm install
```

## 2. Compile e empacote o aplicativo

Para compilar o aplicativo macOS e empacotá-lo em `dist/OpenCraft.app`, execute:

```bash
./scripts/package-mac-app.sh
```

Se você não tiver um certificado Apple Developer ID, o script usará automaticamente **assinatura ad-hoc** (`-`).

Para modos de execução de desenvolvimento, flags de assinatura e solução de problemas de Team ID, veja o README do aplicativo macOS:
[https://github.com/editzffaleta/OpenCraft/blob/main/apps/macos/README.md](https://github.com/editzffaleta/OpenCraft/blob/main/apps/macos/README.md)

> **Nota**: Aplicativos assinados ad-hoc podem gerar avisos de segurança. Se o aplicativo travar imediatamente com "Abort trap 6", veja a seção [Solução de problemas](#solução-de-problemas).

## 3. Instale a CLI

O aplicativo macOS espera uma instalação global da CLI `opencraft` para gerenciar tarefas em segundo plano.

**Para instalá-la (recomendado):**

1. Abra o aplicativo OpenCraft.
2. Vá para a aba **General** nas configurações.
3. Clique em **"Install CLI"**.

Alternativamente, instale manualmente:

```bash
npm install -g opencraft@<versão>
```

## Solução de problemas

### Falha na compilação: incompatibilidade de Toolchain ou SDK

A compilação do aplicativo macOS espera o SDK macOS mais recente e o toolchain Swift 6.2.

**Dependências do sistema (obrigatórias):**

- **Última versão do macOS disponível no Software Update** (necessária pelos SDKs do Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Verificações:**

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não corresponderem, atualize o macOS/Xcode e execute novamente a compilação.

### Aplicativo trava ao conceder permissão

Se o aplicativo travar quando você tentar permitir acesso ao **Reconhecimento de Fala** ou **Microfone**, pode ser devido a um cache TCC corrompido ou incompatibilidade de assinatura.

**Correção:**

1. Redefina as permissões TCC:

   ```bash
   tccutil reset All ai.opencraft.mac.debug
   ```

2. Se isso falhar, altere o `BUNDLE_ID` temporariamente em [`scripts/package-mac-app.sh`](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/package-mac-app.sh) para forçar uma "tela limpa" do macOS.

### Gateway "Starting..." indefinidamente

Se o status do Gateway ficar em "Starting...", verifique se um processo zumbi está ocupando a porta:

```bash
opencraft gateway status
opencraft gateway stop

# Se você não estiver usando um LaunchAgent (modo dev / execução manual), encontre o ouvinte:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver ocupando a porta, pare esse processo (Ctrl+C). Como último recurso, mate o PID encontrado acima.
