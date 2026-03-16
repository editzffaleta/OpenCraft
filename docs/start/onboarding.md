---
summary: "Fluxo de onboarding de primeira execução do OpenCraft (app macOS)"
read_when:
  - Projetando o assistente de onboarding do macOS
  - Implementando configuração de auth ou identidade
title: "Onboarding (App macOS)"
sidebarTitle: "Onboarding: App macOS"
---

# Onboarding (App macOS)

Este documento descreve o fluxo de onboarding de **primeira execução** atual. O objetivo é
uma experiência suave no "dia 0": escolher onde o Gateway roda, conectar a autenticação,
executar o assistente e deixar o agente inicializar sozinho.
Para uma visão geral dos caminhos de onboarding, veja [Visão Geral do Onboarding](/start/onboarding-overview).

<Steps>
<Step title="Aprovar aviso do macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Aprovar acesso a redes locais">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Boas-vindas e aviso de segurança">
<Frame caption="Leia o aviso de segurança exibido e decida de acordo">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confiança de segurança:

- Por padrão, o OpenCraft é um agente pessoal: um único limite de operador confiável.
- Configurações compartilhadas/multiusuário exigem bloqueio (dividir limites de confiança, manter acesso a ferramentas mínimo e seguir [Segurança](/gateway/security)).
- O onboarding local agora padreia novos configs para `tools.profile: "coding"`, para que configurações locais novas mantenham ferramentas de sistema de arquivos/runtime sem forçar o perfil irrestrito `full`.
- Se hooks/webhooks ou outros feeds de conteúdo não confiável estiverem habilitados, use um nível de modelo moderno e forte e mantenha política de ferramentas/sandboxing estritos.

</Step>
<Step title="Local vs Remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Onde o **Gateway** roda?

- **Este Mac (apenas local):** o onboarding pode configurar auth e gravar credenciais localmente.
- **Remoto (via SSH/Tailnet):** o onboarding **não** configura auth local; as credenciais devem existir no host do gateway.
- **Configurar depois:** pular a configuração e deixar o app sem configuração.

<Tip>
**Dica de auth do Gateway:**

- O assistente agora gera um **token** mesmo para loopback, então clientes WS locais devem se autenticar.
- Se você desabilitar o auth, qualquer processo local pode se conectar; use isso apenas em máquinas totalmente confiáveis.
- Use um **token** para acesso multi-máquina ou binds não-loopback.

</Tip>
</Step>
<Step title="Permissões">
<Frame caption="Escolha quais permissões deseja conceder ao OpenCraft">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

O onboarding solicita permissões TCC necessárias para:

- Automação (AppleScript)
- Notificações
- Acessibilidade
- Gravação de tela
- Microfone
- Reconhecimento de fala
- Câmera
- Localização

</Step>
<Step title="CLI">
  <Info>Esta etapa é opcional</Info>
  O app pode instalar o CLI global `opencraft` via npm/pnpm para que fluxos de
  trabalho em terminal e tarefas launchd funcionem imediatamente.
</Step>
<Step title="Chat de Onboarding (sessão dedicada)">
  Após a configuração, o app abre uma sessão de chat de onboarding dedicada para que o
  agente possa se apresentar e guiar os próximos passos. Isso mantém a orientação de
  primeira execução separada da sua conversa normal. Veja [Bootstrapping](/start/bootstrapping) para
  o que acontece no host do gateway durante a primeira execução do agente.
</Step>
</Steps>
