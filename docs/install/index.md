---
summary: "Instalar OpenCraft — script do instalador, npm/pnpm, do source, Docker, e mais"
read_when:
  - You need an install method other than the Getting Started quickstart
  - You want to deploy to a cloud platform
  - You need to update, migrate, or uninstall
title: "Instalar"
---

# Instalar

Já seguiu [Getting Started](/start/getting-started)? Você está tudo pronto — esta página é para métodos alternativos de instalação, instruções específicas da plataforma e manutenção.

## Requisitos de sistema

- **[Node 24 (recomendado)](/install/node)** (Node 22 LTS, atualmente `22.16+`, ainda é suportado para compatibilidade; o [script do instalador](#install-methods) instalará Node 24 se ausente)
- macOS, Linux, ou Windows
- `pnpm` apenas se você construir do source

<Note>
No Windows, recomendamos fortemente executar OpenCraft em [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install).
</Note>

## Métodos de instalação

<Tip>
O **script do instalador** é a forma recomendada de instalar OpenCraft. Ele cuida da detecção de Node, instalação e onboarding em uma única etapa.
</Tip>

<Warning>
Para hosts VPS/cloud, evite imagens marketplace "1-click" de terceiros quando possível. Prefira uma imagem base do SO limpa (por exemplo Ubuntu LTS), depois instale OpenCraft você mesmo com o script do instalador.
</Warning>

<AccordionGroup>
  <Accordion title="Script do instalador" icon="rocket" defaultOpen>
    Baixa o CLI, instala globalmente via npm, e inicia onboarding.

    <Tabs>
      <Tab title="macOS / Linux / WSL2">
        ```bash
        curl -fsSL https://opencraft.ai/install.sh | bash
        ```
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://opencraft.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    É isso — o script cuida da detecção de Node, instalação e onboarding.

    Para pular onboarding e apenas instalar o binário:

    <Tabs>
      <Tab title="macOS / Linux / WSL2">
        ```bash
        curl -fsSL https://opencraft.ai/install.sh | bash -s -- --no-onboard
        ```
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        & ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -NoOnboard
        ```
      </Tab>
    </Tabs>

    Para todas as flags, variáveis de ambiente e opções CI/automação, veja [Internos do instalador](/install/installer).

  </Accordion>

  <Accordion title="npm / pnpm" icon="package">
    Se você já gerencia Node você mesmo, recomendamos Node 24. OpenCraft ainda suporta Node 22 LTS, atualmente `22.16+`, para compatibilidade:

    <Tabs>
      <Tab title="npm">
        ```bash
        npm install -g opencraft@latest
        opencraft onboard --install-daemon
        ```

        <Accordion title="sharp build errors?">
          Se você tem libvips instalado globalmente (comum em macOS via Homebrew) e `sharp` falha, force binários pré-compilados:

          ```bash
          SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g opencraft@latest
          ```

          Se você vê `sharp: Please add node-gyp to your dependencies`, instale ferramentas de compilação (macOS: Xcode CLT + `npm install -g node-gyp`) ou use a variável de ambiente acima.
        </Accordion>
      </Tab>
      <Tab title="pnpm">
        ```bash
        pnpm add -g opencraft@latest
        pnpm approve-builds -g        # approve opencraft, node-llama-cpp, sharp, etc.
        opencraft onboard --install-daemon
        ```

        <Note>
        pnpm requer aprovação explícita para pacotes com scripts de compilação. Após a primeira instalação mostrar o aviso "Ignored build scripts", execute `pnpm approve-builds -g` e selecione os pacotes listados.
        </Note>
      </Tab>
    </Tabs>

    Quer o `main` atual do GitHub com uma instalação do package-manager?

    ```bash
    npm install -g github:editzffaleta/OpenCraft#main
    ```

    ```bash
    pnpm add -g github:editzffaleta/OpenCraft#main
    ```

  </Accordion>

  <Accordion title="Do source" icon="github">
    Para contribuidores ou qualquer um que queira executar de um checkout local.

    <Steps>
      <Step title="Clone e construa">
        Clone o [repositório OpenCraft](https://github.com/editzffaleta/OpenCraft) e construa:

        ```bash
        git clone https://github.com/editzffaleta/OpenCraft.git
        cd opencraft
        pnpm install
        pnpm ui:build
        pnpm build
        ```
      </Step>
      <Step title="Link do CLI">
        Disponibilize o comando `opencraft` globalmente:

        ```bash
        pnpm link --global
        ```

        Alternativamente, pule o link e execute comandos via `pnpm opencraft ...` dentro do repositório.
      </Step>
      <Step title="Execute onboarding">
        ```bash
        opencraft onboard --install-daemon
        ```
      </Step>
    </Steps>

    Para fluxos de desenvolvimento mais profundos, veja [Setup](/start/setup).

  </Accordion>
</AccordionGroup>

## Outros métodos de instalação

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Deployments containerizados ou headless.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Container sem root: execute `setup-podman.sh` uma vez, depois o script de inicialização.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Instalação declarativa via Nix.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Provisionamento automatizado de fleet.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Uso CLI apenas via runtime Bun.
  </Card>
</CardGroup>

## Após instalação

Verifique se tudo está funcionando:

```bash
opencraft doctor         # check for config issues
opencraft status         # gateway status
opencraft dashboard      # open the browser UI
```

Se você precisa de caminhos de runtime personalizados, use:

- `OPENCRAFT_HOME` para caminhos internos baseados em diretório inicial
- `OPENCRAFT_STATE_DIR` para localização de estado mutável
- `OPENCRAFT_CONFIG_PATH` para localização de arquivo de configuração

Veja [Environment vars](/help/environment) para precedência e detalhes completos.

## Solução de problemas: `opencraft` não encontrado

<Accordion title="Diagnóstico e correção de PATH">
  Diagnóstico rápido:

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

Se `$(npm prefix -g)/bin` (macOS/Linux) ou `$(npm prefix -g)` (Windows) **não estão** em seu `$PATH`, seu shell não consegue encontrar binários npm globais (incluindo `opencraft`).

Correção — adicione ao arquivo de inicialização do seu shell (`~/.zshrc` ou `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

No Windows, adicione a saída de `npm prefix -g` ao seu PATH.

Depois abra um novo terminal (ou `rehash` em zsh / `hash -r` em bash).
</Accordion>

## Atualizar / desinstalar

<CardGroup cols={3}>
  <Card title="Atualizando" href="/install/updating" icon="refresh-cw">
    Mantenha OpenCraft atualizado.
  </Card>
  <Card title="Migrando" href="/install/migrating" icon="arrow-right">
    Mude para uma nova máquina.
  </Card>
  <Card title="Desinstalar" href="/install/uninstall" icon="trash-2">
    Remova OpenCraft completamente.
  </Card>
</CardGroup>
