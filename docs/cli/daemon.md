---
summary: "Referência CLI para `opencraft daemon` (alias legado para gerenciamento de serviço gateway)"
read_when:
  - Você ainda usa `opencraft daemon ...` em scripts
  - Você precisa de comandos de ciclo de vida do serviço (install/start/stop/restart/status)
title: "daemon"
---

# `opencraft daemon`

Alias legado para comandos de gerenciamento de serviço do Gateway.

`opencraft daemon ...` mapeia para a mesma superfície de controle de serviço que `opencraft gateway ...` comandos de serviço.

## Uso

```bash
opencraft daemon status
opencraft daemon install
opencraft daemon start
opencraft daemon stop
opencraft daemon restart
opencraft daemon uninstall
```

## Subcomandos

- `status`: mostrar estado de instalação do serviço e verificar saúde do Gateway
- `install`: instalar serviço (`launchd`/`systemd`/`schtasks`)
- `uninstall`: remover serviço
- `start`: iniciar serviço
- `stop`: parar serviço
- `restart`: reiniciar serviço

## Opções comuns

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- ciclo de vida (`uninstall|start|stop|restart`): `--json`

Observações:

- `status` resolve SecretRefs de autenticação configurados para autenticação de verificação quando possível.
- Se um SecretRef de autenticação necessário não está resolvido neste caminho de comando, `daemon status --json` reporta `rpc.authWarning` quando a verificação de conectividade/autenticação falha; passe `--token`/`--password` explicitamente ou resolva a fonte do segredo primeiro.
- Se a verificação é bem-sucedida, avisos de ref de autenticação não resolvidos são suprimidos para evitar falsos positivos.
- Em instalações Linux systemd, verificações de desvio de token de `status` incluem tanto fontes `Environment=` quanto `EnvironmentFile=` da unidade.
- Quando autenticação por token requer um token e `gateway.auth.token` é gerenciado por SecretRef, `install` valida que o SecretRef é resolvível mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se autenticação por token requer um token e o SecretRef de token configurado não está resolvido, a instalação falha de forma fechada.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estão configurados e `gateway.auth.mode` não está definido, a instalação é bloqueada até que o modo seja definido explicitamente.

## Preferir

Use [`opencraft gateway`](/cli/gateway) para documentação e exemplos atuais.
