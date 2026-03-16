---
title: "Detecção de loop de tools"
description: "Configure guardrails opcionais para prevenir loops repetitivos ou parados de chamadas de tool"
summary: "Como habilitar e ajustar guardrails que detectam loops repetitivos de chamadas de tool"
read_when:
  - Um usuário reporta agentes travados repetindo chamadas de tool
  - Você precisa ajustar a proteção contra chamadas repetitivas
  - Você está editando políticas de tool/runtime de agentes
---

# Detecção de loop de tools

O OpenCraft pode evitar que agentes fiquem presos em padrões repetitivos de chamadas de tool.
O guard está **desativado por padrão**.

Ative-o apenas onde necessário, pois pode bloquear chamadas legítimas repetidas com configurações estritas.

## Por que isso existe

- Detectar sequências repetitivas que não fazem progresso.
- Detectar loops de alta frequência sem resultado (mesma tool, mesmas entradas, erros repetidos).
- Detectar padrões específicos de chamadas repetidas para tools de polling conhecidas.

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

Override por agente (opcional):

```json5
{
  agents: {
    list: [
      {
        id: "executor-seguro",
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

- `enabled`: Chave mestra. `false` significa que nenhuma detecção de loop é realizada.
- `historySize`: número de chamadas de tool recentes mantidas para análise.
- `warningThreshold`: limite antes de classificar um padrão apenas como aviso.
- `criticalThreshold`: limite para bloquear padrões de loop repetitivos.
- `globalCircuitBreakerThreshold`: limite global do disjuntor sem progresso.
- `detectors.genericRepeat`: detecta padrões repetidos de mesma tool + mesmos parâmetros.
- `detectors.knownPollNoProgress`: detecta padrões semelhantes a polling conhecidos sem mudança de estado.
- `detectors.pingPong`: detecta padrões alternados ping-pong.

## Configuração recomendada

- Comece com `enabled: true`, padrões inalterados.
- Mantenha os limites na ordem `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se ocorrerem falsos positivos:
  - aumente `warningThreshold` e/ou `criticalThreshold`
  - (opcionalmente) aumente `globalCircuitBreakerThreshold`
  - desative apenas o detector que está causando problemas
  - reduza `historySize` para um contexto histórico menos estrito

## Logs e comportamento esperado

Quando um loop é detectado, o OpenCraft reporta um evento de loop e bloqueia ou amorte o próximo ciclo de tool dependendo da gravidade.
Isso protege os usuários de gastos descontrolados de tokens e travamentos enquanto preserva o acesso normal às tools.

- Prefira aviso e supressão temporária primeiro.
- Escale apenas quando evidências repetidas se acumularem.

## Notas

- `tools.loopDetection` é mesclado com overrides em nível de agente.
- A configuração por agente sobrescreve ou estende completamente os valores globais.
- Se nenhuma configuração existe, os guardrails permanecem desativados.
