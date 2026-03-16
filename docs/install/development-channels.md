---
summary: "Canais stable, beta e dev: semântica, troca e tagging"
read_when:
  - Você quer trocar entre stable/beta/dev
  - Você está fazendo tagging ou publicando pré-lançamentos
title: "Canais de Desenvolvimento"
---

# Canais de desenvolvimento

Última atualização: 2026-01-21

O OpenCraft distribui três canais de atualização:

- **stable**: dist-tag npm `latest`.
- **beta**: dist-tag npm `beta` (builds em teste).
- **dev**: head móvel de `main` (git). dist-tag npm: `dev` (quando publicado).

Distribuímos builds para **beta**, testamos e depois **promovemos um build aprovado para `latest`**
sem mudar o número de versão — dist-tags são a fonte da verdade para instalações npm.

## Trocando de canal

Checkout via Git:

```bash
opencraft update --channel stable
opencraft update --channel beta
opencraft update --channel dev
```

- `stable`/`beta` fazem checkout da tag correspondente mais recente (frequentemente a mesma tag).
- `dev` muda para `main` e faz rebase no upstream.

Instalação global via npm/pnpm:

```bash
opencraft update --channel stable
opencraft update --channel beta
opencraft update --channel dev
```

Isso atualiza via o dist-tag npm correspondente (`latest`, `beta`, `dev`).

Quando você **explicitamente** troca de canal com `--channel`, o OpenCraft também alinha
o método de instalação:

- `dev` garante um checkout git (padrão `~/opencraft`, sobrescreva com `OPENCLAW_GIT_DIR`),
  atualiza e instala o CLI global a partir desse checkout.
- `stable`/`beta` instala do npm usando o dist-tag correspondente.

Dica: se você quiser stable + dev em paralelo, mantenha dois clones e aponte seu gateway para o stable.

## Plugins e canais

Quando você troca de canal com `opencraft update`, o OpenCraft também sincroniza fontes de plugins:

- `dev` prefere plugins embutidos do checkout git.
- `stable` e `beta` restauram pacotes de plugins instalados via npm.

## Boas práticas de tagging

- Marque com tags os releases que você quer que checkouts git usem (`vYYYY.M.D` para stable, `vYYYY.M.D-beta.N` para beta).
- `vYYYY.M.D.beta.N` também é reconhecido por compatibilidade, mas prefira `-beta.N`.
- Tags legadas `vYYYY.M.D-<patch>` ainda são reconhecidas como stable (não-beta).
- Mantenha tags imutáveis: nunca mova ou reutilize uma tag.
- dist-tags npm continuam sendo a fonte da verdade para instalações npm:
  - `latest` → stable
  - `beta` → build candidato
  - `dev` → snapshot de main (opcional)

## Disponibilidade do app macOS

Builds beta e dev podem **não** incluir um release do app macOS. Isso é normal:

- A tag git e o dist-tag npm ainda podem ser publicados.
- Mencione "sem build macOS para este beta" nas notas de release ou changelog.
