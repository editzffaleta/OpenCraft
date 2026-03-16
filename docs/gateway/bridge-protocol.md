---
summary: "Protocolo bridge (nodes legados): TCP JSONL, pareamento, RPC com escopo"
read_when:
  - Construindo ou depurando clientes de node (iOS/Android/macOS em modo node)
  - Investigando falhas de pareamento ou auth do bridge
  - Auditando a superfície de node exposta pelo gateway
title: "Bridge Protocol"
---

# Protocolo bridge (transporte de node legado)

O protocolo Bridge é um transporte de node **legado** (TCP JSONL). Novos clientes de node
devem usar o protocolo WebSocket unificado do Gateway.

Se você estiver construindo um cliente de operador ou node, use o
[protocolo do Gateway](/gateway/protocol).

**Nota:** Builds atuais do OpenCraft não mais incluem o listener TCP bridge; este documento é mantido para referência histórica.
Chaves de config legadas `bridge.*` não são mais parte do schema de config.

## Por que temos ambos

- **Fronteira de segurança**: o bridge expõe uma allowlist pequena em vez da
  superfície completa da API do gateway.
- **Pareamento + identidade de node**: admissão de node é de propriedade do gateway e vinculada
  a um token por node.
- **UX de descoberta**: nodes podem descobrir gateways via Bonjour na LAN, ou conectar
  diretamente por um tailnet.
- **WS de loopback**: o plano de controle WS completo permanece local a menos que tunelado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (quando `bridge.tls.enabled` é true).
- Porta padrão do listener legado era `18790` (builds atuais não iniciam um bridge TCP).

Quando TLS está habilitado, registros TXT de descoberta incluem `bridgeTls=1` mais
`bridgeTlsSha256` como um hint não secreto. Note que registros TXT Bonjour/mDNS são
não autenticados; clientes não devem tratar o fingerprint anunciado como um
pin autoritativo sem intenção explícita do usuário ou outra verificação fora de banda.

## Handshake + pareamento

1. Cliente envia `hello` com metadados de node + token (se já pareado).
2. Se não pareado, gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Cliente envia `pair-request`.
4. Gateway aguarda aprovação, depois envia `pair-ok` e `hello-ok`.

`hello-ok` retorna `serverName` e pode incluir `canvasHostUrl`.

## Frames

Cliente → Gateway:

- `req` / `res`: RPC do gateway com escopo (chat, sessões, config, health, voicewake, skills.bins)
- `event`: sinais de node (transcrição de voz, solicitação de agente, inscrição em chat, ciclo de vida exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos de node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: atualizações de chat para sessões inscritas
- `ping` / `pong`: keepalive

Aplicação de allowlist legada ficava em `src/gateway/server-bridge.ts` (removido).

## Eventos de ciclo de vida exec

Nodes podem emitir eventos `exec.finished` ou `exec.denied` para surfacear atividade de system.run.
Esses são mapeados para eventos de sistema no gateway. (Nodes legados podem ainda emitir `exec.started`.)

Campos do payload (todos opcionais exceto quando indicado):

- `sessionKey` (obrigatório): sessão de agente para receber o evento de sistema.
- `runId`: id exec único para agrupamento.
- `command`: string de comando raw ou formatada.
- `exitCode`, `timedOut`, `success`, `output`: detalhes de conclusão (apenas finished).
- `reason`: razão de negação (apenas denied).

## Uso com Tailnet

- Fazer bind do bridge em um IP tailnet: `bridge.bind: "tailnet"` em
  `~/.opencraft/opencraft.json`.
- Clientes conectam via nome MagicDNS ou IP tailnet.
- Bonjour **não** cruza redes; use host/porta manual ou DNS-SD wide-area
  quando necessário.

## Versionamento

Bridge é atualmente **v1 implícito** (sem negociação min/max). Compatibilidade retroativa
é esperada; adicione um campo de versão do protocolo bridge antes de qualquer mudança quebrando.
