---
summary: "Como os scripts instaladores funcionam (install.sh, install-cli.sh, install.ps1), flags e automação"
read_when:
  - Você quer entender o `openclaw.ai/install.sh`
  - Você quer automatizar instalações (CI / headless)
  - Você quer instalar a partir de um checkout do GitHub
title: "Detalhes do Instalador"
---

# Detalhes do instalador

O OpenCraft disponibiliza três scripts instaladores, servidos em `openclaw.ai`.

| Script                             | Plataforma           | O que faz                                                                                      |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala o Node se necessário, instala o OpenCraft via npm (padrão) ou git, e pode executar o onboarding. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala o Node + OpenCraft em um prefixo local (`~/.opencraft`). Não requer root.             |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala o Node se necessário, instala o OpenCraft via npm (padrão) ou git, e pode executar o onboarding. |

## Comandos rápidos

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Se a instalação foi bem-sucedida mas `opencraft` não é encontrado em um novo terminal, veja [Solução de problemas do Node.js](/install/node#troubleshooting).
</Note>

---

## install.sh

<Tip>
Recomendado para a maioria das instalações interativas no macOS/Linux/WSL.
</Tip>

### Fluxo (install.sh)

<Steps>
  <Step title="Detectar SO">
    Suporta macOS e Linux (incluindo WSL). Se macOS for detectado, instala o Homebrew se não estiver presente.
  </Step>
  <Step title="Garantir Node.js 24 por padrão">
    Verifica a versão do Node e instala o Node 24 se necessário (Homebrew no macOS, scripts de configuração NodeSource no Linux apt/dnf/yum). O OpenCraft ainda suporta Node 22 LTS, atualmente `22.16+`, para compatibilidade.
  </Step>
  <Step title="Garantir Git">
    Instala o Git se não estiver presente.
  </Step>
  <Step title="Instalar o OpenCraft">
    - Método `npm` (padrão): instalação global via npm
    - Método `git`: clona/atualiza o repositório, instala deps com pnpm, compila e instala o wrapper em `~/.local/bin/opencraft`
  </Step>
  <Step title="Tarefas pós-instalação">
    - Executa `opencraft doctor --non-interactive` em upgrades e instalações git (melhor esforço)
    - Tenta onboarding quando apropriado (TTY disponível, onboarding não desabilitado e verificações de bootstrap/config passam)
    - Define `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão
  </Step>
</Steps>

### Detecção de checkout do código-fonte

Se executado dentro de um checkout do OpenCraft (`package.json` + `pnpm-workspace.yaml`), o script oferece:

- usar checkout (`git`), ou
- usar instalação global (`npm`)

Se nenhum TTY estiver disponível e nenhum método de instalação estiver definido, usa `npm` por padrão e avisa.

O script sai com código `2` para seleção de método inválida ou valores `--install-method` inválidos.

### Exemplos (install.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Pular onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalação git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                            | Descrição                                                               |
| ------------------------------- | ----------------------------------------------------------------------- |
| `--install-method npm\|git`     | Escolher método de instalação (padrão: `npm`). Alias: `--method`        |
| `--npm`                         | Atalho para método npm                                                  |
| `--git`                         | Atalho para método git. Alias: `--github`                               |
| `--version <version\|dist-tag>` | Versão npm ou dist-tag (padrão: `latest`)                               |
| `--beta`                        | Usar dist-tag beta se disponível, caso contrário fallback para `latest` |
| `--git-dir <path>`              | Diretório de checkout (padrão: `~/opencraft`). Alias: `--dir`           |
| `--no-git-update`               | Pular `git pull` para checkout existente                                |
| `--no-prompt`                   | Desabilitar prompts                                                     |
| `--no-onboard`                  | Pular onboarding                                                        |
| `--onboard`                     | Habilitar onboarding                                                    |
| `--dry-run`                     | Imprimir ações sem aplicar alterações                                   |
| `--verbose`                     | Habilitar saída de debug (`set -x`, logs de nível notice do npm)        |
| `--help`                        | Mostrar uso (`-h`)                                                      |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                    | Descrição                               |
| ------------------------------------------- | --------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalação                    |
| `OPENCLAW_VERSION=latest\|next\|<semver>`   | Versão npm ou dist-tag                  |
| `OPENCLAW_BETA=0\|1`                        | Usar beta se disponível                 |
| `OPENCLAW_GIT_DIR=<path>`                   | Diretório de checkout                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Alternar atualizações git               |
| `OPENCLAW_NO_PROMPT=1`                      | Desabilitar prompts                     |
| `OPENCLAW_NO_ONBOARD=1`                     | Pular onboarding                        |
| `OPENCLAW_DRY_RUN=1`                        | Modo dry run                            |
| `OPENCLAW_VERBOSE=1`                        | Modo debug                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nível de log do npm                     |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Controlar comportamento do sharp/libvips (padrão: `1`) |

  </Accordion>
</AccordionGroup>

---

## install-cli.sh

<Info>
Projetado para ambientes onde você quer tudo sob um prefixo local (padrão `~/.opencraft`) e sem dependência do Node do sistema.
</Info>

### Fluxo (install-cli.sh)

<Steps>
  <Step title="Instalar runtime Node local">
    Baixa um tarball Node suportado e fixado (atualmente padrão `22.22.0`) para `<prefix>/tools/node-v<version>` e verifica SHA-256.
  </Step>
  <Step title="Garantir Git">
    Se o Git não estiver presente, tenta instalar via apt/dnf/yum no Linux ou Homebrew no macOS.
  </Step>
  <Step title="Instalar o OpenCraft sob o prefixo">
    Instala com npm usando `--prefix <prefix>`, depois escreve o wrapper em `<prefix>/bin/opencraft`.
  </Step>
</Steps>

### Exemplos (install-cli.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefixo + versão personalizados">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/opencraft --version latest
    ```
  </Tab>
  <Tab title="Saída JSON para automação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/opencraft
    ```
  </Tab>
  <Tab title="Executar onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                   | Descrição                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `--prefix <path>`      | Prefixo de instalação (padrão: `~/.opencraft`)                                     |
| `--version <ver>`      | Versão ou dist-tag do OpenCraft (padrão: `latest`)                                 |
| `--node-version <ver>` | Versão do Node (padrão: `22.22.0`)                                                 |
| `--json`               | Emitir eventos NDJSON                                                              |
| `--onboard`            | Executar `opencraft onboard` após a instalação                                     |
| `--no-onboard`         | Pular onboarding (padrão)                                                          |
| `--set-npm-prefix`     | No Linux, força o prefixo npm para `~/.npm-global` se o prefixo atual não for gravável |
| `--help`               | Mostrar uso (`-h`)                                                                 |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                    | Descrição                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefixo de instalação                                                                   |
| `OPENCLAW_VERSION=<ver>`                    | Versão ou dist-tag do OpenCraft                                                         |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versão do Node                                                                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Pular onboarding                                                                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nível de log do npm                                                                     |
| `OPENCLAW_GIT_DIR=<path>`                   | Caminho de lookup de limpeza legado (usado ao remover checkout antigo do submódulo `Peekaboo`) |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Controlar comportamento do sharp/libvips (padrão: `1`)                                  |

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
    Se não estiver presente, tenta instalar via winget, depois Chocolatey, depois Scoop. O Node 22 LTS, atualmente `22.16+`, permanece suportado para compatibilidade.
  </Step>
  <Step title="Instalar o OpenCraft">
    - Método `npm` (padrão): instalação global via npm usando a `-Tag` selecionada
    - Método `git`: clona/atualiza o repositório, instala/compila com pnpm e instala o wrapper em `%USERPROFILE%\.local\bin\opencraft.cmd`
  </Step>
  <Step title="Tarefas pós-instalação">
    Adiciona o diretório bin necessário ao PATH do usuário quando possível, depois executa `opencraft doctor --non-interactive` em upgrades e instalações git (melhor esforço).
  </Step>
</Steps>

### Exemplos (install.ps1)

<Tabs>
  <Tab title="Padrão">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalação git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Diretório git personalizado">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\opencraft"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Trace de debug">
    ```powershell
    # install.ps1 ainda não tem uma flag -Verbose dedicada.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                      | Descrição                                                       |
| ------------------------- | --------------------------------------------------------------- |
| `-InstallMethod npm\|git` | Método de instalação (padrão: `npm`)                            |
| `-Tag <tag>`              | dist-tag do npm (padrão: `latest`)                              |
| `-GitDir <path>`          | Diretório de checkout (padrão: `%USERPROFILE%\opencraft`)       |
| `-NoOnboard`              | Pular onboarding                                                |
| `-NoGitUpdate`            | Pular `git pull`                                                |
| `-DryRun`                 | Apenas imprimir ações                                           |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                           | Descrição              |
| ---------------------------------- | ---------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalação   |
| `OPENCLAW_GIT_DIR=<path>`          | Diretório de checkout  |
| `OPENCLAW_NO_ONBOARD=1`            | Pular onboarding       |
| `OPENCLAW_GIT_UPDATE=0`            | Desabilitar git pull   |
| `OPENCLAW_DRY_RUN=1`               | Modo dry run           |

  </Accordion>
</AccordionGroup>

<Note>
Se `-InstallMethod git` for usado e o Git não estiver presente, o script sai e imprime o link do Git para Windows.
</Note>

---

## CI e automação

Use flags/variáveis de ambiente não interativas para execuções previsíveis.

<Tabs>
  <Tab title="install.sh (npm não interativo)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git não interativo)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/opencraft
    ```
  </Tab>
  <Tab title="install.ps1 (pular onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solução de problemas

<AccordionGroup>
  <Accordion title="Por que o Git é necessário?">
    O Git é necessário para o método de instalação `git`. Para instalações `npm`, o Git ainda é verificado/instalado para evitar falhas `spawn git ENOENT` quando dependências usam URLs git.
  </Accordion>

  <Accordion title="Por que o npm retorna EACCES no Linux?">
    Algumas configurações Linux apontam o prefixo global do npm para caminhos de propriedade do root. O `install.sh` pode mudar o prefixo para `~/.npm-global` e acrescentar exports PATH aos arquivos rc do shell (quando esses arquivos existem).
  </Accordion>

  <Accordion title="Problemas com sharp/libvips">
    Os scripts definem `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão para evitar que o sharp compile contra o libvips do sistema. Para substituir:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instale o Git para Windows, reabra o PowerShell, execute o instalador novamente.
  </Accordion>

  <Accordion title='Windows: "opencraft is not recognized"'>
    Execute `npm config get prefix` e adicione aquele diretório ao seu PATH de usuário (sem sufixo `\bin` necessário no Windows), depois reabra o PowerShell.
  </Accordion>

  <Accordion title="Windows: como obter saída detalhada do instalador">
    O `install.ps1` atualmente não expõe um switch `-Verbose`.
    Use tracing do PowerShell para diagnósticos em nível de script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="opencraft não encontrado após a instalação">
    Geralmente é um problema de PATH. Veja [Solução de problemas do Node.js](/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>
