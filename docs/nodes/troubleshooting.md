---
summary: "Solucionar problemas de emparelhamento de node, requisitos de foreground, permissões e falhas de tool"
read_when:
  - Node está conectado mas tools de câmera/canvas/tela/exec falham
  - Você precisa entender a diferença entre emparelhamento de node e aprovações
title: "Troubleshooting de Node"
---

# Troubleshooting de node

Use esta página quando um node está visível no status mas as tools de node falham.

## Sequência de comandos

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Depois rode verificações específicas de node:

```bash
opencraft nodes status
opencraft nodes describe --node <idOrNameOrIp>
opencraft approvals get --node <idOrNameOrIp>
```

Sinais de saúde:

- Node está conectado e emparelhado para o papel `node`.
- `nodes describe` inclui a capacidade que você está chamando.
- Aprovações exec mostram modo/allowlist esperados.

## Requisitos de foreground

`canvas.*`, `camera.*` e `screen.*` são apenas em foreground nos nodes iOS/Android.

Verificação rápida e correção:

```bash
opencraft nodes describe --node <idOrNameOrIp>
opencraft nodes canvas snapshot --node <idOrNameOrIp>
opencraft logs --follow
```

Se você ver `NODE_BACKGROUND_UNAVAILABLE`, coloque o app do node em foreground e tente novamente.

## Matriz de permissões

| Capacidade                   | iOS                                     | Android                                      | App node macOS                | Código de falha típico         |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Câmera (+ mic para clipe com áudio)     | Câmera (+ mic para clipe com áudio)          | Câmera (+ mic para clipe com áudio) | `*_PERMISSION_REQUIRED`  |
| `screen.record`              | Gravação de Tela (+ mic opcional)       | Prompt de captura de tela (+ mic opcional)   | Gravação de Tela              | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Enquanto Usando ou Sempre (depende do modo) | Localização em foreground/background por modo | Permissão de Localização   | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (caminho do host de node)           | n/a (caminho do host de node)                | Aprovações exec obrigatórias  | `SYSTEM_RUN_DENIED`            |

## Emparelhamento versus aprovações

Esses são controles diferentes:

1. **Emparelhamento de dispositivo**: este node pode se conectar ao gateway?
2. **Aprovações exec**: este node pode rodar um comando shell específico?

Verificações rápidas:

```bash
opencraft devices list
opencraft nodes status
opencraft approvals get --node <idOrNameOrIp>
opencraft approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Se o emparelhamento estiver faltando, aprove o dispositivo do node primeiro.
Se o emparelhamento estiver ok mas `system.run` falhar, corrija as aprovações/allowlist exec.

## Códigos de erro comuns de node

- `NODE_BACKGROUND_UNAVAILABLE` → app está em background; coloque em foreground.
- `CAMERA_DISABLED` → toggle de câmera desativado nas configurações do node.
- `*_PERMISSION_REQUIRED` → permissão do SO faltando/negada.
- `LOCATION_DISABLED` → modo de localização está desativado.
- `LOCATION_PERMISSION_REQUIRED` → modo de localização solicitado não foi concedido.
- `LOCATION_BACKGROUND_UNAVAILABLE` → app está em background mas apenas permissão Enquanto Usando existe.
- `SYSTEM_RUN_DENIED: approval required` → requisição exec precisa de aprovação explícita.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pelo modo allowlist.
  Em hosts de node Windows, formas wrapper shell como `cmd.exe /c ...` são tratadas como misses de allowlist em
  modo allowlist a menos que aprovadas via fluxo ask.

## Loop de recuperação rápida

```bash
opencraft nodes status
opencraft nodes describe --node <idOrNameOrIp>
opencraft approvals get --node <idOrNameOrIp>
opencraft logs --follow
```

Se ainda travado:

- Re-aprove o emparelhamento de dispositivo.
- Reabra o app do node (foreground).
- Re-conceda as permissões do SO.
- Recrie/ajuste a política de aprovação exec.

Relacionados:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
