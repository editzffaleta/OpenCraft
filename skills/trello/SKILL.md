---
name: trello
description: Gerencie quadros, listas e cartões do Trello via API REST do Trello.
homepage: https://developer.atlassian.com/cloud/trello/rest/
metadata:
  {
    "opencraft":
      { "emoji": "📋", "requires": { "bins": ["jq"], "env": ["TRELLO_API_KEY", "TRELLO_TOKEN"] } },
  }
---

# Skill do Trello

Gerencie quadros, listas e cartões do Trello diretamente pelo OpenCraft.

## Configuração

1. Obtenha sua chave de API: https://trello.com/app-key
2. Gere um token (clique no link "Token" nessa página)
3. Defina as variáveis de ambiente:
   ```bash
   export TRELLO_API_KEY="your-api-key"
   export TRELLO_TOKEN="your-token"
   ```

## Uso

Todos os comandos usam curl para acessar a API REST do Trello.

### Listar quadros

```bash
curl -s "https://api.trello.com/1/members/me/boards?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN" | jq '.[] | {name, id}'
```

### Listar listas em um quadro

```bash
curl -s "https://api.trello.com/1/boards/{boardId}/lists?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN" | jq '.[] | {name, id}'
```

### Listar cartões em uma lista

```bash
curl -s "https://api.trello.com/1/lists/{listId}/cards?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN" | jq '.[] | {name, id, desc}'
```

### Criar um cartão

```bash
curl -s -X POST "https://api.trello.com/1/cards?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN" \
  -d "idList={listId}" \
  -d "name=Card Title" \
  -d "desc=Card description"
```

### Mover um cartão para outra lista

```bash
curl -s -X PUT "https://api.trello.com/1/cards/{cardId}?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN" \
  -d "idList={newListId}"
```

### Adicionar um comentário a um cartão

```bash
curl -s -X POST "https://api.trello.com/1/cards/{cardId}/actions/comments?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN" \
  -d "text=Your comment here"
```

### Arquivar um cartão

```bash
curl -s -X PUT "https://api.trello.com/1/cards/{cardId}?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN" \
  -d "closed=true"
```

## Observações

- IDs de Quadro/Lista/Cartão podem ser encontrados na URL do Trello ou via os comandos de listagem
- A chave de API e o token fornecem acesso total à sua conta do Trello - mantenha-os em segredo!
- Limites de requisição: 300 requisições por 10 segundos por chave de API; 100 requisições por 10 segundos por token; endpoints `/1/members` são limitados a 100 requisições por 900 segundos

## Exemplos

```bash
# Obter todos os quadros
curl -s "https://api.trello.com/1/members/me/boards?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN&fields=name,id" | jq

# Encontrar um quadro específico por nome
curl -s "https://api.trello.com/1/members/me/boards?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN" | jq '.[] | select(.name | contains("Work"))'

# Obter todos os cartões de um quadro
curl -s "https://api.trello.com/1/boards/{boardId}/cards?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN" | jq '.[] | {name, list: .idList}'
```
