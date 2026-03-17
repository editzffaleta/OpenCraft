---
summary: "Referência CLI para `opencraft doctor` (verificações de saúde + reparos guiados)"
read_when:
  - Você tem problemas de conectividade/autenticação e quer correções guiadas
  - Você atualizou e quer uma verificação de sanidade
title: "doctor"
---

# `opencraft doctor`

Verificações de saúde + correções rápidas para o gateway e canais.

Relacionado:

- Solução de problemas: [Solução de problemas](/gateway/troubleshooting)
- Auditoria de segurança: [Segurança](/gateway/security)

## Exemplos

```bash
opencraft doctor
opencraft doctor --repair
opencraft doctor --deep
```

Observações:

- Prompts interativos (como correções de keychain/OAuth) só executam quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) pulam prompts.
- `--fix` (alias para `--repair`) grava um backup em `~/.editzffaleta/OpenCraft.json.bak` e remove chaves de config desconhecidas, listando cada remoção.
- Verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões e podem arquivá-los como `.deleted.<timestamp>` para recuperar espaço com segurança.
- O Doctor também varre `~/.opencraft/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de tarefas Cron e pode reescrevê-los no local antes que o agendador tenha que normalizá-los automaticamente em tempo de execução.
- O Doctor inclui uma verificação de prontidão de busca em memória e pode recomendar `opencraft configure --section model` quando credenciais de embedding estão faltando.
- Se o modo sandbox está habilitado mas Docker está indisponível, o doctor reporta um aviso de alto sinal com correção (`instalar Docker` ou `opencraft config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` são gerenciados por SecretRef e indisponíveis no caminho de comando atual, o doctor reporta um aviso somente leitura e não grava credenciais de fallback em texto plano.

## macOS: substituições de env do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de config e pode causar erros persistentes de "não autorizado".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
