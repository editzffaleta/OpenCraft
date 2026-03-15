---
name: apple-reminders
description: Gerencia o Apple Reminders via CLI remindctl (listar, adicionar, editar, concluir, deletar). Suporta listas, filtros de data e saída JSON/simples.
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

Use `remindctl` para gerenciar o Apple Reminders diretamente do terminal.

## Quando Usar

✅ **USE esta habilidade quando:**

- O usuário mencionar explicitamente "lembrete" ou "app Lembretes"
- Criar to-dos pessoais com datas de vencimento que sincronizam com o iOS
- Gerenciar listas do Apple Reminders
- O usuário quiser que as tarefas apareçam no app Lembretes do iPhone/iPad

## Quando NÃO Usar

❌ **NÃO use esta habilidade quando:**

- Agendar tarefas ou alertas do OpenCraft → use a ferramenta `cron` com systemEvent
- Eventos de calendário ou compromissos → use o Apple Calendar
- Gerenciamento de tarefas de projeto/trabalho → use Notion, GitHub Issues ou fila de tarefas
- Notificações únicas → use a ferramenta `cron` para alertas temporizados
- O usuário diz "me lembre" mas quer um alerta do OpenCraft → esclareça primeiro

## Configuração

- Instalar: `brew install steipete/tap/remindctl`
- Apenas macOS; conceda permissão de Lembretes quando solicitado
- Verificar status: `remindctl status`
- Solicitar acesso: `remindctl authorize`

## Comandos Comuns

### Visualizar Lembretes

```bash
remindctl                    # Lembretes de hoje
remindctl today              # Hoje
remindctl tomorrow           # Amanhã
remindctl week               # Esta semana
remindctl overdue            # Vencidos
remindctl all                # Tudo
remindctl 2026-01-04         # Data específica
```

### Gerenciar Listas

```bash
remindctl list               # Listar todas as listas
remindctl list Trabalho      # Mostrar lista específica
remindctl list Projetos --create    # Criar lista
remindctl list Trabalho --delete    # Deletar lista
```

### Criar Lembretes

```bash
remindctl add "Comprar leite"
remindctl add --title "Ligar para a mãe" --list Pessoal --due tomorrow
remindctl add --title "Preparar reunião" --due "2026-02-15 09:00"
```

### Concluir/Deletar

```bash
remindctl complete 1 2 3     # Concluir por ID
remindctl delete 4A83 --force  # Deletar por ID
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

## Exemplo: Esclarecendo a Intenção do Usuário

Usuário: "Me lembre de verificar o deploy em 2 horas"

**Pergunte:** "Você quer isso no Apple Reminders (sincroniza com seu celular) ou como um alerta do OpenCraft (te aviso aqui)?"

- Apple Reminders → use esta habilidade
- Alerta do OpenCraft → use a ferramenta `cron` com systemEvent
