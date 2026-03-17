---
title: Verificação Formal (Modelos de Segurança)
summary: Modelos de segurança verificados por máquina para os caminhos de maior risco do OpenCraft.
read_when:
  - Revisando garantias ou limites dos modelos formais de segurança
  - Reproduzindo ou atualizando verificações de modelos de segurança TLA+/TLC
permalink: /security/formal-verification/
---

# Verificação Formal (Modelos de Segurança)

Esta página acompanha os **modelos formais de segurança** do OpenCraft (TLA+/TLC hoje; mais conforme necessário).

> Nota: alguns links antigos podem se referir ao nome anterior do projeto.

**Objetivo (norte):** fornecer um argumento verificado por máquina de que o OpenCraft aplica sua
política de segurança pretendida (autorização, isolamento de sessão, controle de ferramentas e
segurança contra configuração incorreta), sob suposições explícitas.

**O que isso é (hoje):** um **conjunto de regressão de segurança** executável e orientado por atacante:

- Cada afirmação possui uma verificação de modelo executável sobre um espaço de estados finito.
- Muitas afirmações possuem um **modelo negativo** pareado que produz um rastro de contraexemplo para uma classe realista de bugs.

**O que isso não é (ainda):** uma prova de que "o OpenCraft é seguro em todos os aspectos" ou que a implementação completa em TypeScript está correta.

## Onde os modelos estão

Os modelos são mantidos em um repositório separado: [vignesh07/opencraft-formal-models](https://github.com/vignesh07/opencraft-formal-models).

## Ressalvas importantes

- Estes são **modelos**, não a implementação completa em TypeScript. É possível haver divergência entre o modelo e o código.
- Os resultados são limitados pelo espaço de estados explorado pelo TLC; "verde" não implica segurança além das suposições e limites modelados.
- Algumas afirmações dependem de suposições ambientais explícitas (por exemplo, implantação correta, entradas de configuração corretas).

## Reproduzindo resultados

Hoje, os resultados são reproduzidos clonando o repositório de modelos localmente e executando o TLC (veja abaixo). Uma iteração futura poderia oferecer:

- Modelos executados em CI com artefatos públicos (rastros de contraexemplo, logs de execução)
- um workflow hospedado de "executar este modelo" para verificações pequenas e limitadas

Primeiros passos:

```bash
git clone https://github.com/vignesh07/opencraft-formal-models
cd opencraft-formal-models

# Java 11+ necessário (TLC roda na JVM).
# O repositório inclui um `tla2tools.jar` fixado (ferramentas TLA+) e fornece `bin/tlc` + alvos Make.

make <target>
```

### Exposição do Gateway e configuração de Gateway aberto incorreta

**Afirmação:** vincular além do loopback sem autenticação pode tornar o comprometimento remoto possível / aumenta a exposição; Token/senha bloqueia atacantes não autorizados (conforme as suposições do modelo).

- Execuções verdes:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Vermelhas (esperado):
  - `make gateway-exposure-v2-negative`

Veja também: `docs/gateway-exposure-matrix.md` no repositório de modelos.

### Pipeline Nodes.run (capacidade de maior risco)

**Afirmação:** `nodes.run` requer (a) lista de permissão de comandos de nó mais comandos declarados e (b) aprovação ao vivo quando configurado; aprovações são tokenizadas para prevenir replay (no modelo).

- Execuções verdes:
  - `make nodes-pipeline`
  - `make approvals-token`
- Vermelhas (esperado):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Armazenamento de pareamento (controle de DM)

**Afirmação:** solicitações de pareamento respeitam TTL e limites de solicitações pendentes.

- Execuções verdes:
  - `make pairing`
  - `make pairing-cap`
- Vermelhas (esperado):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Controle de entrada (menções + bypass de comando de controle)

**Afirmação:** em contextos de grupo que exigem menção, um "comando de controle" não autorizado não pode contornar o controle de menções.

- Verde:
  - `make ingress-gating`
- Vermelho (esperado):
  - `make ingress-gating-negative`

### Isolamento de roteamento/chave de sessão

**Afirmação:** DMs de pares distintos não se fundem na mesma sessão, a menos que explicitamente vinculados/configurados.

- Verde:
  - `make routing-isolation`
- Vermelho (esperado):
  - `make routing-isolation-negative`

## v1++: modelos limitados adicionais (concorrência, retentativas, correção de rastro)

Estes são modelos de acompanhamento que aumentam a fidelidade em torno de modos de falha do mundo real (atualizações não atômicas, retentativas e fan-out de mensagens).

### Concorrência / idempotência do armazenamento de pareamento

**Afirmação:** um armazenamento de pareamento deve garantir `MaxPending` e idempotência mesmo sob intercalações (ou seja, "verificar-então-escrever" deve ser atômico / bloqueado; refresh não deve criar duplicatas).

O que significa:

- Sob solicitações concorrentes, você não pode exceder `MaxPending` para um canal.
- Solicitações/refreshes repetidos para o mesmo `(channel, sender)` não devem criar linhas pendentes duplicadas.

- Execuções verdes:
  - `make pairing-race` (verificação de limite atômica/bloqueada)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Vermelhas (esperado):
  - `make pairing-race-negative` (corrida de limite begin/commit não atômica)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlação de rastro de entrada / idempotência

**Afirmação:** a ingestão deve preservar a correlação de rastro através do fan-out e ser idempotente sob retentativas do provedor.

O que significa:

- Quando um evento externo se torna múltiplas mensagens internas, cada parte mantém a mesma identidade de rastro/evento.
- Retentativas não resultam em processamento duplo.
- Se os IDs de evento do provedor estiverem ausentes, a deduplicação recorre a uma chave segura (por exemplo, ID de rastro) para evitar descartar eventos distintos.

- Verde:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Vermelho (esperado):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedência de dmScope de roteamento + identityLinks

**Afirmação:** o roteamento deve manter sessões de DM isoladas por padrão e só fundir sessões quando explicitamente configurado (precedência de canal + links de identidade).

O que significa:

- Substituições de dmScope específicas do canal devem prevalecer sobre os padrões globais.
- identityLinks devem fundir apenas dentro de grupos vinculados explícitos, não entre pares não relacionados.

- Verde:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Vermelho (esperado):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
