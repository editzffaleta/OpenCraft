---
summary: "Atualizando OpenCraft com segurança (instalação global ou source), além de estratégia de rollback"
read_when:
  - Updating OpenCraft
  - Something breaks after an update
title: "Atualizando"
---

# Atualizando

OpenCraft está se movendo rápido (pré "1.0"). Trate atualizações como envio de infraestrutura: atualizar → executar verificações → reiniciar (ou use `opencraft update`, que reinicia) → verificar.

## Recomendado: re-execute o instalador do site (atualização em local)

O **caminho de atualização preferido** é re-executar o instalador do site. Ele detecta instalações existentes, atualiza em local, e executa `opencraft doctor` quando necessário.

```bash
curl -fsSL https://opencraft.ai/install.sh | bash
```

Notas:

- Adicione `--no-onboard` se você não quer que onboarding execute novamente.
- Para **instalações do source**, use:

  ```bash
  curl -fsSL https://opencraft.ai/install.sh | bash -s -- --install-method git --no-onboard
  ```

  O instalador executará `git pull --rebase` **apenas** se o repositório estiver limpo.

- Para **instalações globais**, o script usa `npm install -g opencraft@latest` por baixo.
- Nota de legado: `clawdbot` permanece disponível como um shim de compatibilidade.

## Antes de atualizar

- Saiba como você instalou: **global** (npm/pnpm) vs **do source** (git clone).
- Saiba como seu Gateway está rodando: **terminal em foreground** vs **serviço supervisionado** (launchd/systemd).
- Crie snapshot de sua customização:
  - Config: `~/.editzffaleta/OpenCraft.json`
  - Credenciais: `~/.opencraft/credentials/`
  - Workspace: `~/.opencraft/workspace`

## Atualizar (instalação global)

Instalação global (escolha uma):

```bash
npm i -g opencraft@latest
```

```bash
pnpm add -g opencraft@latest
```

Nós **não** recomendamos Bun para o runtime Gateway (bugs com WhatsApp/Telegram).

Para trocar canais de atualização (instalações git + npm):

```bash
opencraft update --channel beta
opencraft update --channel dev
opencraft update --channel stable
```

Use `--tag <dist-tag|version|spec>` para uma sobrescrita de alvo de pacote pontual.

Para o `main` do GitHub atual via uma instalação do package-manager:

```bash
opencraft update --tag main
```

Equivalentes manuais:

```bash
npm i -g github:editzffaleta/OpenCraft#main
```

```bash
pnpm add -g github:editzffaleta/OpenCraft#main
```

Você também pode passar uma especificação de pacote explícita ao `--tag` para atualizações pontuais (por exemplo uma ref do GitHub ou URL de tarball).

Veja [Development channels](/install/development-channels) para semântica de canais e notas de lançamento.

Nota: em instalações npm, o gateway registra uma dica de atualização na inicialização (verifica a tag do canal atual). Desative via `update.checkOnStart: false`.

### Auto-atualizador Core (opcional)

O auto-atualizador está **desligado por padrão** e é um recurso Gateway core (não um plugin).

```json
{
  "update": {
    "channel": "stable",
    "auto": {
      "enabled": true,
      "stableDelayHours": 6,
      "stableJitterHours": 12,
      "betaCheckIntervalHours": 1
    }
  }
}
```

Comportamento:

- `stable`: quando uma nova versão é vista, OpenCraft aguarda `stableDelayHours` e depois aplica um jitter determinístico por instalação em `stableJitterHours` (rollout distribuído).
- `beta`: verifica em cadência `betaCheckIntervalHours` (padrão: por hora) e aplica quando uma atualização está disponível.
- `dev`: sem aplicação automática; use `opencraft update` manual.

Use `opencraft update --dry-run` para visualizar ações de atualização antes de habilitar automação.

Depois:

```bash
opencraft doctor
opencraft gateway restart
opencraft health
```

Notas:

- Se seu Gateway roda como um serviço, `opencraft gateway restart` é preferido sobre matar PIDs.
- Se você está fixado em uma versão específica, veja "Rollback / pinning" abaixo.

## Atualizar (`opencraft update`)

Para **instalações do source** (checkout git), prefira:

```bash
opencraft update
```

Ele executa um fluxo de atualização relativamente seguro:

- Requer uma worktree limpa.
- Muda para o canal selecionado (tag ou branch).
- Busca + rebase contra o upstream configurado (canal dev).
- Instala deps, constrói, constrói o Control UI, e executa `opencraft doctor`.
- Reinicia o gateway por padrão (use `--no-restart` para pular).

Se você instalou via **npm/pnpm** (sem metadados git), `opencraft update` tentará atualizar via seu package manager. Se não conseguir detectar a instalação, use "Atualizar (instalação global)" em vez disso.

## Atualizar (Control UI / RPC)

O Control UI tem **Update & Restart** (RPC: `update.run`). Ele:

1. Executa o mesmo fluxo de atualização de source que `opencraft update` (apenas checkout git).
2. Escreve um sentinela de reinicialização com um relatório estruturado (cauda stdout/stderr).
3. Reinicia o gateway e faz ping da última sessão ativa com o relatório.

Se o rebase falhar, o gateway aborta e reinicia sem aplicar a atualização.

## Atualizar (do source)

Do checkout do repositório:

Preferido:

```bash
opencraft update
```

Manual (aproximadamente equivalente):

```bash
git pull
pnpm install
pnpm build
pnpm ui:build # auto-installs UI deps on first run
opencraft doctor
opencraft health
```

Notas:

- `pnpm build` importa quando você executa o binário `opencraft` empacotado ([`openclaw.mjs`](https://github.com/editzffaleta/OpenCraft/blob/main/openclaw.mjs)) ou usa Node para executar `dist/`.
- Se você executa de um checkout de repositório sem uma instalação global, use `pnpm opencraft ...` para comandos CLI.
- Se você executa diretamente do TypeScript (`pnpm opencraft ...`), um rebuild geralmente é desnecessário, mas **migrações de configuração ainda se aplicam** → execute doctor.
- Mudar entre instalações global e git é fácil: instale o outro sabor, depois execute `opencraft doctor` para que o ponto de entrada do serviço gateway seja reescrito para a instalação atual.

## Sempre execute: `opencraft doctor`

Doctor é o comando "atualização segura". É intencionalmente chato: repara + migra + avisa.

Nota: se você está em uma **instalação do source** (checkout git), `opencraft doctor` oferecerá executar `opencraft update` primeiro.

Coisas típicas que faz:

- Migra chaves de configuração obsoletas / localizações de arquivo de configuração legado.
- Audita políticas DM e avisa em configurações "abertas" arriscadas.
- Verifica saúde do Gateway e pode oferecer para reiniciar.
- Detecta e migra serviços gateway mais antigos (launchd/systemd; legacy schtasks) para serviços OpenCraft atuais.
- No Linux, garante lingering de usuário systemd (para que o Gateway sobreviva ao logout).

Detalhes: [Doctor](/gateway/doctor)

## Iniciar / parar / reiniciar o Gateway

CLI (funciona independentemente do SO):

```bash
opencraft gateway status
opencraft gateway stop
opencraft gateway restart
opencraft gateway --port 18789
opencraft logs --follow
```

Se você está supervisionado:

- macOS launchd (LaunchAgent empacotado em app): `launchctl kickstart -k gui/$UID/ai.opencraft.gateway` (use `ai.opencraft.<profile>`; legado `com.opencraft.*` ainda funciona)
- Linux systemd user service: `systemctl --user restart opencraft-gateway[-<profile>].service`
- Windows (WSL2): `systemctl --user restart opencraft-gateway[-<profile>].service`
  - `launchctl`/`systemctl` apenas funcionam se o serviço está instalado; caso contrário execute `opencraft gateway install`.

Runbook + rótulos de serviço exatos: [Gateway runbook](/gateway)

## Rollback / pinning (quando algo quebra)

### Pin (instalação global)

Instale uma versão conhecida como boa (substitua `<version>` pela última que funcionou):

```bash
npm i -g opencraft@<version>
```

```bash
pnpm add -g opencraft@<version>
```

Dica: para ver a versão publicada atual, execute `npm view opencraft version`.

Depois reinicie + re-execute doctor:

```bash
opencraft doctor
opencraft gateway restart
```

### Pin (source) por data

Escolha um commit de uma data (exemplo: "estado de main a partir de 2026-01-01"):

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
```

Depois reinstale deps + reinicie:

```bash
pnpm install
pnpm build
opencraft gateway restart
```

Se você quer voltar para latest depois:

```bash
git checkout main
git pull
```

## Se você está preso

- Execute `opencraft doctor` novamente e leia a saída cuidadosamente (frequentemente diz o fix).
- Verifique: [Troubleshooting](/gateway/troubleshooting)
- Pergunte no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)
