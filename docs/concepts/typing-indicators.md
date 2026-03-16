---
summary: "Quando o OpenCraft mostra indicadores de digitação e como ajustá-los"
read_when:
  - Alterando comportamento ou padrões de indicador de digitação
title: "Indicadores de Digitação"
---

# Indicadores de digitação

Indicadores de digitação são enviados ao canal de chat enquanto uma execução está ativa. Use
`agents.defaults.typingMode` para controlar **quando** a digitação começa e `typingIntervalSeconds`
para controlar **com que frequência** é atualizado.

## Padrões

Quando `agents.defaults.typingMode` está **não definido**, o OpenCraft mantém o comportamento legado:

- **Chats diretos**: a digitação começa imediatamente assim que o loop do modelo começa.
- **Chats em grupo com menção**: a digitação começa imediatamente.
- **Chats em grupo sem menção**: a digitação começa apenas quando o texto da mensagem começa a ser transmitido.
- **Execuções de heartbeat**: a digitação está desabilitada.

## Modos

Defina `agents.defaults.typingMode` para um de:

- `never` — sem indicador de digitação, nunca.
- `instant` — começar a digitar **assim que o loop do modelo começa**, mesmo se a execução
  depois retornar apenas o token de resposta silenciosa.
- `thinking` — começar a digitar no **primeiro delta de raciocínio** (requer
  `reasoningLevel: "stream"` para a execução).
- `message` — começar a digitar no **primeiro delta de texto não-silencioso** (ignora
  o token silencioso `NO_REPLY`).

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

Você pode sobrescrever o modo ou a cadência por sessão:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notas

- O modo `message` não mostrará digitação para respostas apenas silenciosas (ex.: o token `NO_REPLY`
  usado para suprimir saída).
- `thinking` só dispara se a execução transmitir raciocínio (`reasoningLevel: "stream"`).
  Se o modelo não emitir deltas de raciocínio, a digitação não começará.
- Heartbeats nunca mostram digitação, independentemente do modo.
- `typingIntervalSeconds` controla a **cadência de atualização**, não o tempo de início.
  O padrão é 6 segundos.
