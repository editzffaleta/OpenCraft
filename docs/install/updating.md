---
summary: "Atualizando o OpenCraft com segurança (instalação global ou a partir do código-fonte), além de estratégia de rollback"
read_when:
  - Atualizando o OpenCraft
  - Algo quebra após uma atualização
title: "Atualizando"
---

# Atualizando

O OpenCraft está evoluindo rapidamente (pré "1.0"). Trate atualizações como implantação de infra: atualizar → executar verificações → reiniciar (ou use `opencraft update`, que reinicia) → verificar.

## Recomendado: execute novamente o instalador do site (atualização no lugar)

O caminho de atualização **preferido** é executar novamente o instalador do site. Ele
detecta instalações existentes, atualiza no lugar e executa `opencraft doctor` quando
necessário.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Notas:

- Adicione `--no-onboard` se não quiser que o assistente de onboarding seja executado novamente.
- Para **instalações a partir do código-fonte**, use:

  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --no-onboard
  ```

  O instalador fará `git pull --rebase` **apenas** se o repositório estiver limpo.

- Para **instalações globais**, o script usa `npm install -g opencraft@latest` internamente.
- Nota legada: `clawdbot` permanece disponível como shim de compatibilidade.

## Antes de atualizar

- Saiba como você instalou: **global** (npm/pnpm) vs **a partir do código-fonte** (git clone).
- Saiba como seu Gateway está sendo executado: **terminal em primeiro plano** vs **serviço supervisionado** (launchd/systemd).
- Faça backup de suas configurações:
  - Config: `~/.opencraft/opencraft.json`
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

**Não** recomendamos o Bun para o runtime do Gateway (bugs com WhatsApp/Telegram).

Para mudar de canal de atualização (instalações git + npm):

```bash
opencraft update --channel beta
opencraft update --channel dev
opencraft update --channel stable
```

Use `--tag <dist-tag|version>` para uma tag/versão de instalação pontual.

Veja [Canais de desenvolvimento](/install/development-channels) para semântica de canais e notas de release.

Nota: em instalações npm, o gateway registra uma dica de atualização na inicialização (verifica a tag do canal atual). Desabilite via `update.checkOnStart: false`.

### Atualizador automático do núcleo (opcional)

O atualizador automático está **desativado por padrão** e é um recurso do núcleo do Gateway (não um plugin).

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

- `stable`: quando uma nova versão é vista, o OpenCraft aguarda `stableDelayHours` e depois aplica um jitter determinístico por instalação em `stableJitterHours` (rollout distribuído).
- `beta`: verifica no intervalo `betaCheckIntervalHours` (padrão: horário) e aplica quando uma atualização está disponível.
- `dev`: sem aplicação automática; use `opencraft update` manualmente.

Use `opencraft update --dry-run` para visualizar ações de atualização antes de habilitar a automação.

Em seguida:

```bash
opencraft doctor
opencraft gateway restart
opencraft health
```

Notas:

- Se seu Gateway executa como serviço, `opencraft gateway restart` é preferível a matar PIDs.
- Se você está fixado em uma versão específica, veja "Rollback / fixação" abaixo.

## Atualizar (`opencraft update`)

Para **instalações a partir do código-fonte** (checkout git), prefira:

```bash
opencraft update
```

Executa um fluxo de atualização seguro:

- Requer um worktree limpo.
- Muda para o canal selecionado (tag ou branch).
- Busca + faz rebase contra o upstream configurado (canal dev).
- Instala deps, compila, compila a UI de Controle e executa `opencraft doctor`.
- Reinicia o gateway por padrão (use `--no-restart` para pular).

Se você instalou via **npm/pnpm** (sem metadados git), `opencraft update` tentará atualizar via seu gerenciador de pacotes. Se não conseguir detectar a instalação, use "Atualizar (instalação global)".

## Atualizar (UI de Controle / RPC)

A UI de Controle tem **Atualizar e Reiniciar** (RPC: `update.run`). Ela:

1. Executa o mesmo fluxo de atualização a partir do código-fonte que `opencraft update` (somente checkout git).
2. Escreve um sentinel de reinicialização com um relatório estruturado (tail de stdout/stderr).
3. Reinicia o gateway e envia um ping para a última sessão ativa com o relatório.

Se o rebase falhar, o gateway aborta e reinicia sem aplicar a atualização.

## Atualizar (a partir do código-fonte)

A partir do checkout do repositório:

Preferido:

```bash
opencraft update
```

Manual (equivalente aproximado):

```bash
git pull
pnpm install
pnpm build
pnpm ui:build # instala deps da UI automaticamente na primeira execução
opencraft doctor
opencraft health
```

Notas:

- `pnpm build` importa quando você executa o binário `opencraft` empacotado ([`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs)) ou usa Node para executar `dist/`.
- Se você executa a partir de um checkout do repositório sem uma instalação global, use `pnpm opencraft ...` para comandos CLI.
- Se você executa diretamente a partir de TypeScript (`pnpm opencraft ...`), uma recompilação geralmente é desnecessária, mas **migrações de config ainda se aplicam** → execute doctor.
- Alternar entre instalações global e git é fácil: instale o outro tipo, então execute `opencraft doctor` para que o entrypoint de serviço do gateway seja reescrito para a instalação atual.

## Sempre execute: `opencraft doctor`

Doctor é o comando de "atualização segura". É intencionalmente tedioso: reparar + migrar + avisar.

Nota: se você está em uma **instalação a partir do código-fonte** (checkout git), `opencraft doctor` oferecerá executar `opencraft update` primeiro.

Coisas típicas que ele faz:

- Migrar chaves de config depreciadas / localizações legadas de arquivos de config.
- Auditar políticas de DM e avisar sobre configurações "open" arriscadas.
- Verificar a saúde do Gateway e pode oferecer reinicialização.
- Detectar e migrar serviços de gateway mais antigos (launchd/systemd; schtasks legado) para os serviços atuais do OpenCraft.
- No Linux, garantir lingering do usuário systemd (para que o Gateway sobreviva ao logout).

Detalhes: [Doctor](/gateway/doctor)

## Iniciar / parar / reiniciar o Gateway

CLI (funciona independente do SO):

```bash
opencraft gateway status
opencraft gateway stop
opencraft gateway restart
opencraft gateway --port 18789
opencraft logs --follow
```

Se você usa supervisão:

- macOS launchd (LaunchAgent empacotado no app): `launchctl kickstart -k gui/$UID/ai.opencraft.gateway` (use `ai.opencraft.<profile>`; o legado `com.opencraft.*` ainda funciona)
- Serviço de usuário systemd no Linux: `systemctl --user restart opencraft-gateway[-<profile>].service`
- Windows (WSL2): `systemctl --user restart opencraft-gateway[-<profile>].service`
  - `launchctl`/`systemctl` funcionam apenas se o serviço estiver instalado; caso contrário, execute `opencraft gateway install`.

Runbook + labels exatos do serviço: [Runbook do Gateway](/gateway)

## Rollback / fixação (quando algo quebra)

### Fixar (instalação global)

Instale uma versão conhecida-boa (substitua `<version>` pela última que funcionou):

```bash
npm i -g opencraft@<version>
```

```bash
pnpm add -g opencraft@<version>
```

Dica: para ver a versão publicada atual, execute `npm view opencraft version`.

Em seguida, reinicie + execute doctor novamente:

```bash
opencraft doctor
opencraft gateway restart
```

### Fixar (código-fonte) por data

Escolha um commit de uma data (exemplo: "estado do main em 2026-01-01"):

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
```

Em seguida, reinstale deps + reinicie:

```bash
pnpm install
pnpm build
opencraft gateway restart
```

Se quiser voltar para o mais recente depois:

```bash
git checkout main
git pull
```

## Se você estiver travado

- Execute `opencraft doctor` novamente e leia a saída com cuidado (ela frequentemente diz a correção).
- Verifique: [Solução de problemas](/gateway/troubleshooting)
- Pergunte no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)
