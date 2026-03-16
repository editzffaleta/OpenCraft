---
summary: "Referência do CLI para `opencraft doctor` (verificações de saúde + reparos guiados)"
read_when:
  - Você tem problemas de conectividade/auth e quer correções guiadas
  - Você atualizou e quer uma verificação de sanidade
title: "doctor"
---

# `opencraft doctor`

Verificações de saúde + correções rápidas para o gateway e canais.

Relacionado:

- Resolução de problemas: [Troubleshooting](/gateway/troubleshooting)
- Auditoria de segurança: [Security](/gateway/security)

## Exemplos

```bash
opencraft doctor
opencraft doctor --repair
opencraft doctor --deep
```

Notas:

- Prompts interativos (como correções de keychain/OAuth) só rodam quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) vão pular os prompts.
- `--fix` (alias para `--repair`) escreve um backup em `~/.opencraft/opencraft.json.bak` e remove chaves de config desconhecidas, listando cada remoção.
- Verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões e podem arquivá-los como `.deleted.<timestamp>` para recuperar espaço com segurança.
- Doctor também escaneia `~/.opencraft/cron/jobs.json` (ou `cron.store`) para shapes legados de cron job e pode reescrevê-los no lugar antes que o agendador precise auto-normalizá-los em runtime.
- Doctor inclui uma verificação de prontidão de busca em memória e pode recomendar `opencraft configure --section model` quando credenciais de embedding estão ausentes.
- Se o modo sandbox está habilitado mas o Docker não está disponível, doctor reporta um aviso de alto sinal com remediação (`install Docker` ou `opencraft config set agents.defaults.sandbox.mode off`).

## macOS: overrides de env `launchctl`

Se você previamente rodou `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor sobrescreve seu arquivo de config e pode causar erros persistentes de "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
