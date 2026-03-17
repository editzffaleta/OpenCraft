---
title: "Detecção de loop de ferramentas"
description: "Configurar proteções opcionais para prevenir loops repetitivos ou travados de chamadas de ferramenta"
summary: "Como habilitar e ajustar proteções que detectam loops repetitivos de chamadas de ferramenta"
read_when:
  - Um usuário reporta agentes travados repetindo chamadas de ferramenta
  - Você precisa ajustar a proteção contra chamadas repetitivas
  - Você está editando políticas de ferramentas/runtime de agentes
---

# Detecção de loop de ferramentas

O OpenCraft pode impedir que agentes fiquem presos em padrões repetidos de chamadas de ferramenta.
A proteção está **desabilitada por padrão**.

Habilite apenas onde necessário, porque pode bloquear chamadas repetidas legítimas com configurações rigorosas.

## Por que isso existe

- Detectar sequências repetitivas que não fazem progresso.
- Detectar loops de alta frequência sem resultado (mesma ferramenta, mesmas entradas, erros repetidos).
- Detectar padrões específicos de chamadas repetidas para ferramentas de polling conhecidas.

## Bloco de configuração

Padrões globais:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Substituição por agente (opcional):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Comportamento dos campos

- `enabled`: Interruptor principal. `false` significa que nenhuma detecção de loop é realizada.
- `historySize`: número de chamadas de ferramenta recentes mantidas para análise.
- `warningThreshold`: limiar antes de classificar um padrão como apenas aviso.
- `criticalThreshold`: limiar para bloquear padrões de loop repetitivos.
- `globalCircuitBreakerThreshold`: limiar global de disjuntor sem progresso.
- `detectors.genericRepeat`: detecta padrões repetidos de mesma ferramenta + mesmos parâmetros.
- `detectors.knownPollNoProgress`: detecta padrões conhecidos de polling sem mudança de estado.
- `detectors.pingPong`: detecta padrões alternados de ping-pong.

## Configuração recomendada

- Comece com `enabled: true`, padrões inalterados.
- Mantenha os limiares ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se falsos positivos ocorrerem:
  - aumente `warningThreshold` e/ou `criticalThreshold`
  - (opcionalmente) aumente `globalCircuitBreakerThreshold`
  - desabilite apenas o detector causando problemas
  - reduza `historySize` para contexto histórico menos rigoroso

## Logs e comportamento esperado

Quando um loop é detectado, o OpenCraft reporta um evento de loop e bloqueia ou atenua o próximo ciclo de ferramenta dependendo da gravidade.
Isso protege os usuários de gastos descontrolados de tokens e travamentos enquanto preserva o acesso normal a ferramentas.

- Prefira aviso e supressão temporária primeiro.
- Escale apenas quando evidências repetidas se acumularem.

## Notas

- `tools.loopDetection` é mesclado com substituições no nível do agente.
- Config por agente substitui completamente ou estende valores globais.
- Se nenhuma config existir, as proteções permanecem desligadas.
