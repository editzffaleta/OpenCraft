# Biblioteca Padrão do OpenProse

Programas principais distribuídos com o OpenProse. Programas de qualidade de produção, bem testados para tarefas comuns.

## Programas

### Avaliação e melhoria

| Programa                 | Descrição                                                            |
| ------------------------ | -------------------------------------------------------------------- |
| `inspector.prose`        | Análise pós-execução para fidelidade de runtime e eficácia da tarefa |
| `vm-improver.prose`      | Analisa inspeções e propõe PRs para melhorar a VM                    |
| `program-improver.prose` | Analisa inspeções e propõe PRs para melhorar o código-fonte .prose   |
| `cost-analyzer.prose`    | Análise de uso de tokens e padrões de custo                          |
| `calibrator.prose`       | Valida avaliações leves em relação a avaliações profundas            |
| `error-forensics.prose`  | Análise de causa raiz para execuções com falha                       |

### Memória

| Programa               | Descrição                                      |
| ---------------------- | ---------------------------------------------- |
| `user-memory.prose`    | Memória pessoal persistente entre projetos     |
| `project-memory.prose` | Memória institucional com escopo de projeto    |

## O ciclo de melhoria

Os programas de avaliação formam um ciclo de melhoria recursivo:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Executar Programa  ──►  Inspector  ──►  VM Improver ──► PR │
│        ▲                     │                              │
│        │                     ▼                              │
│        │              Program Improver ──► PR               │
│        │                     │                              │
│        └─────────────────────┘                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Análise de suporte:

- **cost-analyzer** — Para onde vai o dinheiro? Oportunidades de otimização.
- **calibrator** — Avaliações baratas são proxies confiáveis para avaliações caras?
- **error-forensics** — Por que uma execução falhou? Análise de causa raiz.

## Uso

```bash
# Inspecionar uma execução concluída
prose run lib/inspector.prose
# Entradas: run_path, depth (light|deep), target (vm|task|all)

# Propor melhorias à VM
prose run lib/vm-improver.prose
# Entradas: inspection_path, prose_repo

# Propor melhorias ao programa
prose run lib/program-improver.prose
# Entradas: inspection_path, run_path

# Analisar custos
prose run lib/cost-analyzer.prose
# Entradas: run_path, scope (single|compare|trend)

# Validar avaliação leve vs profunda
prose run lib/calibrator.prose
# Entradas: run_paths, sample_size

# Investigar falhas
prose run lib/error-forensics.prose
# Entradas: run_path, focus (vm|program|context|external)

# Programas de memória (recomenda backend sqlite+)
prose run lib/user-memory.prose --backend sqlite+
# Entradas: mode (teach|query|reflect), content

prose run lib/project-memory.prose --backend sqlite+
# Entradas: mode (ingest|query|update|summarize), content
```

## Programas de memória

Os programas de memória usam agentes persistentes para acumular conhecimento:

**user-memory** (`persist: user`)

- Aprende suas preferências, decisões e padrões em todos os projetos
- Lembra erros e lições aprendidas
- Responde perguntas a partir do conhecimento acumulado

**project-memory** (`persist: project`)

- Entende a arquitetura e as decisões deste projeto
- Rastreia por que as coisas são do jeito que são
- Responde perguntas com contexto específico do projeto

Ambos recomendam `--backend sqlite+` para persistência durável.

## Princípios de design

1. **Pronto para produção** — Testado, documentado, trata casos extremos
2. **Componível** — Pode ser importado via `use` em outros programas
3. **Estado com escopo de usuário** — Utilitários entre projetos usam `persist: user`
4. **Dependências mínimas** — Nenhum serviço externo necessário
5. **Contratos claros** — Entradas e saídas bem definidas
6. **Valor incremental** — Útil no modo simples, mais poderoso com profundidade
