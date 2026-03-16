---
summary: "Referência do CLI para `opencraft daemon` (alias legado para gerenciamento de serviço do gateway)"
read_when:
  - Você ainda usa `opencraft daemon ...` em scripts
  - Você precisa de comandos de ciclo de vida do serviço (install/start/stop/restart/status)
title: "daemon"
---

# `opencraft daemon`

Alias legado para comandos de gerenciamento de serviço do Gateway.

`opencraft daemon ...` mapeia para a mesma superfície de controle de serviço que os comandos de serviço `opencraft gateway ...`.

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

- `status`: mostrar estado de instalação do serviço e fazer probe de saúde do Gateway
- `install`: instalar serviço (`launchd`/`systemd`/`schtasks`)
- `uninstall`: remover serviço
- `start`: iniciar serviço
- `stop`: parar serviço
- `restart`: reiniciar serviço

## Opções comuns

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- ciclo de vida (`uninstall|start|stop|restart`): `--json`

Notas:

- `status` resolve SecretRefs de auth configurados para auth de probe quando possível.
- Em instalações systemd Linux, verificações de deriva de token de `status` incluem fontes de unidade `Environment=` e `EnvironmentFile=`.
- Quando auth por token requer um token e `gateway.auth.token` é gerenciado por SecretRef, `install` valida que o SecretRef é resolvível mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se auth por token requer um token e o SecretRef de token configurado não está resolvido, a instalação falha fechada.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação é bloqueada até que o modo seja definido explicitamente.

## Prefira

Use [`opencraft gateway`](/cli/gateway) para docs e exemplos atuais.
