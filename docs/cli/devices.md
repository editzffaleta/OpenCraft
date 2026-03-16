---
summary: "Referência do CLI para `opencraft devices` (pareamento de dispositivos + rotação/revogação de token)"
read_when:
  - Você está aprovando solicitações de pareamento de dispositivos
  - Você precisa rotacionar ou revogar tokens de dispositivo
title: "devices"
---

# `opencraft devices`

Gerenciar solicitações de pareamento de dispositivos e tokens com escopo de dispositivo.

## Comandos

### `opencraft devices list`

Listar solicitações de pareamento pendentes e dispositivos pareados.

```
opencraft devices list
opencraft devices list --json
```

### `opencraft devices remove <deviceId>`

Remover uma entrada de dispositivo pareado.

```
opencraft devices remove <deviceId>
opencraft devices remove <deviceId> --json
```

### `opencraft devices clear --yes [--pending]`

Limpar dispositivos pareados em massa.

```
opencraft devices clear --yes
opencraft devices clear --yes --pending
opencraft devices clear --yes --pending --json
```

### `opencraft devices approve [requestId] [--latest]`

Aprovar uma solicitação de pareamento de dispositivo pendente. Se `requestId` for omitido, OpenCraft
aprova automaticamente a solicitação pendente mais recente.

```
opencraft devices approve
opencraft devices approve <requestId>
opencraft devices approve --latest
```

### `opencraft devices reject <requestId>`

Rejeitar uma solicitação de pareamento de dispositivo pendente.

```
opencraft devices reject <requestId>
```

### `opencraft devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotacionar um token de dispositivo para uma função específica (opcionalmente atualizando escopos).

```
opencraft devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### `opencraft devices revoke --device <id> --role <role>`

Revogar um token de dispositivo para uma função específica.

```
opencraft devices revoke --device <deviceId> --role node
```

## Opções comuns

- `--url <url>`: URL WebSocket do Gateway (padrão: `gateway.remote.url` quando configurado).
- `--token <token>`: Token do Gateway (se necessário).
- `--password <password>`: Senha do Gateway (auth por senha).
- `--timeout <ms>`: Timeout de RPC.
- `--json`: Saída JSON (recomendado para scripts).

Nota: ao definir `--url`, o CLI não retorna para credenciais de config ou ambiente.
Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.

## Notas

- Rotação de token retorna um novo token (sensível). Trate-o como um segredo.
- Esses comandos requerem escopo `operator.pairing` (ou `operator.admin`).
- `devices clear` é intencionalmente protegido por `--yes`.
- Se o escopo de pareamento não estiver disponível no loopback local (e nenhum `--url` explícito for passado), list/approve podem usar um fallback de pareamento local.

## Checklist de recuperação de deriva de token

Use quando a UI de Controle ou outros clientes continuam falhando com `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirmar a fonte atual do token do gateway:

```bash
opencraft config get gateway.auth.token
```

2. Listar dispositivos pareados e identificar o id do dispositivo afetado:

```bash
opencraft devices list
```

3. Rotacionar token de operador para o dispositivo afetado:

```bash
opencraft devices rotate --device <deviceId> --role operator
```

4. Se a rotação não for suficiente, remover o pareamento obsoleto e aprovar novamente:

```bash
opencraft devices remove <deviceId>
opencraft devices list
opencraft devices approve <requestId>
```

5. Tentar conexão do cliente novamente com o token/senha compartilhado atual.

Relacionado:

- [Resolução de problemas de auth do Dashboard](/web/dashboard#if-you-see-unauthorized-1008)
- [Resolução de problemas do Gateway](/gateway/troubleshooting#dashboard-control-ui-connectivity)
