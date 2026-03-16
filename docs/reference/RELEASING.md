---
title: "Checklist de Release"
summary: "Checklist de release passo a passo para npm + app macOS"
read_when:
  - Criando um novo release npm
  - Criando um novo release do app macOS
  - Verificando metadados antes de publicar
---

# Checklist de Release (npm + macOS)

Use `pnpm` da raiz do repositório com Node 24 por padrão. Node 22 LTS, atualmente `22.16+`, permanece suportado para compatibilidade. Mantenha a árvore de trabalho limpa antes de criar tags/publicar.

## Gatilho do operador

Quando o operador disser "release", faça imediatamente este preflight (sem perguntas extras a menos que esteja bloqueado):

- Leia este doc e `docs/platforms/mac/release.md`.
- Carregue env de `~/.profile` e confirme que `SPARKLE_PRIVATE_KEY_FILE` + variáveis do App Store Connect estão definidas (SPARKLE_PRIVATE_KEY_FILE deve estar em `~/.profile`).
- Use chaves Sparkle de `~/Library/CloudStorage/Dropbox/Backup/Sparkle` se necessário.

## Versionamento

Os releases atuais do OpenCraft usam versionamento baseado em data.

- Versão de release estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
  - Exemplos do histórico do repositório: `v2026.2.26`, `v2026.3.8`
- Versão de pré-release beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
  - Exemplos do histórico do repositório: `v2026.2.15-beta.1`, `v2026.3.8-beta.1`
- Tag de correção de fallback: `vYYYY.M.D-N`
  - Use apenas como tag de recuperação de último recurso quando um release imutável publicado queimou a tag estável original e você não pode reutilizá-la.
  - A versão do pacote npm permanece `YYYY.M.D`; o sufixo `-N` é apenas para a tag git e o release GitHub.
  - Prefira betas para iteração de pré-release normal, depois corte uma tag estável limpa quando estiver pronto.
- Use a mesma string de versão em todos os lugares, menos o `v` inicial onde as tags Git não são usadas:
  - `package.json`: `2026.3.8`
  - Tag Git: `v2026.3.8`
  - Título do release GitHub: `opencraft 2026.3.8`
- Não preencha mês ou dia com zero. Use `2026.3.8`, não `2026.03.08`.
- Estável e beta são dist-tags do npm, não linhas de release separadas:
  - `latest` = estável
  - `beta` = pré-release/teste
- Dev é a head em movimento do `main`, não um release com tag git normal.
- A execução de preview acionada por tag aceita tags de estável, beta e correção de fallback, e rejeita versões cuja data CalVer está mais de 2 dias de calendário UTC distante da data do release.

Nota histórica:

- Tags mais antigas como `v2026.1.11-1`, `v2026.2.6-3` e `v2.0.0-beta2` existem no histórico do repositório.
- Trate as tags de correção como uma saída de emergência somente fallback. Novos releases ainda devem usar `vYYYY.M.D` para estável e `vYYYY.M.D-beta.N` para beta.

1. **Versão e metadados**

- [ ] Atualizar versão no `package.json` (ex: `2026.1.29`).
- [ ] Executar `pnpm plugins:sync` para alinhar versões de pacotes de extensão + changelogs.
- [ ] Atualizar strings CLI/versão em [`src/version.ts`](https://github.com/openclaw/openclaw/blob/main/src/version.ts) e o user agent do Baileys em [`src/web/session.ts`](https://github.com/openclaw/openclaw/blob/main/src/web/session.ts).
- [ ] Confirmar metadados do pacote (name, description, repository, keywords, license) e que o mapa `bin` aponta para [`opencraft.mjs`](https://github.com/openclaw/openclaw/blob/main/opencraft.mjs) para `opencraft`.
- [ ] Se as dependências mudaram, execute `pnpm install` para que `pnpm-lock.yaml` esteja atualizado.

2. **Build e artefatos**

- [ ] Se as entradas A2UI mudaram, execute `pnpm canvas:a2ui:bundle` e faça commit de qualquer [`src/canvas-host/a2ui/a2ui.bundle.js`](https://github.com/openclaw/openclaw/blob/main/src/canvas-host/a2ui/a2ui.bundle.js) atualizado.
- [ ] `pnpm run build` (regenera `dist/`).
- [ ] Verificar que os `files` do pacote npm incluem todas as pastas `dist/*` necessárias (notavelmente `dist/node-host/**` e `dist/acp/**` para node headless + CLI ACP).
- [ ] Confirmar que `dist/build-info.json` existe e inclui o hash `commit` esperado (o banner CLI usa isso para instalações npm).
- [ ] Opcional: `npm pack --pack-destination /tmp` após o build; inspecione o conteúdo do tarball e mantenha-o à mão para o release GitHub (não faça **commit** dele).

3. **Changelog e docs**

- [ ] Atualizar `CHANGELOG.md` com destaques voltados ao usuário (crie o arquivo se estiver ausente); mantenha as entradas estritamente em ordem decrescente por versão.
- [ ] Garantir que exemplos/flags do README correspondam ao comportamento atual do CLI (notavelmente novos comandos ou opções).

4. **Validação**

- [ ] `pnpm build`
- [ ] `pnpm check`
- [ ] `pnpm test` (ou `pnpm test:coverage` se precisar de saída de cobertura)
- [ ] `pnpm release:check` (verifica conteúdo do npm pack)
- [ ] Se `pnpm config:docs:check` falhar como parte da validação do release e a mudança na superfície de config for intencional, execute `pnpm config:docs:gen`, revise `docs/.generated/config-baseline.json` e `docs/.generated/config-baseline.jsonl`, faça commit das baselines atualizadas, depois execute novamente `pnpm release:check`.
- [ ] `OPENCLAW_INSTALL_SMOKE_SKIP_NONROOT=1 pnpm test:install:smoke` (teste de smoke de instalação Docker, caminho rápido; necessário antes do release)
  - Se o release npm imediatamente anterior for sabidamente quebrado, defina `OPENCLAW_INSTALL_SMOKE_PREVIOUS=<last-good-version>` ou `OPENCLAW_INSTALL_SMOKE_SKIP_PREVIOUS=1` para a etapa de pré-instalação.
- [ ] (Opcional) Smoke completo do instalador (adiciona cobertura de não-root + CLI): `pnpm test:install:smoke`
- [ ] (Opcional) E2E do instalador (Docker, executa `curl -fsSL https://opencraft.ai/install.sh | bash`, onboarding e depois executa chamadas de tool reais):
  - `pnpm test:install:e2e:openai` (requer `OPENAI_API_KEY`)
  - `pnpm test:install:e2e:anthropic` (requer `ANTHROPIC_API_KEY`)
  - `pnpm test:install:e2e` (requer ambas as chaves; executa ambos os provedores)
- [ ] (Opcional) Verificação pontual do gateway web se suas mudanças afetarem caminhos de envio/recebimento.

5. **App macOS (Sparkle)**

- [ ] Compilar + assinar o app macOS, depois compactá-lo em zip para distribuição.
- [ ] Gerar o appcast Sparkle (notas HTML via [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)) e atualizar `appcast.xml`.
- [ ] Manter o zip do app (e zip de dSYM opcional) pronto para anexar ao release GitHub.
- [ ] Seguir [release macOS](/platforms/mac/release) para os comandos exatos e variáveis de ambiente necessárias.
  - `APP_BUILD` deve ser numérico + monotônico (sem `-beta`) para que o Sparkle compare versões corretamente.
  - Se notarizando, use o perfil keychain `openclaw-notary` criado a partir das variáveis de env da API do App Store Connect (veja [release macOS](/platforms/mac/release)).

6. **Publicar (npm)**

- [ ] Confirmar que o status do git está limpo; faça commit e push conforme necessário.
- [ ] Confirmar que a publicação confiável do npm está configurada para o pacote `opencraft`.
- [ ] Não dependa de um segredo `NPM_TOKEN` para este workflow; o job de publicação usa a publicação confiável OIDC do GitHub.
- [ ] Faça push da tag git correspondente para acionar a execução de preview em `.github/workflows/openclaw-npm-release.yml`.
- [ ] Execute `OpenCraft NPM Release` manualmente com a mesma tag para publicar após a aprovação do ambiente `npm-release`.
  - Tags estáveis publicam no npm `latest`.
  - Tags beta publicam no npm `beta`.
  - Tags de correção de fallback como `v2026.3.13-1` mapeiam para a versão npm `2026.3.13`.
  - Tanto a execução de preview quanto a execução de publicação manual rejeitam tags que não mapeiam de volta para `package.json`, não estão em `main`, ou cuja data CalVer está mais de 2 dias de calendário UTC distante da data do release.
  - Se `opencraft@YYYY.M.D` já foi publicado, uma tag de correção de fallback ainda é útil para o release GitHub e recuperação do Docker, mas o npm publish não republicará essa versão.
- [ ] Verificar o registro: `npm view opencraft version`, `npm view opencraft dist-tags` e `npx -y opencraft@X.Y.Z --version` (ou `--help`).

### Troubleshooting (notas do release 2.0.0-beta2)

- **npm pack/publish trava ou produz tarball enorme**: o bundle do app macOS em `dist/OpenCraft.app` (e zips de release) são varridos para o pacote. Corrija colocando em whitelist o conteúdo de publicação via `files` no `package.json` (inclua subdiretórios de dist, docs, skills; exclua bundles de app). Confirme com `npm pack --dry-run` que `dist/OpenCraft.app` não está listado.
- **Loop de auth web npm para dist-tags**: use auth legado para obter um prompt de OTP:
  - `NPM_CONFIG_AUTH_TYPE=legacy npm dist-tag add opencraft@X.Y.Z latest`
- **Verificação `npx` falha com `ECOMPROMISED: Lock compromised`**: tente novamente com um cache fresco:
  - `NPM_CONFIG_CACHE=/tmp/npm-cache-$(date +%s) npx -y opencraft@X.Y.Z --version`
- **Tag precisa de recuperação após uma correção tardia**: se a tag estável original estiver vinculada a um release GitHub imutável, crie uma tag de correção de fallback como `vX.Y.Z-1` em vez de tentar atualizar à força `vX.Y.Z`.
  - Mantenha a versão do pacote npm em `X.Y.Z`; o sufixo de correção é apenas para a tag git e o release GitHub.
  - Use isso apenas como último recurso. Para iteração normal, prefira tags beta e depois corte um release estável limpo.

7. **Release GitHub + appcast**

- [ ] Criar tag e fazer push: `git tag vX.Y.Z && git push origin vX.Y.Z` (ou `git push --tags`).
  - Fazer push da tag também aciona o workflow de release npm.
- [ ] Criar/atualizar o release GitHub para `vX.Y.Z` com **título `opencraft X.Y.Z`** (não apenas a tag); o corpo deve incluir a seção **completa** do changelog para aquela versão (Destaques + Mudanças + Correções), inline (sem links simples), e **não deve repetir o título dentro do corpo**.
- [ ] Anexar artefatos: tarball `npm pack` (opcional), `OpenCraft-X.Y.Z.zip` e `OpenCraft-X.Y.Z.dSYM.zip` (se gerado).
- [ ] Fazer commit do `appcast.xml` atualizado e fazer push (o Sparkle alimenta a partir do main).
- [ ] De um diretório temporário limpo (sem `package.json`), execute `npx -y opencraft@X.Y.Z send --help` para confirmar que os entrypoints de instalação/CLI funcionam.
- [ ] Anunciar/compartilhar notas de release.

## Escopo de publicação de plugin (npm)

Publicamos apenas **plugins npm existentes** sob o escopo `@openclaw/*`. Plugins
embutidos que não estão no npm permanecem **somente na árvore de disco** (ainda enviados em
`extensions/**`).

Processo para derivar a lista:

1. `npm search @openclaw --json` e capture os nomes dos pacotes.
2. Compare com nomes de `extensions/*/package.json`.
3. Publique apenas a **interseção** (já no npm).

Lista atual de plugins npm (atualize conforme necessário):

- @openclaw/bluebubbles
- @openclaw/diagnostics-otel
- @openclaw/discord
- @openclaw/feishu
- @openclaw/lobster
- @openclaw/matrix
- @openclaw/msteams
- @openclaw/nextcloud-talk
- @openclaw/nostr
- @openclaw/voice-call
- @openclaw/zalo
- @openclaw/zalouser

As notas de release também devem destacar **novos plugins embutidos opcionais** que **não estão
habilitados por padrão** (exemplo: `tlon`).
