---
summary: "Quando o OpenCraft mostra indicadores de digitação e como ajustá-los"
read_when:
  - Alterando comportamento ou padrões de indicadores de digitação
title: "Typing Indicators"
---

# Indicadores de digitação

Indicadores de digitação são enviados para o canal de chat enquanto uma execução está ativa. Use
`agents.defaults.typingMode` para controlar **quando** a digitação começa e `typingIntervalSeconds`
para controlar **com que frequência** ela é atualizada.

## Padrões

Quando `agents.defaults.typingMode` **não está definido**, o OpenCraft mantém o comportamento legado:

- **Chats diretos**: digitação começa imediatamente quando o loop do modelo inicia.
- **Chats em grupo com menção**: digitação começa imediatamente.
- **Chats em grupo sem menção**: digitação começa apenas quando o texto da mensagem começa a ser transmitido.
- **Execuções de heartbeat**: digitação está desabilitada.

## Modos

Defina `agents.defaults.typingMode` para um dos seguintes:

- `never` — nenhum indicador de digitação, nunca.
- `instant` — começa a digitar **assim que o loop do modelo inicia**, mesmo se a execução
  depois retornar apenas o Token de resposta silenciosa.
- `thinking` — começa a digitar no **primeiro delta de raciocínio** (requer
  `reasoningLevel: "stream"` para a execução).
- `message` — começa a digitar no **primeiro delta de texto não-silencioso** (ignora
  o Token silencioso `NO_REPLY`).

Ordem de "quão cedo dispara":
`never` → `message` → `thinking` → `instant`

## Configuração

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Você pode sobrescrever o modo ou cadência por sessão:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notas

- O modo `message` não mostrará digitação para respostas apenas silenciosas (ex. o Token
  `NO_REPLY` usado para suprimir saída).
- `thinking` só dispara se a execução transmitir raciocínio (`reasoningLevel: "stream"`).
  Se o modelo não emitir deltas de raciocínio, a digitação não começará.
- Heartbeats nunca mostram digitação, independentemente do modo.
- `typingIntervalSeconds` controla a **cadência de atualização**, não o tempo de início.
  O padrão é 6 segundos.
