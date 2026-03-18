---
name: weather
description: "Obter clima atual e previsões via wttr.in ou Open-Meteo. Use quando: o usuário perguntar sobre clima, temperatura ou previsões para qualquer local. NÃO use para: dados históricos de clima, alertas de tempo severo ou análise meteorológica detalhada. Nenhuma chave de API necessária."
homepage: https://wttr.in/:help
metadata: { "opencraft": { "emoji": "☔", "requires": { "bins": ["curl"] } } }
---

# Skill de Clima

Obtenha condições climáticas atuais e previsões.

## Quando Usar

✅ **USE esta skill quando:**

- "Como está o tempo?"
- "Vai chover hoje/amanhã?"
- "Temperatura em [cidade]"
- "Previsão do tempo para a semana"
- Verificações de clima para planejamento de viagens

## Quando NÃO Usar

❌ **NÃO use esta skill quando:**

- Dados históricos de clima → use arquivos/APIs de clima
- Análise climática ou tendências → use fontes de dados especializadas
- Dados de microclima hiper-local → use sensores locais
- Alertas de tempo severo → verifique fontes oficiais do NWS
- Clima para aviação/marítimo → use serviços especializados (METAR, etc.)

## Localização

Sempre inclua uma cidade, região ou código de aeroporto nas consultas de clima.

## Comandos

### Clima Atual

```bash
# Resumo em uma linha
curl "wttr.in/London?format=3"

# Condições atuais detalhadas
curl "wttr.in/London?0"

# Cidade específica
curl "wttr.in/New+York?format=3"
```

### Previsões

```bash
# Previsão de 3 dias
curl "wttr.in/London"

# Previsão semanal
curl "wttr.in/London?format=v2"

# Dia específico (0=hoje, 1=amanhã, 2=depois de amanhã)
curl "wttr.in/London?1"
```

### Opções de Formato

```bash
# Uma linha
curl "wttr.in/London?format=%l:+%c+%t+%w"

# Saída JSON
curl "wttr.in/London?format=j1"

# Imagem PNG
curl "wttr.in/London.png"
```

### Códigos de Formato

- `%c` — Emoji de condição climática
- `%t` — Temperatura
- `%f` — "Sensação térmica"
- `%w` — Vento
- `%h` — Umidade
- `%p` — Precipitação
- `%l` — Localização

## Respostas Rápidas

**"Como está o tempo?"**

```bash
curl -s "wttr.in/London?format=%l:+%c+%t+(feels+like+%f),+%w+wind,+%h+humidity"
```

**"Vai chover?"**

```bash
curl -s "wttr.in/London?format=%l:+%c+%p"
```

**"Previsão do fim de semana"**

```bash
curl "wttr.in/London?format=v2"
```

## Observações

- Nenhuma chave de API necessária (usa wttr.in)
- Com limite de requisições; não faça spam de pedidos
- Funciona para a maioria das cidades do mundo
- Suporta códigos de aeroporto: `curl wttr.in/ORD`
