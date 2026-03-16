---
summary: "Workspace do agente: localização, layout e estratégia de backup"
read_when:
  - Você precisa explicar o workspace do agente ou seu layout de arquivos
  - Você quer fazer backup ou migrar um workspace do agente
title: "Workspace do Agente"
---

# Workspace do agente

O workspace é o lar do agente. É o único diretório de trabalho usado para
ferramentas de arquivo e contexto do workspace. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.opencraft/`, que armazena config, credenciais e
sessões.

**Importante:** o workspace é o **cwd padrão**, não um sandbox rígido. Ferramentas
resolvem caminhos relativos contra o workspace, mas caminhos absolutos ainda podem alcançar
outros locais no host a menos que o sandboxing esteja habilitado. Se você precisar de isolamento, use
[`agents.defaults.sandbox`](/gateway/sandboxing) (e/ou config de sandbox por agente).
Quando o sandboxing está habilitado e `workspaceAccess` não é `"rw"`, ferramentas operam
dentro de um workspace sandbox em `~/.opencraft/sandboxes`, não no seu workspace host.

## Localização padrão

- Padrão: `~/.opencraft/workspace`
- Se `OPENCLAW_PROFILE` estiver definido e não for `"default"`, o padrão torna-se
  `~/.opencraft/workspace-<profile>`.
- Sobrescreva em `~/.opencraft/opencraft.json`:

```json5
{
  agent: {
    workspace: "~/.opencraft/workspace",
  },
}
```

`opencraft onboard`, `opencraft configure` ou `opencraft setup` criarão o
workspace e semeará os arquivos de bootstrap se estiverem ausentes.
Cópias de seed sandbox só aceitam arquivos regulares dentro do workspace; aliases
de symlink/hardlink que resolvem fora do workspace fonte são ignorados.

Se você já gerencia os arquivos do workspace você mesmo, pode desabilitar a
criação de arquivos de bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Pastas extras de workspace

Instalações mais antigas podem ter criado `~/opencraft`. Manter múltiplos diretórios de workspace
por aí pode causar confusão de auth ou deriva de estado, porque apenas um
workspace está ativo por vez.

**Recomendação:** mantenha um único workspace ativo. Se você não usa mais as
pastas extras, arquive-as ou mova para a Lixeira (por exemplo `trash ~/opencraft`).
Se você mantém intencionalmente múltiplos workspaces, certifique-se de que
`agents.defaults.workspace` aponta para o ativo.

`opencraft doctor` avisa quando detecta diretórios extras de workspace.

## Mapa de arquivos do workspace (o que cada arquivo significa)

Estes são os arquivos padrão que o OpenCraft espera dentro do workspace:

- `AGENTS.md`
  - Instruções de operação para o agente e como ele deve usar a memória.
  - Carregado no início de cada sessão.
  - Bom lugar para regras, prioridades e detalhes de "como se comportar".

- `SOUL.md`
  - Persona, tom e limites.
  - Carregado em cada sessão.

- `USER.md`
  - Quem é o usuário e como tratá-lo.
  - Carregado em cada sessão.

- `IDENTITY.md`
  - Nome, vibe e emoji do agente.
  - Criado/atualizado durante o ritual de bootstrap.

- `TOOLS.md`
  - Notas sobre suas ferramentas e convenções locais.
  - Não controla a disponibilidade de ferramentas; é apenas orientação.

- `HEARTBEAT.md`
  - Pequena checklist opcional para execuções de heartbeat.
  - Mantenha curto para evitar gasto de tokens.

- `BOOT.md`
  - Checklist opcional de inicialização executada na reinicialização do gateway quando hooks internos estão habilitados.
  - Mantenha curto; use a ferramenta de mensagem para envios de saída.

- `BOOTSTRAP.md`
  - Ritual de primeira execução.
  - Só criado para um workspace completamente novo.
  - Delete após o ritual estar completo.

- `memory/YYYY-MM-DD.md`
  - Log de memória diário (um arquivo por dia).
  - Recomendado ler hoje + ontem no início da sessão.

- `MEMORY.md` (opcional)
  - Memória de longo prazo curada.
  - Carregue apenas na sessão principal e privada (não em contextos compartilhados/grupo).

Veja [Memória](/concepts/memory) para o workflow e flush automático de memória.

- `skills/` (opcional)
  - Skills específicos do workspace.
  - Sobrescreve skills gerenciados/embutidos quando há conflito de nomes.

- `canvas/` (opcional)
  - Arquivos de UI Canvas para exibições de nó (por exemplo `canvas/index.html`).

Se algum arquivo de bootstrap estiver ausente, o OpenCraft injeta um marcador de "arquivo ausente" na
sessão e continua. Arquivos de bootstrap grandes são truncados quando injetados;
ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 20000) e
`agents.defaults.bootstrapTotalMaxChars` (padrão: 150000).
`opencraft setup` pode recriar padrões ausentes sem sobrescrever arquivos existentes.

## O que NÃO está no workspace

Estes ficam em `~/.opencraft/` e NÃO devem ser commitados no repositório do workspace:

- `~/.opencraft/opencraft.json` (config)
- `~/.opencraft/credentials/` (tokens OAuth, chaves de API)
- `~/.opencraft/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.opencraft/skills/` (skills gerenciados)

Se você precisar migrar sessões ou config, copie-as separadamente e mantenha-as
fora do controle de versão.

## Backup via Git (recomendado, privado)

Trate o workspace como memória privada. Coloque-o em um repositório git **privado** para que seja
respaldado e recuperável.

Execute esses passos na máquina onde o Gateway roda (é lá que o
workspace fica).

### 1) Inicializar o repositório

Se o git estiver instalado, workspaces novos são inicializados automaticamente. Se este
workspace não for um repositório ainda, execute:

```bash
cd ~/.opencraft/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Adicionar workspace do agente"
```

### 2) Adicionar um remote privado (opções para iniciantes)

Opção A: Interface web do GitHub

1. Crie um novo repositório **privado** no GitHub.
2. Não inicialize com um README (evita conflitos de merge).
3. Copie a URL HTTPS do remote.
4. Adicione o remote e faça push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opção B: CLI do GitHub (`gh`)

```bash
gh auth login
gh repo create opencraft-workspace --private --source . --remote origin --push
```

Opção C: Interface web do GitLab

1. Crie um novo repositório **privado** no GitLab.
2. Não inicialize com um README (evita conflitos de merge).
3. Copie a URL HTTPS do remote.
4. Adicione o remote e faça push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Atualizações contínuas

```bash
git status
git add .
git commit -m "Atualizar memória"
git push
```

## Não commite secrets

Mesmo em um repositório privado, evite armazenar secrets no workspace:

- Chaves de API, tokens OAuth, senhas ou credenciais privadas.
- Qualquer coisa em `~/.opencraft/`.
- Dumps brutos de chats ou anexos sensíveis.

Se precisar armazenar referências sensíveis, use placeholders e mantenha o
secret real em outro lugar (gerenciador de senhas, variáveis de ambiente ou `~/.opencraft/`).

`.gitignore` sugerido para começar:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Movendo o workspace para uma nova máquina

1. Clone o repositório para o caminho desejado (padrão `~/.opencraft/workspace`).
2. Defina `agents.defaults.workspace` para esse caminho em `~/.opencraft/opencraft.json`.
3. Execute `opencraft setup --workspace <caminho>` para semear arquivos ausentes.
4. Se precisar de sessões, copie `~/.opencraft/agents/<agentId>/sessions/` da
   máquina antiga separadamente.

## Notas avançadas

- Roteamento multi-agente pode usar diferentes workspaces por agente. Veja
  [Roteamento de canais](/channels/channel-routing) para configuração de roteamento.
- Se `agents.defaults.sandbox` estiver habilitado, sessões não-principais podem usar workspaces
  sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.
