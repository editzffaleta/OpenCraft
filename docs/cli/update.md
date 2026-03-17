---
summary: "Referência CLI para `opencraft update` (atualização segura de código-fonte + reinício automático do Gateway)"
read_when:
  - Você quer atualizar um checkout de código-fonte com segurança
  - Você precisa entender o comportamento do atalho `--update`
title: "update"
---

# `opencraft update`

Atualizar o OpenCraft com segurança e alternar entre canais stable/beta/dev.

Se você instalou via **npm/pnpm** (instalação global, sem metadados git), atualizações acontecem pelo fluxo do gerenciador de pacotes em [Updating](/install/updating).

## Uso

```bash
opencraft update
opencraft update status
opencraft update wizard
opencraft update --channel beta
opencraft update --channel dev
opencraft update --tag beta
opencraft update --tag main
opencraft update --dry-run
opencraft update --no-restart
opencraft update --json
opencraft --update
```

## Opções

- `--no-restart`: pular reinício do serviço Gateway após atualização bem-sucedida.
- `--channel <stable|beta|dev>`: definir o canal de atualização (git + npm; persistido no config).
- `--tag <dist-tag|version|spec>`: sobrepor o alvo do pacote apenas para esta atualização. Para instalações de pacote, `main` mapeia para `github:editzffaleta/OpenCraft#main`.
- `--dry-run`: pré-visualizar ações de atualização planejadas (canal/tag/alvo/fluxo de reinício) sem escrever config, instalar, sincronizar Plugins ou reiniciar.
- `--json`: imprimir JSON `UpdateRunResult` legível por máquina.
- `--timeout <seconds>`: timeout por etapa (padrão é 1200s).

Nota: downgrades requerem confirmação porque versões mais antigas podem quebrar a configuração.

## `update status`

Mostrar o canal de atualização ativo + tag/branch/SHA git (para checkouts de código-fonte), mais disponibilidade de atualização.

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
após atualizar (padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

## O que ele faz

Quando você alterna canais explicitamente (`--channel ...`), o OpenCraft também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/opencraft`, sobrescrever com `OPENCRAFT_GIT_DIR`),
  atualiza-o e instala o CLI global a partir desse checkout.
- `stable`/`beta` → instala via npm usando a dist-tag correspondente.

O auto-atualizador principal do Gateway (quando habilitado via config) reutiliza este mesmo caminho de atualização.

## Fluxo de checkout git

Canais:

- `stable`: checkout da tag não-beta mais recente, depois build + doctor.
- `beta`: checkout da tag `-beta` mais recente, depois build + doctor.
- `dev`: checkout de `main`, depois fetch + rebase.

Visão de alto nível:

1. Requer uma árvore de trabalho limpa (sem mudanças não commitadas).
2. Alterna para o canal selecionado (tag ou branch).
3. Busca upstream (apenas dev).
4. Apenas dev: lint + build TypeScript de pré-voo em uma árvore de trabalho temporária; se a ponta falhar, volta até 10 commits para encontrar o build limpo mais recente.
5. Faz rebase no commit selecionado (apenas dev).
6. Instala dependências (pnpm preferido; fallback npm).
7. Faz build + build da Interface de Controle.
8. Executa `opencraft doctor` como verificação final de "atualização segura".
9. Sincroniza Plugins com o canal ativo (dev usa extensões incluídas; stable/beta usa npm) e atualiza Plugins instalados via npm.

## Atalho `--update`

`opencraft --update` é reescrito para `opencraft update` (útil para shells e scripts de lançamento).

## Veja também

- `opencraft doctor` (oferece executar atualização primeiro em checkouts git)
- [Development channels](/install/development-channels)
- [Updating](/install/updating)
- [CLI reference](/cli)
