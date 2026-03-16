---
title: Verificação Formal (Modelos de Segurança)
summary: Modelos de segurança verificados por máquina para os caminhos de maior risco do OpenCraft.
read_when:
  - Revisando garantias ou limites de modelos de segurança formal
  - Reproduzindo ou atualizando verificações de modelo de segurança TLA+/TLC
permalink: /security/formal-verification/
---

# Verificação Formal (Modelos de Segurança)

Esta página acompanha os **modelos de segurança formais** do OpenCraft (TLA+/TLC atualmente; mais conforme necessário).

> Nota: alguns links mais antigos podem se referir ao nome anterior do projeto.

**Objetivo (norte verdadeiro):** fornecer um argumento verificado por máquina de que o OpenCraft aplica sua política de segurança pretendida (autorização, isolamento de sessão, controle de ferramentas e segurança contra má configuração), sob premissas explícitas.

**O que isso é (hoje):** um **conjunto de regressão de segurança** executável e orientado por atacante:

- Cada afirmação tem uma verificação de modelo executável sobre um espaço de estados finito.
- Muitas afirmações têm um **modelo negativo** pareado que produz um trace de contraexemplo para uma classe de bug realista.

**O que ainda não é:** uma prova de que "o OpenCraft é seguro em todos os aspectos" ou que a implementação TypeScript completa está correta.

## Onde ficam os modelos

Os modelos são mantidos em um repositório separado: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Ressalvas importantes

- Estes são **modelos**, não a implementação TypeScript completa. Divergência entre modelo e código é possível.
- Os resultados são limitados pelo espaço de estados explorado pelo TLC; "verde" não implica segurança além das premissas e limites modelados.
- Algumas afirmações dependem de premissas ambientais explícitas (ex.: implantação correta, entradas de configuração corretas).

## Reproduzindo resultados

Atualmente, os resultados são reproduzidos clonando o repositório de modelos localmente e executando o TLC (veja abaixo). Uma iteração futura poderia oferecer:

- Modelos executados em CI com artefatos públicos (traces de contraexemplo, logs de execução)
- um fluxo de trabalho hospedado "execute este modelo" para verificações pequenas e limitadas

Primeiros passos:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ necessário (TLC roda na JVM).
# O repositório inclui um `tla2tools.jar` fixado (ferramentas TLA+) e fornece `bin/tlc` + alvos Make.

make <alvo>
```

### Exposição do gateway e má configuração de gateway aberto

**Afirmação:** vincular além do loopback sem autenticação pode tornar o comprometimento remoto possível / aumenta a exposição; token/senha bloqueia atacantes não autenticados (conforme as premissas do modelo).

- Execuções verdes:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Vermelhas (esperadas):
  - `make gateway-exposure-v2-negative`

Veja também: `docs/gateway-exposure-matrix.md` no repositório de modelos.

### Pipeline Nodes.run (capacidade de maior risco)

**Afirmação:** `nodes.run` requer (a) lista de permissões de comandos de node mais comandos declarados e (b) aprovação em tempo real quando configurado; aprovações são tokenizadas para evitar replay (no modelo).

- Execuções verdes:
  - `make nodes-pipeline`
  - `make approvals-token`
- Vermelhas (esperadas):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Armazenamento de pareamento (controle de DM)

**Afirmação:** solicitações de pareamento respeitam TTL e limites de solicitações pendentes.

- Execuções verdes:
  - `make pairing`
  - `make pairing-cap`
- Vermelhas (esperadas):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Controle de entrada (menções + bypass de comando de controle)

**Afirmação:** em contextos de grupo que exigem menção, um "comando de controle" não autorizado não pode contornar o controle de menção.

- Verdes:
  - `make ingress-gating`
- Vermelhas (esperadas):
  - `make ingress-gating-negative`

### Isolamento de roteamento/chave de sessão

**Afirmação:** DMs de pares distintos não colapsam na mesma sessão, a menos que explicitamente vinculados/configurados.

- Verdes:
  - `make routing-isolation`
- Vermelhas (esperadas):
  - `make routing-isolation-negative`

## v1++: modelos limitados adicionais (concorrência, retries, correção de trace)

Estes são modelos de acompanhamento que aumentam a fidelidade em torno de modos de falha do mundo real (atualizações não atômicas, retries e fan-out de mensagens).

### Concorrência / idempotência do armazenamento de pareamento

**Afirmação:** um armazenamento de pareamento deve aplicar `MaxPending` e idempotência mesmo sob intercalações (ou seja, "verificar-depois-escrever" deve ser atômico/bloqueado; atualização não deve criar duplicatas).

O que significa:

- Sob solicitações concorrentes, você não pode exceder `MaxPending` para um canal.
- Solicitações/atualizações repetidas para o mesmo `(canal, remetente)` não devem criar linhas pendentes vivas duplicadas.

- Execuções verdes:
  - `make pairing-race` (verificação de limite atômico/bloqueado)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Vermelhas (esperadas):
  - `make pairing-race-negative` (corrida de início/commit não atômico no limite)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlação de trace de entrada / idempotência

**Afirmação:** a ingestão deve preservar a correlação de trace entre fan-out e ser idempotente sob retries do provedor.

O que significa:

- Quando um evento externo se torna múltiplas mensagens internas, cada parte mantém a mesma identidade de trace/evento.
- Retries não resultam em processamento duplo.
- Se os IDs de evento do provedor estiverem ausentes, a deduplicação recorre a uma chave segura (ex.: ID de trace) para evitar descartar eventos distintos.

- Verdes:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Vermelhas (esperadas):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedência de dmScope de roteamento + identityLinks

**Afirmação:** o roteamento deve manter sessões de DM isoladas por padrão e apenas colapsar sessões quando explicitamente configurado (precedência de canal + links de identidade).

O que significa:

- Substituições de dmScope específicas de canal devem prevalecer sobre padrões globais.
- identityLinks deve colapsar apenas dentro de grupos vinculados explicitamente, não entre pares não relacionados.

- Verdes:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Vermelhas (esperadas):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
