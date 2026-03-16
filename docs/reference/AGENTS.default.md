---
title: "AGENTS.md Padrão"
summary: "Instruções padrão do agente OpenCraft e roster de skills para a configuração de assistente pessoal"
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

2. Copie os templates de workspace padrão para o workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.opencraft/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.opencraft/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.opencraft/workspace/TOOLS.md
```

3. Opcional: se você quiser o roster de skills de assistente pessoal, substitua AGENTS.md por este arquivo:

```bash
cp docs/reference/AGENTS.default.md ~/.opencraft/workspace/AGENTS.md
```

4. Opcional: escolha um workspace diferente definindo `agents.defaults.workspace` (suporta `~`):

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
- Leia `MEMORY.md` quando presente; só faça fallback para `memory.md` em minúsculas quando `MEMORY.md` estiver ausente.
- Faça isso antes de responder.

## Soul (obrigatório)

- `SOUL.md` define identidade, tom e limites. Mantenha-o atualizado.
- Se você alterar `SOUL.md`, avise o usuário.
- Você é uma instância nova a cada sessão; a continuidade vive nesses arquivos.

## Espaços compartilhados (recomendado)

- Você não é a voz do usuário; seja cuidadoso em chats em grupo ou canais públicos.
- Não compartilhe dados privados, informações de contato ou notas internas.

## Sistema de memória (recomendado)

- Diário: `memory/YYYY-MM-DD.md` (crie `memory/` se necessário).
- Memória de longo prazo: `MEMORY.md` para fatos, preferências e decisões duráveis.
- `memory.md` em minúsculas é apenas fallback legado; não mantenha ambos os arquivos raiz propositalmente.
- No início da sessão, leia hoje + ontem + `MEMORY.md` quando presente, caso contrário `memory.md`.
- Capture: decisões, preferências, restrições, loops abertos.
- Evite segredos a menos que explicitamente solicitado.

## Ferramentas e skills

- As ferramentas vivem em skills; siga o `SKILL.md` de cada skill quando precisar dela.
- Mantenha notas específicas do ambiente em `TOOLS.md` (Notas para Skills).

## Dica de backup (recomendado)

Se você tratar este workspace como a "memória" do Clawd, transforme-o em um repositório git (de preferência privado) para que `AGENTS.md` e seus arquivos de memória sejam salvos.

```bash
cd ~/.opencraft/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Opcional: adicione um remote privado + push
```

## O que o OpenCraft faz

- Executa gateway WhatsApp + agente de codagem Pi para que o assistente possa ler/escrever chats, buscar contexto e executar skills via o Mac host.
- O app macOS gerencia permissões (gravação de tela, notificações, microfone) e expõe o CLI `opencraft` via seu binário embutido.
- Chats diretos colapsam na sessão `main` do agente por padrão; grupos ficam isolados como `agent:<agentId>:<canal>:group:<id>` (salas/canais: `agent:<agentId>:<canal>:channel:<id>`); heartbeats mantêm tarefas em background ativas.

## Skills Principais (habilite em Configurações → Skills)

- **mcporter** — Runtime/CLI de servidor de tools para gerenciar backends de skills externos.
- **Peekaboo** — Screenshots rápidos do macOS com análise de visão de IA opcional.
- **camsnap** — Capture frames, clips ou alertas de movimento de câmeras de segurança RTSP/ONVIF.
- **oracle** — CLI de agente pronto para OpenAI com replay de sessão e controle de navegador.
- **eightctl** — Controle seu sono, pelo terminal.
- **imsg** — Envie, leia, transmita iMessage e SMS.
- **wacli** — CLI do WhatsApp: sync, busca, envio.
- **discord** — Ações do Discord: reações, stickers, enquetes. Use alvos `user:<id>` ou `channel:<id>` (ids numéricos sem prefixo são ambíguos).
- **gog** — CLI do Google Suite: Gmail, Agenda, Drive, Contatos.
- **spotify-player** — Cliente Spotify de terminal para buscar/enfileirar/controlar reprodução.
- **sag** — Voz ElevenLabs com UX estilo mac say; transmite para os alto-falantes por padrão.
- **Sonos CLI** — Controle alto-falantes Sonos (descoberta/status/reprodução/volume/agrupamento) por scripts.
- **blucli** — Reproduza, agrupe e automatize players BluOS por scripts.
- **OpenHue CLI** — Controle de iluminação Philips Hue para cenas e automações.
- **OpenAI Whisper** — Fala-para-texto local para ditado rápido e transcrição de voicemail.
- **Gemini CLI** — Modelos Google Gemini pelo terminal para P&R rápido.
- **agent-tools** — Kit de ferramentas utilitárias para automações e scripts auxiliares.

## Notas de Uso

- Prefira o CLI `opencraft` para scripting; o app mac gerencia permissões.
- Execute instalações na aba Skills; ela oculta o botão se um binário já estiver presente.
- Mantenha os heartbeats habilitados para que o assistente possa agendar lembretes, monitorar caixas de entrada e disparar capturas de câmera.
- A UI Canvas roda em tela cheia com overlays nativos. Evite colocar controles críticos nas bordas superior-esquerda/superior-direita/inferior; adicione margens explícitas no layout e não dependa de insets de safe-area.
- Para verificação baseada em navegador, use `opencraft browser` (abas/status/screenshot) com o perfil Chrome gerenciado pelo OpenCraft.
- Para inspeção do DOM, use `opencraft browser eval|query|dom|snapshot` (e `--json`/`--out` quando precisar de saída para máquina).
- Para interações, use `opencraft browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type requerem refs de snapshot; use `evaluate` para seletores CSS).
