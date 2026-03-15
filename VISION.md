## Visão do OpenCraft

O OpenCraft é a IA que realmente faz as coisas.
Roda nos seus dispositivos, nos seus canais, com as suas regras.

Este documento explica o estado atual e a direção do projeto.
Ainda estamos no início, então a iteração é rápida.
Visão geral do projeto e docs para desenvolvedores: [`README.md`](README.md)
Guia de contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md)

O OpenCraft nasceu como um fork brasileiro do OpenClaw — um projeto de assistente pessoal de IA
que evoluiu por vários nomes: Warelay → Clawdbot → Moltbot → OpenClaw → **OpenCraft**.

O objetivo: um assistente pessoal fácil de usar, que suporta uma ampla gama de plataformas
e respeita privacidade e segurança — com documentação e interface em português.

O foco atual é:

**Prioridade:**

- Segurança e padrões seguros
- Correção de bugs e estabilidade
- Confiabilidade da configuração e UX na primeira execução

**Próximas prioridades:**

- Suporte a todos os principais provedores de modelos
- Melhorar suporte aos principais canais de mensagem (e adicionar alguns de alta demanda)
- Performance e infraestrutura de testes
- Melhores capacidades de computer-use e harness de agentes
- Ergonomia no CLI e frontend web
- Apps companheiros no macOS, iOS, Android, Windows e Linux

**Regras de contribuição:**

- Um PR = um issue/tópico. Não agrupe múltiplas correções/funcionalidades não relacionadas.
- PRs com mais de ~5.000 linhas alteradas são revisados apenas em circunstâncias excepcionais.
- Não abra grandes lotes de PRs pequenos de uma vez; cada PR tem custo de revisão.
- Para correções pequenas relacionadas, agrupar em um único PR focado é encorajado.

## Segurança

A segurança no OpenCraft é uma troca deliberada: padrões fortes sem sacrificar a capacidade.
O objetivo é manter o poder para trabalho real enquanto torna os caminhos arriscados explícitos e controlados pelo operador.

Política de segurança canônica e reporte:

- [`SECURITY.md`](SECURITY.md)

Priorizamos padrões seguros, mas também expõe controles claros para workflows de alta potência confiáveis.

## Plugins & Memória

O OpenCraft tem uma API de plugins extensiva.
O core permanece enxuto; capacidades opcionais geralmente devem ser distribuídas como plugins.

O caminho preferido para plugins é a distribuição via pacote npm mais carregamento local de extensões para desenvolvimento.
Se você construir um plugin, hospede e mantenha-o no seu próprio repositório.
A barra para adicionar plugins opcionais ao core é intencionalmente alta.

Memória é um slot especial de plugin onde apenas um plugin de memória pode estar ativo por vez.
Hoje distribuímos múltiplas opções de memória; ao longo do tempo planejamos convergir para um caminho padrão recomendado.

### Habilidades

Ainda distribuímos algumas habilidades bundled para UX básica.
Novas habilidades devem ser publicadas primeiro (num hub de habilidades), não adicionadas ao core por padrão.
Adições de habilidades ao core devem ser raras e exigir uma forte razão de produto ou segurança.

### Suporte a MCP

O OpenCraft suporta MCP através do `mcporter`: https://github.com/steipete/mcporter

Isso mantém a integração MCP flexível e desacoplada do runtime central:

- adicionar ou alterar servidores MCP sem reiniciar o gateway
- manter a superfície de ferramentas/contexto do core enxuta
- reduzir o impacto de mudanças MCP na estabilidade e segurança do core

Por ora, preferimos este modelo de ponte a construir um runtime MCP de primeira classe no core.
Se houver um servidor MCP ou funcionalidade que o `mcporter` ainda não suporta, abra um issue lá.

### Setup

O OpenCraft é atualmente terminal-first por design.
Isso mantém o setup explícito: usuários veem docs, auth, permissões e postura de segurança logo de início.

A longo prazo, queremos fluxos de onboarding mais fáceis à medida que o hardening amadurece.
Não queremos wrappers de conveniência que escondam decisões críticas de segurança dos usuários.

### Por que TypeScript?

O OpenCraft é principalmente um sistema de orquestração: prompts, ferramentas, protocolos e integrações.
TypeScript foi escolhido para manter o OpenCraft hackeável por padrão.
É amplamente conhecido, rápido para iterar, fácil de ler, modificar e estender.

## O que não vamos mesclar (por enquanto)

- Novas habilidades de core quando podem ser distribuídas via hub de habilidades
- Sets completos de tradução de docs para todos os idiomas (adiado; planejamos traduções geradas por IA mais tarde)
- Integrações de serviços comerciais que claramente não se encaixam na categoria de provedor de modelo
- Canais wrapper em torno de canais já suportados sem uma lacuna clara de capacidade ou segurança
- Runtime MCP de primeira classe no core quando o `mcporter` já fornece o caminho de integração
- Frameworks de hierarquia de agentes (gerenciador-de-gerenciadores / árvores de planejador aninhadas) como arquitetura padrão
- Camadas de orquestração pesadas que duplicam infraestrutura existente de agentes e ferramentas

Esta lista é uma barreira de roadmap, não uma lei física.
Forte demanda de usuários e forte justificativa técnica podem mudá-la.
