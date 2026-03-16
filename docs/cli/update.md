---
summary: "Referência do CLI para `opencraft update` (atualização segura de fonte + auto-restart do gateway)"
read_when:
  - Você quer atualizar um checkout de fonte com segurança
  - Você precisa entender o comportamento do atalho `--update`
title: "update"
---

# `opencraft update`

Atualizar o OpenCraft com segurança e mudar entre canais stable/beta/dev.

Se você instalou via **npm/pnpm** (instalação global, sem metadados git), as atualizações acontecem pelo fluxo do gerenciador de pacotes em [Updating](/install/updating).

## Uso

```bash
opencraft update
opencraft update status
opencraft update wizard
opencraft update --channel beta
opencraft update --channel dev
opencraft update --tag beta
opencraft update --dry-run
opencraft update --no-restart
opencraft update --json
opencraft --update
```

## Opções

- `--no-restart`: pular reinicialização do serviço do Gateway após uma atualização bem-sucedida.
- `--channel <stable|beta|dev>`: definir o canal de atualização (git + npm; persistido na config).
- `--tag <dist-tag|version>`: sobrescrever o dist-tag ou versão npm apenas para esta atualização.
- `--dry-run`: visualizar ações de atualização planejadas (fluxo de canal/tag/alvo/restart) sem escrever config, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprimir JSON `UpdateRunResult` legível por máquina.
- `--timeout <seconds>`: timeout por passo (padrão é 1200s).

Nota: downgrades requerem confirmação porque versões mais antigas podem quebrar a configuração.

## `update status`

Mostrar o canal de atualização ativo + tag/branch/SHA git (para checkouts de fonte), mais disponibilidade de atualização.

```bash
opencraft update status
opencraft update status --json
opencraft update status --timeout 10
```

Opções:

- `--json`: imprimir JSON de status legível por máquina.
- `--timeout <seconds>`: timeout para verificações (padrão é 3s).

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se deve reiniciar o Gateway
após atualizar (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

## O que faz

Quando você muda de canal explicitamente (`--channel ...`), OpenCraft também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, sobrescreva com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala o CLI global daquele checkout.
- `stable`/`beta` → instala do npm usando o dist-tag correspondente.

O auto-atualizador core do Gateway (quando habilitado via config) reutiliza este mesmo path de atualização.

## Fluxo de checkout git

Canais:

- `stable`: fazer checkout da última tag não-beta, depois build + doctor.
- `beta`: fazer checkout da última tag `-beta`, depois build + doctor.
- `dev`: fazer checkout de `main`, depois fetch + rebase.

Visão geral:

1. Requer uma worktree limpa (sem mudanças não commitadas).
2. Muda para o canal selecionado (tag ou branch).
3. Faz fetch upstream (apenas dev).
4. Apenas dev: preflight lint + build TypeScript em uma worktree temporária; se o tip falhar, volta até 10 commits para encontrar o build mais novo limpo.
5. Faz rebase no commit selecionado (apenas dev).
6. Instala deps (pnpm preferido; fallback npm).
7. Build + build da UI de Controle.
8. Roda `opencraft doctor` como verificação final de "atualização segura".
9. Sincroniza plugins para o canal ativo (dev usa extensões bundled; stable/beta usa npm) e atualiza plugins instalados via npm.

## Atalho `--update`

`opencraft --update` reescreve para `opencraft update` (útil para shells e scripts de launcher).

## Veja também

- `opencraft doctor` (oferece rodar update primeiro em checkouts git)
- [Canais de desenvolvimento](/install/development-channels)
- [Updating](/install/updating)
- [CLI reference](/cli)
