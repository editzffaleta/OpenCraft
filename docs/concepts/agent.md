---
summary: "Tempo de execução do agente (pi-mono integrado), contrato de espaço de trabalho e bootstrap de sessão"
read_when:
  - Mudando tempo de execução do agente, bootstrap de espaço de trabalho ou comportamento de sessão
title: "Tempo de Execução do Agente"
---

# Tempo de Execução do Agente

O OpenCraft executa um único tempo de execução de agente integrado derivado de **pi-mono**.

## Espaço de trabalho (necessário)

O OpenCraft usa um diretório de espaço de trabalho de agente único (`agents.defaults.workspace`) como o **único** diretório de trabalho do agente (`cwd`) para ferramentas e contexto.

Recomendado: use `opencraft setup` para criar `~/.editzffaleta/OpenCraft.json` se faltando e inicializar os arquivos do espaço de trabalho.

Layout completo de espaço de trabalho + guia de backup: [Espaço de trabalho do agente](/concepts/agent-workspace)

Se `agents.defaults.sandbox` está habilitado, sessões não-principais podem substituir isso com
espaços de trabalho por sessão em `agents.defaults.sandbox.workspaceRoot` (veja
[Configuração do Gateway](/gateway/configuration)).

## Arquivos de bootstrap (injetados)

Dentro de `agents.defaults.workspace`, OpenCraft espera estes arquivos editáveis do usuário:

- `AGENTS.md` — instruções operacionais + "memória"
- `SOUL.md` — persona, limites, tom
- `TOOLS.md` — notas de ferramentas mantidas pelo usuário (ex: `imsg`, `sag`, convenções)
- `BOOTSTRAP.md` — ritual de primeira execução única (deletado após conclusão)
- `IDENTITY.md` — nome/vibe/emoji do agente
- `USER.md` — perfil de usuário + endereço preferido

No primeiro turno de uma nova sessão, OpenCraft injeta o conteúdo destes arquivos diretamente no contexto do agente.

Arquivos em branco são pulados. Arquivos grandes são aparados e truncados com um marcador para que prompts permaneçam enxutos (leia o arquivo para conteúdo completo).

Se um arquivo está faltando, OpenCraft injeta uma única linha de marcador "arquivo faltando" (e `opencraft setup` criará um template seguro padrão).

`BOOTSTRAP.md` é apenas criado para um **espaço de trabalho completamente novo** (nenhum outro arquivo de bootstrap presente). Se você deletar após completar o ritual, não deve ser recriado em reinícios posteriores.

Para desabilitar criação de arquivo de bootstrap inteiramente (para espaços de trabalho pré-semeados), defina:

```json5
{ agent: { skipBootstrap: true } }
```

## Ferramentas integradas

Ferramentas principais (read/exec/edit/write e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas a política de ferramenta. `apply_patch` é opcional e protegido por
`tools.exec.applyPatch`. `TOOLS.md` **não** controla quais ferramentas existem; é
orientação para como _você_ quer que sejam usadas.

## Skills

OpenCraft carrega skills de três locais (workspace vence em conflito de nome):

- Bundled (enviado com a instalação)
- Managed/local: `~/.opencraft/skills`
- Workspace: `<workspace>/skills`

Skills podem ser protegidas por config/env (veja `skills` em [Configuração do Gateway](/gateway/configuration)).

## Integração pi-mono

OpenCraft reutiliza peças da base de código pi-mono (modelos/ferramentas), mas **gerenciamento de sessão, descoberta e fiação de ferramenta são de propriedade do OpenCraft**.

- Nenhum tempo de execução de agente pi-coding.
- Nenhuma configuração `~/.pi/agent` ou `<workspace>/.pi` é consultada.

## Sessões

Transcrições de sessão são armazenadas como JSONL em:

- `~/.opencraft/agents/<agentId>/sessions/<SessionId>.jsonl`

O ID da sessão é estável e escolhido por OpenCraft.
Pastas de sessão legadas Pi/Tau **não** são lidas.

## Steering durante streaming

Quando modo de fila é `steer`, mensagens de entrada são injetadas na execução atual.
A fila é verificada **após cada chamada de ferramenta**; se uma mensagem enfileirada está presente,
chamadas de ferramenta restantes da mensagem assistente atual são puladas (resultados de ferramenta de erro com "Skipped due to queued user message."), então a mensagem de usuário enfileirada
é injetada antes da próxima resposta de assistente.

Quando modo de fila é `followup` ou `collect`, mensagens de entrada são mantidas até que o
turno atual termine, então um novo turno de agente começa com os payloads enfileirados. Veja
[Fila](/concepts/queue) para modo + comportamento de debounce/cap.

Block streaming envia blocos de assistente concluídos assim que terminam; está
**desabilitado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Sintonize a fronteira via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; padrão para text_end).
Controle soft block chunking com `agents.defaults.blockStreamingChunk` (padrão para
800–1200 chars; prefere quebras de parágrafo, então newlines; frases por último).
Coalesce chunks transmitidos com `agents.defaults.blockStreamingCoalesce` para reduzir
spam de linha única (merging baseado em idle antes de envio). Canais não-Telegram requerem
`*.blockStreaming: true` explícito para habilitar respostas de bloco.
Resumos de ferramenta verbosos são emitidos no início da ferramenta (sem debounce); Control UI
transmite saída de ferramenta via eventos de agente quando disponíveis.
Mais detalhes: [Streaming + chunking](/concepts/streaming).

## Refs de modelo

Refs de modelo em config (por exemplo `agents.defaults.model` e `agents.defaults.models`) são analisadas pela divisão no **primeiro** `/`.

- Use `provider/model` ao configurar modelos.
- Se o ID do modelo em si contém `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omite o provedor, OpenCraft trata a entrada como um alias ou um modelo para o **provedor padrão** (apenas funciona quando não há `/` no ID do modelo).

## Configuração (mínima)

No mínimo, defina:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente recomendado)

---

_Próximo: [Chats de Grupo](/channels/group-messages)_
