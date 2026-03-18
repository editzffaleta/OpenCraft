# Ajuda do OpenProse

Carregue este arquivo quando um usuário invocar `prose help` ou perguntar sobre o OpenProse.

---

## Bem-vindo

OpenProse é uma linguagem de programação para sessões de IA. Você escreve programas estruturados que orquestram agentes de IA, e a VM (esta sessão) os executa criando subagentes reais.

**Uma sessão de IA de longa duração é um computador Turing-completo. OpenProse é uma linguagem de programação para ela.**

---

## O que você quer automatizar?

Quando um usuário invocar `prose help`, guie-o para definir o que deseja construir. Use a ferramenta AskUserQuestion:

```
Question: "O que você gostaria de automatizar com o OpenProse?"
Header: "Objetivo"
Options:
  1. "Executar um workflow" - "Tenho um arquivo .prose para executar"
  2. "Construir algo novo" - "Me ajude a criar um programa para uma tarefa específica"
  3. "Aprender a sintaxe" - "Mostre-me exemplos e explique como funciona"
  4. "Explorar possibilidades" - "O que o OpenProse pode fazer?"
```

**Após o usuário responder:**

- **Executar um workflow**: Peça o caminho do arquivo, depois carregue `prose.md` e execute
- **Construir algo novo**: Peça que descreva sua tarefa, depois ajude a escrever um programa .prose (carregue `guidance/patterns.md`)
- **Aprender a sintaxe**: Mostre exemplos de `examples/`, explique o modelo de VM
- **Explorar possibilidades**: Apresente exemplos principais como `37-the-forge.prose` ou `28-gas-town.prose`

---

## Comandos disponíveis

| Comando                | O que faz                             |
| ---------------------- | ------------------------------------- |
| `prose help`           | Esta ajuda - guia você ao que precisa |
| `prose run <file>`     | Executa um programa .prose            |
| `prose compile <file>` | Valida a sintaxe sem executar         |
| `prose update`         | Migra arquivos de workspace legados   |
| `prose examples`       | Navega e executa programas de exemplo |

---

## Início rápido

**Execute um exemplo:**

```
prose run examples/01-hello-world.prose
```

**Crie seu primeiro programa:**

```
prose help
→ Selecione "Construir algo novo"
→ Descreva o que você quer automatizar
```

---

## Perguntas frequentes

### Quais assistentes de IA são suportados?

Claude Code, OpenCode e Amp. Qualquer ambiente que execute um modelo suficientemente inteligente e suporte primitivas como subagentes é considerado "Prose Complete".

### Como isso é uma VM?

LLMs são simuladores — quando recebem uma descrição detalhada do sistema, eles não apenas a descrevem, eles a simulam. A especificação `prose.md` descreve uma VM com fidelidade suficiente para que lê-la induza a simulação. Mas a simulação com fidelidade suficiente é implementação: cada sessão cria um subagente real, as saídas são artefatos reais, o estado persiste no histórico da conversa ou em arquivos. A simulação é a execução.

### O que é "IoC inteligente"?

Contêineres IoC tradicionais (Spring, Guice) conectam dependências a partir de arquivos de configuração. O contêiner do OpenProse é uma sessão de IA que conecta agentes usando compreensão. Ele não apenas combina nomes — ele entende contexto, intenção e pode tomar decisões inteligentes sobre a execução.

### Isso parece Python.

A sintaxe é intencionalmente familiar — a estrutura baseada em indentação do Python é legível e autoexplicativa. Mas a semântica é completamente diferente. O OpenProse não tem funções, classes nem computação de propósito geral. Tem agentes, sessões e fluxo de controle. O princípio de design: estruturado mas autoevidente, interpretação não ambígua com documentação mínima.

### Por que não inglês simples?

O inglês já é um framework de agentes — não estamos substituindo-o, estamos estruturando-o. O inglês simples não distingue sequencial de paralelo, não especifica contagens de tentativas, não escopa variáveis. O OpenProse usa inglês exatamente onde a ambiguidade é uma funcionalidade (dentro de `**...**`), e estrutura em todo o resto. A sintaxe de quarta parede permite que você confie no julgamento da IA precisamente quando quiser.

### Por que não YAML?

Começamos com YAML. O problema: loops, condicionais e declarações de variáveis não são autoexplicativos em YAML — e quando você tenta torná-los autoexplicativos, fica verboso e feio. Mais fundamentalmente, o YAML otimiza para parseabilidade por máquina. O OpenProse otimiza para legibilidade inteligente por máquina. Ele não precisa ser analisado — precisa ser compreendido. Esse é um objetivo de design completamente diferente.

### Por que não LangChain/CrewAI/AutoGen?

Essas são bibliotecas de orquestração — elas coordenam agentes de fora. O OpenProse executa dentro da sessão do agente — a própria sessão é o contêiner IoC. Isso significa zero dependências externas e portabilidade em qualquer assistente de IA. Mudou do Claude Code para o Codex? Seus arquivos .prose ainda funcionam.

---

## Sintaxe em resumo

```prose
session "prompt"              # Cria subagente
agent name:                   # Define template de agente
let x = session "..."         # Captura resultado
parallel:                     # Execução concorrente
repeat N:                     # Loop fixo
for x in items:               # Iteração
loop until **condição**:      # Loop avaliado por IA
try: ... catch: ...           # Tratamento de erros
if **condição**: ...          # Condicional
choice **critério**: option   # Ramificação selecionada por IA
block name(params):           # Bloco reutilizável
do blockname(args)            # Invoca bloco
items | map: ...              # Pipeline
```

Para sintaxe completa e regras de validação, consulte `compiler.md`.

---

## Exemplos

O diretório `examples/` contém 37 programas de exemplo:

| Intervalo | Categoria                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------ |
| 01-08     | Básicos (hello world, pesquisa, revisão de código, depuração)                                          |
| 09-12     | Agentes e skills                                                                                       |
| 13-15     | Variáveis e composição                                                                                 |
| 16-19     | Execução paralela                                                                                      |
| 20-21     | Loops e pipelines                                                                                      |
| 22-23     | Tratamento de erros                                                                                    |
| 24-27     | Avançado (choice, condicionais, blocos, interpolação)                                                  |
| 28        | Gas Town (orquestração multi-agente)                                                                   |
| 29-31     | Padrão da cadeira do capitão (orquestrador persistente)                                                |
| 33-36     | Workflows de produção (PR auto-fix, pipeline de conteúdo, fábrica de funcionalidades, caçador de bugs) |
| 37        | The Forge (construir um navegador do zero)                                                             |

**Pontos de partida recomendados:**

- `01-hello-world.prose` - Programa mais simples possível
- `16-parallel-reviews.prose` - Veja a execução paralela
- `37-the-forge.prose` - Assista a IA construir um navegador web
