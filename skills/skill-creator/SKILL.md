---
name: skill-creator
description: Crie, edite, melhore ou audite AgentSkills. Use quando criar uma nova skill do zero ou quando solicitado a melhorar, revisar, auditar, organizar ou limpar uma skill ou arquivo SKILL.md existente. Use também ao editar ou reestruturar um diretório de skill (mover arquivos para references/ ou scripts/, remover conteúdo obsoleto, validar contra a especificação AgentSkills). Acionado por frases como "criar uma skill", "criar uma skill", "organizar uma skill", "melhorar esta skill", "revisar a skill", "limpar a skill", "auditar a skill".
---

# Criador de Skills

Esta skill fornece orientação para criar skills eficazes.

## Sobre Skills

Skills são pacotes modulares e autossuficientes que estendem as capacidades do agente fornecendo
conhecimento especializado, fluxos de trabalho e ferramentas. Pense nelas como "guias de integração" para domínios ou tarefas específicas — elas transformam o agente de um assistente genérico em um agente especializado equipado com conhecimento procedural que nenhum modelo pode possuir completamente.

### O que as Skills Fornecem

1. Fluxos de trabalho especializados — Procedimentos de várias etapas para domínios específicos
2. Integrações de ferramentas — Instruções para trabalhar com formatos de arquivo ou APIs específicos
3. Expertise de domínio — Conhecimento específico da empresa, esquemas, lógica de negócios
4. Recursos agrupados — Scripts, referências e ativos para tarefas complexas e repetitivas

## Princípios Principais

### Conciso é Fundamental

A janela de contexto é um bem público. Skills compartilham a janela de contexto com tudo mais que o agente precisa: prompt do sistema, histórico de conversa, metadados de outras Skills e a solicitação real do usuário.

**Suposição padrão: o agente já é muito inteligente.** Adicione apenas contexto que o agente não possui. Questione cada informação: "O agente realmente precisa desta explicação?" e "Este parágrafo justifica seu custo em tokens?"

Prefira exemplos concisos a explicações verbosas.

### Defina Graus Apropriados de Liberdade

Ajuste o nível de especificidade à fragilidade e variabilidade da tarefa:

**Alta liberdade (instruções em texto)**: Use quando múltiplas abordagens são válidas, decisões dependem do contexto, ou heurísticas guiam a abordagem.

**Liberdade média (pseudocódigo ou scripts com parâmetros)**: Use quando existe um padrão preferido, alguma variação é aceitável, ou a configuração afeta o comportamento.

**Baixa liberdade (scripts específicos, poucos parâmetros)**: Use quando operações são frágeis e propensas a erros, consistência é crítica, ou uma sequência específica deve ser seguida.

Pense no agente explorando um caminho: uma ponte estreita com penhascos precisa de proteções específicas (baixa liberdade), enquanto um campo aberto permite muitas rotas (alta liberdade).

### Anatomia de uma Skill

Toda skill consiste em um arquivo SKILL.md obrigatório e recursos agrupados opcionais:

```
nome-da-skill/
├── SKILL.md (obrigatório)
│   ├── Metadados frontmatter YAML (obrigatório)
│   │   ├── name: (obrigatório)
│   │   └── description: (obrigatório)
│   └── Instruções Markdown (obrigatório)
└── Recursos Agrupados (opcional)
    ├── scripts/          - Código executável (Python/Bash/etc.)
    ├── references/       - Documentação para carregar no contexto conforme necessário
    └── assets/           - Arquivos usados na saída (templates, ícones, fontes, etc.)
```

#### SKILL.md (obrigatório)

Todo SKILL.md consiste em:

- **Frontmatter** (YAML): Contém os campos `name` e `description`. Estes são os únicos campos que o agente lê para determinar quando a skill é usada, por isso é muito importante ser claro e abrangente ao descrever o que é a skill e quando deve ser usada.
- **Corpo** (Markdown): Instruções e orientações para usar a skill. Carregado APENAS APÓS o acionamento da skill (se for o caso).

#### Recursos Agrupados (opcional)

##### Scripts (`scripts/`)

Código executável (Python/Bash/etc.) para tarefas que requerem confiabilidade determinística ou são reescritas repetidamente.

- **Quando incluir**: Quando o mesmo código é reescrito repetidamente ou confiabilidade determinística é necessária
- **Exemplo**: `scripts/rotate_pdf.py` para tarefas de rotação de PDF
- **Benefícios**: Eficiente em tokens, determinístico, pode ser executado sem carregar no contexto
- **Nota**: Scripts ainda podem precisar ser lidos pelo agente para patches ou ajustes específicos do ambiente

##### Referências (`references/`)

Documentação e material de referência destinados a serem carregados conforme necessário no contexto para informar o processo e raciocínio do agente.

- **Quando incluir**: Para documentação que o agente deve consultar durante o trabalho
- **Exemplos**: `references/finance.md` para esquemas financeiros, `references/mnda.md` para template de NDA, `references/policies.md` para políticas da empresa, `references/api_docs.md` para especificações de API
- **Casos de uso**: Esquemas de banco de dados, documentação de API, conhecimento de domínio, políticas da empresa, guias detalhados de fluxo de trabalho
- **Benefícios**: Mantém o SKILL.md enxuto, carregado apenas quando o agente determina necessidade
- **Melhor prática**: Se os arquivos forem grandes (>10k palavras), inclua padrões de busca grep no SKILL.md
- **Evite duplicação**: As informações devem estar no SKILL.md ou em arquivos de referência, não em ambos. Prefira arquivos de referência para informações detalhadas, a menos que sejam essenciais para a skill — isso mantém o SKILL.md enxuto enquanto torna as informações descobríveis sem ocupar a janela de contexto. Mantenha apenas instruções procedurais essenciais e orientação de fluxo de trabalho no SKILL.md; mova material de referência detalhado, esquemas e exemplos para arquivos de referência.

##### Ativos (`assets/`)

Arquivos não destinados a serem carregados no contexto, mas usados na saída que o agente produz.

- **Quando incluir**: Quando a skill precisa de arquivos que serão usados na saída final
- **Exemplos**: `assets/logo.png` para ativos de marca, `assets/slides.pptx` para templates PowerPoint, `assets/frontend-template/` para boilerplate HTML/React, `assets/font.ttf` para tipografia
- **Casos de uso**: Templates, imagens, ícones, código boilerplate, fontes, documentos de amostra que são copiados ou modificados
- **Benefícios**: Separa recursos de saída da documentação, permite que o agente use arquivos sem carregá-los no contexto

#### O que NÃO Incluir em uma Skill

Uma skill deve conter apenas arquivos essenciais que apoiem diretamente sua funcionalidade. NÃO crie documentação extra ou arquivos auxiliares, incluindo:

- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md
- etc.

A skill deve conter apenas as informações necessárias para um agente de IA realizar o trabalho em questão. Não deve conter contexto auxiliar sobre o processo de criação, procedimentos de configuração e teste, documentação para o usuário, etc. Criar arquivos de documentação adicionais apenas adiciona desordem e confusão.

### Princípio de Design de Divulgação Progressiva

As skills usam um sistema de carregamento em três níveis para gerenciar o contexto de forma eficiente:

1. **Metadados (nome + descrição)** — Sempre no contexto (~100 palavras)
2. **Corpo do SKILL.md** — Quando a skill é acionada (<5k palavras)
3. **Recursos agrupados** — Conforme necessário pelo agente (Ilimitado porque scripts podem ser executados sem ler na janela de contexto)

#### Padrões de Divulgação Progressiva

Mantenha o corpo do SKILL.md nos elementos essenciais e abaixo de 500 linhas para minimizar o bloat de contexto. Divida o conteúdo em arquivos separados quando se aproximar desse limite. Ao dividir conteúdo em outros arquivos, é muito importante referenciá-los no SKILL.md e descrever claramente quando lê-los, para garantir que o leitor da skill saiba que existem e quando usá-los.

**Princípio-chave:** Quando uma skill suporta múltiplas variações, frameworks ou opções, mantenha apenas o fluxo de trabalho principal e a orientação de seleção no SKILL.md. Mova detalhes específicos de variantes (padrões, exemplos, configuração) para arquivos de referência separados.

**Padrão 1: Guia de alto nível com referências**

```markdown
# Processamento de PDF

## Início rápido

Extraia texto com pdfplumber:
[exemplo de código]

## Funcionalidades avançadas

- **Preenchimento de formulários**: Veja [FORMS.md](FORMS.md) para guia completo
- **Referência da API**: Veja [REFERENCE.md](REFERENCE.md) para todos os métodos
- **Exemplos**: Veja [EXAMPLES.md](EXAMPLES.md) para padrões comuns
```

O agente carrega FORMS.md, REFERENCE.md ou EXAMPLES.md apenas quando necessário.

**Padrão 2: Organização específica por domínio**

Para Skills com múltiplos domínios, organize o conteúdo por domínio para evitar carregar contexto irrelevante:

```
bigquery-skill/
├── SKILL.md (visão geral e navegação)
└── reference/
    ├── finance.md (métricas de receita, faturamento)
    ├── sales.md (oportunidades, pipeline)
    ├── product.md (uso de API, funcionalidades)
    └── marketing.md (campanhas, atribuição)
```

Quando um usuário pergunta sobre métricas de vendas, o agente lê apenas sales.md.

Da mesma forma, para skills que suportam múltiplos frameworks ou variantes, organize por variante:

```
cloud-deploy/
├── SKILL.md (fluxo de trabalho + seleção de provedor)
└── references/
    ├── aws.md (padrões de deployment AWS)
    ├── gcp.md (padrões de deployment GCP)
    └── azure.md (padrões de deployment Azure)
```

Quando o usuário escolhe AWS, o agente lê apenas aws.md.

**Padrão 3: Detalhes condicionais**

Mostre conteúdo básico, link para conteúdo avançado:

```markdown
# Processamento DOCX

## Criando documentos

Use docx-js para novos documentos. Veja [DOCX-JS.md](DOCX-JS.md).

## Editando documentos

Para edições simples, modifique o XML diretamente.

**Para alterações rastreadas**: Veja [REDLINING.md](REDLINING.md)
**Para detalhes OOXML**: Veja [OOXML.md](OOXML.md)
```

O agente lê REDLINING.md ou OOXML.md apenas quando o usuário precisar dessas funcionalidades.

**Diretrizes importantes:**

- **Evite referências profundamente aninhadas** — Mantenha as referências a um nível de profundidade do SKILL.md. Todos os arquivos de referência devem ser linkados diretamente do SKILL.md.
- **Estruture arquivos de referência mais longos** — Para arquivos com mais de 100 linhas, inclua um índice no topo para que o agente possa ver o escopo completo ao pré-visualizar.

## Processo de Criação de Skill

A criação de skill envolve estas etapas:

1. Entender a skill com exemplos concretos
2. Planejar conteúdos reutilizáveis da skill (scripts, referências, ativos)
3. Inicializar a skill (executar init_skill.py)
4. Editar a skill (implementar recursos e escrever SKILL.md)
5. Empacotar a skill (executar package_skill.py)
6. Iterar com base no uso real

Siga estas etapas em ordem, pulando apenas quando houver um motivo claro pelo qual não são aplicáveis.

### Nomenclatura de Skill

- Use apenas letras minúsculas, dígitos e hífens; normalize títulos fornecidos pelo usuário para hyphen-case (ex: "Modo de Plano" -> `plano-modo`).
- Ao gerar nomes, gere um nome com menos de 64 caracteres (letras, dígitos, hífens).
- Prefira frases curtas com verbo que descrevam a ação.
- Use namespace por ferramenta quando melhora a clareza ou acionamento (ex: `gh-address-comments`, `linear-address-issue`).
- Nomeie a pasta da skill exatamente com o nome da skill.

### Etapa 1: Entender a Skill com Exemplos Concretos

Pule esta etapa apenas quando os padrões de uso da skill já estiverem claramente entendidos. Ainda é valiosa mesmo ao trabalhar com uma skill existente.

Para criar uma skill eficaz, entenda claramente exemplos concretos de como a skill será usada. Esse entendimento pode vir de exemplos diretos do usuário ou exemplos gerados validados com feedback do usuário.

Por exemplo, ao construir uma skill de editor de imagens, perguntas relevantes incluem:

- "Que funcionalidades a skill de editor de imagens deve suportar? Editar, girar, algo mais?"
- "Você pode dar exemplos de como essa skill seria usada?"
- "Imagino usuários pedindo coisas como 'Remova o olho vermelho desta imagem' ou 'Gire esta imagem'. Há outras formas que você imagina que essa skill seria usada?"
- "O que um usuário diria que deveria acionar esta skill?"

Para não sobrecarregar os usuários, evite fazer muitas perguntas em uma única mensagem. Comece com as perguntas mais importantes e faça perguntas de acompanhamento conforme necessário.

Conclua esta etapa quando houver uma noção clara da funcionalidade que a skill deve suportar.

### Etapa 2: Planejar os Conteúdos Reutilizáveis da Skill

Para transformar exemplos concretos em uma skill eficaz, analise cada exemplo:

1. Considere como executar o exemplo do zero
2. Identifique quais scripts, referências e ativos seriam úteis ao executar esses fluxos repetidamente

Exemplo: Ao construir uma skill `pdf-editor` para consultas como "Ajude-me a girar este PDF", a análise mostra:

1. Girar um PDF requer reescrever o mesmo código cada vez
2. Um script `scripts/rotate_pdf.py` seria útil para armazenar na skill

Exemplo: Ao projetar uma skill `frontend-webapp-builder` para consultas como "Crie um app de tarefas", a análise mostra:

1. Escrever um webapp frontend requer o mesmo boilerplate HTML/React cada vez
2. Um template `assets/hello-world/` contendo os arquivos boilerplate HTML/React seria útil

Exemplo: Ao construir uma skill `big-query` para consultas como "Quantos usuários fizeram login hoje?", a análise mostra:

1. Consultar o BigQuery requer redescobrir os esquemas de tabela cada vez
2. Um arquivo `references/schema.md` documentando os esquemas de tabela seria útil

Para estabelecer o conteúdo da skill, analise cada exemplo concreto para criar uma lista dos recursos reutilizáveis a incluir: scripts, referências e ativos.

### Etapa 3: Inicializando a Skill

Neste ponto, é hora de criar a skill de fato.

Pule esta etapa apenas se a skill sendo desenvolvida já existe e iteração ou empacotamento é necessário. Nesse caso, continue para a próxima etapa.

Ao criar uma nova skill do zero, sempre execute o script `init_skill.py`. O script convenientemente gera um novo diretório de skill template que inclui automaticamente tudo que uma skill requer, tornando o processo de criação muito mais eficiente e confiável.

Uso:

```bash
scripts/init_skill.py <nome-da-skill> --path <diretório-de-saída> [--resources scripts,references,assets] [--examples]
```

Exemplos:

```bash
scripts/init_skill.py minha-skill --path skills/public
scripts/init_skill.py minha-skill --path skills/public --resources scripts,references
scripts/init_skill.py minha-skill --path skills/public --resources scripts --examples
```

O script:

- Cria o diretório da skill no caminho especificado
- Gera um template SKILL.md com frontmatter adequado e placeholders TODO
- Opcionalmente cria diretórios de recursos com base em `--resources`
- Opcionalmente adiciona arquivos de exemplo quando `--examples` está definido

Após a inicialização, personalize o SKILL.md e adicione recursos conforme necessário. Se usou `--examples`, substitua ou exclua arquivos placeholder.

### Etapa 4: Editar a Skill

Ao editar a skill (recém-gerada ou existente), lembre-se que a skill está sendo criada para outra instância do agente usar. Inclua informações que seriam benéficas e não óbvias para o agente. Considere que conhecimento procedural, detalhes específicos do domínio ou ativos reutilizáveis ajudariam outra instância a executar essas tarefas de forma mais eficaz.

#### Aprenda Padrões de Design Comprovados

Consulte estes guias úteis com base nas necessidades da sua skill:

- **Processos de várias etapas**: Veja references/workflows.md para fluxos de trabalho sequenciais e lógica condicional
- **Formatos de saída específicos ou padrões de qualidade**: Veja references/output-patterns.md para padrões de template e exemplo

Esses arquivos contêm melhores práticas estabelecidas para design eficaz de skills.

#### Comece com os Conteúdos Reutilizáveis da Skill

Para iniciar a implementação, comece com os recursos reutilizáveis identificados acima: arquivos `scripts/`, `references/` e `assets/`. Note que esta etapa pode requerer input do usuário. Por exemplo, ao implementar uma skill `brand-guidelines`, o usuário pode precisar fornecer ativos de marca ou templates para armazenar em `assets/`, ou documentação para `references/`.

Scripts adicionados devem ser testados executando-os de fato para garantir que não há bugs e que a saída corresponde ao esperado. Se há muitos scripts semelhantes, apenas uma amostra representativa precisa ser testada.

Se usou `--examples`, exclua arquivos placeholder que não são necessários para a skill. Crie apenas diretórios de recursos que são realmente necessários.

#### Atualize o SKILL.md

**Diretrizes de escrita:** Sempre use forma imperativa/infinitiva.

##### Frontmatter

Escreva o frontmatter YAML com `name` e `description`:

- `name`: O nome da skill
- `description`: Este é o mecanismo principal de acionamento da sua skill, e ajuda o agente a entender quando usar a skill.
  - Inclua tanto o que a Skill faz quanto os acionadores/contextos específicos para quando usá-la.
  - Inclua todas as informações de "quando usar" aqui — Não no corpo. O corpo só é carregado após o acionamento, então seções "Quando Usar Esta Skill" no corpo não são úteis.
  - Exemplo de descrição para uma skill `docx`: "Criação, edição e análise abrangente de documentos com suporte para alterações rastreadas, comentários, preservação de formatação e extração de texto. Use quando o agente precisar trabalhar com documentos profissionais (.docx) para: (1) Criar novos documentos, (2) Modificar ou editar conteúdo, (3) Trabalhar com alterações rastreadas, (4) Adicionar comentários, ou qualquer outra tarefa de documento"

Não inclua nenhum outro campo no frontmatter YAML.

##### Corpo

Escreva instruções para usar a skill e seus recursos agrupados.

### Etapa 5: Empacotando uma Skill

Uma vez que o desenvolvimento da skill esteja completo, ela deve ser empacotada em um arquivo .skill distribuível. O processo de empacotamento valida automaticamente a skill primeiro:

```bash
scripts/package_skill.py <caminho/para/pasta-da-skill>
```

Especificação opcional do diretório de saída:

```bash
scripts/package_skill.py <caminho/para/pasta-da-skill> ./dist
```

O script de empacotamento irá:

1. **Validar** a skill automaticamente, verificando:
   - Formato frontmatter YAML e campos obrigatórios
   - Convenções de nomenclatura e estrutura de diretórios
   - Completude e qualidade da descrição
   - Organização de arquivos e referências de recursos

2. **Empacotar** a skill se a validação passar, criando um arquivo .skill nomeado após a skill (ex: `minha-skill.skill`) que inclui todos os arquivos e mantém a estrutura de diretórios adequada para distribuição. O arquivo .skill é um arquivo zip com extensão .skill.

   Restrição de segurança: symlinks são rejeitados e o empacotamento falha quando algum symlink está presente.

Se a validação falhar, o script reportará os erros e sairá sem criar um pacote. Corrija os erros de validação e execute o comando de empacotamento novamente.

### Etapa 6: Iterar

Após testar a skill, os usuários podem solicitar melhorias. Frequentemente isso acontece logo após usar a skill, com contexto fresco de como a skill se saiu.

**Fluxo de iteração:**

1. Use a skill em tarefas reais
2. Observe dificuldades ou ineficiências
3. Identifique como o SKILL.md ou recursos agrupados devem ser atualizados
4. Implemente as mudanças e teste novamente
