---
summary: "Como os scripts de instalação funcionam (install.sh, install-cli.sh, install.ps1), flags e automação"
read_when:
  - Você quer entender o `opencraft.ai/install.sh`
  - Você quer automatizar instalações (CI / headless)
  - Você quer instalar a partir de um checkout do GitHub
title: "Detalhes do Instalador"
---

# Detalhes do instalador

O OpenCraft distribui três scripts de instalação, servidos a partir de `opencraft.ai`.

| Script                             | Plataforma           | O que faz                                                                                               |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node.js se necessário, instala OpenCraft via npm (padrão) ou git, e pode executar o onboarding. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node.js + OpenCraft em um prefixo local (`~/.opencraft`). Não requer root.                      |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala Node.js se necessário, instala OpenCraft via npm (padrão) ou git, e pode executar o onboarding. |

## Comandos rápidos

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://opencraft.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Se a instalação for bem-sucedida mas `opencraft` não for encontrado em um novo terminal, veja [Solução de problemas do Node.js](/install/node#troubleshooting).
</Note>

---

## install.sh

<Tip>
Recomendado para a maioria das instalações interativas no macOS/Linux/WSL.
</Tip>

### Fluxo (install.sh)

<Steps>
  <Step title="Detectar SO">
    Suporta macOS e Linux (incluindo WSL). Se macOS for detectado, instala Homebrew se estiver faltando.
  </Step>
  <Step title="Garantir Node.js 24 por padrão">
    Verifica a versão do Node.js e instala Node 24 se necessário (Homebrew no macOS, scripts de setup NodeSource no Linux apt/dnf/yum). O OpenCraft ainda suporta Node 22 LTS, atualmente `22.16+`, para compatibilidade.
  </Step>
  <Step title="Garantir Git">
    Instala Git se estiver faltando.
  </Step>
  <Step title="Instalar OpenCraft">
    - Método `npm` (padrão): instalação global via npm
    - Método `git`: clone/atualiza repositório, instala dependências com pnpm, faz build, depois instala wrapper em `~/.local/bin/opencraft`
  </Step>
  <Step title="Tarefas pós-instalação">
    - Executa `opencraft doctor --non-interactive` em atualizações e instalações git (melhor esforço)
    - Tenta onboarding quando apropriado (TTY disponível, onboarding não desabilitado, e verificações de bootstrap/config passam)
    - Define `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão
  </Step>
</Steps>

### Detecção de checkout do código-fonte

Se executado dentro de um checkout do OpenCraft (`package.json` + `pnpm-workspace.yaml`), o script oferece:

- usar checkout (`git`), ou
- usar instalação global (`npm`)

Se não houver TTY disponível e nenhum método de instalação estiver definido, ele usa `npm` por padrão e exibe um aviso.

O script encerra com código `2` para seleção de método inválida ou valores inválidos de `--install-method`.

### Exemplos (install.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Pular onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalação git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Simulação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                                  | Descrição                                                        |
| ------------------------------------- | ---------------------------------------------------------------- |
| `--install-method npm\|git`           | Escolher método de instalação (padrão: `npm`). Alias: `--method` |
| `--npm`                               | Atalho para método npm                                           |
| `--git`                               | Atalho para método git. Alias: `--github`                        |
| `--version <version\|dist-tag\|spec>` | Versão npm, dist-tag ou spec de pacote (padrão: `latest`)        |
| `--beta`                              | Usar dist-tag beta se disponível, senão fallback para `latest`   |
| `--git-dir <path>`                    | Diretório de checkout (padrão: `~/opencraft`). Alias: `--dir`    |
| `--no-git-update`                     | Pular `git pull` para checkout existente                         |
| `--no-prompt`                         | Desabilitar prompts                                              |
| `--no-onboard`                        | Pular onboarding                                                 |
| `--onboard`                           | Habilitar onboarding                                             |
| `--dry-run`                           | Exibir ações sem aplicar mudanças                                |
| `--verbose`                           | Habilitar saída de debug (`set -x`, logs npm notice-level)       |
| `--help`                              | Mostrar uso (`-h`)                                               |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                                 | Descrição                                           |
| -------------------------------------------------------- | --------------------------------------------------- |
| `OPENCRAFT_INSTALL_METHOD=git\|npm`                      | Método de instalação                                |
| `OPENCRAFT_VERSION=latest\|next\|main\|<semver>\|<spec>` | Versão npm, dist-tag ou spec de pacote              |
| `OPENCRAFT_BETA=0\|1`                                    | Usar beta se disponível                             |
| `OPENCRAFT_GIT_DIR=<path>`                               | Diretório de checkout                               |
| `OPENCRAFT_GIT_UPDATE=0\|1`                              | Alternar atualizações git                           |
| `OPENCRAFT_NO_PROMPT=1`                                  | Desabilitar prompts                                 |
| `OPENCRAFT_NO_ONBOARD=1`                                 | Pular onboarding                                    |
| `OPENCRAFT_DRY_RUN=1`                                    | Modo simulação                                      |
| `OPENCRAFT_VERBOSE=1`                                    | Modo debug                                          |
| `OPENCRAFT_NPM_LOGLEVEL=error\|warn\|notice`             | Nível de log do npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                       | Controlar comportamento sharp/libvips (padrão: `1`) |

  </Accordion>
</AccordionGroup>

---

## install-cli.sh

<Info>
Projetado para ambientes onde você quer tudo sob um prefixo local (padrão `~/.opencraft`) e sem dependência de Node.js no sistema.
</Info>

### Fluxo (install-cli.sh)

<Steps>
  <Step title="Instalar runtime local Node.js">
    Baixa um tarball Node.js com versão fixada (atualmente padrão `22.22.0`) para `<prefix>/tools/node-v<version>` e verifica SHA-256.
  </Step>
  <Step title="Garantir Git">
    Se Git estiver faltando, tenta instalar via apt/dnf/yum no Linux ou Homebrew no macOS.
  </Step>
  <Step title="Instalar OpenCraft sob o prefixo">
    Instala com npm usando `--prefix <prefix>`, depois escreve wrapper em `<prefix>/bin/opencraft`.
  </Step>
</Steps>

### Exemplos (install-cli.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefixo + versão personalizados">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install-cli.sh | bash -s -- --prefix /opt/opencraft --version latest
    ```
  </Tab>
  <Tab title="Saída JSON para automação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install-cli.sh | bash -s -- --json --prefix /opt/opencraft
    ```
  </Tab>
  <Tab title="Executar onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                   | Descrição                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `--prefix <path>`      | Prefixo de instalação (padrão: `~/.opencraft`)                                        |
| `--version <ver>`      | Versão ou dist-tag do OpenCraft (padrão: `latest`)                                    |
| `--node-version <ver>` | Versão do Node.js (padrão: `22.22.0`)                                                 |
| `--json`               | Emitir eventos NDJSON                                                                 |
| `--onboard`            | Executar `opencraft onboard` após instalação                                          |
| `--no-onboard`         | Pular onboarding (padrão)                                                             |
| `--set-npm-prefix`     | No Linux, forçar prefixo npm para `~/.npm-global` se o prefixo atual não for gravável |
| `--help`               | Mostrar uso (`-h`)                                                                    |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                     | Descrição                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `OPENCRAFT_PREFIX=<path>`                    | Prefixo de instalação                                                                           |
| `OPENCRAFT_VERSION=<ver>`                    | Versão ou dist-tag do OpenCraft                                                                 |
| `OPENCRAFT_NODE_VERSION=<ver>`               | Versão do Node.js                                                                               |
| `OPENCRAFT_NO_ONBOARD=1`                     | Pular onboarding                                                                                |
| `OPENCRAFT_NPM_LOGLEVEL=error\|warn\|notice` | Nível de log do npm                                                                             |
| `OPENCRAFT_GIT_DIR=<path>`                   | Caminho de busca para limpeza legada (usado ao remover checkout antigo do submodule `Peekaboo`) |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`           | Controlar comportamento sharp/libvips (padrão: `1`)                                             |

  </Accordion>
</AccordionGroup>

---

## install.ps1

### Fluxo (install.ps1)

<Steps>
  <Step title="Garantir PowerShell + ambiente Windows">
    Requer PowerShell 5+.
  </Step>
  <Step title="Garantir Node.js 24 por padrão">
    Se estiver faltando, tenta instalar via winget, depois Chocolatey, depois Scoop. Node 22 LTS, atualmente `22.16+`, continua suportado para compatibilidade.
  </Step>
  <Step title="Instalar OpenCraft">
    - Método `npm` (padrão): instalação global via npm usando a `-Tag` selecionada
    - Método `git`: clone/atualiza repositório, instala/faz build com pnpm, e instala wrapper em `%USERPROFILE%\.local\bin\opencraft.cmd`
  </Step>
  <Step title="Tarefas pós-instalação">
    Adiciona o diretório bin necessário ao PATH do usuário quando possível, depois executa `opencraft doctor --non-interactive` em atualizações e instalações git (melhor esforço).
  </Step>
</Steps>

### Exemplos (install.ps1)

<Tabs>
  <Tab title="Padrão">
    ```powershell
    iwr -useb https://opencraft.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalação git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Diretório git personalizado">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -InstallMethod git -GitDir "C:\opencraft"
    ```
  </Tab>
  <Tab title="Simulação">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Rastreamento de debug">
    ```powershell
    # install.ps1 ainda não tem uma flag -Verbose dedicada.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                        | Descrição                                                 |
| --------------------------- | --------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalação (padrão: `npm`)                      |
| `-Tag <tag\|version\|spec>` | dist-tag npm, versão ou spec de pacote (padrão: `latest`) |
| `-GitDir <path>`            | Diretório de checkout (padrão: `%USERPROFILE%\opencraft`) |
| `-NoOnboard`                | Pular onboarding                                          |
| `-NoGitUpdate`              | Pular `git pull`                                          |
| `-DryRun`                   | Apenas exibir ações                                       |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                            | Descrição             |
| ----------------------------------- | --------------------- |
| `OPENCRAFT_INSTALL_METHOD=git\|npm` | Método de instalação  |
| `OPENCRAFT_GIT_DIR=<path>`          | Diretório de checkout |
| `OPENCRAFT_NO_ONBOARD=1`            | Pular onboarding      |
| `OPENCRAFT_GIT_UPDATE=0`            | Desabilitar git pull  |
| `OPENCRAFT_DRY_RUN=1`               | Modo simulação        |

  </Accordion>
</AccordionGroup>

<Note>
Se `-InstallMethod git` for usado e o Git estiver faltando, o script encerra e exibe o link do Git for Windows.
</Note>

---

## CI e automação

Use flags/variáveis de ambiente não-interativas para execuções previsíveis.

<Tabs>
  <Tab title="install.sh (npm não-interativo)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git não-interativo)">
    ```bash
    OPENCRAFT_INSTALL_METHOD=git OPENCRAFT_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install-cli.sh | bash -s -- --json --prefix /opt/opencraft
    ```
  </Tab>
  <Tab title="install.ps1 (pular onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solução de problemas

<AccordionGroup>
  <Accordion title="Por que o Git é necessário?">
    Git é necessário para o método de instalação `git`. Para instalações `npm`, o Git ainda é verificado/instalado para evitar falhas `spawn git ENOENT` quando dependências usam URLs git.
  </Accordion>

  <Accordion title="Por que o npm dá EACCES no Linux?">
    Algumas configurações Linux apontam o prefixo global do npm para caminhos de propriedade do root. `install.sh` pode mudar o prefixo para `~/.npm-global` e adicionar exports de PATH aos arquivos rc do shell (quando esses arquivos existem).
  </Accordion>

  <Accordion title="Problemas com sharp/libvips">
    Os scripts definem `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão para evitar que sharp compile contra o libvips do sistema. Para sobrescrever:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instale Git for Windows, reabra o PowerShell, execute o instalador novamente.
  </Accordion>

  <Accordion title='Windows: "opencraft is not recognized"'>
    Execute `npm config get prefix` e adicione esse diretório ao seu PATH de usuário (sem sufixo `\bin` no Windows), depois reabra o PowerShell.
  </Accordion>

  <Accordion title="Windows: como obter saída verbosa do instalador">
    `install.ps1` não expõe atualmente uma flag `-Verbose`.
    Use rastreamento do PowerShell para diagnósticos em nível de script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="opencraft não encontrado após instalação">
    Geralmente é um problema de PATH. Veja [Solução de problemas do Node.js](/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>
