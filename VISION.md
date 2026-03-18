## Visão do OpenCraft

OpenCraft é a IA que realmente faz coisas.
Ela roda nos seus dispositivos, nos seus canais, com as suas regras.

Este documento explica o estado atual e a direção do projeto.
Ainda estamos no início, então a iteração é rápida.
Visão geral do projeto e docs para desenvolvedores: [`README.md`](README.md)
Guia de contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md)

O OpenCraft começou como um playground pessoal para aprender IA e construir algo genuinamente útil:
um assistente capaz de executar tarefas reais em um computador real.
Ele evoluiu por vários nomes e versões: Warelay -> Clawdbot -> Moltbot -> OpenCraft.

O objetivo: um assistente pessoal fácil de usar, com suporte a uma ampla gama de plataformas, que respeita privacidade e segurança.

O foco atual é:

Prioridade:

- Segurança e padrões seguros
- Correção de bugs e estabilidade
- Confiabilidade de configuração e UX na primeira execução

Próximas prioridades:

- Suporte a todos os principais provedores de modelos
- Melhoria do suporte aos principais canais de mensagens (e adição de novos com alta demanda)
- Performance e infraestrutura de testes
- Melhores capacidades de uso do computador e harness de agentes
- Ergonomia no CLI e no frontend web
- Apps complementares em macOS, iOS, Android, Windows e Linux

Regras de contribuição:

- Um PR = um problema/tópico. Não agrupe correções/funcionalidades não relacionadas.
- PRs com mais de ~5.000 linhas alteradas são revisados apenas em circunstâncias excepcionais.
- Não abra grandes lotes de PRs minúsculos de uma vez; cada PR tem custo de revisão.
- Para correções pequenas e relacionadas, agrupá-las em um PR focado é encorajado.

## Segurança

A segurança no OpenCraft é uma troca deliberada: padrões fortes sem matar a capacidade.
O objetivo é manter o sistema poderoso para trabalho real, tornando caminhos de risco explícitos e controlados pelo operador.

Política de segurança canônica e reporte:

- [`SECURITY.md`](SECURITY.md)

Priorizamos padrões seguros, mas também expõemos controles claros para fluxos de trabalho confiáveis e de alta potência.

## Plugins & Memória

O OpenCraft tem uma extensa API de plugins.
O núcleo permanece enxuto; capacidades opcionais devem normalmente ser distribuídas como plugins.

O caminho preferido para plugins é a distribuição via pacote npm, mais o carregamento local de extensões para desenvolvimento.
Se você construir um plugin, hospede-o e mantenha-o em seu próprio repositório.
A barra para adicionar plugins opcionais ao núcleo é intencionalmente alta.
Docs de plugins: [`docs/tools/plugin.md`](docs/tools/plugin.md)
Listagem de plugins da comunidade + barra de PR: https://docs.opencraft.ai/plugins/community

Memória é um slot especial de plugin onde apenas um plugin de memória pode estar ativo por vez.
Hoje distribuímos múltiplas opções de memória; ao longo do tempo planejamos convergir para um caminho padrão recomendado.

### Skills

Ainda distribuímos algumas skills empacotadas para UX básica.
Novas skills devem ser publicadas primeiro no ClawHub (`clawhub.ai`), e não adicionadas ao núcleo por padrão.
Adições de skills ao núcleo devem ser raras e exigir uma forte razão de produto ou segurança.

### Suporte a MCP

O OpenCraft suporta MCP através do `mcporter`: https://github.com/steipete/mcporter

Isso mantém a integração MCP flexível e desacoplada do runtime do núcleo:

- adicione ou altere servidores MCP sem reiniciar o gateway
- mantenha a superfície de tools/contexto do núcleo enxuta
- reduza o impacto das mudanças do MCP na estabilidade e segurança do núcleo

Por enquanto, preferimos este modelo de bridge em vez de construir um runtime MCP de primeira classe no núcleo.
Se houver um servidor ou funcionalidade MCP que o `mcporter` ainda não suporta, por favor abra uma issue lá.

### Configuração

O OpenCraft é atualmente terminal-first por design.
Isso mantém a configuração explícita: os usuários veem docs, autenticação, permissões e postura de segurança logo de início.

A longo prazo, queremos fluxos de onboarding mais fáceis à medida que o hardening amadurece.
Não queremos wrappers de conveniência que escondam decisões críticas de segurança dos usuários.

### Por que TypeScript?

O OpenCraft é principalmente um sistema de orquestração: prompts, tools, protocolos e integrações.
O TypeScript foi escolhido para manter o OpenCraft hackável por padrão.
É amplamente conhecido, rápido para iterar, e fácil de ler, modificar e estender.

## O Que Não Faremos Merge (Por Enquanto)

- Novas skills de núcleo quando podem viver no ClawHub
- Conjuntos completos de tradução de docs para todos os idiomas (adiado; planejamos traduções geradas por IA posteriormente)
- Integrações de serviços comerciais que não se encaixam claramente na categoria de provedor de modelo
- Canais wrapper em torno de canais já suportados sem uma lacuna clara de capacidade ou segurança
- Runtime MCP de primeira classe no núcleo quando o `mcporter` já fornece o caminho de integração
- Frameworks de hierarquia de agentes (gerenciador de gerenciadores / árvores de planejamento aninhadas) como arquitetura padrão
- Camadas de orquestração pesadas que duplicam a infraestrutura existente de agentes e tools

Esta lista é uma guardrail de roadmap, não uma lei da física.
Alta demanda de usuários e forte embasamento técnico podem mudá-la.
