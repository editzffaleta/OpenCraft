---
summary: "Obtenha OpenCraft instalado e execute seu primeiro chat em minutos."
read_when:
  - First time setup from zero
  - You want the fastest path to a working chat
title: "Começando"
---

# Começando

Objetivo: sair do zero para o primeiro chat funcionando com configuração mínima.

<Info>
Chat mais rápido: abra a Control UI (sem configuração de canal necessária). Execute `opencraft dashboard`
e converse no navegador, ou abra `http://127.0.0.1:18789/` no
<Tooltip headline="Gateway host" tip="The machine running the OpenCraft gateway service.">gateway host</Tooltip>.
Docs: [Dashboard](/web/dashboard) e [Control UI](/web/control-ui).
</Info>

## Pré-requisitos

- Node 24 recomendado (Node 22 LTS, atualmente `22.16+`, ainda suportado para compatibilidade)

<Tip>
Verifique sua versão do Node com `node --version` se não tiver certeza.
</Tip>

## Configuração rápida (CLI)

<Steps>
  <Step title="Instale o OpenCraft (recomendado)">
    <Tabs>
      <Tab title="macOS/Linux">
        ```bash
        curl -fsSL https://opencraft.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://opencraft.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Outros métodos de instalação e requisitos: [Instalar](/install).
    </Note>

  </Step>
  <Step title="Execute onboarding">
    ```bash
    opencraft onboard --install-daemon
    ```

    O onboarding configura autenticação, configurações de gateway e canais opcionais.
    Veja [Onboarding (CLI)](/start/wizard) para detalhes.

  </Step>
  <Step title="Verifique o Gateway">
    Se você instalou o serviço, ele já deve estar em execução:

    ```bash
    opencraft gateway status
    ```

  </Step>
  <Step title="Abra a Control UI">
    ```bash
    opencraft dashboard
    ```
  </Step>
</Steps>

<Check>
Se a Control UI carregar, seu Gateway está pronto para uso.
</Check>

## Verificações opcionais e extras

<AccordionGroup>
  <Accordion title="Execute o Gateway em primeiro plano">
    Útil para testes rápidos ou solução de problemas.

    ```bash
    opencraft gateway --port 18789
    ```

  </Accordion>
  <Accordion title="Envie uma mensagem de teste">
    Requer um canal configurado.

    ```bash
    opencraft message send --target +15555550123 --message "Hello from OpenCraft"
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente úteis

Se você executar o OpenCraft como uma conta de serviço ou desejar localizações personalizadas de configuração/estado:

- `OPENCRAFT_HOME` define o diretório inicial usado para resolução de caminho interno.
- `OPENCRAFT_STATE_DIR` substitui o diretório de estado.
- `OPENCRAFT_CONFIG_PATH` substitui o caminho do arquivo de configuração.

Referência completa de variáveis de ambiente: [Variáveis de ambiente](/help/environment).

## Vá mais a fundo

<Columns>
  <Card title="Onboarding (CLI)" href="/start/wizard">
    Referência completa de onboarding CLI e opções avançadas.
  </Card>
  <Card title="Onboarding do app macOS" href="/start/onboarding">
    Fluxo de primeira execução para o app macOS.
  </Card>
</Columns>

## O que você terá

- Um Gateway em execução
- Autenticação configurada
- Acesso a Control UI ou um canal conectado

## Próximos passos

- Segurança e aprovações de DM: [Pareamento](/channels/pairing)
- Conecte mais canais: [Canais](/channels)
- Fluxos de trabalho avançados e da origem: [Configuração](/start/setup)
