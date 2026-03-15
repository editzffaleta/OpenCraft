---
name: notion
description: API do Notion para criar e gerenciar páginas, bancos de dados e blocos.
homepage: https://developers.notion.com
metadata:
  {
    "opencraft":
      { "emoji": "📝", "requires": { "env": ["NOTION_API_KEY"] }, "primaryEnv": "NOTION_API_KEY" },
  }
---

# notion

Use a API do Notion para criar/ler/atualizar páginas, fontes de dados (bancos de dados) e blocos.

## Configuração

1. Crie uma integração em https://notion.so/my-integrations
2. Copie a chave de API (começa com `ntn_` ou `secret_`)
3. Armazene-a:

```bash
mkdir -p ~/.config/notion
echo "ntn_sua_chave_aqui" > ~/.config/notion/api_key
```

4. Compartilhe as páginas/bancos de dados alvo com sua integração (clique em "..." → "Conectar a" → nome da sua integração)

## Fundamentos da API

Todas as requisições precisam de:

```bash
NOTION_KEY=$(cat ~/.config/notion/api_key)
curl -X GET "https://api.notion.com/v1/..." \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json"
```

> **Nota:** O header `Notion-Version` é obrigatório. Esta habilidade usa `2025-09-03` (mais recente). Nesta versão, bancos de dados são chamados de "fontes de dados" na API.

## Operações Comuns

**Pesquisar páginas e fontes de dados:**

```bash
curl -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"query": "título da página"}'
```

**Obter página:**

```bash
curl "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03"
```

**Obter conteúdo da página (blocos):**

```bash
curl "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03"
```

**Criar página em uma fonte de dados:**

```bash
curl -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "xxx"},
    "properties": {
      "Name": {"title": [{"text": {"content": "Novo Item"}}]},
      "Status": {"select": {"name": "A fazer"}}
    }
  }'
```

**Consultar uma fonte de dados (banco de dados):**

```bash
curl -X POST "https://api.notion.com/v1/data_sources/{data_source_id}/query" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {"property": "Status", "select": {"equals": "Ativo"}},
    "sorts": [{"property": "Data", "direction": "descending"}]
  }'
```

**Criar uma fonte de dados (banco de dados):**

```bash
curl -X POST "https://api.notion.com/v1/data_sources" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"page_id": "xxx"},
    "title": [{"text": {"content": "Meu Banco de Dados"}}],
    "properties": {
      "Name": {"title": {}},
      "Status": {"select": {"options": [{"name": "A fazer"}, {"name": "Concluído"}]}},
      "Date": {"date": {}}
    }
  }'
```

**Atualizar propriedades da página:**

```bash
curl -X PATCH "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"select": {"name": "Concluído"}}}}'
```

**Adicionar blocos à página:**

```bash
curl -X PATCH "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "children": [
      {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": "Olá"}}]}}
    ]
  }'
```

## Tipos de Propriedade

Formatos comuns de propriedade para itens de banco de dados:

- **Título:** `{"title": [{"text": {"content": "..."}}]}`
- **Texto rico:** `{"rich_text": [{"text": {"content": "..."}}]}`
- **Seleção:** `{"select": {"name": "Opção"}}`
- **Multi-seleção:** `{"multi_select": [{"name": "A"}, {"name": "B"}]}`
- **Data:** `{"date": {"start": "2024-01-15", "end": "2024-01-16"}}`
- **Checkbox:** `{"checkbox": true}`
- **Número:** `{"number": 42}`
- **URL:** `{"url": "https://..."}`
- **Email:** `{"email": "a@b.com"}`
- **Relação:** `{"relation": [{"id": "page_id"}]}`

## Diferenças Principais na versão 2025-09-03

- **Bancos de dados → Fontes de dados:** Use endpoints `/data_sources/` para consultas e recuperação
- **Dois IDs:** Cada banco de dados agora tem tanto `database_id` quanto `data_source_id`
  - Use `database_id` ao criar páginas (`parent: {"database_id": "..."}`)
  - Use `data_source_id` ao consultar (`POST /v1/data_sources/{id}/query`)
- **Resultados de pesquisa:** Bancos de dados retornam como `"object": "data_source"` com seu `data_source_id`
- **Pai nas respostas:** Páginas mostram `parent.data_source_id` junto com `parent.database_id`
- **Encontrar o data_source_id:** Pesquise o banco de dados, ou chame `GET /v1/data_sources/{data_source_id}`

## Notas

- IDs de página/banco de dados são UUIDs (com ou sem traços)
- A API não pode definir filtros de visualização de banco de dados — isso é apenas pela UI
- Limite de taxa: ~3 requisições/segundo em média, com respostas `429 rate_limited` usando `Retry-After`
- Filhos de bloco em append: até 100 filhos por requisição, até dois níveis de aninhamento num único append
- Limites de tamanho de payload: até 1000 elementos de bloco e 500KB no total
- Use `is_inline: true` ao criar fontes de dados para incorporá-las em páginas
