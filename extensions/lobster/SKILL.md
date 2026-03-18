# Lobster

O Lobster executa fluxos de trabalho de múltiplas etapas com pontos de verificação de aprovação. Use quando:

- O usuário quiser uma automação repetível (triagem, monitoramento, sincronização)
- Ações precisarem de aprovação humana antes de executar (enviar, publicar, excluir)
- Múltiplas chamadas de ferramentas devem ser executadas como uma operação determinística

## Quando usar o Lobster

| Intenção do usuário                                                   | Usar Lobster?                                            |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| "Faça triagem do meu email"                                           | Sim — múltiplas etapas, pode enviar respostas            |
| "Envie uma mensagem"                                                  | Não — ação única, use a ferramenta message diretamente   |
| "Verifique meu email toda manhã e pergunte antes de responder"        | Sim — fluxo agendado com aprovação                       |
| "Como está o tempo?"                                                  | Não — consulta simples                                   |
| "Monitore este PR e me notifique sobre mudanças"                      | Sim — com estado, recorrente                             |

## Uso básico

### Executar um pipeline

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' --max 20 | email.triage"
}
```

Retorna resultado estruturado:

```json
{
  "protocolVersion": 1,
  "ok": true,
  "status": "ok",
  "output": [{ "summary": {...}, "items": [...] }],
  "requiresApproval": null
}
```

### Gerenciar aprovação

Se o fluxo de trabalho precisar de aprovação:

```json
{
  "status": "needs_approval",
  "output": [],
  "requiresApproval": {
    "prompt": "Send 3 draft replies?",
    "items": [...],
    "resumeToken": "..."
  }
}
```

Apresente o prompt ao usuário. Se aprovado:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

## Exemplos de fluxos de trabalho

### Triagem de email

```
gog.gmail.search --query 'newer_than:1d' --max 20 | email.triage
```

Busca emails recentes e classifica em categorias (needs_reply, needs_action, fyi).

### Triagem de email com portão de aprovação

```
gog.gmail.search --query 'newer_than:1d' | email.triage | approve --prompt 'Process these?'
```

Igual ao anterior, mas aguarda aprovação antes de retornar.

## Comportamentos principais

- **Determinístico**: Mesma entrada → mesma saída (sem variação de LLM na execução do pipeline)
- **Portões de aprovação**: O comando `approve` interrompe a execução e retorna um token
- **Retomável**: Use a ação `resume` com o token para continuar
- **Saída estruturada**: Sempre retorna envelope JSON com `protocolVersion`

## Não use o Lobster para

- Solicitações simples de ação única (use a ferramenta diretamente)
- Consultas que precisam de interpretação de LLM no meio do fluxo
- Tarefas pontuais que não serão repetidas
