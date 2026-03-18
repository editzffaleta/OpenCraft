---
name: skill-creator
description: Criar, editar, melhorar ou auditar AgentSkills. Use ao criar uma nova skill do zero ou quando solicitado a melhorar, revisar, auditar, organizar ou limpar uma skill existente ou arquivo SKILL.md. Use também ao editar ou reestruturar um diretório de skill (mover arquivos para references/ ou scripts/, remover conteúdo desatualizado, validar contra a spec de AgentSkills). Ativado por frases como "criar uma skill", "criar uma skill", "organizar uma skill", "melhorar esta skill", "revisar a skill", "limpar a skill", "auditar a skill".
---

# Skill Creator

Esta skill fornece orientação para criar skills eficazes.

## Sobre Skills

Skills são pacotes modulares e autocontidos que estendem as capacidades do Codex fornecendo
conhecimento especializado, fluxos de trabalho e ferramentas. Pense nelas como "guias de integração" para domínios
ou tarefas específicas — elas transformam o Codex de um agente de propósito geral em um agente especializado
equipado com conhecimento procedural que nenhum modelo pode possuir completamente.

### O que as Skills Fornecem

1. Fluxos de trabalho especializados - Procedimentos de múltiplas etapas para domínios específicos
2. Integrações de ferramentas - Instruções para trabalhar com formatos de arquivo ou APIs específicos
3. Expertise de domínio - Conhecimento específico da empresa, esquemas, lógica de negócios
4. Recursos agrupados - Scripts, referências e ativos para tarefas complexas e repetitivas

## Princípios Fundamentais

### Conciso é Fundamental

A janela de contexto é um bem público. Skills compartilham a janela de contexto com tudo o mais que o Codex precisa: prompt do sistema, histórico de conversa, metadados de outras Skills e a solicitação real do usuário.

**Suposição padrão: o Codex já é muito inteligente.** Adicione apenas contexto que o Codex ainda não tem. Questione cada informação: "O Codex realmente precisa dessa explicação?" e "Este parágrafo justifica seu custo em tokens?"

Prefira exemplos concisos a explicações detalhadas.

### Defina Graus de Liberdade Apropriados

Ajuste o nível de especificidade à fragilidade e variabilidade da tarefa:

**Alta liberdade (instruções em texto)**: Use quando múltiplas abordagens são válidas, as decisões dependem do contexto ou heurísticas guiam a abordagem.

**Liberdade média (pseudocódigo ou scripts com parâmetros)**: Use quando existe um padrão preferido, alguma variação é aceitável ou a configuração afeta o comportamento.

**Baixa liberdade (scripts específicos, poucos parâmetros)**: Use quando as operações são frágeis e propensas a erros, a consistência é crítica ou uma sequência específica deve ser seguida.

Pense no Codex explorando um caminho: uma ponte estreita com penhascos precisa de guias específicos (baixa liberdade), enquanto um campo aberto permite muitas rotas (alta liberdade).

### Anatomia de uma Skill

Cada skill consiste em um arquivo SKILL.md obrigatório e recursos agrupados opcionais:

```
skill-name/
├── SKILL.md (obrigatório)
│   ├── Metadados YAML frontmatter (obrigatório)
│   │   ├── name: (obrigatório)
│   │   └── description: (obrigatório)
│   └── Instruções em Markdown (obrigatório)
└── Recursos Agrupados (opcional)
    ├── scripts/          - Código executável (Python/Bash/etc.)
    ├── references/       - Documentação para ser carregada no contexto conforme necessário
    └── assets/           - Arquivos usados na saída (templates, ícones, fontes, etc.)
```

#### SKILL.md (obrigatório)

Todo SKILL.md consiste em:

- **Frontmatter** (YAML): Contém os campos `name` e `description`. Esses são os únicos campos que o Codex lê para determinar quando a skill é usada, portanto é muito importante ser claro e abrangente ao descrever o que a skill faz e quando deve ser usada.
- **Corpo** (Markdown): Instruções e orientações para usar a skill. Carregado somente APÓS o acionamento da skill (se for o caso).

#### Recursos Agrupados (opcional)

##### Scripts (`scripts/`)

Código executável (Python/Bash/etc.) para tarefas que requerem confiabilidade determinística ou são reescritas repetidamente.

- **Quando incluir**: Quando o mesmo código está sendo reescrito repetidamente ou confiabilidade determinística é necessária
- **Exemplo**: `scripts/rotate_pdf.py` para tarefas de rotação de PDF
- **Benefícios**: Eficiente em tokens, determinístico, pode ser executado sem carregar no contexto
- **Nota**: Scripts ainda podem precisar ser lidos pelo Codex para patching ou ajustes específicos do ambiente

##### References (`references/`)

Documentação e material de referência destinados a ser carregados conforme necessário no contexto para informar o processo e raciocínio do Codex.

- **Quando incluir**: Para documentação que o Codex deve consultar durante o trabalho
- **Exemplos**: `references/finance.md` para esquemas financeiros, `references/mnda.md` para template de NDA da empresa, `references/policies.md` para políticas da empresa, `references/api_docs.md` para especificações de API
- **Casos de uso**: Esquemas de banco de dados, documentação de API, conhecimento de domínio, políticas da empresa, guias detalhados de fluxo de trabalho
- **Benefícios**: Mantém o SKILL.md enxuto, carregado apenas quando o Codex determinar que é necessário
- **Boa prática**: Se os arquivos forem grandes (>10k palavras), inclua padrões de pesquisa grep no SKILL.md
- **Evite duplicação**: As informações devem estar em SKILL.md ou em arquivos de referência, não em ambos. Prefira arquivos de referência para informações detalhadas, a menos que sejam realmente centrais para a skill — isso mantém o SKILL.md enxuto enquanto torna as informações descobríveis sem ocupar a janela de contexto. Mantenha apenas instruções procedurais essenciais e orientações de fluxo de trabalho no SKILL.md; mova material de referência detalhado, esquemas e exemplos para arquivos de referência.

##### Assets (`assets/`)

Arquivos não destinados a serem carregados no contexto, mas usados na saída produzida pelo Codex.

- **Quando incluir**: Quando a skill precisa de arquivos que serão usados na saída final
- **Exemplos**: `assets/logo.png` para ativos de marca, `assets/slides.pptx` para templates do PowerPoint, `assets/frontend-template/` para boilerplate HTML/React, `assets/font.ttf` para tipografia
- **Casos de uso**: Templates, imagens, ícones, código boilerplate, fontes, documentos de amostra que são copiados ou modificados
- **Benefícios**: Separa recursos de saída da documentação, permite que o Codex use arquivos sem carregá-los no contexto

#### O que Não Incluir em uma Skill

Uma skill deve conter apenas arquivos essenciais que suportam diretamente sua funcionalidade. NÃO crie documentação adicional ou arquivos auxiliares, incluindo:

- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md
- etc.

A skill deve conter apenas as informações necessárias para que um agente de IA execute o trabalho em questão. Não deve conter contexto auxiliar sobre o processo de criação, procedimentos de configuração e teste, documentação voltada ao usuário, etc. Criar arquivos de documentação adicionais apenas adiciona confusão e desordem.

### Princípio de Design de Divulgação Progressiva

Skills usam um sistema de carregamento em três níveis para gerenciar o contexto com eficiência:

1. **Metadados (name + description)** - Sempre no contexto (~100 palavras)
2. **Corpo do SKILL.md** - Quando a skill é acionada (<5k palavras)
3. **Recursos agrupados** - Conforme necessário pelo Codex (Ilimitado porque scripts podem ser executados sem leitura na janela de contexto)

#### Padrões de Divulgação Progressiva

Mantenha o corpo do SKILL.md nos elementos essenciais e abaixo de 500 linhas para minimizar o crescimento do contexto. Divida o conteúdo em arquivos separados quando se aproximar desse limite. Ao dividir conteúdo em outros arquivos, é muito importante referenciá-los no SKILL.md e descrever claramente quando lê-los, para garantir que o leitor da skill saiba que eles existem e quando usá-los.

**Princípio chave:** Quando uma skill suporta múltiplas variações, frameworks ou opções, mantenha apenas o fluxo de trabalho principal e a orientação de seleção no SKILL.md. Mova detalhes específicos de variantes (padrões, exemplos, configuração) para arquivos de referência separados.

**Padrão 1: Guia de alto nível com referências**

```markdown
# PDF Processing

## Quick start

Extract text with pdfplumber:
[code example]

## Advanced features

- **Form filling**: See [FORMS.md](FORMS.md) for complete guide
- **API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
- **Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
```

O Codex carrega FORMS.md, REFERENCE.md ou EXAMPLES.md apenas quando necessário.

**Padrão 2: Organização específica por domínio**

Para Skills com múltiplos domínios, organize o conteúdo por domínio para evitar carregar contexto irrelevante:

```
bigquery-skill/
├── SKILL.md (visão geral e navegação)
└── reference/
    ├── finance.md (métricas de receita e cobrança)
    ├── sales.md (oportunidades, pipeline)
    ├── product.md (uso de API, funcionalidades)
    └── marketing.md (campanhas, atribuição)
```

Quando um usuário pergunta sobre métricas de vendas, o Codex lê apenas sales.md.

Da mesma forma, para skills que suportam múltiplos frameworks ou variantes, organize por variante:

```
cloud-deploy/
├── SKILL.md (fluxo de trabalho + seleção de provedor)
└── references/
    ├── aws.md (padrões de deploy na AWS)
    ├── gcp.md (padrões de deploy no GCP)
    └── azure.md (padrões de deploy no Azure)
```

Quando o usuário escolhe AWS, o Codex lê apenas aws.md.

**Padrão 3: Detalhes condicionais**

Mostre conteúdo básico, vincule ao conteúdo avançado:

```markdown
# DOCX Processing

## Creating documents

Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)
```

O Codex lê REDLINING.md ou OOXML.md apenas quando o usuário precisar dessas funcionalidades.

**Diretrizes importantes:**

- **Evite referências profundamente aninhadas** - Mantenha referências a um nível de profundidade a partir do SKILL.md. Todos os arquivos de referência devem vincular diretamente do SKILL.md.
- **Estruture arquivos de referência mais longos** - Para arquivos com mais de 100 linhas, inclua um índice no topo para que o Codex possa ver o escopo completo ao visualizar.

## Processo de Criação de Skill

A criação de skills envolve estas etapas:

1. Entender a skill com exemplos concretos
2. Planejar o conteúdo reutilizável da skill (scripts, references, assets)
3. Inicializar a skill (executar init_skill.py)
4. Editar a skill (implementar recursos e escrever o SKILL.md)
5. Empacotar a skill (executar package_skill.py)
6. Iterar com base no uso real

Siga estas etapas em ordem, pulando apenas quando houver uma razão clara de por que não são aplicáveis.

### Nomenclatura de Skills

- Use apenas letras minúsculas, dígitos e hífens; normalize títulos fornecidos pelo usuário para kebab-case (por exemplo, "Plan Mode" -> `plan-mode`).
- Ao gerar nomes, gere um nome com menos de 64 caracteres (letras, dígitos, hífens).
- Prefira frases curtas com verbos que descrevam a ação.
- Use namespace pelo nome da ferramenta quando melhorar clareza ou acionamento (por exemplo, `gh-address-comments`, `linear-address-issue`).
- Nomeie a pasta da skill exatamente igual ao nome da skill.

### Etapa 1: Entender a Skill com Exemplos Concretos

Pule esta etapa apenas quando os padrões de uso da skill já estiverem claramente compreendidos. Ela permanece valiosa mesmo ao trabalhar com uma skill existente.

Para criar uma skill eficaz, entenda claramente exemplos concretos de como a skill será usada. Esse entendimento pode vir tanto de exemplos diretos do usuário quanto de exemplos gerados e validados com feedback do usuário.

Por exemplo, ao criar uma skill de editor de imagens, perguntas relevantes incluem:

- "Que funcionalidades a skill de editor de imagens deve suportar? Edição, rotação, alguma outra?"
- "Você pode dar alguns exemplos de como esta skill seria usada?"
- "Posso imaginar usuários pedindo coisas como 'Remova os olhos vermelhos desta imagem' ou 'Gire esta imagem'. Existem outras formas de uso que você imagina?"
- "O que um usuário diria que deveria acionar esta skill?"

Para evitar sobrecarregar os usuários, evite fazer muitas perguntas em uma única mensagem. Comece com as perguntas mais importantes e faça perguntas de acompanhamento conforme necessário para maior eficácia.

Conclua esta etapa quando houver uma noção clara das funcionalidades que a skill deve suportar.

### Etapa 2: Planejar o Conteúdo Reutilizável da Skill

Para transformar exemplos concretos em uma skill eficaz, analise cada exemplo:

1. Considerando como executar o exemplo do zero
2. Identificando quais scripts, referências e assets seriam úteis ao executar esses fluxos de trabalho repetidamente

Exemplo: Ao criar uma skill `pdf-editor` para lidar com consultas como "Me ajude a girar este PDF," a análise mostra:

1. Girar um PDF requer reescrever o mesmo código a cada vez
2. Um script `scripts/rotate_pdf.py` seria útil para armazenar na skill

Exemplo: Ao criar uma skill `frontend-webapp-builder` para consultas como "Crie um app de tarefas" ou "Crie um dashboard para rastrear meus passos," a análise mostra:

1. Escrever um webapp frontend requer o mesmo boilerplate HTML/React a cada vez
2. Um template `assets/hello-world/` contendo os arquivos boilerplate do projeto HTML/React seria útil para armazenar na skill

Exemplo: Ao criar uma skill `big-query` para lidar com consultas como "Quantos usuários fizeram login hoje?" a análise mostra:

1. Consultar o BigQuery requer redescobrir os esquemas de tabela e relacionamentos a cada vez
2. Um arquivo `references/schema.md` documentando os esquemas de tabela seria útil para armazenar na skill

Para estabelecer o conteúdo da skill, analise cada exemplo concreto para criar uma lista dos recursos reutilizáveis a incluir: scripts, references e assets.

### Etapa 3: Inicializar a Skill

Chegou o momento de realmente criar a skill.

Pule esta etapa apenas se a skill em desenvolvimento já existir e for necessário iterar ou empacotar. Nesse caso, continue para a próxima etapa.

Ao criar uma nova skill do zero, sempre execute o script `init_skill.py`. O script gera convenientemente um novo diretório de skill com template que inclui automaticamente tudo o que uma skill requer, tornando o processo de criação muito mais eficiente e confiável.

Uso:

```bash
scripts/init_skill.py <skill-name> --path <output-directory> [--resources scripts,references,assets] [--examples]
```

Exemplos:

```bash
scripts/init_skill.py my-skill --path skills/public
scripts/init_skill.py my-skill --path skills/public --resources scripts,references
scripts/init_skill.py my-skill --path skills/public --resources scripts --examples
```

O script:

- Cria o diretório da skill no caminho especificado
- Gera um template SKILL.md com frontmatter adequado e placeholders TODO
- Opcionalmente cria diretórios de recursos com base em `--resources`
- Opcionalmente adiciona arquivos de exemplo quando `--examples` é definido

Após a inicialização, personalize o SKILL.md e adicione recursos conforme necessário. Se você usou `--examples`, substitua ou exclua os arquivos de placeholder.

### Etapa 4: Editar a Skill

Ao editar a skill (recém-gerada ou existente), lembre-se de que ela está sendo criada para outra instância do Codex usar. Inclua informações que seriam benéficas e não óbvias para o Codex. Considere qual conhecimento procedural, detalhes específicos do domínio ou assets reutilizáveis ajudariam outra instância do Codex a executar essas tarefas com mais eficácia.

#### Aprenda Padrões de Design Comprovados

Consulte estes guias úteis com base nas necessidades da sua skill:

- **Processos de múltiplas etapas**: Veja references/workflows.md para fluxos de trabalho sequenciais e lógica condicional
- **Formatos de saída específicos ou padrões de qualidade**: Veja references/output-patterns.md para padrões de template e exemplo

Esses arquivos contêm melhores práticas estabelecidas para design eficaz de skills.

#### Comece com o Conteúdo Reutilizável da Skill

Para iniciar a implementação, comece com os recursos reutilizáveis identificados acima: arquivos `scripts/`, `references/` e `assets/`. Note que esta etapa pode exigir input do usuário. Por exemplo, ao implementar uma skill `brand-guidelines`, o usuário pode precisar fornecer ativos de marca ou templates para armazenar em `assets/`, ou documentação para armazenar em `references/`.

Scripts adicionados devem ser testados executando-os de verdade para garantir que não haja bugs e que a saída corresponda ao esperado. Se houver muitos scripts similares, apenas uma amostra representativa precisa ser testada para garantir confiança de que todos funcionam, equilibrando o tempo até a conclusão.

Se você usou `--examples`, exclua quaisquer arquivos de placeholder que não sejam necessários para a skill. Crie apenas diretórios de recursos que sejam realmente necessários.

#### Atualizar o SKILL.md

**Diretrizes de Escrita:** Sempre use a forma imperativa/infinitiva.

##### Frontmatter

Escreva o frontmatter YAML com `name` e `description`:

- `name`: O nome da skill
- `description`: Este é o mecanismo principal de acionamento para sua skill, e ajuda o Codex a entender quando usá-la.
  - Inclua tanto o que a Skill faz quanto gatilhos/contextos específicos de quando usá-la.
  - Inclua todas as informações de "quando usar" aqui - Não no corpo. O corpo é carregado somente após o acionamento, portanto seções "Quando Usar Esta Skill" no corpo não são úteis para o Codex.
  - Exemplo de description para uma skill `docx`: "Criação, edição e análise abrangente de documentos com suporte para controle de alterações, comentários, preservação de formatação e extração de texto. Use quando o Codex precisar trabalhar com documentos profissionais (arquivos .docx) para: (1) Criar novos documentos, (2) Modificar ou editar conteúdo, (3) Trabalhar com controle de alterações, (4) Adicionar comentários, ou qualquer outra tarefa com documentos"

Não inclua outros campos no frontmatter YAML.

##### Corpo

Escreva instruções para usar a skill e seus recursos agrupados.

### Etapa 5: Empacotar uma Skill

Uma vez que o desenvolvimento da skill está completo, ela deve ser empacotada em um arquivo .skill distribuível que é compartilhado com o usuário. O processo de empacotamento valida automaticamente a skill primeiro para garantir que ela atenda a todos os requisitos:

```bash
scripts/package_skill.py <path/to/skill-folder>
```

Especificação opcional do diretório de saída:

```bash
scripts/package_skill.py <path/to/skill-folder> ./dist
```

O script de empacotamento irá:

1. **Validar** a skill automaticamente, verificando:
   - Formato do frontmatter YAML e campos obrigatórios
   - Convenções de nomenclatura da skill e estrutura de diretório
   - Completude e qualidade da description
   - Organização de arquivos e referências de recursos

2. **Empacotar** a skill se a validação passar, criando um arquivo .skill nomeado após a skill (por exemplo, `my-skill.skill`) que inclui todos os arquivos e mantém a estrutura de diretório adequada para distribuição. O arquivo .skill é um arquivo zip com extensão .skill.

   Restrição de segurança: symlinks são rejeitados e o empacotamento falha quando qualquer symlink está presente.

Se a validação falhar, o script reportará os erros e sairá sem criar um pacote. Corrija quaisquer erros de validação e execute o comando de empacotamento novamente.

### Etapa 6: Iterar

Após testar a skill, os usuários podem solicitar melhorias. Isso geralmente acontece logo após usar a skill, com contexto fresco de como a skill foi executada.

**Fluxo de trabalho de iteração:**

1. Use a skill em tarefas reais
2. Note dificuldades ou ineficiências
3. Identifique como o SKILL.md ou os recursos agrupados devem ser atualizados
4. Implemente as alterações e teste novamente
