---
summary: "Instalar o OpenCraft — script instalador, npm/pnpm, a partir do código-fonte, Docker e mais"
read_when:
  - Você precisa de um método de instalação diferente do quickstart do Getting Started
  - Você quer implantar em uma plataforma de nuvem
  - Você precisa atualizar, migrar ou desinstalar
title: "Instalação"
---

# Instalação

Já seguiu o [Getting Started](/start/getting-started)? Você está pronto — esta página é para métodos alternativos de instalação, instruções específicas de plataforma e manutenção.

## Requisitos do sistema

- **[Node 24 (recomendado)](/install/node)** (Node 22 LTS, atualmente `22.16+`, ainda é suportado para compatibilidade; o [script instalador](#install-methods) instalará o Node 24 se não estiver presente)
- macOS, Linux ou Windows
- `pnpm` apenas se você compilar a partir do código-fonte

<Note>
No Windows, recomendamos fortemente executar o OpenCraft sob o [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install).
</Note>

## Métodos de instalação

<Tip>
O **script instalador** é a forma recomendada de instalar o OpenCraft. Ele gerencia a detecção do Node, instalação e onboarding em uma única etapa.
</Tip>

<Warning>
Para hosts VPS/nuvem, evite imagens de marketplace "1-clique" de terceiros quando possível. Prefira uma imagem base limpa do SO (por exemplo Ubuntu LTS) e instale o OpenCraft você mesmo com o script instalador.
</Warning>

<AccordionGroup>
  <Accordion title="Script instalador" icon="rocket" defaultOpen>
    Baixa o CLI, instala globalmente via npm e inicia o assistente de onboarding.

    <Tabs>
      <Tab title="macOS / Linux / WSL2">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    É só isso — o script gerencia a detecção do Node, instalação e onboarding.

    Para pular o onboarding e apenas instalar o binário:

    <Tabs>
      <Tab title="macOS / Linux / WSL2">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
        ```
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
        ```
      </Tab>
    </Tabs>

    Para todas as flags, variáveis de ambiente e opções de CI/automação, veja [Detalhes do instalador](/install/installer).

  </Accordion>

  <Accordion title="npm / pnpm" icon="package">
    Se você já gerencia o Node por conta própria, recomendamos o Node 24. O OpenCraft ainda suporta Node 22 LTS, atualmente `22.16+`, para compatibilidade:

    <Tabs>
      <Tab title="npm">
        ```bash
        npm install -g opencraft@latest
        opencraft onboard --install-daemon
        ```

        <Accordion title="Erros de build do sharp?">
          Se você tem o libvips instalado globalmente (comum no macOS via Homebrew) e o `sharp` falha, force os binários pré-compilados:

          ```bash
          SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g opencraft@latest
          ```

          Se você vir `sharp: Please add node-gyp to your dependencies`, instale as ferramentas de build (macOS: Xcode CLT + `npm install -g node-gyp`) ou use a variável de ambiente acima.
        </Accordion>
      </Tab>
      <Tab title="pnpm">
        ```bash
        pnpm add -g opencraft@latest
        pnpm approve-builds -g        # aprove opencraft, node-llama-cpp, sharp, etc.
        opencraft onboard --install-daemon
        ```

        <Note>
        O pnpm requer aprovação explícita para pacotes com scripts de build. Após a primeira instalação mostrar o aviso "Ignored build scripts", execute `pnpm approve-builds -g` e selecione os pacotes listados.
        </Note>
      </Tab>
    </Tabs>

  </Accordion>

  <Accordion title="A partir do código-fonte" icon="github">
    Para colaboradores ou qualquer pessoa que queira executar a partir de um checkout local.

    <Steps>
      <Step title="Clonar e compilar">
        Clone o [repositório OpenCraft](https://github.com/openclaw/openclaw) e compile:

        ```bash
        git clone https://github.com/openclaw/openclaw.git
        cd openclaw
        pnpm install
        pnpm ui:build
        pnpm build
        ```
      </Step>
      <Step title="Vincular o CLI">
        Torne o comando `opencraft` disponível globalmente:

        ```bash
        pnpm link --global
        ```

        Alternativamente, pule o link e execute comandos via `pnpm opencraft ...` de dentro do repositório.
      </Step>
      <Step title="Executar o onboarding">
        ```bash
        opencraft onboard --install-daemon
        ```
      </Step>
    </Steps>

    Para fluxos de trabalho de desenvolvimento mais aprofundados, veja [Setup](/start/setup).

  </Accordion>
</AccordionGroup>

## Outros métodos de instalação

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Implantações em contêiner ou headless.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Contêiner rootless: execute `setup-podman.sh` uma vez, depois o script de inicialização.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Instalação declarativa via Nix.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Provisionamento automatizado de frota.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Uso somente de CLI via runtime Bun.
  </Card>
</CardGroup>

## Após a instalação

Verifique se tudo está funcionando:

```bash
opencraft doctor         # verificar problemas de configuração
opencraft status         # status do gateway
opencraft dashboard      # abrir a UI no navegador
```

Se você precisar de caminhos de runtime personalizados, use:

- `OPENCLAW_HOME` para caminhos internos baseados no diretório home
- `OPENCLAW_STATE_DIR` para localização do estado mutável
- `OPENCLAW_CONFIG_PATH` para localização do arquivo de config

Veja [Variáveis de ambiente](/help/environment) para precedência e detalhes completos.

## Solução de problemas: `opencraft` não encontrado

<Accordion title="Diagnóstico e correção do PATH">
  Diagnóstico rápido:

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

Se `$(npm prefix -g)/bin` (macOS/Linux) ou `$(npm prefix -g)` (Windows) **não** estiver no seu `$PATH`, seu shell não consegue encontrar os binários globais do npm (incluindo `opencraft`).

Correção — adicione ao seu arquivo de inicialização do shell (`~/.zshrc` ou `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

No Windows, adicione a saída de `npm prefix -g` ao seu PATH.

Em seguida, abra um novo terminal (ou `rehash` no zsh / `hash -r` no bash).
</Accordion>

## Atualizar / desinstalar

<CardGroup cols={3}>
  <Card title="Atualizando" href="/install/updating" icon="refresh-cw">
    Mantenha o OpenCraft atualizado.
  </Card>
  <Card title="Migrando" href="/install/migrating" icon="arrow-right">
    Mover para uma nova máquina.
  </Card>
  <Card title="Desinstalar" href="/install/uninstall" icon="trash-2">
    Remover o OpenCraft completamente.
  </Card>
</CardGroup>
