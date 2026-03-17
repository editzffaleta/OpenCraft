---
summary: "Fluxo de configuração de primeira execução do OpenCraft (app macOS)"
read_when:
  - Projetando o assistente de onboarding do macOS
  - Implementando configuração de autenticação ou identidade
title: "Onboarding (App macOS)"
sidebarTitle: "Onboarding: App macOS"
---

# Onboarding (App macOS)

Este documento descreve o fluxo de configuração de **primeira execução** atual. O objetivo é uma
experiência "dia 0" suave: escolha onde o Gateway executa, conecte a autenticação, execute o
wizard e deixe o agente fazer o bootstrap sozinho.
Para uma visão geral dos caminhos de onboarding, veja [Visão Geral do Onboarding](/start/onboarding-overview).

<Steps>
<Step title="Aprove o aviso do macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Aprove encontrar redes locais">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Boas-vindas e aviso de segurança">
<Frame caption="Leia o aviso de segurança exibido e decida adequadamente">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confiança de segurança:

- Por padrão, o OpenCraft é um agente pessoal: uma fronteira de operador confiável.
- Configurações compartilhadas/multi-usuário requerem bloqueio (separar fronteiras de confiança, manter acesso a ferramentas mínimo e seguir [Segurança](/gateway/security)).
- O onboarding local agora define novas configurações como `tools.profile: "coding"` para que configurações locais novas mantenham ferramentas de sistema de arquivos/runtime sem forçar o perfil irrestrito `full`.
- Se hooks/webhooks ou outros feeds de conteúdo não confiável estiverem habilitados, use um nível de modelo moderno forte e mantenha política de ferramentas/sandboxing rigorosos.

</Step>
<Step title="Local vs Remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Onde o **Gateway** executa?

- **Este Mac (Apenas local):** o onboarding pode configurar autenticação e escrever credenciais
  localmente.
- **Remoto (via SSH/Tailnet):** o onboarding **não** configura autenticação local;
  credenciais devem existir no gateway host.
- **Configurar depois:** pular a configuração e deixar o app sem configurar.

<Tip>
**Dica de autenticação do Gateway:**

- O wizard agora gera um **token** mesmo para loopback, então clientes WS locais devem se autenticar.
- Se você desabilitar a autenticação, qualquer processo local pode se conectar; use isso apenas em máquinas totalmente confiáveis.
- Use um **token** para acesso multi-máquina ou binds não-loopback.

</Tip>
</Step>
<Step title="Permissões">
<Frame caption="Escolha quais permissões você quer dar ao OpenCraft">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

O onboarding solicita permissões TCC necessárias para:

- Automação (AppleScript)
- Notificações
- Acessibilidade
- Gravação de Tela
- Microfone
- Reconhecimento de Fala
- Câmera
- Localização

</Step>
<Step title="CLI">
  <Info>Este passo é opcional</Info>
  O app pode instalar o CLI global `opencraft` via npm/pnpm para que fluxos de trabalho
  no terminal e tarefas launchd funcionem imediatamente.
</Step>
<Step title="Chat de Onboarding (sessão dedicada)">
  Após a configuração, o app abre uma sessão de chat dedicada de onboarding para que o agente possa
  se apresentar e guiar os próximos passos. Isso mantém a orientação de primeira execução separada
  da sua conversa normal. Veja [Bootstrapping](/start/bootstrapping) para
  o que acontece no gateway host durante a primeira execução do agente.
</Step>
</Steps>
