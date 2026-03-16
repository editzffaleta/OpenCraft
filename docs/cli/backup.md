---
summary: "Referência do CLI para `opencraft backup` (criar arquivos de backup locais)"
read_when:
  - Você quer um arquivo de backup de primeira classe para estado local do OpenCraft
  - Você quer pré-visualizar quais paths seriam incluídos antes de reset ou desinstalação
title: "backup"
---

# `opencraft backup`

Criar um arquivo de backup local para estado, config, credenciais, sessões e workspaces opcionais do OpenCraft.

```bash
opencraft backup create
opencraft backup create --output ~/Backups
opencraft backup create --dry-run --json
opencraft backup create --verify
opencraft backup create --no-include-workspace
opencraft backup create --only-config
opencraft backup verify ./2026-03-09T00-00-00.000Z-opencraft-backup.tar.gz
```

## Notas

- O arquivo inclui um arquivo `manifest.json` com os paths de fonte resolvidos e layout do arquivo.
- Saída padrão é um arquivo `.tar.gz` com timestamp no diretório de trabalho atual.
- Se o diretório de trabalho atual estiver dentro de uma árvore de fonte salva, o OpenCraft faz fallback para seu diretório home para o local padrão do arquivo.
- Arquivos de arquivo existentes nunca são sobrescritos.
- Paths de saída dentro das árvores de estado/workspace de fonte são rejeitados para evitar auto-inclusão.
- `opencraft backup verify <archive>` valida que o arquivo contém exatamente um manifesto raiz, rejeita paths de arquivo estilo traversal e verifica que cada payload declarado no manifesto existe no tarball.
- `opencraft backup create --verify` roda essa validação imediatamente após escrever o arquivo.
- `opencraft backup create --only-config` faz backup apenas do arquivo de config JSON ativo.

## O que é salvo

`opencraft backup create` planeja fontes de backup de sua instalação local do OpenCraft:

- O diretório de estado retornado pelo resolvedor de estado local do OpenCraft, geralmente `~/.opencraft`
- O path do arquivo de config ativo
- O diretório OAuth / credenciais
- Diretórios de workspace descobertos da config atual, a menos que você passe `--no-include-workspace`

Se você usar `--only-config`, o OpenCraft pula estado, credenciais e descoberta de workspace e arquiva apenas o path do arquivo de config ativo.

O OpenCraft canonicaliza paths antes de construir o arquivo. Se config, credenciais ou um workspace já residem dentro do diretório de estado, eles não são duplicados como fontes de backup de nível superior separadas. Paths ausentes são pulados.

O payload do arquivo armazena conteúdo de arquivo dessas árvores de fonte, e o `manifest.json` embutido registra os paths de fonte absolutos resolvidos mais o layout do arquivo usado para cada asset.

## Comportamento com config inválida

`opencraft backup` intencionalmente ignora o preflight de config normal para que ainda possa ajudar durante recuperação. Como a descoberta de workspace depende de uma config válida, `opencraft backup create` agora falha rapidamente quando o arquivo de config existe mas é inválido e o backup de workspace ainda está habilitado.

Se você ainda quiser um backup parcial nessa situação, execute novamente:

```bash
opencraft backup create --no-include-workspace
```

Isso mantém estado, config e credenciais no escopo enquanto pula inteiramente a descoberta de workspace.

Se você só precisa de uma cópia do próprio arquivo de config, `--only-config` também funciona quando a config está malformada porque não depende de analisar a config para descoberta de workspace.

## Tamanho e performance

O OpenCraft não impõe um tamanho máximo de backup embutido ou limite de tamanho por arquivo.

Limites práticos vêm da máquina local e sistema de arquivos de destino:

- Espaço disponível para a escrita temporária do arquivo mais o arquivo final
- Tempo para percorrer árvores grandes de workspace e comprimí-las em um `.tar.gz`
- Tempo para reescanear o arquivo se você usar `opencraft backup create --verify` ou rodar `opencraft backup verify`
- Comportamento do sistema de arquivos no path de destino. O OpenCraft prefere um passo de publicação hard-link sem sobrescrita e faz fallback para cópia exclusiva quando hard links não são suportados

Workspaces grandes são geralmente o principal fator do tamanho do arquivo. Se você quer um backup menor ou mais rápido, use `--no-include-workspace`.

Para o menor arquivo, use `--only-config`.
