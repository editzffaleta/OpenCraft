---
title: "Política de Lançamento"
summary: "Canais de lançamento públicos, nomenclatura de versões e cadência"
read_when:
  - Procurando definições de canais de lançamento públicos
  - Procurando nomenclatura de versões e cadência
---

# Política de Lançamento

O OpenCraft tem três faixas de lançamento públicas:

- stable: lançamentos marcados com tag que publicam no npm `latest`
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: o head em movimento do `main`

## Nomenclatura de versões

- Versão de lançamento stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não use zero à esquerda no mês ou dia
- `latest` significa o lançamento stable atual no npm
- `beta` significa o pré-lançamento atual no npm
- Lançamentos beta podem ser publicados antes que o app macOS esteja atualizado

## Cadência de lançamento

- Lançamentos seguem o fluxo beta-primeiro
- Stable só segue depois que o último beta é validado
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são exclusivos para mantenedores

## Referências públicas

- [`.github/workflows/opencraft-npm-release.yml`](https://github.com/editzffaleta/OpenCraft/blob/main/.github/workflows/opencraft-npm-release.yml)
- [`scripts/opencraft-npm-release-check.ts`](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/opencraft-npm-release-check.ts)

Mantenedores usam a documentação privada de lançamento em
[`opencraft/maintainers/release/README.md`](https://github.com/opencraft/maintainers/blob/main/release/README.md)
para o runbook real.
