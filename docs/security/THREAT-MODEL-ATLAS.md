# Modelo de Ameaças do OpenCraft v1.0

## Framework MITRE ATLAS

**Versão:** 1.0-rascunho
**Última Atualização:** 2026-02-04
**Metodologia:** MITRE ATLAS + Diagramas de Fluxo de Dados
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Atribuição do Framework

Este modelo de ameaças é construído sobre o [MITRE ATLAS](https://atlas.mitre.org/), o framework padrão da indústria para documentar ameaças adversariais a sistemas de IA/ML. O ATLAS é mantido pelo [MITRE](https://www.mitre.org/) em colaboração com a comunidade de segurança de IA.

**Recursos-chave do ATLAS:**

- [Técnicas ATLAS](https://atlas.mitre.org/techniques/)
- [Táticas ATLAS](https://atlas.mitre.org/tactics/)
- [Estudos de Caso ATLAS](https://atlas.mitre.org/studies/)
- [GitHub ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Contribuindo para o ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuindo para Este Modelo de Ameaças

Este é um documento vivo mantido pela comunidade OpenCraft. Consulte [CONTRIBUTING-THREAT-MODEL.md](/security/CONTRIBUTING-THREAT-MODEL) para orientações sobre como contribuir:

- Reportar novas ameaças
- Atualizar ameaças existentes
- Propor cadeias de ataque
- Sugerir mitigações

---

## 1. Introdução

### 1.1 Objetivo

Este modelo de ameaças documenta ameaças adversariais à plataforma de agentes de IA OpenCraft e ao marketplace de habilidades ClawHub, usando o framework MITRE ATLAS projetado especificamente para sistemas de IA/ML.

### 1.2 Escopo

| Componente                  | Incluído | Notas                                                  |
| --------------------------- | -------- | ------------------------------------------------------ |
| Runtime do Agente OpenCraft | Sim      | Execução do agente principal, chamadas de ferramentas, sessões |
| Gateway                     | Sim      | Autenticação, roteamento, integração com canais        |
| Integrações de Canais       | Sim      | WhatsApp, Telegram, Discord, Signal, Slack, etc.       |
| Marketplace ClawHub         | Sim      | Publicação de habilidades, moderação, distribuição     |
| Servidores MCP              | Sim      | Provedores de ferramentas externas                     |
| Dispositivos do Usuário     | Parcial  | Aplicativos móveis, clientes desktop                   |

### 1.3 Fora do Escopo

Nada está explicitamente fora do escopo deste modelo de ameaças.

---

## 2. Arquitetura do Sistema

### 2.1 Fronteiras de Confiança

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA NÃO CONFIÁVEL                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FRONTEIRA DE CONFIANÇA 1: Acesso ao Canal         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Pareamento de Dispositivo (período de carência de 30s) │   │
│  │  • Validação AllowFrom / AllowList                        │   │
│  │  • Autenticação Token/Senha/Tailscale                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FRONTEIRA DE CONFIANÇA 2: Isolamento de Sessão   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SESSÕES DE AGENTE                       │   │
│  │  • Chave de sessão = agente:canal:par                     │   │
│  │  • Políticas de ferramentas por agente                    │   │
│  │  • Registro de transcrição                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FRONTEIRA DE CONFIANÇA 3: Execução de Ferramentas │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  SANDBOX DE EXECUÇÃO                      │   │
│  │  • Sandbox Docker OU Host (exec-approvals)                │   │
│  │  • Execução remota de Node                               │   │
│  │  • Proteção SSRF (fixação DNS + bloqueio de IP)           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FRONTEIRA DE CONFIANÇA 4: Conteúdo Externo        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              URLs BUSCADAS / EMAILS / WEBHOOKS            │   │
│  │  • Envolvimento de conteúdo externo (tags XML)            │   │
│  │  • Injeção de aviso de segurança                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FRONTEIRA DE CONFIANÇA 5: Cadeia de Suprimentos   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publicação de habilidades (semver, SKILL.md obrigatório) │  │
│  │  • Flags de moderação baseados em padrões                 │   │
│  │  • Varredura VirusTotal (em breve)                        │   │
│  │  • Verificação de idade da conta GitHub                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Fluxos de Dados

| Fluxo | Origem  | Destino | Dados                  | Proteção                     |
| ----- | ------- | ------- | ---------------------- | ---------------------------- |
| F1    | Canal   | Gateway | Mensagens do usuário   | TLS, AllowFrom               |
| F2    | Gateway | Agente  | Mensagens roteadas     | Isolamento de sessão          |
| F3    | Agente  | Ferramentas | Invocações de ferramentas | Aplicação de políticas |
| F4    | Agente  | Externo | Requisições web_fetch  | Bloqueio SSRF                |
| F5    | ClawHub | Agente  | Código de habilidade   | Moderação, varredura          |
| F6    | Agente  | Canal   | Respostas              | Filtragem de saída            |

---

## 3. Análise de Ameaças por Tática ATLAS

### 3.1 Reconhecimento (AML.TA0002)

#### T-RECON-001: Descoberta de Endpoint do Agente

| Atributo                | Valor                                                                             |
| ----------------------- | --------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Varredura Ativa                                                       |
| **Descrição**           | Atacante varre endpoints de gateway OpenCraft expostos                            |
| **Vetor de Ataque**     | Varredura de rede, consultas Shodan, enumeração DNS                               |
| **Componentes Afetados**| Gateway, endpoints de API expostos                                                |
| **Mitigações Atuais**   | Opção de autenticação Tailscale, vinculação ao loopback por padrão                |
| **Risco Residual**      | Médio - Gateways públicos são descobríveis                                        |
| **Recomendações**       | Documentar implantação segura, adicionar limitação de taxa nos endpoints de descoberta |

#### T-RECON-002: Sondagem de Integração de Canal

| Atributo                | Valor                                                                       |
| ----------------------- | --------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Varredura Ativa                                                 |
| **Descrição**           | Atacante sonda canais de mensagens para identificar contas gerenciadas por IA |
| **Vetor de Ataque**     | Envio de mensagens de teste, observação de padrões de resposta              |
| **Componentes Afetados**| Todas as integrações de canais                                              |
| **Mitigações Atuais**   | Nenhuma específica                                                          |
| **Risco Residual**      | Baixo - Valor limitado apenas com a descoberta                              |
| **Recomendações**       | Considerar aleatorização do tempo de resposta                               |

---

### 3.2 Acesso Inicial (AML.TA0004)

#### T-ACCESS-001: Interceptação de Código de Pareamento

| Atributo                | Valor                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acesso à API de Inferência de Modelo de IA                  |
| **Descrição**           | Atacante intercepta código de pareamento durante o período de carência de 30s |
| **Vetor de Ataque**     | Espionagem visual, captura de rede, engenharia social                   |
| **Componentes Afetados**| Sistema de pareamento de dispositivos                                   |
| **Mitigações Atuais**   | Expiração em 30s, códigos enviados pelo canal existente                 |
| **Risco Residual**      | Médio - Período de carência explorável                                  |
| **Recomendações**       | Reduzir período de carência, adicionar etapa de confirmação             |

#### T-ACCESS-002: Falsificação de AllowFrom

| Atributo                | Valor                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acesso à API de Inferência de Modelo de IA                                   |
| **Descrição**           | Atacante falsifica a identidade de remetente permitida no canal                          |
| **Vetor de Ataque**     | Depende do canal - falsificação de número de telefone, personificação de nome de usuário |
| **Componentes Afetados**| Validação AllowFrom por canal                                                            |
| **Mitigações Atuais**   | Verificação de identidade específica por canal                                           |
| **Risco Residual**      | Médio - Alguns canais são vulneráveis à falsificação                                     |
| **Recomendações**       | Documentar riscos específicos por canal, adicionar verificação criptográfica quando possível |

#### T-ACCESS-003: Roubo de Token

| Atributo                | Valor                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - Acesso à API de Inferência de Modelo de IA                   |
| **Descrição**           | Atacante rouba tokens de autenticação de arquivos de configuração        |
| **Vetor de Ataque**     | Malware, acesso não autorizado ao dispositivo, exposição de backup de configuração |
| **Componentes Afetados**| `~/.opencraft/credentials/`, armazenamento de configuração               |
| **Mitigações Atuais**   | Permissões de arquivo                                                    |
| **Risco Residual**      | Alto - Tokens armazenados em texto simples                               |
| **Recomendações**       | Implementar criptografia de token em repouso, adicionar rotação de token |

---

### 3.3 Execução (AML.TA0005)

#### T-EXEC-001: Injeção de Prompt Direta

| Atributo                | Valor                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Injeção de Prompt em LLM: Direta                                               |
| **Descrição**           | Atacante envia prompts elaborados para manipular o comportamento do agente                     |
| **Vetor de Ataque**     | Mensagens de canal contendo instruções adversariais                                            |
| **Componentes Afetados**| LLM do agente, todas as superfícies de entrada                                                 |
| **Mitigações Atuais**   | Detecção de padrões, envolvimento de conteúdo externo                                          |
| **Risco Residual**      | Crítico - Apenas detecção, sem bloqueio; ataques sofisticados contornam                        |
| **Recomendações**       | Implementar defesa em múltiplas camadas, validação de saída, confirmação do usuário para ações sensíveis |

#### T-EXEC-002: Injeção de Prompt Indireta

| Atributo                | Valor                                                                       |
| ----------------------- | --------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.001 - Injeção de Prompt em LLM: Indireta                          |
| **Descrição**           | Atacante embute instruções maliciosas em conteúdo buscado                   |
| **Vetor de Ataque**     | URLs maliciosas, emails envenenados, webhooks comprometidos                 |
| **Componentes Afetados**| web_fetch, ingestão de email, fontes de dados externas                      |
| **Mitigações Atuais**   | Envolvimento de conteúdo com tags XML e aviso de segurança                  |
| **Risco Residual**      | Alto - O LLM pode ignorar instruções do wrapper                             |
| **Recomendações**       | Implementar sanitização de conteúdo, separar contextos de execução          |

#### T-EXEC-003: Injeção de Argumentos de Ferramentas

| Atributo                | Valor                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Injeção de Prompt em LLM: Direta                              |
| **Descrição**           | Atacante manipula argumentos de ferramentas por meio de injeção de prompt     |
| **Vetor de Ataque**     | Prompts elaborados que influenciam os valores dos parâmetros de ferramentas   |
| **Componentes Afetados**| Todas as invocações de ferramentas                                            |
| **Mitigações Atuais**   | Aprovações de execução para comandos perigosos                                |
| **Risco Residual**      | Alto - Depende do julgamento do usuário                                       |
| **Recomendações**       | Implementar validação de argumentos, chamadas de ferramentas parametrizadas   |

#### T-EXEC-004: Bypass de Aprovação de Execução

| Atributo                | Valor                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0043 - Criação de Dados Adversariais                                |
| **Descrição**           | Atacante elabora comandos que contornam a lista de permissões de aprovação |
| **Vetor de Ataque**     | Ofuscação de comandos, exploração de alias, manipulação de caminho       |
| **Componentes Afetados**| exec-approvals.ts, lista de permissões de comandos                      |
| **Mitigações Atuais**   | Lista de permissões + modo de pergunta                                   |
| **Risco Residual**      | Alto - Sem sanitização de comando                                        |
| **Recomendações**       | Implementar normalização de comandos, expandir lista de bloqueio         |

---

### 3.4 Persistência (AML.TA0006)

#### T-PERSIST-001: Instalação de Habilidade Maliciosa

| Atributo                | Valor                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Comprometimento da Cadeia de Suprimentos: Software de IA       |
| **Descrição**           | Atacante publica habilidade maliciosa no ClawHub                               |
| **Vetor de Ataque**     | Criar conta, publicar habilidade com código malicioso oculto                   |
| **Componentes Afetados**| ClawHub, carregamento de habilidades, execução do agente                       |
| **Mitigações Atuais**   | Verificação de idade da conta GitHub, flags de moderação baseados em padrões   |
| **Risco Residual**      | Crítico - Sem sandbox, revisão limitada                                        |
| **Recomendações**       | Integração VirusTotal (em andamento), sandbox de habilidades, revisão comunitária |

#### T-PERSIST-002: Envenenamento de Atualização de Habilidade

| Atributo                | Valor                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Comprometimento da Cadeia de Suprimentos: Software de IA       |
| **Descrição**           | Atacante compromete habilidade popular e publica atualização maliciosa         |
| **Vetor de Ataque**     | Comprometimento de conta, engenharia social do proprietário da habilidade      |
| **Componentes Afetados**| Versionamento ClawHub, fluxos de atualização automática                        |
| **Mitigações Atuais**   | Impressão digital de versão                                                    |
| **Risco Residual**      | Alto - Atualizações automáticas podem puxar versões maliciosas                 |
| **Recomendações**       | Implementar assinatura de atualização, capacidade de rollback, fixação de versão |

#### T-PERSIST-003: Adulteração de Configuração do Agente

| Atributo                | Valor                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Comprometimento da Cadeia de Suprimentos: Dados               |
| **Descrição**           | Atacante modifica configuração do agente para persistir o acesso              |
| **Vetor de Ataque**     | Modificação de arquivo de configuração, injeção de configurações              |
| **Componentes Afetados**| Configuração do agente, políticas de ferramentas                              |
| **Mitigações Atuais**   | Permissões de arquivo                                                         |
| **Risco Residual**      | Médio - Requer acesso local                                                   |
| **Recomendações**       | Verificação de integridade da configuração, registro de auditoria para alterações |

---

### 3.5 Evasão de Defesa (AML.TA0007)

#### T-EVADE-001: Bypass de Padrão de Moderação

| Atributo                | Valor                                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Criação de Dados Adversariais                                       |
| **Descrição**           | Atacante elabora conteúdo de habilidade para evadir padrões de moderação        |
| **Vetor de Ataque**     | Homóglifos Unicode, truques de codificação, carregamento dinâmico               |
| **Componentes Afetados**| moderation.ts do ClawHub                                                        |
| **Mitigações Atuais**   | FLAG_RULES baseado em padrões                                                   |
| **Risco Residual**      | Alto - Regex simples facilmente contornado                                      |
| **Recomendações**       | Adicionar análise comportamental (VirusTotal Code Insight), detecção baseada em AST |

#### T-EVADE-002: Escape do Wrapper de Conteúdo

| Atributo                | Valor                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Criação de Dados Adversariais                                    |
| **Descrição**           | Atacante elabora conteúdo que escapa do contexto do wrapper XML              |
| **Vetor de Ataque**     | Manipulação de tags, confusão de contexto, substituição de instrução         |
| **Componentes Afetados**| Envolvimento de conteúdo externo                                             |
| **Mitigações Atuais**   | Tags XML + aviso de segurança                                                |
| **Risco Residual**      | Médio - Novos escapes são descobertos regularmente                           |
| **Recomendações**       | Múltiplas camadas de wrapper, validação no lado de saída                     |

---

### 3.6 Descoberta (AML.TA0008)

#### T-DISC-001: Enumeração de Ferramentas

| Atributo                | Valor                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acesso à API de Inferência de Modelo de IA         |
| **Descrição**           | Atacante enumera ferramentas disponíveis por meio de prompts   |
| **Vetor de Ataque**     | Consultas do tipo "Quais ferramentas você tem?"                |
| **Componentes Afetados**| Registro de ferramentas do agente                              |
| **Mitigações Atuais**   | Nenhuma específica                                             |
| **Risco Residual**      | Baixo - Ferramentas geralmente documentadas                    |
| **Recomendações**       | Considerar controles de visibilidade de ferramentas            |

#### T-DISC-002: Extração de Dados de Sessão

| Atributo                | Valor                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - Acesso à API de Inferência de Modelo de IA             |
| **Descrição**           | Atacante extrai dados sensíveis do contexto de sessão              |
| **Vetor de Ataque**     | Consultas "O que discutimos?", sondagem de contexto                |
| **Componentes Afetados**| Transcrições de sessão, janela de contexto                         |
| **Mitigações Atuais**   | Isolamento de sessão por remetente                                 |
| **Risco Residual**      | Médio - Dados dentro da sessão são acessíveis                      |
| **Recomendações**       | Implementar redação de dados sensíveis no contexto                 |

---

### 3.7 Coleta e Exfiltração (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Roubo de Dados via web_fetch

| Atributo                | Valor                                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Coleta                                                              |
| **Descrição**           | Atacante exfiltra dados instruindo o agente a enviar para URL externa           |
| **Vetor de Ataque**     | Injeção de prompt fazendo o agente fazer POST de dados para servidor do atacante |
| **Componentes Afetados**| Ferramenta web_fetch                                                            |
| **Mitigações Atuais**   | Bloqueio SSRF para redes internas                                               |
| **Risco Residual**      | Alto - URLs externas são permitidas                                             |
| **Recomendações**       | Implementar lista de permissões de URL, reconhecimento de classificação de dados |

#### T-EXFIL-002: Envio Não Autorizado de Mensagens

| Atributo                | Valor                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Coleta                                                      |
| **Descrição**           | Atacante faz o agente enviar mensagens contendo dados sensíveis         |
| **Vetor de Ataque**     | Injeção de prompt fazendo o agente enviar mensagem ao atacante          |
| **Componentes Afetados**| Ferramenta de mensagem, integrações de canais                           |
| **Mitigações Atuais**   | Controle de mensagens de saída                                          |
| **Risco Residual**      | Médio - O controle pode ser contornado                                  |
| **Recomendações**       | Exigir confirmação explícita para novos destinatários                   |

#### T-EXFIL-003: Coleta de Credenciais

| Atributo                | Valor                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Coleta                                                         |
| **Descrição**           | Habilidade maliciosa coleta credenciais do contexto do agente              |
| **Vetor de Ataque**     | Código de habilidade lê variáveis de ambiente, arquivos de configuração    |
| **Componentes Afetados**| Ambiente de execução de habilidades                                        |
| **Mitigações Atuais**   | Nenhuma específica para habilidades                                        |
| **Risco Residual**      | Crítico - Habilidades são executadas com privilégios do agente             |
| **Recomendações**       | Sandbox de habilidades, isolamento de credenciais                          |

---

### 3.8 Impacto (AML.TA0011)

#### T-IMPACT-001: Execução Não Autorizada de Comandos

| Atributo                | Valor                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosão da Integridade do Modelo de IA                         |
| **Descrição**           | Atacante executa comandos arbitrários no sistema do usuário               |
| **Vetor de Ataque**     | Injeção de prompt combinada com bypass de aprovação de execução           |
| **Componentes Afetados**| Ferramenta Bash, execução de comandos                                     |
| **Mitigações Atuais**   | Aprovações de execução, opção de sandbox Docker                           |
| **Risco Residual**      | Crítico - Execução no host sem sandbox                                    |
| **Recomendações**       | Usar sandbox por padrão, melhorar UX de aprovação                         |

#### T-IMPACT-002: Esgotamento de Recursos (DoS)

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosão da Integridade do Modelo de IA                    |
| **Descrição**           | Atacante esgota créditos de API ou recursos de computação            |
| **Vetor de Ataque**     | Inundação automatizada de mensagens, chamadas caras de ferramentas   |
| **Componentes Afetados**| Gateway, sessões de agente, provedor de API                          |
| **Mitigações Atuais**   | Nenhuma                                                              |
| **Risco Residual**      | Alto - Sem limitação de taxa                                         |
| **Recomendações**       | Implementar limites de taxa por remetente, orçamentos de custo       |

#### T-IMPACT-003: Dano à Reputação

| Atributo                | Valor                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosão da Integridade do Modelo de IA                          |
| **Descrição**           | Atacante faz o agente enviar conteúdo prejudicial/ofensivo                 |
| **Vetor de Ataque**     | Injeção de prompt causando respostas inadequadas                           |
| **Componentes Afetados**| Geração de saída, mensagens de canal                                       |
| **Mitigações Atuais**   | Políticas de conteúdo do provedor de LLM                                   |
| **Risco Residual**      | Médio - Filtros do provedor são imperfeitos                                |
| **Recomendações**       | Camada de filtragem de saída, controles do usuário                         |

---

## 4. Análise da Cadeia de Suprimentos do ClawHub

### 4.1 Controles de Segurança Atuais

| Controle               | Implementação               | Eficácia                                                              |
| ---------------------- | --------------------------- | --------------------------------------------------------------------- |
| Idade da Conta GitHub  | `requireGitHubAccountAge()` | Média - Eleva a barreira para novos atacantes                         |
| Sanitização de Caminho | `sanitizePath()`            | Alta - Previne path traversal                                         |
| Validação de Tipo de Arquivo | `isTextFile()`        | Média - Apenas arquivos de texto, mas ainda podem ser maliciosos      |
| Limites de Tamanho     | 50MB no bundle total        | Alta - Previne esgotamento de recursos                                |
| SKILL.md Obrigatório   | Readme obrigatório          | Baixo valor de segurança - Apenas informativo                         |
| Moderação por Padrões  | FLAG_RULES em moderation.ts | Baixa - Facilmente contornado                                         |
| Status de Moderação    | Campo `moderationStatus`    | Média - Revisão manual possível                                       |

### 4.2 Padrões de Flag de Moderação

Padrões atuais em `moderation.ts`:

```javascript
// Identificadores conhecidamente maliciosos
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Palavras-chave suspeitas
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limitações:**

- Verifica apenas slug, displayName, summary, frontmatter, metadata, caminhos de arquivo
- Não analisa o conteúdo real do código da habilidade
- Regex simples facilmente contornado com ofuscação
- Sem análise comportamental

### 4.3 Melhorias Planejadas

| Melhoria               | Status                                   | Impacto                                                                |
| ---------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| Integração VirusTotal  | Em Andamento                             | Alto - Análise comportamental do Code Insight                          |
| Denúncia Comunitária   | Parcial (tabela `skillReports` existe)   | Médio                                                                  |
| Registro de Auditoria  | Parcial (tabela `auditLogs` existe)      | Médio                                                                  |
| Sistema de Badges      | Implementado                             | Médio - `highlighted`, `official`, `deprecated`, `redactionApproved`  |

---

## 5. Matriz de Risco

### 5.1 Probabilidade vs Impacto

| ID da Ameaça  | Probabilidade | Impacto  | Nível de Risco | Prioridade |
| ------------- | ------------- | -------- | -------------- | ---------- |
| T-EXEC-001    | Alto          | Crítico  | **Crítico**    | P0         |
| T-PERSIST-001 | Alto          | Crítico  | **Crítico**    | P0         |
| T-EXFIL-003   | Médio         | Crítico  | **Crítico**    | P0         |
| T-IMPACT-001  | Médio         | Crítico  | **Alto**       | P1         |
| T-EXEC-002    | Alto          | Alto     | **Alto**       | P1         |
| T-EXEC-004    | Médio         | Alto     | **Alto**       | P1         |
| T-ACCESS-003  | Médio         | Alto     | **Alto**       | P1         |
| T-EXFIL-001   | Médio         | Alto     | **Alto**       | P1         |
| T-IMPACT-002  | Alto          | Médio    | **Alto**       | P1         |
| T-EVADE-001   | Alto          | Médio    | **Médio**      | P2         |
| T-ACCESS-001  | Baixo         | Alto     | **Médio**      | P2         |
| T-ACCESS-002  | Baixo         | Alto     | **Médio**      | P2         |
| T-PERSIST-002 | Baixo         | Alto     | **Médio**      | P2         |

### 5.2 Cadeias de Ataque do Caminho Crítico

**Cadeia de Ataque 1: Roubo de Dados via Habilidade**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publicar habilidade maliciosa) → (Evadir moderação) → (Coletar credenciais)
```

**Cadeia de Ataque 2: Injeção de Prompt para RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Injetar prompt) → (Contornar aprovação de execução) → (Executar comandos)
```

**Cadeia de Ataque 3: Injeção Indireta via Conteúdo Buscado**

```
T-EXEC-002 → T-EXFIL-001 → Exfiltração externa
(Envenenar conteúdo de URL) → (Agente busca e segue instruções) → (Dados enviados ao atacante)
```

---

## 6. Resumo de Recomendações

### 6.1 Imediato (P0)

| ID    | Recomendação                                       | Trata                      |
| ----- | -------------------------------------------------- | -------------------------- |
| R-001 | Completar integração VirusTotal                    | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementar sandbox de habilidades                 | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Adicionar validação de saída para ações sensíveis  | T-EXEC-001, T-EXEC-002     |

### 6.2 Curto Prazo (P1)

| ID    | Recomendação                                     | Trata        |
| ----- | ------------------------------------------------ | ------------ |
| R-004 | Implementar limitação de taxa                    | T-IMPACT-002 |
| R-005 | Adicionar criptografia de token em repouso       | T-ACCESS-003 |
| R-006 | Melhorar UX e validação de aprovação de execução | T-EXEC-004   |
| R-007 | Implementar lista de permissões de URL para web_fetch | T-EXFIL-001 |

### 6.3 Médio Prazo (P2)

| ID    | Recomendação                                                    | Trata         |
| ----- | --------------------------------------------------------------- | ------------- |
| R-008 | Adicionar verificação criptográfica de canal quando possível    | T-ACCESS-002  |
| R-009 | Implementar verificação de integridade de configuração          | T-PERSIST-003 |
| R-010 | Adicionar assinatura de atualização e fixação de versão         | T-PERSIST-002 |

---

## 7. Apêndices

### 7.1 Mapeamento de Técnicas ATLAS

| ID ATLAS      | Nome da Técnica                        | Ameaças no OpenCraft                                                     |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| AML.T0006     | Varredura Ativa                        | T-RECON-001, T-RECON-002                                                 |
| AML.T0009     | Coleta                                 | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                                   |
| AML.T0010.001 | Cadeia de Suprimentos: Software de IA  | T-PERSIST-001, T-PERSIST-002                                             |
| AML.T0010.002 | Cadeia de Suprimentos: Dados           | T-PERSIST-003                                                            |
| AML.T0031     | Erosão da Integridade do Modelo de IA  | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                                 |
| AML.T0040     | Acesso à API de Inferência de Modelo de IA | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002    |
| AML.T0043     | Criação de Dados Adversariais          | T-EXEC-004, T-EVADE-001, T-EVADE-002                                     |
| AML.T0051.000 | Injeção de Prompt em LLM: Direta       | T-EXEC-001, T-EXEC-003                                                   |
| AML.T0051.001 | Injeção de Prompt em LLM: Indireta     | T-EXEC-002                                                               |

### 7.2 Arquivos de Segurança Principais

| Caminho                             | Finalidade                        | Nível de Risco |
| ----------------------------------- | --------------------------------- | -------------- |
| `src/infra/exec-approvals.ts`       | Lógica de aprovação de comandos   | **Crítico**    |
| `src/gateway/auth.ts`               | Autenticação do gateway           | **Crítico**    |
| `src/web/inbound/access-control.ts` | Controle de acesso ao canal       | **Crítico**    |
| `src/infra/net/ssrf.ts`             | Proteção SSRF                     | **Crítico**    |
| `src/security/external-content.ts`  | Mitigação de injeção de prompt    | **Crítico**    |
| `src/agents/sandbox/tool-policy.ts` | Aplicação de políticas de ferramentas | **Crítico** |
| `convex/lib/moderation.ts`          | Moderação do ClawHub              | **Alto**       |
| `convex/lib/skillPublish.ts`        | Fluxo de publicação de habilidades | **Alto**      |
| `src/routing/resolve-route.ts`      | Isolamento de sessão              | **Médio**      |

### 7.3 Glossário

| Termo                | Definição                                                            |
| -------------------- | -------------------------------------------------------------------- |
| **ATLAS**            | Adversarial Threat Landscape for AI Systems do MITRE                 |
| **ClawHub**          | Marketplace de habilidades do OpenCraft                              |
| **Gateway**          | Camada de roteamento de mensagens e autenticação do OpenCraft        |
| **MCP**              | Model Context Protocol - interface do provedor de ferramentas        |
| **Injeção de Prompt**| Ataque onde instruções maliciosas são embutidas na entrada           |
| **Habilidade**       | Extensão baixável para agentes OpenCraft                             |
| **SSRF**             | Server-Side Request Forgery (Falsificação de Requisição do Lado do Servidor) |

---

_Este modelo de ameaças é um documento vivo. Reporte problemas de segurança para security@openclaw.ai_
