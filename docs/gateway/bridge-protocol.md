---
summary: "Protocolo Bridge (nodes legados): TCP JSONL, pairing, RPC com escopo"
read_when:
  - Construindo ou debugando clientes node (modo node iOS/Android/macOS)
  - Investigando falhas de pairing ou auth do bridge
  - Auditando a superfície de node exposta pelo gateway
title: "Bridge Protocol"
---

# Protocolo Bridge (transporte de node legado)

O protocolo Bridge é um transporte de node **legado** (TCP JSONL). Novos clientes node devem usar o protocolo unificado Gateway WebSocket.

Se você está construindo um cliente operador ou node, use o [protocolo Gateway](/gateway/protocol).

**Nota:** Builds atuais do OpenCraft não incluem mais o listener TCP bridge; este documento é mantido como referência histórica.
Chaves de config legadas `bridge.*` não fazem mais parte do schema de config.

## Por que temos ambos

- **Limite de segurança**: o bridge expõe uma pequena allowlist em vez de toda a superfície da API do gateway.
- **Pairing + identidade de node**: admissão de node é controlada pelo gateway e vinculada a um token por node.
- **UX de descoberta**: nodes podem descobrir gateways via Bonjour na LAN, ou conectar diretamente via tailnet.
- **Loopback WS**: o control plane WS completo permanece local a menos que tunelado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (quando `bridge.tls.enabled` é true).
- A porta padrão do listener legado era `18790` (builds atuais não iniciam um TCP bridge).

Quando TLS está habilitado, registros TXT de descoberta incluem `bridgeTls=1` mais `bridgeTlsSha256` como dica não-secreta. Note que registros TXT Bonjour/mDNS são não autenticados; clientes não devem tratar o fingerprint anunciado como um pin autoritativo sem intenção explícita do usuário ou outra verificação fora-de-banda.

## Handshake + pairing

1. Cliente envia `hello` com metadados de node + token (se já pareado).
2. Se não pareado, gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Cliente envia `pair-request`.
4. Gateway aguarda aprovação, depois envia `pair-ok` e `hello-ok`.

`hello-ok` retorna `serverName` e pode incluir `canvasHostUrl`.

## Frames

Cliente → Gateway:

- `req` / `res`: RPC do gateway com escopo (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sinais do node (transcrição de voz, requisição de agente, subscribe de chat, lifecycle de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos de node (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`)
- `event`: atualizações de chat para sessões inscritas
- `ping` / `pong`: keepalive

A aplicação de allowlist legada vivia em `src/gateway/server-bridge.ts` (removido).

## Eventos de lifecycle de exec

Nodes podem emitir eventos `exec.finished` ou `exec.denied` para exibir atividade de system.run.
Esses são mapeados para eventos de sistema no gateway. (Nodes legados podem ainda emitir `exec.started`.)

Campos do payload (todos opcionais exceto onde indicado):

- `sessionKey` (obrigatório): sessão do agente para receber o evento de sistema.
- `runId`: id único de exec para agrupamento.
- `command`: string de comando bruta ou formatada.
- `exitCode`, `timedOut`, `success`, `output`: detalhes de conclusão (apenas finished).
- `reason`: motivo da negação (apenas denied).

## Uso em Tailnet

- Faça bind do bridge a um IP de tailnet: `bridge.bind: "tailnet"` em `~/.editzffaleta/OpenCraft.json`.
- Clientes conectam via nome MagicDNS ou IP de tailnet.
- Bonjour **não** cruza redes; use host/porta manual ou DNS-SD de área ampla quando necessário.

## Versionamento

Bridge é atualmente **v1 implícito** (sem negociação min/max). Compatibilidade com versões anteriores é esperada; adicione um campo de versão de protocolo do bridge antes de qualquer mudança que quebre.
