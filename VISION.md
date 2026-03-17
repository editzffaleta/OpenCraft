## Visão OpenCraft

OpenCraft é a IA que realmente faz as coisas.
Ela funciona em seus dispositivos, em seus canais, com suas regras.

Este documento explica o estado atual e a direção do projeto.
Ainda estamos no início, então a iteração é rápida.
Visão geral do projeto e documentação para desenvolvedores: [`README.md`](README.md)
Guia de contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md)

OpenCraft começou como um playground pessoal para aprender IA e construir algo genuinamente útil:
um assistente que possa executar tarefas reais em um computador real.
Evoluiu através de vários nomes e shells: Warelay -> Clawdbot -> Moltbot -> OpenCraft.

O objetivo: um assistente pessoal que seja fácil de usar, suporte uma ampla gama de plataformas e respeite privacidade e segurança.

O foco atual é:

Prioridade:

- Segurança e padrões seguros
- Correções de bugs e estabilidade
- Confiabilidade de configuração e UX de primeira execução

Próximas prioridades:

- Suporte a todos os principais provedores de modelos
- Melhoria do suporte para os principais canais de mensagens (e adição de alguns altamente solicitados)
- Performance e infraestrutura de testes
- Melhorias nas capacidades de computer-use e agent harness
- Ergonomia em CLI e frontend web
- Aplicativos complementares em macOS, iOS, Android, Windows e Linux

Regras de contribuição:

- Um PR = um issue/tópico. Não agrupe múltiplas correções/funcionalidades não relacionadas.
- PRs com ~5.000 ou mais linhas alteradas são revisados apenas em circunstâncias excepcionais.
- Não abra grandes lotes de PRs pequenos de uma vez; cada PR tem custo de revisão.
- Para pequenas correções muito relacionadas, agrupar em um único PR focado é encorajado.

## Segurança

Segurança no OpenCraft é uma troca deliberada: padrões fortes sem prejudicar a capacidade.
O objetivo é permanecer poderoso para trabalho real enquanto torna os caminhos arriscados explícitos e controlados pelo operador.

Política de segurança canônica e relatórios:

- [`SECURITY.md`](SECURITY.md)

Priorizamos padrões seguros, mas também expomos controles claros para fluxos de trabalho de alta potência confiáveis.

## Plugins & Memory

OpenCraft possui uma extensa API de plugin.
O core permanece enxuto; a capacidade opcional normalmente deve ser entregue como plugins.

O caminho preferido para plugins é distribuição de pacote npm mais carregamento de extensão local para desenvolvimento.
Se você construir um plugin, hospede e mantenha-o em seu próprio repositório.
A barra para adicionar plugins opcionais ao core é intencionalmente alta.
Documentação de plugins: [`docs/tools/plugin.md`](docs/tools/plugin.md)
Listagem de plugins da comunidade + barra de PR: https://docs.opencraft.ai/plugins/community

Memory é um slot de plugin especial onde apenas um plugin de memory pode estar ativo por vez.
Hoje entregamos múltiplas opções de memory; ao longo do tempo, planejamos convergir para um caminho padrão recomendado.

### Skills

Ainda entregamos algumas skills agrupadas para UX de linha de base.
Novas skills devem ser publicadas primeiro no ClawHub (`clawhub.ai`), não adicionadas ao core por padrão.
Adições de skills ao core devem ser raras e exigir uma forte razão de produto ou segurança.

### Suporte a MCP

OpenCraft suporta MCP através de `mcporter`: https://github.com/steipete/mcporter

Isto mantém a integração MCP flexível e desacoplada do runtime core:

- adicionar ou alterar servidores MCP sem reiniciar o Gateway
- manter a superfície de tool/context do core enxuta
- reduzir o impacto de mudanças MCP na estabilidade e segurança do core

Por enquanto, preferimos este modelo de ponte sobre construir um runtime MCP de primeira classe no core.
Se houver um servidor ou funcionalidade MCP que `mcporter` ainda não suporte, abra uma issue lá.

### Configuração

OpenCraft é atualmente terminal-first por design.
Isto mantém a configuração explícita: usuários veem docs, auth, permissões e postura de segurança desde o início.

A longo prazo, queremos fluxos de onboarding mais fáceis conforme o hardening amadurece.
Não queremos wrappers de conveniência que escondem decisões críticas de segurança dos usuários.

### Por que TypeScript?

OpenCraft é principalmente um sistema de orquestração: prompts, tools, protocolos e integrações.
TypeScript foi escolhido para manter OpenCraft hackeável por padrão.
É amplamente conhecido, rápido para iterar, e fácil de ler, modificar e estender.

## O Que Não Vamos Fazer Merge (Por Enquanto)

- Novas core skills quando elas podem viver no ClawHub
- Conjuntos completos de tradução de docs para todos os docs (adiado; planejamos traduções geradas por IA mais tarde)
- Integrações de serviços comerciais que não se encaixam claramente na categoria model-provider
- Canais wrapper em torno de canais já suportados sem uma lacuna clara de capacidade ou segurança
- Runtime MCP de primeira classe no core quando `mcporter` já fornece o caminho de integração
- Frameworks de agent-hierarchy (manager-of-managers / nested planner trees) como arquitetura padrão
- Camadas de orquestração pesadas que duplicam infraestrutura de agent e tool existente

Esta lista é uma proteção de roadmap, não uma lei da física.
Forte demanda do usuário e forte justificativa técnica podem mudá-la.
