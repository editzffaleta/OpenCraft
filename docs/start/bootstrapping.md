---
summary: "Ritual de bootstrapping do agente que semeia o espaço de trabalho e arquivos de identidade"
read_when:
  - Entendendo o que acontece na primeira execução do agente
  - Explicando onde ficam os arquivos de bootstrapping
  - Depurando a configuração de identidade do onboarding
title: "Bootstrapping de Agente"
sidebarTitle: "Bootstrapping"
---

# Bootstrapping de Agente

Bootstrapping é o ritual de **primeira execução** que prepara o espaço de trabalho do agente e
coleta detalhes de identidade. Acontece após o onboarding, quando o agente inicia
pela primeira vez.

## O que o bootstrapping faz

Na primeira execução do agente, o OpenCraft faz o bootstrap do espaço de trabalho (padrão
`~/.opencraft/workspace`):

- Semeia `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Executa um ritual curto de perguntas e respostas (uma pergunta por vez).
- Escreve identidade + preferências em `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Remove `BOOTSTRAP.md` quando finalizado para que execute apenas uma vez.

## Onde é executado

O bootstrapping sempre executa no **gateway host**. Se o app macOS se conecta a
um Gateway remoto, o espaço de trabalho e os arquivos de bootstrapping ficam naquela máquina
remota.

<Note>
Quando o Gateway executa em outra máquina, edite os arquivos do espaço de trabalho no gateway
host (por exemplo, `user@gateway-host:~/.opencraft/workspace`).
</Note>

## Documentos relacionados

- Onboarding do app macOS: [Onboarding](/start/onboarding)
- Layout do espaço de trabalho: [Espaço de trabalho do agente](/concepts/agent-workspace)
