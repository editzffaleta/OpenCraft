# Guia de Estilo de UI Android do OpenCraft

Escopo: toda a UI Android nativa em `apps/android` (Jetpack Compose).
Objetivo: um sistema visual coerente em onboarding, configurações e telas futuras.

## 1. Direção de Design

- Superfícies limpas e discretas.
- Legibilidade forte em primeiro lugar.
- Uma ação primária clara por estado de tela.
- Divulgação progressiva para controles avançados.
- Fluxos determinísticos: valide cedo, falhe claramente.

## 2. Baseline de Estilo

O fluxo de onboarding define o baseline visual atual.
Novas telas devem corresponder a essa linguagem, a menos que haja uma razão de produto forte para não o fazer.

Características do baseline:

- Fundo neutro claro com profundidade sutil.
- Destaque azul claro para estados ativos/primários.
- Hierarquia de bordas forte para estrutura.
- Tipografia medium/semibold (sem texto fino).
- Layout de divisores e espaçamento em vez de agrupamentos pesados de cards.

## 3. Tokens Principais

Use estes como tokens de design compartilhados para nova UI Compose.

- Gradiente de fundo: `#FFFFFF`, `#F7F8FA`, `#EFF1F5`
- Superfície: `#F6F7FA`
- Borda: `#E5E7EC`
- Borda forte: `#D6DAE2`
- Texto primário: `#17181C`
- Texto secundário: `#4D5563`
- Texto terciário: `#8A92A2`
- Destaque primário: `#1D5DD8`
- Destaque suave: `#ECF3FF`
- Sucesso: `#2F8C5A`
- Aviso: `#C8841A`

Regra: não introduza cores aleatórias por tela quando um token existente se encaixar.

## 4. Tipografia

Família de tipo principal: Manrope (`400/500/600/700`).

Escala recomendada:

- Display: `34sp / 40sp`, bold
- Título de seção: `24sp / 30sp`, semibold
- Headline/ação: `16sp / 22sp`, semibold
- Corpo: `15sp / 22sp`, medium
- Callout/helper: `14sp / 20sp`, medium
- Caption 1: `12sp / 16sp`, medium
- Caption 2: `11sp / 14sp`, medium

Use monospace apenas para comandos, códigos de configuração, valores semelhantes a endpoints.
Regra rígida: evite pesos ultra-finos em fundos claros.

## 5. Layout e Espaçamento

- Respeite os insets de desenho seguro.
- Mantenha a hierarquia de conteúdo principalmente via espaçamento + divisores.
- Prefira ritmo vertical de `8/10/12/14/20dp`.
- Use ações fixadas na parte inferior para fluxos de múltiplos passos ou de alta importância.
- Evite aninhamento desnecessário de containers.

## 6. Botões e Ações

- Ação primária: botão de destaque preenchido, visualmente dominante.
- Ação secundária: menor ênfase (botão outlined/text/surface).
- Botões de ícone apenas devem permanecer legíveis e ter alvo >= 44dp.
- Botões de voltar em linhas de ação usam formato quadrado arredondado, não circular por padrão.

## 7. Inputs e Formulários

- Sempre mostre rótulo explícito ou título de contexto claro.
- Mantenha o texto auxiliar curto e acionável.
- Valide antes de avançar etapas.
- Prefira erros inline imediatos em vez de estados de falha ocultos.
- Mantenha campos avançados opcionais explícitos (`Manual`, `Avançado`, etc.).

## 8. Progresso e Fluxos de Múltiplos Passos

- Use contagem de etapas clara (`Passo X de N`).
- Use trilha/indicador de progresso rotulado quando as etapas forem discretas.
- Mantenha a navegação previsível: o comportamento de voltar/avançar nunca deve surpreender.

## 9. Acessibilidade

- Alvo de toque mínimo prático: `44dp`.
- Não dependa apenas de cor para status.
- Preserve alto contraste para todos os níveis de texto.
- Adicione `contentDescription` significativo para controles de ícone apenas.

## 10. Regras de Arquitetura

- Estado durável de UI em `MainViewModel`.
- Composables: estado entra, callbacks saem.
- Sem lógica de negócio/rede em composables.
- Mantenha efeitos colaterais explícitos (`LaunchedEffect`, APIs de resultado de atividade).

## 11. Fonte de Verdade

- `app/src/main/java/ai/opencraft/android/ui/OpenCraftTheme.kt`
- `app/src/main/java/ai/opencraft/android/ui/OnboardingFlow.kt`
- `app/src/main/java/ai/opencraft/android/ui/RootScreen.kt`
- `app/src/main/java/ai/opencraft/android/ui/SettingsSheet.kt`
- `app/src/main/java/ai/opencraft/android/MainViewModel.kt`

Se o estilo e a implementação divergirem, atualize os dois na mesma mudança.
