---
name: parallels-discord-roundtrip
description: Executar o harness de smoke do Parallels macOS com verificação de roundtrip ponta a ponta no Discord, incluindo envio pelo convidado, verificação pelo host, resposta do host e leitura de volta pelo convidado.
---

# Parallels Discord Roundtrip

Use when macOS Parallels smoke must prove Discord two-way delivery end to end.

## Goal

Cover:

- install on fresh macOS snapshot
- onboard + gateway health
- guest `message send` to Discord
- host sees that message on Discord
- host posts a new Discord message
- guest `message read` sees that new message

## Inputs

- host env var with Discord bot token
- Discord guild ID
- Discord channel ID
- `OPENAI_API_KEY`

## Preferred run

```bash
export OPENCRAFT_PARALLELS_DISCORD_TOKEN="$(
  ssh peters-mac-studio-1 'jq -r ".channels.discord.token" ~/.opencraft/opencraft.json' | tr -d '\n'
)"

pnpm test:parallels:macos \
  --discord-token-env OPENCRAFT_PARALLELS_DISCORD_TOKEN \
  --discord-guild-id 1456350064065904867 \
  --discord-channel-id 1456744319972282449 \
  --json
```

## Notes

- Snapshot target: closest to `macOS 26.3.1 fresh`.
- Snapshot resolver now prefers matching `*-poweroff*` clones when the base hint also matches. That lets the harness reuse disk-only recovery snapshots without passing a longer hint.
- If Windows/Linux snapshot restore logs show `PET_QUESTION_SNAPSHOT_STATE_INCOMPATIBLE_CPU`, drop the suspended state once, create a `*-poweroff*` replacement snapshot, and rerun. The smoke scripts now auto-start restored power-off snapshots.
- Harness configures Discord inside the guest; no checked-in token/config.
- Use the `opencraft` wrapper for guest `message send/read`; `node opencraft.mjs message ...` does not expose the lazy message subcommands the same way.
- Write `channels.discord.guilds` in one JSON object (`--strict-json`), not dotted `config set channels.discord.guilds.<snowflake>...` paths; numeric snowflakes get treated like array indexes.
- Avoid `prlctl enter` / expect for long Discord setup scripts; it line-wraps/corrupts long commands. Use `prlctl exec --current-user /bin/sh -lc ...` for the Discord config phase.
- Full 3-OS sweeps: the shared build lock is safe in parallel, but snapshot restore is still a Parallels bottleneck. Prefer serialized Windows/Linux restore-heavy reruns if the host is already under load.
- Harness cleanup deletes the temporary Discord smoke messages at exit.
- Per-phase logs: `/tmp/opencraft-parallels-smoke.*`
- Machine summary: pass `--json`
- If roundtrip flakes, inspect `fresh.discord-roundtrip.log` and `discord-last-readback.json` in the run dir first.

## Pass criteria

- fresh lane or upgrade lane requested passes
- summary reports `discord=pass` for that lane
- guest outbound nonce appears in channel history
- host inbound nonce appears in `opencraft message read` output
