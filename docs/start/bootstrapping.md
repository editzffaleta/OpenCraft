---
summary: "Ritual de bootstrapping que inicializa o workspace e os arquivos de identidade do agente"
read_when:
  - Entender o que acontece na primeira execução do agente
  - Explicar onde ficam os arquivos de bootstrapping
  - Depurar a configuração de identidade no onboarding
title: "Bootstrapping do Agente"
sidebarTitle: "Bootstrapping"
---

# Bootstrapping do Agente

O bootstrapping é o ritual de **primeira execução** que prepara o workspace do
agente e coleta detalhes de identidade. Acontece após o onboarding, quando o
agente inicia pela primeira vez.

## O que o bootstrapping faz

Na primeira execução do agente, o OpenCraft inicializa o workspace (padrão
`~/.opencraft/workspace`):

- Cria `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Executa um breve ritual de perguntas e respostas (uma pergunta por vez).
- Grava identidade e preferências em `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Remove `BOOTSTRAP.md` ao finalizar, para que o ritual ocorra apenas uma vez.

## Onde é executado

O bootstrapping sempre roda no **host do gateway**. Se o app macOS se conecta a
um Gateway remoto, o workspace e os arquivos de bootstrapping ficam nessa máquina
remota.

<Note>
Quando o Gateway roda em outra máquina, edite os arquivos do workspace no host do
gateway (por exemplo, `user@gateway-host:~/.opencraft/workspace`).
</Note>

## Documentação relacionada

- Onboarding do app macOS: [Onboarding](/start/onboarding)
- Layout do workspace: [Workspace do agente](/concepts/agent-workspace)
