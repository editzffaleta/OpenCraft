---
summary: "Scripts do repositório: propósito, escopo e notas de segurança"
read_when:
  - Executando scripts do repositório
  - Adicionando ou alterando scripts em ./scripts
title: "Scripts"
---

# Scripts

O diretório `scripts/` contém scripts auxiliares para fluxos de trabalho locais e tarefas de operações.
Use-os quando uma tarefa estiver claramente vinculada a um script; caso contrário, prefira o CLI.

## Convenções

- Scripts são **opcionais** a menos que referenciados em docs ou checklists de release.
- Prefira interfaces CLI quando existirem (exemplo: monitoramento de auth usa `opencraft models status --check`).
- Assuma que os scripts são específicos do host; leia-os antes de executar em uma nova máquina.

## Scripts de monitoramento de auth

Scripts de monitoramento de auth estão documentados aqui:
[/automation/auth-monitoring](/automation/auth-monitoring)

## Ao adicionar scripts

- Mantenha os scripts focados e documentados.
- Adicione uma entrada curta na documentação relevante (ou crie uma se estiver ausente).
