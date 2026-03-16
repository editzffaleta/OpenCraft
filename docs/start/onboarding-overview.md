---
summary: "Visão geral dos caminhos e fluxos de onboarding do OpenCraft"
read_when:
  - Escolhendo um caminho de onboarding
  - Configurando um novo ambiente
title: "Visão Geral do Onboarding"
sidebarTitle: "Visão Geral do Onboarding"
---

# Visão Geral do Onboarding

O OpenCraft suporta múltiplos caminhos de onboarding dependendo de onde o Gateway
roda e como você prefere configurar os provedores.

## Escolha seu caminho de onboarding

- **Assistente CLI** para macOS, Linux e Windows (via WSL2).
- **App macOS** para uma primeira execução guiada no Apple Silicon ou Macs Intel.

## Assistente de onboarding CLI

Execute o assistente em um terminal:

```bash
opencraft onboard
```

Use o assistente CLI quando quiser controle total do Gateway, workspace,
canais e skills. Documentação:

- [Assistente de Onboarding (CLI)](/start/wizard)
- [Comando `opencraft onboard`](/cli/onboard)

## Onboarding pelo app macOS

Use o app OpenCraft quando quiser uma configuração totalmente guiada no macOS. Documentação:

- [Onboarding (App macOS)](/start/onboarding)

## Provedor Personalizado

Se você precisar de um endpoint que não está listado, incluindo provedores hospedados
que expõem APIs padrão OpenAI ou Anthropic, escolha **Provedor Personalizado** no
assistente CLI. Você será solicitado a:

- Escolher compatível com OpenAI, compatível com Anthropic, ou **Desconhecido** (detecção automática).
- Inserir uma URL base e chave de API (se exigido pelo provedor).
- Fornecer um ID de modelo e alias opcional.
- Escolher um ID de endpoint para que múltiplos endpoints personalizados possam coexistir.

Para etapas detalhadas, siga a documentação de onboarding CLI acima.
