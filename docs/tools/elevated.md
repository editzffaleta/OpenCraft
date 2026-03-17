---
summary: "Modo exec elevado e diretivas /elevated"
read_when:
  - Ajustando padrões do modo elevado, allowlists ou comportamento de slash command
title: "Modo Elevado"
---

# Modo Elevado (diretivas /elevated)

## O que faz

- `/elevated on` roda no host do Gateway e mantém aprovações de exec (igual a `/elevated ask`).
- `/elevated full` roda no host do Gateway **e** auto-aprova exec (pula aprovações de exec).
- `/elevated ask` roda no host do Gateway mas mantém aprovações de exec (igual a `/elevated on`).
- `on`/`ask` **não** forçam `exec.security=full`; a política configurada de security/ask ainda se aplica.
- Só muda o comportamento quando o agente está **em sandbox** (caso contrário exec já roda no host).
- Formas de diretiva: `/elevated on|off|ask|full`, `/elev on|off|ask|full`.
- Apenas `on|off|ask|full` são aceitos; qualquer outra coisa retorna uma dica e não muda o estado.

## O que controla (e o que não controla)

- **Gates de disponibilidade**: `tools.elevated` é a linha de base global. `agents.list[].tools.elevated` pode restringir ainda mais o elevado por agente (ambos devem permitir).
- **Estado por sessão**: `/elevated on|off|ask|full` define o nível elevado para a chave de sessão atual.
- **Diretiva inline**: `/elevated on|ask|full` dentro de uma mensagem se aplica apenas àquela mensagem.
- **Grupos**: Em chats de grupo, diretivas elevadas são honradas apenas quando o agente é mencionado. Mensagens apenas de comando que ignoram requisitos de menção são tratadas como mencionadas.
- **Execução no host**: elevado força `exec` no host do Gateway; `full` também define `security=full`.
- **Aprovações**: `full` pula aprovações de exec; `on`/`ask` as honram quando regras de allowlist/ask exigem.
- **Agentes sem sandbox**: sem efeito para localização; afeta apenas gating, logging e status.
- **Política de ferramenta ainda se aplica**: se `exec` é negado por política de ferramenta, elevado não pode ser usado.
- **Separado de `/exec`**: `/exec` ajusta padrões por sessão para remetentes autorizados e não requer elevado.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se apenas àquela mensagem).
2. Substituição de sessão (definida enviando uma mensagem apenas de diretiva).
3. Padrão global (`agents.defaults.elevatedDefault` na config).

## Definindo um padrão de sessão

- Envie uma mensagem que seja **apenas** a diretiva (espaço em branco permitido), ex. `/elevated full`.
- Resposta de confirmação é enviada (`Elevated mode set to full...` / `Elevated mode disabled.`).
- Se o acesso elevado estiver desabilitado ou o remetente não estiver na allowlist aprovada, a diretiva responde com um erro acionável e não muda o estado da sessão.
- Envie `/elevated` (ou `/elevated:`) sem argumento para ver o nível elevado atual.

## Disponibilidade + allowlists

- Gate de funcionalidade: `tools.elevated.enabled` (padrão pode estar desligado via config mesmo que o código suporte).
- Allowlist de remetente: `tools.elevated.allowFrom` com allowlists por provedor (ex. `discord`, `whatsapp`).
- Entradas de allowlist sem prefixo correspondem apenas a valores de identidade com escopo de remetente (`SenderId`, `SenderE164`, `From`); campos de roteamento de destinatário nunca são usados para autorização elevada.
- Metadados mutáveis de remetente requerem prefixos explícitos:
  - `name:<value>` corresponde a `SenderName`
  - `username:<value>` corresponde a `SenderUsername`
  - `tag:<value>` corresponde a `SenderTag`
  - `id:<value>`, `from:<value>`, `e164:<value>` estão disponíveis para targeting explícito de identidade
- Gate por agente: `agents.list[].tools.elevated.enabled` (opcional; pode apenas restringir mais).
- Allowlist por agente: `agents.list[].tools.elevated.allowFrom` (opcional; quando definida, o remetente deve corresponder **ambas** allowlists global + por agente).
- Fallback do Discord: se `tools.elevated.allowFrom.discord` for omitido, a lista `channels.discord.allowFrom` é usada como fallback (legacy: `channels.discord.dm.allowFrom`). Defina `tools.elevated.allowFrom.discord` (mesmo `[]`) para substituir. Allowlists por agente **não** usam o fallback.
- Todos os gates devem passar; caso contrário, elevado é tratado como indisponível.

## Logging + status

- Chamadas exec elevadas são registradas no nível info.
- Status da sessão inclui modo elevado (ex. `elevated=ask`, `elevated=full`).
