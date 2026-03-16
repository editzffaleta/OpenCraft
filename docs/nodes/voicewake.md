---
summary: "Palavras de ativação por voz globais (de propriedade do Gateway) e como sincronizam entre nodes"
read_when:
  - Alterando comportamento ou padrões de palavras de ativação por voz
  - Adicionando novas plataformas de node que precisam de sincronização de palavra de ativação
title: "Voice Wake"
---

# Voice Wake (Palavras de Ativação Globais)

O OpenCraft trata **palavras de ativação como uma lista global única** de propriedade do **Gateway**.

- Não existem **palavras de ativação personalizadas por node**.
- **Qualquer UI de node/app pode editar** a lista; alterações são persistidas pelo Gateway e transmitidas a todos.
- macOS e iOS mantêm toggles locais de **Voice Wake habilitado/desabilitado** (UX local + permissões diferem).
- Android atualmente mantém o Voice Wake desativado e usa um fluxo de microfone manual na aba de Voz.

## Armazenamento (host do Gateway)

Palavras de ativação são armazenadas na máquina do gateway em:

- `~/.opencraft/settings/voicewake.json`

Estrutura:

```json
{ "triggers": ["opencraft", "claude", "computador"], "updatedAtMs": 1730000000000 }
```

## Protocolo

### Métodos

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` com params `{ triggers: string[] }` → `{ triggers: string[] }`

Notas:

- Triggers são normalizados (trimmed, vazios removidos). Listas vazias voltam para os padrões.
- Limites são aplicados por segurança (limites de quantidade/comprimento).

### Eventos

- `voicewake.changed` payload `{ triggers: string[] }`

Quem recebe:

- Todos os clientes WebSocket (app macOS, WebChat, etc.)
- Todos os nodes conectados (iOS/Android), e também ao conectar o node como um push de "estado atual" inicial.

## Comportamento do cliente

### App macOS

- Usa a lista global para controlar triggers do `VoiceWakeRuntime`.
- Editar "Palavras de ativação" nas configurações de Voice Wake chama `voicewake.set` e então depende da transmissão para manter outros clientes sincronizados.

### Node iOS

- Usa a lista global para detecção de triggers do `VoiceWakeManager`.
- Editar Palavras de Ativação em Configurações chama `voicewake.set` (via WS do Gateway) e também mantém a detecção local de palavra de ativação responsiva.

### Node Android

- Voice Wake está atualmente desativado no runtime/Configurações do Android.
- Voz no Android usa captura de microfone manual na aba de Voz em vez de triggers de palavra de ativação.
