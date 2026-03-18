---
name: apple-reminders
description: Gerenciar o Apple Reminders via CLI remindctl (listar, adicionar, editar, concluir, excluir). Suporta listas, filtros de data e saída JSON/texto simples.
homepage: https://github.com/steipete/remindctl
metadata:
  {
    "opencraft":
      {
        "emoji": "⏰",
        "os": ["darwin"],
        "requires": { "bins": ["remindctl"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/remindctl",
              "bins": ["remindctl"],
              "label": "Instalar remindctl via Homebrew",
            },
          ],
      },
  }
---

# CLI do Apple Reminders (remindctl)

Use `remindctl` para gerenciar o Apple Reminders diretamente pelo terminal.

## Quando Usar

✅ **USE esta skill quando:**

- O usuário mencionar explicitamente "lembrete" ou "app Lembretes"
- Criar tarefas pessoais com datas de vencimento que sincronizam com iOS
- Gerenciar listas do Apple Reminders
- O usuário quiser que tarefas apareçam no app Lembretes do iPhone/iPad

## Quando NÃO Usar

❌ **NÃO use esta skill quando:**

- Agendar tarefas ou alertas do OpenCraft → use a ferramenta `cron` com systemEvent
- Eventos de calendário ou compromissos → use o Apple Calendar
- Gerenciamento de tarefas de projeto/trabalho → use Notion, GitHub Issues ou fila de tarefas
- Notificações únicas → use a ferramenta `cron` para alertas programados
- O usuário diz "me lembre" mas quer um alerta do OpenCraft → esclareça primeiro

## Configuração

- Instalar: `brew install steipete/tap/remindctl`
- Apenas macOS; conceda permissão ao Lembretes quando solicitado
- Verificar status: `remindctl status`
- Solicitar acesso: `remindctl authorize`

## Comandos Comuns

### Ver Lembretes

```bash
remindctl                    # Lembretes de hoje
remindctl today              # Hoje
remindctl tomorrow           # Amanhã
remindctl week               # Esta semana
remindctl overdue            # Atrasados
remindctl all                # Tudo
remindctl 2026-01-04         # Data específica
```

### Gerenciar Listas

```bash
remindctl list               # Listar todas as listas
remindctl list Work          # Mostrar lista específica
remindctl list Projects --create    # Criar lista
remindctl list Work --delete        # Excluir lista
```

### Criar Lembretes

```bash
remindctl add "Buy milk"
remindctl add --title "Call mom" --list Personal --due tomorrow
remindctl add --title "Meeting prep" --due "2026-02-15 09:00"
```

### Concluir/Excluir

```bash
remindctl complete 1 2 3     # Concluir por ID
remindctl delete 4A83 --force  # Excluir por ID
```

### Formatos de Saída

```bash
remindctl today --json       # JSON para scripts
remindctl today --plain      # Formato TSV
remindctl today --quiet      # Apenas contagens
```

## Formatos de Data

Aceitos por `--due` e filtros de data:

- `today`, `tomorrow`, `yesterday`
- `YYYY-MM-DD`
- `YYYY-MM-DD HH:mm`
- ISO 8601 (`2026-01-04T12:34:56Z`)

## Exemplo: Esclarecer a Intenção do Usuário

Usuário: "Me lembre de verificar o deploy em 2 horas"

**Pergunte:** "Você quer isso no Apple Lembretes (sincroniza com seu telefone) ou como um alerta do OpenCraft (eu te mando uma mensagem aqui)?"

- Apple Lembretes → use esta skill
- Alerta do OpenCraft → use a ferramenta `cron` com systemEvent
