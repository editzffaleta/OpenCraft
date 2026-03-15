# Contribuindo com o OpenCraft

Bem-vindo à comunidade OpenCraft! 🛠️

## Links Rápidos

- **GitHub:** https://github.com/editzffaleta/OpenCraft
- **Visão:** [`VISION.md`](VISION.md)

## Como Contribuir

1. **Bugs e pequenas correções** → Abra um PR!
2. **Novas funcionalidades / arquitetura** → Abra uma [GitHub Discussion](https://github.com/editzffaleta/OpenCraft/discussions) ou issue primeiro
3. **Dúvidas** → Abra uma issue com a tag `question`

## Antes de Abrir um PR

- Teste localmente com sua instância do OpenCraft
- Execute os testes: `pnpm build && pnpm check && pnpm test`
- Garanta que os checks de CI passam
- Mantenha os PRs focados (uma coisa por PR; não misture preocupações não relacionadas)
- Descreva o quê e por quê
- Responda ou resolva conversas de revisão de bots que você endereçou antes de pedir revisão novamente
- **Inclua screenshots** — uma mostrando o problema/antes, outra mostrando a correção/depois (para mudanças de UI ou visuais)
- Use ortografia e gramática brasileira em código, comentários, docs e strings de UI
- Não edite arquivos cobertos por regras de `CODEOWNERS` de segurança a menos que um dos owners listados pediu explicitamente a mudança

## Conversas de Revisão São de Responsabilidade do Autor

Se um bot de revisão deixar conversas no seu PR, você é responsável pelo acompanhamento:

- Resolva a conversa você mesmo quando o código ou explicação endereça completamente a preocupação
- Responda e deixe aberto apenas quando precisar de julgamento do mantenedor ou revisor
- Não deixe conversas de bots "corrigidas" para os mantenedores limparem

## UI de Controle — Decorators

A Control UI usa Lit com decorators **legados** (o Rollup atual não suporta campos `accessor` necessários para decorators padrão). Ao adicionar campos reativos, mantenha o estilo legado:

```ts
@state() foo = "bar";
@property({ type: Number }) count = 0;
```

O `tsconfig.json` raiz está configurado para decorators legados (`experimentalDecorators: true`)
com `useDefineForClassFields: false`. Evite alterar isso a menos que também esteja atualizando
as ferramentas de build da UI para suportar decorators padrão.

## PRs com Assistência de IA são Bem-vindos! 🤖

Construiu com Claude, Codex ou outras ferramentas de IA? **Ótimo — só identifique!**

Por favor inclua no seu PR:

- [ ] Marque como assistido por IA no título ou descrição do PR
- [ ] Note o grau de testes (não testado / testado levemente / totalmente testado)
- [ ] Inclua prompts ou logs de sessão se possível (muito útil!)
- [ ] Confirme que você entende o que o código faz
- [ ] Resolva ou responda conversas de revisão de bots depois de endereçá-las

PRs com IA são cidadãos de primeira classe aqui. Queremos apenas transparência para que os revisores saibam o que procurar.

## Foco Atual & Roadmap 🗺

Estamos priorizando atualmente:

- **Estabilidade**: Correção de casos extremos em conexões de canal (WhatsApp/Telegram).
- **UX**: Melhorar o wizard de onboarding e mensagens de erro.
- **Habilidades**: Para contribuições de habilidades, publique diretamente como pacote npm.
- **Performance**: Otimizando uso de tokens e lógica de compactação.
- **i18n**: Mantendo a tradução pt-BR atualizada e expandindo suporte a idiomas.

Verifique as [Issues do GitHub](https://github.com/editzffaleta/OpenCraft/issues) pelas labels `good first issue` e `help wanted`!

## Reportar uma Vulnerabilidade

Veja [SECURITY.md](SECURITY.md) para instruções completas de reporte de vulnerabilidades.

Para questões de segurança no projeto original upstream, reporte em:
- **Core CLI e gateway** — [openclaw/openclaw](https://github.com/openclaw/openclaw)

### Campos Obrigatórios no Reporte

1. **Título**
2. **Avaliação de Severidade**
3. **Impacto**
4. **Componente Afetado**
5. **Reprodução Técnica**
6. **Impacto Demonstrado**
7. **Ambiente**
8. **Conselho de Remediação**

Reportes sem passos de reprodução, impacto demonstrado e conselho de remediação serão despriorizados.
