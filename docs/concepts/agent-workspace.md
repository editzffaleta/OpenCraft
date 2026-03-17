---
summary: "Workspace do agente: localização, layout e estratégia de backup"
read_when:
  - Você precisa explicar o workspace do agente ou seu layout de arquivos
  - Você quer fazer backup ou migrar um workspace de agente
title: "Agent Workspace"
---

# Workspace do agente

O workspace é o lar do agente. É o único diretório de trabalho usado para
ferramentas de arquivo e para contexto do workspace. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.opencraft/`, que armazena configuração, credenciais e
sessões.

**Importante:** o workspace é o **cwd padrão**, não um sandbox rígido. Ferramentas
resolvem caminhos relativos em relação ao workspace, mas caminhos absolutos ainda podem alcançar
outros locais no host, a menos que o sandboxing esteja habilitado. Se você precisa de isolamento, use
[`agents.defaults.sandbox`](/gateway/sandboxing) (e/ou configuração de sandbox por agente).
Quando o sandboxing está habilitado e `workspaceAccess` não é `"rw"`, ferramentas operam
dentro de um workspace sandbox em `~/.opencraft/sandboxes`, não no seu workspace do host.

## Localização padrão

- Padrão: `~/.opencraft/workspace`
- Se `OPENCRAFT_PROFILE` estiver definido e não for `"default"`, o padrão se torna
  `~/.opencraft/workspace-<profile>`.
- Sobrescreva em `~/.editzffaleta/OpenCraft.json`:

```json5
{
  agent: {
    workspace: "~/.opencraft/workspace",
  },
}
```

`opencraft onboard`, `opencraft configure` ou `opencraft setup` criarão o
workspace e semearão os arquivos de bootstrap se estiverem ausentes.
Cópias de semente do sandbox aceitam apenas arquivos regulares dentro do workspace; aliases de
symlink/hardlink que resolvem fora do workspace de origem são ignorados.

Se você já gerencia os arquivos do workspace por conta própria, pode desabilitar a
criação de arquivos de bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Pastas extras do workspace

Instalações mais antigas podem ter criado `~/opencraft`. Manter múltiplos diretórios
de workspace pode causar confusão de autenticação ou divergência de estado, porque apenas um
workspace está ativo por vez.

**Recomendação:** mantenha um único workspace ativo. Se você não usa mais as
pastas extras, arquive-as ou mova para a Lixeira (por exemplo `trash ~/opencraft`).
Se você mantém intencionalmente múltiplos workspaces, certifique-se de que
`agents.defaults.workspace` aponte para o ativo.

`opencraft doctor` avisa quando detecta diretórios de workspace extras.

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
  - Quem é o usuário e como se dirigir a ele.
  - Carregado em cada sessão.

- `IDENTITY.md`
  - O nome, vibe e emoji do agente.
  - Criado/atualizado durante o ritual de bootstrap.

- `TOOLS.md`
  - Notas sobre suas ferramentas e convenções locais.
  - Não controla a disponibilidade de ferramentas; é apenas orientação.

- `HEARTBEAT.md`
  - Checklist pequeno opcional para execuções de heartbeat.
  - Mantenha curto para evitar consumo de Token.

- `BOOT.md`
  - Checklist de inicialização opcional executado ao reiniciar o Gateway quando hooks internos estão habilitados.
  - Mantenha curto; use a ferramenta de mensagem para envios.

- `BOOTSTRAP.md`
  - Ritual de primeira execução, único.
  - Criado apenas para um workspace novo.
  - Delete após o ritual estar completo.

- `memory/YYYY-MM-DD.md`
  - Log de memória diário (um arquivo por dia).
  - Recomendado ler hoje + ontem no início da sessão.

- `MEMORY.md` (opcional)
  - Memória curada de longo prazo.
  - Carregue apenas na sessão principal e privada (não em contextos compartilhados/grupo).

Veja [Memória](/concepts/memory) para o fluxo de trabalho e flush automático de memória.

- `skills/` (opcional)
  - Skills específicas do workspace.
  - Sobrescrevem Skills gerenciadas/empacotadas quando os nomes colidem.

- `canvas/` (opcional)
  - Arquivos de Canvas UI para exibições de nodes (por exemplo `canvas/index.html`).

Se algum arquivo de bootstrap estiver ausente, o OpenCraft injeta um marcador de "arquivo ausente" na
sessão e continua. Arquivos de bootstrap grandes são truncados quando injetados;
ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 20000) e
`agents.defaults.bootstrapTotalMaxChars` (padrão: 150000).
`opencraft setup` pode recriar os padrões ausentes sem sobrescrever arquivos
existentes.

## O que NÃO está no workspace

Estes ficam em `~/.opencraft/` e NÃO devem ser comitados no repositório do workspace:

- `~/.editzffaleta/OpenCraft.json` (configuração)
- `~/.opencraft/credentials/` (tokens OAuth, chaves de API)
- `~/.opencraft/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.opencraft/skills/` (Skills gerenciadas)

Se você precisa migrar sessões ou configurações, copie-as separadamente e mantenha-as
fora do controle de versão.

## Backup com Git (recomendado, privado)

Trate o workspace como memória privada. Coloque-o em um repositório Git **privado** para que fique
com backup e seja recuperável.

Execute estes passos na máquina onde o Gateway roda (é onde o
workspace vive).

### 1) Inicialize o repositório

Se o Git estiver instalado, workspaces novos são inicializados automaticamente. Se este
workspace ainda não é um repositório, execute:

```bash
cd ~/.opencraft/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Adicione um remote privado (opções para iniciantes)

Opção A: Interface web do GitHub

1. Crie um novo repositório **privado** no GitHub.
2. Não inicialize com README (evita conflitos de merge).
3. Copie a URL remota HTTPS.
4. Adicione o remote e faça push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opção B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create opencraft-workspace --private --source . --remote origin --push
```

Opção C: Interface web do GitLab

1. Crie um novo repositório **privado** no GitLab.
2. Não inicialize com README (evita conflitos de merge).
3. Copie a URL remota HTTPS.
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
git commit -m "Update memory"
git push
```

## Não comite segredos

Mesmo em um repositório privado, evite armazenar segredos no workspace:

- Chaves de API, tokens OAuth, senhas ou credenciais privadas.
- Qualquer coisa em `~/.opencraft/`.
- Dumps brutos de conversas ou anexos sensíveis.

Se você precisa armazenar referências sensíveis, use placeholders e mantenha o
segredo real em outro lugar (gerenciador de senhas, variáveis de ambiente ou `~/.opencraft/`).

Sugestão de `.gitignore` inicial:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Movendo o workspace para uma nova máquina

1. Clone o repositório no caminho desejado (padrão `~/.opencraft/workspace`).
2. Defina `agents.defaults.workspace` para esse caminho em `~/.editzffaleta/OpenCraft.json`.
3. Execute `opencraft setup --workspace <path>` para semear quaisquer arquivos ausentes.
4. Se você precisa de sessões, copie `~/.opencraft/agents/<agentId>/sessions/` da
   máquina antiga separadamente.

## Notas avançadas

- O roteamento multi-agente pode usar workspaces diferentes por agente. Veja
  [Roteamento de canal](/channels/channel-routing) para configuração de roteamento.
- Se `agents.defaults.sandbox` estiver habilitado, sessões não-principais podem usar workspaces
  sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.
