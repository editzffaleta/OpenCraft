---
summary: "Modo elevado de exec e diretivas /elevated"
read_when:
  - Ajustando padrões do modo elevado, allowlists ou comportamento de slash command
title: "Modo Elevado"
---

# Modo Elevado (diretivas /elevated)

## O que faz

- `/elevated on` roda no host do gateway e mantém aprovações de exec (mesmo que `/elevated ask`).
- `/elevated full` roda no host do gateway **e** aprova exec automaticamente (pula aprovações de exec).
- `/elevated ask` roda no host do gateway mas mantém aprovações de exec (mesmo que `/elevated on`).
- `on`/`ask` **não** forçam `exec.security=full`; a política de segurança/ask configurada ainda se aplica.
- Só muda comportamento quando o agente está **em sandbox** (caso contrário, exec já roda no host).
- Formas da diretiva: `/elevated on|off|ask|full`, `/elev on|off|ask|full`.
- Apenas `on|off|ask|full` são aceitos; qualquer outra coisa retorna uma dica e não muda o estado.

## O que controla (e o que não controla)

- **Gates de disponibilidade**: `tools.elevated` é a baseline global. `agents.list[].tools.elevated` pode restringir ainda mais o elevado por agente (ambos devem permitir).
- **Estado por sessão**: `/elevated on|off|ask|full` define o nível elevado para a chave de sessão atual.
- **Diretiva inline**: `/elevated on|ask|full` dentro de uma mensagem se aplica apenas àquela mensagem.
- **Grupos**: Em chats em grupo, diretivas elevadas são honradas apenas quando o agente é mencionado. Mensagens apenas de comando que contornam requisitos de menção são tratadas como mencionadas.
- **Execução no host**: elevated força `exec` para o host do gateway; `full` também define `security=full`.
- **Aprovações**: `full` pula aprovações de exec; `on`/`ask` as honram quando regras de allowlist/ask exigem.
- **Agentes sem sandbox**: no-op para localização; afeta apenas gating, logging e status.
- **Política de tool ainda se aplica**: se `exec` é negado pela política de tool, o modo elevado não pode ser usado.
- **Separado de `/exec`**: `/exec` ajusta padrões por sessão para remetentes autorizados e não requer elevado.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se apenas àquela mensagem).
2. Override de sessão (definido enviando uma mensagem somente com a diretiva).
3. Padrão global (`agents.defaults.elevatedDefault` na configuração).

## Definindo um padrão de sessão

- Envie uma mensagem que seja **apenas** a diretiva (espaços permitidos), ex.: `/elevated full`.
- Uma resposta de confirmação é enviada (`Modo elevado definido como full...` / `Modo elevado desabilitado.`).
- Se o acesso elevado está desabilitado ou o remetente não está na allowlist aprovada, a diretiva responde com um erro acionável e não muda o estado da sessão.
- Envie `/elevated` (ou `/elevated:`) sem argumento para ver o nível elevado atual.

## Disponibilidade + allowlists

- Gate de funcionalidade: `tools.elevated.enabled` (pode estar desabilitado via config mesmo que o código suporte).
- Allowlist de remetente: `tools.elevated.allowFrom` com allowlists por provedor (ex.: `discord`, `whatsapp`).
- Entradas de allowlist sem prefixo correspondem apenas a valores de identidade com escopo de remetente (`SenderId`, `SenderE164`, `From`); campos de roteamento de destinatário nunca são usados para autorização elevada.
- Metadados de remetente mutáveis requerem prefixos explícitos:
  - `name:<valor>` corresponde a `SenderName`
  - `username:<valor>` corresponde a `SenderUsername`
  - `tag:<valor>` corresponde a `SenderTag`
  - `id:<valor>`, `from:<valor>`, `e164:<valor>` estão disponíveis para targeting de identidade explícito
- Gate por agente: `agents.list[].tools.elevated.enabled` (opcional; só pode restringir ainda mais).
- Allowlist por agente: `agents.list[].tools.elevated.allowFrom` (opcional; quando definido, o remetente deve corresponder a **ambas** as allowlists global e por agente).
- Fallback Discord: se `tools.elevated.allowFrom.discord` for omitido, a lista `channels.discord.allowFrom` é usada como fallback (legado: `channels.discord.dm.allowFrom`). Defina `tools.elevated.allowFrom.discord` (mesmo `[]`) para sobrescrever. Allowlists por agente **não** usam o fallback.
- Todos os gates devem passar; caso contrário, o modo elevado é tratado como indisponível.

## Logging + status

- Chamadas de exec elevado são registradas em nível info.
- O status da sessão inclui o modo elevado (ex.: `elevated=ask`, `elevated=full`).
