---
name: weather
description: "Obtém clima atual e previsões via wttr.in ou Open-Meteo. Use quando: o usuário perguntar sobre clima, temperatura ou previsões para qualquer localidade. NÃO use para: dados históricos de clima, alertas de tempo severo ou análise meteorológica detalhada. Não precisa de chave de API."
homepage: https://wttr.in/:help
metadata: { "opencraft": { "emoji": "☔", "requires": { "bins": ["curl"] } } }
---

# Habilidade de Clima

Obtém condições climáticas atuais e previsões.

## Quando Usar

✅ **USE esta habilidade quando:**

- "Como está o tempo?"
- "Vai chover hoje/amanhã?"
- "Temperatura em [cidade]"
- "Previsão do tempo para a semana"
- Verificações de clima para viagens

## Quando NÃO Usar

❌ **NÃO use esta habilidade quando:**

- Dados históricos de clima → use arquivos/APIs de clima
- Análise climática ou tendências → use fontes de dados especializadas
- Dados de microclima hiper-local → use sensores locais
- Alertas de tempo severo → verifique fontes oficiais (INMET, etc.)
- Clima para aviação/marítimo → use serviços especializados (METAR, etc.)

## Localização

Sempre inclua uma cidade, região ou código de aeroporto nas consultas de clima.

## Comandos

### Clima Atual

```bash
# Resumo em uma linha
curl "wttr.in/SaoPaulo?format=3"

# Condições atuais detalhadas
curl "wttr.in/SaoPaulo?0"

# Cidade específica
curl "wttr.in/Rio+de+Janeiro?format=3"
```

### Previsões

```bash
# Previsão de 3 dias
curl "wttr.in/SaoPaulo"

# Previsão semanal
curl "wttr.in/SaoPaulo?format=v2"

# Dia específico (0=hoje, 1=amanhã, 2=depois de amanhã)
curl "wttr.in/SaoPaulo?1"
```

### Opções de Formato

```bash
# Uma linha
curl "wttr.in/SaoPaulo?format=%l:+%c+%t+%w"

# Saída JSON
curl "wttr.in/SaoPaulo?format=j1"

# Imagem PNG
curl "wttr.in/SaoPaulo.png"
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
curl -s "wttr.in/SaoPaulo?format=%l:+%c+%t+(sensacao+%f),+%w+vento,+%h+umidade"
```

**"Vai chover?"**

```bash
curl -s "wttr.in/SaoPaulo?format=%l:+%c+%p"
```

**"Previsão do fim de semana"**

```bash
curl "wttr.in/SaoPaulo?format=v2"
```

## Notas

- Não precisa de chave de API (usa wttr.in)
- Com limite de requisições; não faça spam
- Funciona para a maioria das cidades do mundo
- Suporta códigos de aeroporto: `curl wttr.in/GRU`
