# Contribuindo para OpenCraft

Bem-vindo ao tanque de lagostas! 🦞

## Links Rápidos

- **GitHub:** https://github.com/editzffaleta/OpenCraft
- **Visão:** [`VISION.md`](VISION.md)
- **Discord:** https://discord.gg/qkhbAGHRBT
- **X/Twitter:** [@steipete](https://x.com/steipete) / [@opencraft](https://x.com/opencraft)

## Mantenedores

- **Peter Steinberger** - Ditador Benevolente
  - GitHub: [@steipete](https://github.com/steipete) · X: [@steipete](https://x.com/steipete)

- **Shadow** - Subsistema Discord, admin do Discord, ClawHub, toda moderação da comunidade
  - GitHub: [@thewilloftheshadow](https://github.com/thewilloftheshadow) · X: [@4shadowed](https://x.com/4shadowed)

- **Vignesh** - Memory (QMD), modelagem formal, TUI, IRC, e Lobster
  - GitHub: [@vignesh07](https://github.com/vignesh07) · X: [@\_vgnsh](https://x.com/_vgnsh)

- **Jos** - Telegram, API, Nix mode
  - GitHub: [@joshp123](https://github.com/joshp123) · X: [@jjpcodes](https://x.com/jjpcodes)

- **Ayaan Zaidi** - Subsistema Telegram, app Android
  - GitHub: [@obviyus](https://github.com/obviyus) · X: [@0bviyus](https://x.com/0bviyus)

- **Tyler Yust** - Agents/subagents, cron, BlueBubbles, app macOS
  - GitHub: [@tyler6204](https://github.com/tyler6204) · X: [@tyleryust](https://x.com/tyleryust)

- **Mariano Belinky** - App iOS, Segurança
  - GitHub: [@mbelinky](https://github.com/mbelinky) · X: [@belimad](https://x.com/belimad)

- **Nimrod Gutman** - App iOS, app macOS e funcionalidades crustáceos
  - GitHub: [@ngutman](https://github.com/ngutman) · X: [@theguti](https://x.com/theguti)

- **Vincent Koc** - Agents, Telemetria, Hooks, Segurança
  - GitHub: [@vincentkoc](https://github.com/vincentkoc) · X: [@vincent_koc](https://x.com/vincent_koc)

- **Val Alexander** - UI/UX, Docs, e Agent DevX
  - GitHub: [@BunsDev](https://github.com/BunsDev) · X: [@BunsDev](https://x.com/BunsDev)

- **Seb Slight** - Docs, Confiabilidade de Agent, Endurecimento de Runtime
  - GitHub: [@sebslight](https://github.com/sebslight) · X: [@sebslig](https://x.com/sebslig)

- **Christoph Nakazawa** - JS Infra
  - GitHub: [@cpojer](https://github.com/cpojer) · X: [@cnakazawa](https://x.com/cnakazawa)

- **Gustavo Madeira Santana** - Multi-agents, CLI, web UI
  - GitHub: [@gumadeiras](https://github.com/gumadeiras) · X: [@gumadeiras](https://x.com/gumadeiras)

- **Onur Solmaz** - Agents, fluxos de dev, integrações ACP, MS Teams
  - GitHub: [@onutc](https://github.com/onutc), [@osolmaz](https://github.com/osolmaz) · X: [@onusoz](https://x.com/onusoz)

- **Josh Avant** - Core, CLI, Gateway, Segurança, Agents
  - GitHub: [@joshavant](https://github.com/joshavant) · X: [@joshavant](https://x.com/joshavant)

- **Jonathan Taylor** - Subsistema ACP, funcionalidades/bugs do Gateway, CLIs Gog/Mog/Sog, SEDMAT
  - GitHub [@visionik](https://github.com/visionik) · X: [@visionik](https://x.com/visionik)
- **Josh Lehman** - Compaction, subsistema Tlon/Urbit
  - GitHub [@jalehman](https://github.com/jalehman) · X: [@jlehman\_](https://x.com/jlehman_)

- **Radek Sienkiewicz** - Docs, Control UI
  - GitHub [@velvet-shark](https://github.com/velvet-shark) · X: [@velvet_shark](https://twitter.com/velvet_shark)

- **Muhammed Mukhthar** - Mattermost, CLI
  - GitHub [@mukhtharcm](https://github.com/mukhtharcm) · X: [@mukhtharcm](https://x.com/mukhtharcm)

- **Altay** - Agents, CLI, tratamento de erros
  - GitHub [@altaywtf](https://github.com/altaywtf) · X: [@altaywtf](https://x.com/altaywtf)

- **Robin Waslander** - Segurança, triagem de PR, correções de bugs
  - GitHub: [@hydro13](https://github.com/hydro13) · X: [@Robin_waslander](https://x.com/Robin_waslander)

- **Tengji (George) Zhang** - APIs de modelo chinês, cloud, pi
  - GitHub: [@odysseus0](https://github.com/odysseus0) · X: [@odysseus0z](https://x.com/odysseus0z)

- **Andrew (Bubbles) Demczuk** - Agents/Gateway/TTS/VTT
  - GitHub: [@ademczuk](https://github.com/ademczuk) · X: [@ademczuk](https://x.com/ademczuk)

## Como Contribuir

1. **Bugs & pequenas correções** → Abra um PR!
2. **Novas funcionalidades / arquitetura** → Comece uma [GitHub Discussion](https://github.com/editzffaleta/OpenCraft/discussions) ou pergunte no Discord primeiro
3. **Perguntas** → Discord [#help](https://discord.com/channels/1456350064065904867/1459642797895319552) / [#users-helping-users](https://discord.com/channels/1456350064065904867/1459007081603403828)

## Antes de Abrir um PR

- Teste localmente com sua instância do OpenCraft
- Execute os testes: `pnpm build && pnpm check && pnpm test`
- Para alterações de extension/plugin, execute primeiro a lane rápida local:
  - `pnpm test:extension <extension-name>`
  - `pnpm test:extension --list` para ver IDs de extension válidos
  - Se você alterou superfícies compartilhadas de plugin ou canal, execute `pnpm test:contracts`
  - Se você alterou comportamento mais amplo de runtime, ainda execute as lanes mais amplas relevantes (`pnpm test:extensions`, `pnpm test:channels`, ou `pnpm test`) antes de pedir revisão
- Se você tem acesso ao Codex, execute `codex review --base origin/main` localmente antes de abrir ou atualizar seu PR. Trate isso como o padrão mais alto atual de revisão de IA, mesmo que a revisão de Codex do GitHub também seja executada.
- Garanta que as verificações de CI passem
- Mantenha PRs focados (uma coisa por PR; não misture preocupações não relacionadas)
- Descreva o quê & por quê
- Responda ou resolva conversas de revisão de bot que você abordou antes de pedir revisão novamente
- **Inclua screenshots** — um mostrando o problema/antes, um mostrando a correção/depois (para mudanças de UI ou visuais)
- Use ortografia e gramática do inglês americano em código, comentários, docs, e strings de UI
- Não edite arquivos cobertos pela propriedade de segurança `CODEOWNERS` a menos que um proprietário listado tenha explicitamente pedido a mudança ou já esteja revisando com você. Trate esses caminhos como superfícies de revisão restritas, não alvo de limpeza oportunista.

## Conversas de Revisão São De Propriedade do Autor

Se um bot de revisão deixar conversas de revisão no seu PR, você é esperado a lidar com o acompanhamento:

- Resolva a conversa você mesmo uma vez que o código ou explicação resolva completamente a preocupação do bot
- Responda e deixe aberto apenas quando precisar de julgamento de mantenedor ou revisor
- Não deixe conversas de revisão de bot "corrigidas" para mantenedores limparem para você
- Se Codex deixar comentários, aborde todos os relevantes ou resolva com uma explicação breve quando não for aplicável à sua mudança
- Se a revisão de Codex do GitHub não disparar por algum motivo, execute `codex review --base origin/main` localmente mesmo assim e trate esse output como trabalho de revisão obrigatório

Isso se aplica a PRs tanto de autoria humana quanto assistidos por IA.

## Decoradores de Control UI

O Control UI usa Lit com decoradores **legacy** (o parse atual do Rollup não suporta
campos `accessor` necessários para decoradores padrão). Ao adicionar campos reativos, mantenha o
estilo legacy:

```ts
@state() foo = "bar";
@property({ type: Number }) count = 0;
```

O `tsconfig.json` raiz está configurado para decoradores legacy (`experimentalDecorators: true`)
com `useDefineForClassFields: false`. Evite mudar esses a menos que você esteja também atualizando o
tooling de build de UI para suportar decoradores padrão.

## PRs Codificadas com IA/Vibe São Bem-vindas! 🤖

Construído com Codex, Claude, ou outras ferramentas de IA? **Incrível - apenas marque!**

Por favor, inclua no seu PR:

- [ ] Marque como AI-assisted no título ou descrição do PR
- [ ] Anote o grau de teste (untested / lightly tested / fully tested)
- [ ] Inclua prompts ou logs de sessão se possível (super útil!)
- [ ] Confirme que você entende o que o código faz
- [ ] Se você tem acesso ao Codex, execute `codex review --base origin/main` localmente e aborde os achados antes de pedir revisão
- [ ] Resolva ou responda conversas de revisão de bot depois que você abordá-las

PRs de IA são cidadãos de primeira classe aqui. Nós apenas queremos transparência para que revisores saibam o que procurar. Se você está usando um agente de codificação LLM, instrua-o a resolver conversas de revisão de bot que abordou em vez de deixá-las para mantenedores.

## Foco Atual & Roadmap 🗺

Estamos atualmente priorizando:

- **Estabilidade**: Corrigindo casos extremos em conexões de canal (WhatsApp/Telegram).
- **UX**: Melhorando o assistente de onboarding e mensagens de erro.
- **Skills**: Para contribuições de skill, vá para [ClawHub](https://clawhub.ai/) — o hub da comunidade para skills do OpenCraft.
- **Performance**: Otimizando uso de tokens e lógica de compaction.

Verifique as [GitHub Issues](https://github.com/editzffaleta/OpenCraft/issues) por labels "good first issue"!

## Mantenedores

Estamos expandindo seletivamente o time de mantenedores.
Se você é um contribuidor experiente que quer ajudar a moldar a direção do OpenCraft — seja através de código, docs, ou comunidade — gostaríamos de ouvir você.

Ser um mantenedor é uma responsabilidade, não um título honorário. Nós esperamos envolvimento ativo e consistente — triagem de issues, revisão de PRs, e ajudando a mover o projeto para frente.

Ainda interessado? Email contributing@opencraft.ai com:

- Links para seus PRs no OpenCraft (se você não tem nenhum, comece por lá primeiro)
- Links para projetos de código aberto que você mantém ou contribui ativamente
- Seus handles de GitHub, Discord, e X/Twitter
- Uma breve introdução: background, experiência, e áreas de interesse
- Idiomas que você fala e onde você está baseado
- Quanto tempo você pode realistically se comprometer

Nós acolhemos pessoas em todos os conjuntos de habilidades — engenharia, documentação, gerenciamento de comunidade, e mais.
Nós revisamos cada aplicação escrita apenas por humanos cuidadosamente e adicionamos mantenedores lentamente e deliberadamente.
Por favor, permita algumas semanas para uma resposta.

## Reportar uma Vulnerabilidade

Nós levamos seriamente relatórios de segurança. Reporte vulnerabilidades diretamente ao repositório onde o issue vive:

- **Core CLI and gateway** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft)
- **App desktop macOS** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) (apps/macos)
- **App iOS** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) (apps/ios)
- **App Android** — [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) (apps/android)
- **ClawHub** — [opencraft/clawhub](https://github.com/opencraft/clawhub)
- **Trust and threat model** — [opencraft/trust](https://github.com/opencraft/trust)

Para issues que não se encaixam em um repo específico, ou se você está incerto, email **security@opencraft.ai** e nós rotacionaremos isso.

### Obrigatório em Relatórios

1. **Título**
2. **Avaliação de Severidade**
3. **Impacto**
4. **Componente Afetado**
5. **Reprodução Técnica**
6. **Impacto Demonstrado**
7. **Ambiente**
8. **Conselho de Remediação**

Relatórios sem passos de reprodução, impacto demonstrado, e conselho de remediação serão depriorizados. Dado o volume de achados de scanner gerados por IA, nós devemos garantir que estamos recebendo relatórios vetted de pesquisadores que entendem os issues.
