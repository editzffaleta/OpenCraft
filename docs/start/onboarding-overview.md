---
summary: "Visão geral das opções e fluxos de onboarding do OpenCraft"
read_when:
  - Escolhendo um caminho de onboarding
  - Configurando um novo ambiente
title: "Visão Geral do Onboarding"
sidebarTitle: "Visão Geral do Onboarding"
---

# Visão Geral do Onboarding

O OpenCraft suporta múltiplos caminhos de onboarding dependendo de onde o Gateway executa
e como você prefere configurar os provedores.

## Escolha seu caminho de onboarding

- **Onboarding CLI** para macOS, Linux e Windows (via WSL2).
- **App macOS** para uma primeira execução guiada em Macs Apple silicon ou Intel.

## Onboarding CLI

Execute o onboarding em um terminal:

```bash
opencraft onboard
```

Use o onboarding CLI quando quiser controle total do Gateway, espaço de trabalho,
canais e skills. Documentação:

- [Onboarding (CLI)](/start/wizard)
- [Comando `opencraft onboard`](/cli/onboard)

## Onboarding do app macOS

Use o app OpenCraft quando quiser uma configuração totalmente guiada no macOS. Documentação:

- [Onboarding (App macOS)](/start/onboarding)

## Provedor Personalizado

Se você precisa de um endpoint que não está listado, incluindo provedores hospedados que
expõem APIs padrão OpenAI ou Anthropic, escolha **Provedor Personalizado** no
onboarding CLI. Será solicitado:

- Escolher compatível com OpenAI, compatível com Anthropic ou **Desconhecido** (detecção automática).
- Inserir uma URL base e chave de API (se exigido pelo provedor).
- Fornecer um ID de modelo e alias opcional.
- Escolher um ID de Endpoint para que múltiplos endpoints personalizados possam coexistir.

Para passos detalhados, siga a documentação de onboarding CLI acima.
