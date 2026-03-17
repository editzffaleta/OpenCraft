---
summary: "Contexto: o que o modelo vê, como é construído e como inspecionar"
read_when:
  - Você quer entender o que "contexto" significa no OpenCraft
  - Você está depurando por que o modelo "sabe" algo (ou esqueceu)
  - Você quer reduzir a sobrecarga de contexto (/context, /status, /compact)
title: "Context"
---

# Contexto

"Contexto" é **tudo que o OpenCraft envia ao modelo para uma execução**. É limitado pela **janela de contexto** (limite de tokens) do modelo.

Modelo mental para iniciantes:

- **Prompt do sistema** (construído pelo OpenCraft): regras, ferramentas, lista de Skills, hora/runtime e arquivos do workspace injetados.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente para esta sessão.
- **Chamadas de ferramentas/resultados + anexos**: saída de comandos, leituras de arquivo, imagens/áudio, etc.

Contexto _não é a mesma coisa_ que "memória": a memória pode ser armazenada no disco e recarregada depois; o contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar contexto)

- `/status` → visão rápida de "quão cheia está minha janela?" + configurações da sessão.
- `/context list` → o que está injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento mais profundo: por arquivo, tamanhos de schema de ferramenta, tamanhos de entrada por Skill e tamanho do prompt do sistema.
- `/usage tokens` → adiciona rodapé de uso por resposta às respostas normais.
- `/compact` → resume histórico mais antigo em uma entrada compacta para liberar espaço na janela.

Veja também: [Comandos slash](/tools/slash-commands), [Uso de tokens e custos](/reference/token-use), [Compactação](/concepts/compaction).

## Exemplo de saída

Os valores variam por modelo, provedor, política de ferramentas e o que está no seu workspace.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## O que conta para a janela de contexto

Tudo que o modelo recebe conta, incluindo:

- Prompt do sistema (todas as seções).
- Histórico da conversa.
- Chamadas de ferramentas + resultados de ferramentas.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de compactação e artefatos de pruning.
- "Wrappers" do provedor ou cabeçalhos ocultos (não visíveis, ainda contam).

## Como o OpenCraft constrói o prompt do sistema

O prompt do sistema é **de propriedade do OpenCraft** e reconstruído a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (apenas metadados; veja abaixo).
- Localização do workspace.
- Hora (UTC + hora do usuário convertida, se configurado).
- Metadados de runtime (host/OS/modelo/thinking).
- Arquivos de bootstrap do workspace injetados em **Project Context**.

Detalhamento completo: [Prompt do Sistema](/concepts/system-prompt).

## Arquivos do workspace injetados (Project Context)

Por padrão, o OpenCraft injeta um conjunto fixo de arquivos do workspace (se presentes):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas na primeira execução)

Arquivos grandes são truncados por arquivo usando `agents.defaults.bootstrapMaxChars` (padrão `20000` chars). O OpenCraft também aplica um limite total de injeção de bootstrap entre arquivos com `agents.defaults.bootstrapTotalMaxChars` (padrão `150000` chars). `/context` mostra tamanhos **raw vs injetado** e se houve truncamento.

Quando o truncamento ocorre, o runtime pode injetar um bloco de aviso no prompt dentro do Project Context. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão `once`).

## Skills: o que é injetado vs carregado sob demanda

O prompt do sistema inclui uma **lista de Skills** compacta (nome + descrição + localização). Esta lista tem custo real de overhead.

As instruções da Skill _não_ são incluídas por padrão. Espera-se que o modelo faça `read` do `SKILL.md` da Skill **apenas quando necessário**.

## Ferramentas: há dois custos

Ferramentas afetam o contexto de duas formas:

1. **Texto da lista de ferramentas** no prompt do sistema (o que você vê como "Tooling").
2. **Schemas de ferramentas** (JSON). Estes são enviados ao modelo para que ele possa chamar ferramentas. Contam para o contexto mesmo que você não os veja como texto simples.

`/context detail` detalha os maiores schemas de ferramentas para que você possa ver o que domina.

## Comandos, diretivas e "atalhos inline"

Comandos slash são tratados pelo Gateway. Existem alguns comportamentos diferentes:

- **Comandos standalone**: uma mensagem que é apenas `/...` executa como um comando.
- **Diretivas**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` são removidas antes de o modelo ver a mensagem.
  - Mensagens apenas com diretivas persistem configurações da sessão.
  - Diretivas inline em uma mensagem normal agem como dicas por mensagem.
- **Atalhos inline** (apenas remetentes na allowlist): certos tokens `/...` dentro de uma mensagem normal podem executar imediatamente (exemplo: "hey /status"), e são removidos antes de o modelo ver o texto restante.

Detalhes: [Comandos slash](/tools/slash-commands).

## Sessões, compactação e pruning (o que persiste)

O que persiste entre mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até ser compactado/reduzido por política.
- **Compactação** persiste um resumo na transcrição e mantém mensagens recentes intactas.
- **Pruning** remove resultados de ferramentas antigos do prompt _em memória_ para uma execução, mas não reescreve a transcrição.

Documentação: [Sessão](/concepts/session), [Compactação](/concepts/compaction), [Pruning de sessão](/concepts/session-pruning).

Por padrão, o OpenCraft usa o motor de contexto `legacy` integrado para montagem e
compactação. Se você instalar um Plugin que fornece `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenCraft delega a montagem de contexto,
`/compact` e hooks de ciclo de vida de contexto de subagente relacionados para esse
motor.

## O que `/context` realmente reporta

`/context` prefere o relatório do prompt do sistema **construído na execução** mais recente quando disponível:

- `System prompt (run)` = capturado da última execução embutida (com capacidade de ferramentas) e persistido no armazenamento de sessão.
- `System prompt (estimate)` = computado em tempo real quando não existe relatório de execução (ou quando executando via um backend CLI que não gera o relatório).

De qualquer forma, reporta tamanhos e principais contribuidores; **não** despeja o prompt do sistema completo ou schemas de ferramentas.
