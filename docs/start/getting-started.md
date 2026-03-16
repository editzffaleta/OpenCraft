---
summary: "Instale o OpenCraft e faça seu primeiro chat em minutos."
read_when:
  - Configuração inicial do zero
  - Você quer o caminho mais rápido para um chat funcionando
title: "Primeiros Passos"
---

# Primeiros Passos

Objetivo: ir do zero ao primeiro chat funcionando com configuração mínima.

<Info>
Chat mais rápido: abra a UI de controle (sem precisar configurar canais). Execute `opencraft dashboard`
e converse no navegador, ou abra `http://127.0.0.1:18789/` no
<Tooltip headline="Host do gateway" tip="A máquina que executa o serviço de gateway do OpenCraft.">host do gateway</Tooltip>.
Docs: [Dashboard](/web/dashboard) e [UI de controle](/web/control-ui).
</Info>

## Pré-requisitos

- Node 24 recomendado (Node 22 LTS, atualmente `22.16+`, ainda suportado para compatibilidade)

<Tip>
Verifique sua versão do Node com `node --version` se não tiver certeza.
</Tip>

## Configuração rápida (CLI)

<Steps>
  <Step title="Instalar o OpenCraft (recomendado)">
    <Tabs>
      <Tab title="macOS/Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Processo do Script de Instalação"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Outros métodos de instalação e requisitos: [Instalação](/install).
    </Note>

  </Step>
  <Step title="Executar o assistente de onboarding">
    ```bash
    opencraft onboard --install-daemon
    ```

    O assistente configura autenticação, configurações do gateway e canais opcionais.
    Veja [Assistente de Onboarding](/start/wizard) para detalhes.

  </Step>
  <Step title="Verificar o Gateway">
    Se você instalou o serviço, ele já deve estar em execução:

    ```bash
    opencraft gateway status
    ```

  </Step>
  <Step title="Abrir a UI de controle">
    ```bash
    opencraft dashboard
    ```
  </Step>
</Steps>

<Check>
Se a UI de controle carregar, seu Gateway está pronto para uso.
</Check>

## Verificações e extras opcionais

<AccordionGroup>
  <Accordion title="Executar o Gateway em primeiro plano">
    Útil para testes rápidos ou solução de problemas.

    ```bash
    opencraft gateway --port 18789
    ```

  </Accordion>
  <Accordion title="Enviar uma mensagem de teste">
    Requer um canal configurado.

    ```bash
    opencraft message send --target +5511999999999 --message "Olá do OpenCraft"
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente úteis

Se você executa o OpenCraft como conta de serviço ou quer locais personalizados
para configuração/estado:

- `OPENCLAW_HOME` define o diretório home usado para resolução de caminhos internos.
- `OPENCLAW_STATE_DIR` sobrescreve o diretório de estado.
- `OPENCLAW_CONFIG_PATH` sobrescreve o caminho do arquivo de configuração.

Referência completa de variáveis de ambiente: [Variáveis de ambiente](/help/environment).

## Avançar

<Columns>
  <Card title="Assistente de Onboarding (detalhes)" href="/start/wizard">
    Referência completa do assistente CLI e opções avançadas.
  </Card>
  <Card title="Onboarding do app macOS" href="/start/onboarding">
    Fluxo de primeira execução para o app macOS.
  </Card>
</Columns>

## O que você terá

- Um Gateway em execução
- Autenticação configurada
- Acesso à UI de controle ou um canal conectado

## Próximos passos

- Segurança em DMs e aprovações: [Pareamento](/channels/pairing)
- Conectar mais canais: [Canais](/channels)
- Fluxos avançados e a partir do código-fonte: [Configuração](/start/setup)
