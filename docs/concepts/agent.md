---
summary: "Runtime do agente (embedded pi-mono), contrato do workspace e bootstrap de sessão"
read_when:
  - Alterando runtime do agente, bootstrap do workspace ou comportamento de sessão
title: "Runtime do Agente"
---

# Runtime do Agente 🤖

O OpenCraft executa um único runtime de agente embarcado derivado do **pi-mono**.

## Workspace (obrigatório)

O OpenCraft usa um único diretório de workspace do agente (`agents.defaults.workspace`) como o **único** diretório de trabalho (`cwd`) do agente para ferramentas e contexto.

Recomendado: use `opencraft setup` para criar `~/.opencraft/opencraft.json` se ausente e inicializar os arquivos do workspace.

Layout completo do workspace + guia de backup: [Workspace do agente](/concepts/agent-workspace)

Se `agents.defaults.sandbox` estiver habilitado, sessões não-principais podem sobrescrever isso com
workspaces por sessão em `agents.defaults.sandbox.workspaceRoot` (veja
[Configuração do Gateway](/gateway/configuration)).

## Arquivos de bootstrap (injetados)

Dentro de `agents.defaults.workspace`, o OpenCraft espera estes arquivos editáveis pelo usuário:

- `AGENTS.md` — instruções de operação + "memória"
- `SOUL.md` — persona, limites, tom
- `TOOLS.md` — notas de ferramentas mantidas pelo usuário (ex.: `imsg`, `sag`, convenções)
- `BOOTSTRAP.md` — ritual de primeira execução (deletado após conclusão)
- `IDENTITY.md` — nome/vibe/emoji do agente
- `USER.md` — perfil do usuário + forma de tratamento preferida

Na primeira rodada de uma nova sessão, o OpenCraft injeta o conteúdo desses arquivos diretamente no contexto do agente.

Arquivos em branco são ignorados. Arquivos grandes são aparados e truncados com um marcador para manter os prompts enxutos (leia o arquivo para conteúdo completo).

Se um arquivo estiver ausente, o OpenCraft injeta uma única linha de marcador "arquivo ausente" (e `opencraft setup` criará um template padrão seguro).

`BOOTSTRAP.md` só é criado para um **workspace completamente novo** (sem outros arquivos de bootstrap presentes). Se você o deletar após completar o ritual, ele não deve ser recriado em reinicializações posteriores.

Para desabilitar a criação de arquivos de bootstrap completamente (para workspaces pré-semeados), defina:

```json5
{ agent: { skipBootstrap: true } }
```

## Ferramentas integradas

Ferramentas principais (read/exec/edit/write e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas à política de ferramentas. `apply_patch` é opcional e controlado por
`tools.exec.applyPatch`. `TOOLS.md` **não** controla quais ferramentas existem; é
orientação para como _você_ quer que sejam usadas.

## Skills

O OpenCraft carrega skills de três locais (workspace vence em conflito de nomes):

- Embutidos (distribuídos com a instalação)
- Gerenciados/locais: `~/.opencraft/skills`
- Workspace: `<workspace>/skills`

Skills podem ser controlados por config/env (veja `skills` em [Configuração do Gateway](/gateway/configuration)).

## Integração pi-mono

O OpenCraft reutiliza partes do código pi-mono (models/tools), mas **gerenciamento de sessão, descoberta e fiação de ferramentas são de propriedade do OpenCraft**.

- Sem runtime de agente pi-coding.
- Sem configurações de `~/.pi/agent` ou `<workspace>/.pi` são consultadas.

## Sessões

Transcrições de sessão são armazenadas como JSONL em:

- `~/.opencraft/agents/<agentId>/sessions/<SessionId>.jsonl`

O ID da sessão é estável e escolhido pelo OpenCraft.
Pastas de sessão legadas Pi/Tau **não** são lidas.

## Direcionamento durante streaming

Quando o modo de fila é `steer`, mensagens de entrada são injetadas na execução atual.
A fila é verificada **após cada chamada de ferramenta**; se uma mensagem enfileirada estiver presente,
as chamadas de ferramenta restantes da mensagem do assistente atual são puladas (resultados de ferramenta com erro
"Skipped due to queued user message."), depois a mensagem do usuário enfileirada é injetada antes da próxima resposta do assistente.

Quando o modo de fila é `followup` ou `collect`, mensagens de entrada são retidas até o
turno atual terminar, depois um novo turno do agente começa com os payloads enfileirados. Veja
[Fila](/concepts/queue) para comportamento de modo + debounce/cap.

O streaming de bloco envia blocos completos do assistente assim que terminam; está
**desativado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste o limite via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; padrão text_end).
Controle o chunking suave de bloco com `agents.defaults.blockStreamingChunk` (padrão
800–1200 chars; prefere quebras de parágrafo, depois newlines; frases por último).
Mescle chunks streamados com `agents.defaults.blockStreamingCoalesce` para reduzir
spam de linha única (merge baseado em ociosidade antes do envio). Canais não-Telegram requerem
`*.blockStreaming: true` explícito para habilitar respostas em bloco.
Sumários verbosos de ferramentas são emitidos no início da ferramenta (sem debounce); a UI de Controle
faz streaming de output de ferramentas via eventos do agente quando disponível.
Mais detalhes: [Streaming + chunking](/concepts/streaming).

## Refs de modelo

Refs de modelo na config (por exemplo `agents.defaults.model` e `agents.defaults.models`) são analisadas dividindo no **primeiro** `/`.

- Use `provider/model` ao configurar modelos.
- Se o ID do modelo em si contém `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenCraft trata a entrada como um alias ou um modelo para o **provedor padrão** (só funciona quando não há `/` no ID do modelo).

## Configuração (mínima)

No mínimo, defina:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente recomendado)

---

_Próximo: [Chats em Grupo](/channels/group-messages)_ 🦞
