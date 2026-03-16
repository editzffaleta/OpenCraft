# Contribuindo para o Modelo de Ameaças do OpenCraft

Obrigado por ajudar a tornar o OpenCraft mais seguro. Este modelo de ameaças é um documento vivo e recebemos contribuições de qualquer pessoa — você não precisa ser um especialista em segurança.

## Formas de Contribuir

### Adicionar uma Ameaça

Identificou um vetor de ataque ou risco que ainda não cobrimos? Abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues) e descreva com suas próprias palavras. Você não precisa conhecer nenhum framework ou preencher todos os campos — apenas descreva o cenário.

**Útil incluir (mas não obrigatório):**

- O cenário de ataque e como poderia ser explorado
- Quais partes do OpenCraft são afetadas (CLI, gateway, canais, ClawHub, servidores MCP, etc.)
- O quão grave você acha que é (baixo / médio / alto / crítico)
- Quaisquer links para pesquisas relacionadas, CVEs ou exemplos do mundo real

Faremos o mapeamento ATLAS, atribuição de IDs de ameaça e avaliação de risco durante a revisão. Se você quiser incluir esses detalhes, ótimo — mas não é esperado.

> **Isso é para adicionar ao modelo de ameaças, não para reportar vulnerabilidades ativas.** Se você encontrou uma vulnerabilidade explorável, consulte nossa [página de Confiança](https://trust.openclaw.ai) para instruções de divulgação responsável.

### Sugerir uma Mitigação

Tem uma ideia de como tratar uma ameaça existente? Abra uma issue ou PR referenciando a ameaça. Mitigações úteis são específicas e acionáveis — por exemplo, "limitação de taxa por remetente de 10 mensagens/minuto no gateway" é melhor do que "implementar limitação de taxa".

### Propor uma Cadeia de Ataque

Cadeias de ataque mostram como múltiplas ameaças se combinam em um cenário de ataque realista. Se você vê uma combinação perigosa, descreva os passos e como um atacante os encadearia. Uma narrativa curta de como o ataque se desenrola na prática é mais valiosa do que um modelo formal.

### Corrigir ou Melhorar o Conteúdo Existente

Erros tipográficos, esclarecimentos, informações desatualizadas, melhores exemplos — PRs são bem-vindos, sem necessidade de issue.

## O Que Usamos

### MITRE ATLAS

Este modelo de ameaças é construído sobre o [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), um framework projetado especificamente para ameaças de IA/ML como injeção de prompt, uso indevido de ferramentas e exploração de agentes. Você não precisa conhecer o ATLAS para contribuir — mapeamos as submissões ao framework durante a revisão.

### IDs de Ameaça

Cada ameaça recebe um ID como `T-EXEC-003`. As categorias são:

| Código  | Categoria                                  |
| ------- | ------------------------------------------ |
| RECON   | Reconhecimento - coleta de informações     |
| ACCESS  | Acesso inicial - obtenção de entrada       |
| EXEC    | Execução - realização de ações maliciosas  |
| PERSIST | Persistência - manutenção de acesso        |
| EVADE   | Evasão de defesa - evitar detecção         |
| DISC    | Descoberta - aprendizado sobre o ambiente  |
| EXFIL   | Exfiltração - roubo de dados               |
| IMPACT  | Impacto - dano ou perturbação              |

Os IDs são atribuídos pelos mantenedores durante a revisão. Você não precisa escolher um.

### Níveis de Risco

| Nível        | Significado                                                             |
| ------------ | ----------------------------------------------------------------------- |
| **Crítico**  | Comprometimento total do sistema, ou alta probabilidade + impacto crítico |
| **Alto**     | Dano significativo provável, ou probabilidade média + impacto crítico   |
| **Médio**    | Risco moderado, ou baixa probabilidade + alto impacto                  |
| **Baixo**    | Improvável e impacto limitado                                           |

Se você não tem certeza sobre o nível de risco, apenas descreva o impacto e nós avaliaremos.

## Processo de Revisão

1. **Triagem** - Revisamos novas submissões em até 48 horas
2. **Avaliação** - Verificamos viabilidade, atribuímos mapeamento ATLAS e ID de ameaça, validamos o nível de risco
3. **Documentação** - Garantimos que tudo está formatado e completo
4. **Merge** - Adicionado ao modelo de ameaças e à visualização

## Recursos

- [Site ATLAS](https://atlas.mitre.org/)
- [Técnicas ATLAS](https://atlas.mitre.org/techniques/)
- [Estudos de Caso ATLAS](https://atlas.mitre.org/studies/)
- [Modelo de Ameaças do OpenCraft](/security/THREAT-MODEL-ATLAS)

## Contato

- **Vulnerabilidades de segurança:** Consulte nossa [página de Confiança](https://trust.openclaw.ai) para instruções de reporte
- **Dúvidas sobre o modelo de ameaças:** Abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Chat geral:** Canal #security no Discord

## Reconhecimento

Os contribuidores do modelo de ameaças são reconhecidos nos agradecimentos do modelo de ameaças, notas de versão e no hall da fama de segurança do OpenCraft para contribuições significativas.
