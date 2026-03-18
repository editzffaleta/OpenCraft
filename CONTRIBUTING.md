# Contribuindo com o OpenCraft

Bem-vindo ao tanque de lagostas! 🦞

## Links Rápidos

- **GitHub:** https://github.com/openclaw/openclaw
- **Visão:** [`VISION.md`](VISION.md)
- **Discord:** https://discord.gg/qkhbAGHRBT
- **X/Twitter:** [@steipete](https://x.com/steipete) / [@opencraft](https://x.com/opencraft)

## Mantenedores

- **Peter Steinberger** - Ditador Benevolente
  - GitHub: [@steipete](https://github.com/steipete) · X: [@steipete](https://x.com/steipete)

- **Shadow** - Subsistema Discord, admin do Discord, Clawhub, toda moderação da comunidade
  - GitHub: [@thewilloftheshadow](https://github.com/thewilloftheshadow) · X: [@4shadowed](https://x.com/4shadowed)

- **Vignesh** - Memória (QMD), modelagem formal, TUI, IRC e Lobster
  - GitHub: [@vignesh07](https://github.com/vignesh07) · X: [@\_vgnsh](https://x.com/_vgnsh)

- **Jos** - Telegram, API, modo Nix
  - GitHub: [@joshp123](https://github.com/joshp123) · X: [@jjpcodes](https://x.com/jjpcodes)

- **Ayaan Zaidi** - Subsistema Telegram, app Android
  - GitHub: [@obviyus](https://github.com/obviyus) · X: [@0bviyus](https://x.com/0bviyus)

- **Tyler Yust** - Agentes/subagentes, cron, BlueBubbles, app macOS
  - GitHub: [@tyler6204](https://github.com/tyler6204) · X: [@tyleryust](https://x.com/tyleryust)

- **Mariano Belinky** - App iOS, Segurança
  - GitHub: [@mbelinky](https://github.com/mbelinky) · X: [@belimad](https://x.com/belimad)

- **Nimrod Gutman** - App iOS, app macOS e funcionalidades crustáceas
  - GitHub: [@ngutman](https://github.com/ngutman) · X: [@theguti](https://x.com/theguti)

- **Vincent Koc** - Agentes, Telemetria, Hooks, Segurança
  - GitHub: [@vincentkoc](https://github.com/vincentkoc) · X: [@vincent_koc](https://x.com/vincent_koc)

- **Val Alexander** - UI/UX, Docs e DevX de Agentes
  - GitHub: [@BunsDev](https://github.com/BunsDev) · X: [@BunsDev](https://x.com/BunsDev)

- **Seb Slight** - Docs, Confiabilidade de Agentes, Hardening de Runtime
  - GitHub: [@sebslight](https://github.com/sebslight) · X: [@sebslig](https://x.com/sebslig)

- **Christoph Nakazawa** - Infraestrutura JS
  - GitHub: [@cpojer](https://github.com/cpojer) · X: [@cnakazawa](https://x.com/cnakazawa)

- **Gustavo Madeira Santana** - Multi-agentes, CLI, Performance, Plugins, Matrix
  - GitHub: [@gumadeiras](https://github.com/gumadeiras) · X: [@gumadeiras](https://x.com/gumadeiras)

- **Onur Solmaz** - Agentes, fluxos de dev, integrações ACP, MS Teams
  - GitHub: [@onutc](https://github.com/onutc), [@osolmaz](https://github.com/osolmaz) · X: [@onusoz](https://x.com/onusoz)

- **Josh Avant** - Core, CLI, Gateway, Segurança, Agentes
  - GitHub: [@joshavant](https://github.com/joshavant) · X: [@joshavant](https://x.com/joshavant)

- **Jonathan Taylor** - Subsistema ACP, funcionalidades/bugs do Gateway, CLIs Gog/Mog/Sog, SEDMAT
  - GitHub [@visionik](https://github.com/visionik) · X: [@visionik](https://x.com/visionik)

- **Josh Lehman** - Compactação, subsistema Tlon/Urbit
  - GitHub [@jalehman](https://github.com/jalehman) · X: [@jlehman\_](https://x.com/jlehman_)

- **Radek Sienkiewicz** - Docs, UI de Controle
  - GitHub [@velvet-shark](https://github.com/velvet-shark) · X: [@velvet_shark](https://twitter.com/velvet_shark)

- **Muhammed Mukhthar** - Mattermost, CLI
  - GitHub [@mukhtharcm](https://github.com/mukhtharcm) · X: [@mukhtharcm](https://x.com/mukhtharcm)

- **Altay** - Agentes, CLI, tratamento de erros
  - GitHub [@altaywtf](https://github.com/altaywtf) · X: [@altaywtf](https://x.com/altaywtf)

- **Robin Waslander** - Segurança, triagem de PRs, correção de bugs
  - GitHub: [@hydro13](https://github.com/hydro13) · X: [@Robin_waslander](https://x.com/Robin_waslander)

- **Tengji (George) Zhang** - APIs de modelos chineses, cloud, pi
  - GitHub: [@odysseus0](https://github.com/odysseus0) · X: [@odysseus0z](https://x.com/odysseus0z)

- **Andrew (Bubbles) Demczuk** - Agentes/Gateway/TTS/VTT
  - GitHub: [@ademczuk](https://github.com/ademczuk) · X: [@ademczuk](https://x.com/ademczuk)

## Como Contribuir

1. **Bugs & pequenas correções** → Abra um PR!
2. **Novas funcionalidades / arquitetura** → Inicie uma [Discussion no GitHub](https://github.com/openclaw/openclaw/discussions) ou pergunte no Discord primeiro
3. **Dúvidas** → Discord [#help](https://discord.com/channels/1456350064065904867/1459642797895319552) / [#users-helping-users](https://discord.com/channels/1456350064065904867/1459007081603403828)

## Antes de Abrir um PR

- Teste localmente com sua instância do OpenCraft
- Execute os testes: `pnpm build && pnpm check && pnpm test`
- Para mudanças em extensões/plugins, execute a lane local rápida primeiro:
  - `pnpm test:extension <nome-da-extensao>`
  - `pnpm test:extension --list` para ver os IDs de extensão válidos
  - Se você alterou superfícies compartilhadas de plugin ou canal, execute `pnpm test:contracts`
  - Para trabalho focado em superfícies compartilhadas, use `pnpm test:contracts:channels` ou `pnpm test:contracts:plugins`
  - Se você alterou comportamentos mais amplos do runtime, ainda execute as lanes mais amplas relevantes (`pnpm test:extensions`, `pnpm test:channels`, ou `pnpm test`) antes de pedir revisão
- Se você tem acesso ao Codex, execute `codex review --base origin/main` localmente antes de abrir ou atualizar seu PR. Trate isso como o padrão atual mais alto de revisão por IA, mesmo que o GitHub Codex review também rode.
- Garanta que as verificações de CI passem
- Mantenha PRs focados (uma coisa por PR; não misture preocupações não relacionadas)
- Descreva o quê & o porquê
- Responda ou resolva conversas de revisão de bots que você tratou antes de pedir revisão novamente
- **Inclua screenshots** — um mostrando o problema/antes, um mostrando a correção/depois (para mudanças de UI ou visuais)
- Use ortografia e gramática americanas em código, comentários, docs e strings de UI
- Não edite arquivos cobertos pela propriedade de segurança do `CODEOWNERS` a menos que um proprietário listado tenha pedido explicitamente a mudança ou já esteja revisando com você. Trate esses caminhos como superfícies de revisão restritas, não alvos de limpeza oportunistas.

## Conversas de Revisão São de Responsabilidade do Autor

Se um bot de revisão deixar conversas de revisão no seu PR, você é responsável pelo acompanhamento:

- Resolva a conversa você mesmo quando o código ou explicação tratar totalmente a preocupação do bot
- Responda e deixe aberta apenas quando precisar do julgamento de um mantenedor ou revisor
- Não deixe conversas de revisão de bots "corrigidas" para os mantenedores limparem por você
- Se o Codex deixar comentários, trate cada um relevante ou resolva com uma explicação curta quando não for aplicável à sua mudança
- Se o GitHub Codex review não disparar por algum motivo, execute `codex review --base origin/main` localmente de qualquer forma e trate esse output como trabalho de revisão obrigatório

Isso se aplica tanto a PRs feitos por humanos quanto por IA.

## Decoradores da Control UI

A Control UI usa Lit com decoradores **legados** (o parsing atual do Rollup não suporta
campos `accessor` necessários para decoradores padrão). Ao adicionar campos reativos, mantenha o
estilo legado:

```ts
@state() foo = "bar";
@property({ type: Number }) count = 0;
```

O `tsconfig.json` raiz está configurado para decoradores legados (`experimentalDecorators: true`)
com `useDefineForClassFields: false`. Evite alterar isso a menos que você também esteja atualizando a
tooling de build da UI para suportar decoradores padrão.

## PRs com IA/Vibe-Code São Bem-Vindos! 🤖

Construído com Codex, Claude ou outras ferramentas de IA? **Ótimo - apenas marque!**

Por favor inclua no seu PR:

- [ ] Marque como assistido por IA no título ou descrição do PR
- [ ] Indique o grau de testes (não testado / levemente testado / totalmente testado)
- [ ] Inclua prompts ou logs de sessão se possível (super útil!)
- [ ] Confirme que você entende o que o código faz
- [ ] Se você tem acesso ao Codex, execute `codex review --base origin/main` localmente e trate os achados antes de pedir revisão
- [ ] Resolva ou responda às conversas de revisão de bots após tratá-las

PRs com IA são cidadãos de primeira classe aqui. Queremos apenas transparência para que os revisores saibam o que procurar. Se você estiver usando um agente de codificação LLM, instrua-o a resolver conversas de revisão de bots que ele tratou em vez de deixá-las para os mantenedores.

## Foco Atual & Roadmap 🗺

Atualmente priorizamos:

- **Estabilidade**: Correção de casos extremos em conexões de canal (WhatsApp/Telegram).
- **UX**: Melhoria do wizard de onboarding e mensagens de erro.
- **Skills**: Para contribuições de skills, acesse o [ClawHub](https://clawhub.ai/) — o hub da comunidade para skills do OpenCraft.
- **Performance**: Otimização do uso de tokens e lógica de compactação.

Confira as [Issues do GitHub](https://github.com/openclaw/openclaw/issues) com labels "good first issue"!

## Mantenedores

Estamos expandindo seletivamente a equipe de mantenedores.
Se você é um contribuidor experiente que quer ajudar a moldar a direção do OpenCraft — seja através de código, docs ou comunidade — gostaríamos de ouvir de você.

Ser mantenedor é uma responsabilidade, não um título honorário. Esperamos envolvimento ativo e consistente — triagem de issues, revisão de PRs e ajuda para mover o projeto adiante.

Ainda interessado? Envie um email para contributing@opencraft.ai com:

- Links para seus PRs no OpenCraft (se você não tiver nenhum, comece por aí)
- Links para projetos open source que você mantém ou contribui ativamente
- Seus handles no GitHub, Discord e X/Twitter
- Uma breve introdução: background, experiência e áreas de interesse
- Idiomas que você fala e onde você está baseado
- Quanto tempo você pode realisticamente dedicar

Recebemos pessoas de todas as habilidades — engenharia, documentação, gestão de comunidade e mais.
Revisamos cada candidatura escrita apenas por humanos com cuidado e adicionamos mantenedores de forma lenta e deliberada.
Por favor, aguarde algumas semanas para uma resposta.

## Reportar uma Vulnerabilidade

Levamos relatórios de segurança a sério. Reporte vulnerabilidades diretamente ao repositório onde o problema está:

- **CLI e gateway principal** — [openclaw/openclaw](https://github.com/openclaw/openclaw)
- **App desktop macOS** — [openclaw/openclaw](https://github.com/openclaw/openclaw) (apps/macos)
- **App iOS** — [openclaw/openclaw](https://github.com/openclaw/openclaw) (apps/ios)
- **App Android** — [openclaw/openclaw](https://github.com/openclaw/openclaw) (apps/android)
- **ClawHub** — [opencraft/clawhub](https://github.com/opencraft/clawhub)
- **Modelo de confiança e ameaças** — [opencraft/trust](https://github.com/opencraft/trust)

Para problemas que não se encaixam em um repositório específico, ou se você não tem certeza, envie email para **security@opencraft.ai** e vamos direcionar.

### Obrigatório nos Relatórios

1. **Título**
2. **Avaliação de Severidade**
3. **Impacto**
4. **Componente Afetado**
5. **Reprodução Técnica**
6. **Impacto Demonstrado**
7. **Ambiente**
8. **Conselho de Remediação**

Relatórios sem etapas de reprodução, impacto demonstrado e conselho de remediação serão despriorizados. Dado o volume de achados gerados por scanners de IA, precisamos garantir que estamos recebendo relatórios revisados de pesquisadores que entendem os problemas.
