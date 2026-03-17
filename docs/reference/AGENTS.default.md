---
title: "AGENTS.md Padrão"
summary: "Instruções padrão do agente OpenCraft e lista de skills para a configuração de assistente pessoal"
read_when:
  - Iniciando uma nova sessão de agente OpenCraft
  - Habilitando ou auditando skills padrão
---

# AGENTS.md — Assistente Pessoal OpenCraft (padrão)

## Primeira execução (recomendado)

O OpenCraft usa um diretório de workspace dedicado para o agente. Padrão: `~/.opencraft/workspace` (configurável via `agents.defaults.workspace`).

1. Crie o workspace (se ainda não existir):

```bash
mkdir -p ~/.opencraft/workspace
```

2. Copie os templates padrão de workspace para o workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.opencraft/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.opencraft/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.opencraft/workspace/TOOLS.md
```

3. Opcional: se você quiser a lista de skills do assistente pessoal, substitua o AGENTS.md por este arquivo:

```bash
cp docs/reference/AGENTS.default.md ~/.opencraft/workspace/AGENTS.md
```

4. Opcional: escolha um workspace diferente configurando `agents.defaults.workspace` (suporta `~`):

```json5
{
  agents: { defaults: { workspace: "~/.opencraft/workspace" } },
}
```

## Padrões de segurança

- Não despeje diretórios ou segredos no chat.
- Não execute comandos destrutivos a menos que seja explicitamente solicitado.
- Não envie respostas parciais/streaming para superfícies de mensagens externas (apenas respostas finais).

## Início de sessão (obrigatório)

- Leia `SOUL.md`, `USER.md` e hoje+ontem em `memory/`.
- Leia `MEMORY.md` quando presente; só use `memory.md` (minúsculo) como fallback quando `MEMORY.md` estiver ausente.
- Faça isso antes de responder.

## Alma (obrigatório)

- `SOUL.md` define identidade, tom e limites. Mantenha-o atualizado.
- Se você alterar `SOUL.md`, avise o usuário.
- Você é uma instância nova a cada sessão; a continuidade vive nesses arquivos.

## Espaços compartilhados (recomendado)

- Você não é a voz do usuário; tenha cuidado em chats de grupo ou canais públicos.
- Não compartilhe dados privados, informações de contato ou notas internas.

## Sistema de memória (recomendado)

- Log diário: `memory/YYYY-MM-DD.md` (crie `memory/` se necessário).
- Memória de longo prazo: `MEMORY.md` para fatos duráveis, preferências e decisões.
- `memory.md` em minúsculo é apenas fallback legado; não mantenha ambos os arquivos raiz intencionalmente.
- No início da sessão, leia hoje + ontem + `MEMORY.md` quando presente, caso contrário `memory.md`.
- Capture: decisões, preferências, restrições, pendências.
- Evite segredos a menos que seja explicitamente solicitado.

## Ferramentas & skills

- Ferramentas vivem em skills; siga o `SKILL.md` de cada skill quando precisar.
- Mantenha notas específicas do ambiente em `TOOLS.md` (Notas para Skills).

## Dica de backup (recomendado)

Se você tratar este workspace como a "memória" do Clawd, transforme-o em um repositório git (idealmente privado) para que `AGENTS.md` e seus arquivos de memória tenham backup.

```bash
cd ~/.opencraft/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Opcional: adicione um remote privado + push
```

## O que o OpenCraft faz

- Executa o Gateway WhatsApp + agente de codificação Pi para que o assistente possa ler/escrever chats, buscar contexto e executar skills via o Mac host.
- O app macOS gerencia permissões (gravação de tela, notificações, microfone) e expõe o CLI `opencraft` via seu binário embutido.
- Chats diretos colapsam na sessão `main` do agente por padrão; grupos ficam isolados como `agent:<agentId>:<channel>:group:<id>` (salas/canais: `agent:<agentId>:<channel>:channel:<id>`); heartbeats mantêm tarefas em segundo plano ativas.

## Skills Principais (habilite em Configurações → Skills)

- **mcporter** — Runtime de servidor de ferramentas/CLI para gerenciar backends de skills externos.
- **Peekaboo** — Capturas de tela rápidas no macOS com análise opcional de visão por IA.
- **camsnap** — Capture frames, clipes ou alertas de movimento de câmeras de segurança RTSP/ONVIF.
- **oracle** — CLI de agente compatível com OpenAI com replay de sessão e controle de navegador.
- **eightctl** — Controle seu sono, pelo terminal.
- **imsg** — Envie, leia, transmita iMessage & SMS.
- **wacli** — CLI WhatsApp: sincronize, pesquise, envie.
- **discord** — Ações Discord: reações, stickers, enquetes. Use alvos `user:<id>` ou `channel:<id>` (ids numéricos simples são ambíguos).
- **gog** — CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Cliente Spotify no terminal para pesquisar/enfileirar/controlar reprodução.
- **sag** — Fala ElevenLabs com UX estilo say do mac; transmite para alto-falantes por padrão.
- **Sonos CLI** — Controle alto-falantes Sonos (descobrir/status/reprodução/volume/agrupamento) a partir de scripts.
- **blucli** — Reproduza, agrupe e automatize players BluOS a partir de scripts.
- **OpenHue CLI** — Controle de iluminação Philips Hue para cenas e automações.
- **OpenAI Whisper** — Fala-para-texto local para ditado rápido e transcrições de correio de voz.
- **Gemini CLI** — Modelos Google Gemini pelo terminal para perguntas e respostas rápidas.
- **agent-tools** — Kit de utilitários para automações e scripts auxiliares.

## Notas de Uso

- Prefira o CLI `opencraft` para scripts; o app mac gerencia permissões.
- Execute instalações pela aba Skills; ela oculta o botão se um binário já estiver presente.
- Mantenha heartbeats habilitados para que o assistente possa agendar lembretes, monitorar caixas de entrada e acionar capturas de câmera.
- A UI Canvas executa em tela cheia com overlays nativos. Evite posicionar controles críticos nas bordas superior-esquerda/superior-direita/inferior; adicione espaçamentos explícitos no layout e não dependa de safe-area insets.
- Para verificação via navegador, use `opencraft browser` (tabs/status/screenshot) com o perfil Chrome gerenciado pelo OpenCraft.
- Para inspeção de DOM, use `opencraft browser eval|query|dom|snapshot` (e `--json`/`--out` quando precisar de saída para máquina).
- Para interações, use `opencraft browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type requerem refs de snapshot; use `evaluate` para seletores CSS).
