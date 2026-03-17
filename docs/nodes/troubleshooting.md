---
summary: "Solucionar problemas de pareamento de nodes, requisitos de primeiro plano, permissões e falhas de ferramentas"
read_when:
  - Node está conectado mas ferramentas de câmera/canvas/tela/exec falham
  - Você precisa entender o modelo mental de pareamento vs aprovações de nodes
title: "Solução de Problemas de Nodes"
---

# Solução de problemas de nodes

Use esta página quando um node está visível no status mas as ferramentas do node falham.

## Sequência de comandos

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Depois execute verificações específicas do node:

```bash
opencraft nodes status
opencraft nodes describe --node <idOrNameOrIp>
opencraft approvals get --node <idOrNameOrIp>
```

Sinais saudáveis:

- Node está conectado e pareado para a role `node`.
- `nodes describe` inclui a capacidade que você está chamando.
- Aprovações exec mostram modo/allowlist esperados.

## Requisitos de primeiro plano

`canvas.*`, `camera.*` e `screen.*` são somente primeiro plano em nodes iOS/Android.

Verificação rápida e correção:

```bash
opencraft nodes describe --node <idOrNameOrIp>
opencraft nodes canvas snapshot --node <idOrNameOrIp>
opencraft logs --follow
```

Se você vir `NODE_BACKGROUND_UNAVAILABLE`, traga o app do node para o primeiro plano e tente novamente.

## Matriz de permissões

| Capacidade                   | iOS                                         | Android                                               | App node macOS                    | Código de falha típico         |
| ---------------------------- | ------------------------------------------- | ----------------------------------------------------- | --------------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Câmera (+ mic para áudio do clip)           | Câmera (+ mic para áudio do clip)                     | Câmera (+ mic para áudio do clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Gravação de Tela (+ mic opcional)           | Prompt de captura de tela (+ mic opcional)            | Gravação de Tela                  | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Enquanto Usando ou Sempre (depende do modo) | Localização Primeiro plano/Background baseado no modo | Permissão de Localização          | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (caminho do host node)                  | n/a (caminho do host node)                            | Aprovações exec necessárias       | `SYSTEM_RUN_DENIED`            |

## Pareamento versus aprovações

Estas são barreiras diferentes:

1. **Pareamento de dispositivo**: este node pode se conectar ao gateway?
2. **Aprovações exec**: este node pode executar um comando shell específico?

Verificações rápidas:

```bash
opencraft devices list
opencraft nodes status
opencraft approvals get --node <idOrNameOrIp>
opencraft approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Se o pareamento estiver faltando, aprove o dispositivo node primeiro.
Se o pareamento estiver ok mas `system.run` falhar, corrija aprovações/allowlist exec.

## Códigos de erro comuns de nodes

- `NODE_BACKGROUND_UNAVAILABLE` → app está em background; traga para o primeiro plano.
- `CAMERA_DISABLED` → toggle de câmera desabilitado nas configurações do node.
- `*_PERMISSION_REQUIRED` → permissão do SO faltando/negada.
- `LOCATION_DISABLED` → modo de localização está desligado.
- `LOCATION_PERMISSION_REQUIRED` → modo de localização solicitado não concedido.
- `LOCATION_BACKGROUND_UNAVAILABLE` → app está em background mas apenas permissão Enquanto Usando existe.
- `SYSTEM_RUN_DENIED: approval required` → requisição exec precisa de aprovação explícita.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pelo modo allowlist.
  Em hosts node Windows, formas de wrapper de shell como `cmd.exe /c ...` são tratadas como misses de allowlist no
  modo allowlist a menos que aprovadas via fluxo ask.

## Loop de recuperação rápida

```bash
opencraft nodes status
opencraft nodes describe --node <idOrNameOrIp>
opencraft approvals get --node <idOrNameOrIp>
opencraft logs --follow
```

Se ainda estiver travado:

- Re-aprove pareamento de dispositivo.
- Re-abra app do node (primeiro plano).
- Re-conceda permissões do SO.
- Recrie/ajuste política de aprovação exec.

Relacionado:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
