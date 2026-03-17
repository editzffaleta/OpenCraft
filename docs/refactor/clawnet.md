---
summary: "Refatoração Clawnet: unificar protocolo de rede, roles, autenticação, aprovações, identidade"
read_when:
  - Planejando um protocolo de rede unificado para nodes + clientes operadores
  - Retrabalhando aprovações, pareamento, TLS e presença entre dispositivos
title: "Clawnet Refactor"
---

# Refatoração Clawnet (unificação de protocolo + autenticação)

## Oi

Oi Peter - ótima direção; isso desbloqueia UX mais simples + segurança mais forte.

## Propósito

Documento único e rigoroso para:

- Estado atual: protocolos, fluxos, fronteiras de confiança.
- Pontos de dor: aprovações, roteamento multi-hop, duplicação de UI.
- Novo estado proposto: um protocolo, roles com escopo, autenticação/pareamento unificado, pinning TLS.
- Modelo de identidade: IDs estáveis + slugs fofos.
- Plano de migração, riscos, perguntas em aberto.

## Objetivos (da discussão)

- Um protocolo para todos os clientes (app mac, CLI, iOS, Android, node headless).
- Todo participante da rede autenticado + pareado.
- Clareza de role: nodes vs operadores.
- Aprovações centrais roteadas para onde o usuário está.
- Criptografia TLS + pinning opcional para todo tráfego remoto.
- Duplicação mínima de código.
- Máquina única deve aparecer uma vez (sem entrada duplicada UI/node).

## Não-objetivos (explícitos)

- Remover separação de capacidade (ainda precisa de privilégio mínimo).
- Expor plano de controle completo do Gateway sem verificações de escopo.
- Fazer autenticação depender de rótulos humanos (slugs permanecem não-segurança).

---

# Estado atual (como está)

## Dois protocolos

### 1) WebSocket do Gateway (plano de controle)

- Superfície completa de API: config, canais, modelos, sessões, execuções de agente, logs, nodes, etc.
- Bind padrão: loopback. Acesso remoto via SSH/Tailscale.
- Autenticação: Token/senha via `connect`.
- Sem pinning TLS (depende de loopback/tunnel).
- Código:
  - `src/gateway/server/ws-connection/message-handler.ts`
  - `src/gateway/client.ts`
  - `docs/gateway/protocol.md`

### 2) Bridge (transporte de node)

- Superfície de lista de permissão estreita, identidade de node + pareamento.
- JSONL sobre TCP; TLS opcional + pinning de fingerprint de certificado.
- TLS anuncia fingerprint no TXT de descoberta.
- Código:
  - `src/infra/bridge/server/connection.ts`
  - `src/gateway/server-bridge.ts`
  - `src/node-host/bridge-client.ts`
  - `docs/gateway/bridge-protocol.md`

## Clientes do plano de controle hoje

- CLI → WS do Gateway via `callGateway` (`src/gateway/call.ts`).
- UI do app macOS → WS do Gateway (`GatewayConnection`).
- UI de Controle Web → WS do Gateway.
- ACP → WS do Gateway.
- Controle do browser usa seu próprio servidor HTTP de controle.

## Nodes hoje

- App macOS em modo node conecta ao bridge do Gateway (`MacNodeBridgeSession`).
- Apps iOS/Android conectam ao bridge do Gateway.
- Pareamento + Token por node armazenado no Gateway.

## Fluxo de aprovação atual (exec)

- Agente usa `system.run` via Gateway.
- Gateway invoca node via bridge.
- Runtime do node decide aprovação.
- Prompt de UI mostrado pelo app mac (quando node == app mac).
- Node retorna `invoke-res` para o Gateway.
- Multi-hop, UI amarrada ao host do node.

## Presença + identidade hoje

- Entradas de presença do Gateway de clientes WS.
- Entradas de presença de node do bridge.
- App mac pode mostrar duas entradas para mesma máquina (UI + node).
- Identidade de node armazenada no armazenamento de pareamento; identidade de UI separada.

---

# Problemas / pontos de dor

- Duas pilhas de protocolo para manter (WS + Bridge).
- Aprovações em nodes remotos: prompt aparece no host do node, não onde o usuário está.
- Pinning TLS existe somente para bridge; WS depende de SSH/Tailscale.
- Duplicação de identidade: mesma máquina aparece como múltiplas instâncias.
- Roles ambíguas: capacidades de UI + node + CLI não claramente separadas.

---

# Novo estado proposto (Clawnet)

## Um protocolo, duas roles

Protocolo WS único com role + escopo.

- **Role: node** (host de capacidade)
- **Role: operador** (plano de controle)
- **Escopo** opcional para operador:
  - `operator.read` (status + visualização)
  - `operator.write` (execução de agente, envios)
  - `operator.admin` (config, canais, modelos)

### Comportamentos de role

**Node**

- Pode registrar capacidades (`caps`, `commands`, permissões).
- Pode receber comandos `invoke` (`system.run`, `camera.*`, `canvas.*`, `screen.record`, etc).
- Pode enviar eventos: `voice.transcript`, `agent.request`, `chat.subscribe`.
- Não pode chamar APIs de config/modelos/canais/sessões/plano de controle do agente.

**Operador**

- API completa do plano de controle, limitada por escopo.
- Recebe todas as aprovações.
- Não executa ações de SO diretamente; roteia para nodes.

### Regra chave

Role é por conexão, não por dispositivo. Um dispositivo pode abrir ambas as roles, separadamente.

---

# Autenticação + pareamento unificados

## Identidade do cliente

Todo cliente fornece:

- `deviceId` (estável, derivado da chave do dispositivo).
- `displayName` (nome humano).
- `role` + `scope` + `caps` + `commands`.

## Fluxo de pareamento (unificado)

- Cliente conecta não autenticado.
- Gateway cria uma **solicitação de pareamento** para aquele `deviceId`.
- Operador recebe prompt; aprova/nega.
- Gateway emite credenciais vinculadas a:
  - chave pública do dispositivo
  - role(s)
  - escopo(s)
  - capacidades/comandos
- Cliente persiste Token, reconecta autenticado.

## Autenticação vinculada ao dispositivo (evitar replay de Token bearer)

Preferido: pares de chaves do dispositivo.

- Dispositivo gera par de chaves uma vez.
- `deviceId = fingerprint(publicKey)`.
- Gateway envia nonce; dispositivo assina; Gateway verifica.
- Tokens são emitidos para uma chave pública (prova de posse), não uma string.

Alternativas:

- mTLS (certificados de cliente): mais forte, mais complexidade operacional.
- Tokens bearer de curta vida somente como fase temporária (rotacionar + revogar cedo).

## Aprovação silenciosa (heurística SSH)

Defina precisamente para evitar um ponto fraco. Prefira um:

- **Somente local**: auto-parear quando cliente conecta via loopback/socket Unix.
- **Desafio via SSH**: Gateway emite nonce; cliente prova SSH buscando-o.
- **Janela de presença física**: após uma aprovação local na UI do host do Gateway, permitir auto-pareamento por uma janela curta (ex. 10 minutos).

Sempre registrar + gravar auto-aprovações.

---

# TLS em todo lugar (dev + prod)

## Reusar TLS existente do bridge

Usar runtime TLS atual + pinning de fingerprint:

- `src/infra/bridge/server/tls.ts`
- lógica de verificação de fingerprint em `src/node-host/bridge-client.ts`

## Aplicar ao WS

- Servidor WS suporta TLS com mesmo cert/chave + fingerprint.
- Clientes WS podem fixar fingerprint (opcional).
- Descoberta anuncia TLS + fingerprint para todos os endpoints.
  - Descoberta é somente dicas de localizador; nunca uma âncora de confiança.

## Por quê

- Reduzir dependência de SSH/Tailscale para confidencialidade.
- Tornar conexões móveis remotas seguras por padrão.

---

# Redesign de aprovações (centralizado)

## Atual

Aprovação acontece no host do node (runtime de node do app mac). Prompt aparece onde o node roda.

## Proposto

Aprovação é **hospedada no Gateway**, UI entregue aos clientes operadores.

### Novo fluxo

1. Gateway recebe intenção `system.run` (agente).
2. Gateway cria registro de aprovação: `approval.requested`.
3. UI(s) do operador mostram prompt.
4. Decisão de aprovação enviada ao Gateway: `approval.resolve`.
5. Gateway invoca comando do node se aprovado.
6. Node executa, retorna `invoke-res`.

### Semânticas de aprovação (endurecimento)

- Broadcast para todos os operadores; somente a UI ativa mostra um modal (outros recebem um toast).
- Primeira resolução vence; Gateway rejeita resolves subsequentes como já resolvido.
- Timeout padrão: negar após N segundos (ex. 60s), registrar motivo.
- Resolução requer escopo `operator.approvals`.

## Benefícios

- Prompt aparece onde o usuário está (mac/celular).
- Aprovações consistentes para nodes remotos.
- Runtime do node permanece headless; sem dependência de UI.

---

# Exemplos de clareza de role

## App iPhone

- **Role node** para: mic, câmera, voice chat, localização, push-to-talk.
- **operator.read** opcional para status e visualização de chat.
- **operator.write/admin** opcional somente quando explicitamente habilitado.

## App macOS

- Role operador por padrão (UI de controle).
- Role node quando "Mac node" habilitado (system.run, screen, camera).
- Mesmo deviceId para ambas conexões → entrada de UI mesclada.

## CLI

- Role operador sempre.
- Escopo derivado por subcomando:
  - `status`, `logs` → read
  - `agent`, `message` → write
  - `config`, `channels` → admin
  - aprovações + pareamento → `operator.approvals` / `operator.pairing`

---

# Identidade + slugs

## ID Estável

Obrigatório para autenticação; nunca muda.
Preferido:

- Fingerprint de par de chaves (hash de chave pública).

## Slug fofo (tema lagosta)

Rótulo humano apenas.

- Exemplo: `scarlet-claw`, `saltwave`, `mantis-pinch`.
- Armazenado no registro do Gateway, editável.
- Tratamento de colisão: `-2`, `-3`.

## Agrupamento de UI

Mesmo `deviceId` entre roles → única linha "Instância":

- Badge: `operator`, `node`.
- Mostra capacidades + último visto.

---

# Estratégia de migração

## Fase 0: Documentar + alinhar

- Publicar este documento.
- Inventariar todas as chamadas de protocolo + fluxos de aprovação.

## Fase 1: Adicionar roles/escopos ao WS

- Estender parâmetros de `connect` com `role`, `scope`, `deviceId`.
- Adicionar gating de lista de permissão para role node.

## Fase 2: Compatibilidade do bridge

- Manter bridge rodando.
- Adicionar suporte WS node em paralelo.
- Portão de funcionalidades atrás de flag de configuração.

## Fase 3: Aprovações centrais

- Adicionar eventos de solicitação + resolução de aprovação no WS.
- Atualizar UI do app mac para solicitar + responder.
- Runtime de node para de solicitar UI.

## Fase 4: Unificação TLS

- Adicionar configuração TLS para WS usando runtime TLS do bridge.
- Adicionar pinning aos clientes.

## Fase 5: Descontinuar bridge

- Migrar iOS/Android/mac node para WS.
- Manter bridge como fallback; remover quando estável.

## Fase 6: Autenticação vinculada ao dispositivo

- Exigir identidade baseada em chave para todas as conexões não locais.
- Adicionar UI de revogação + rotação.

---

# Notas de segurança

- Role/lista de permissão imposta na fronteira do Gateway.
- Nenhum cliente recebe API "completa" sem escopo de operador.
- Pareamento obrigatório para _todas_ as conexões.
- TLS + pinning reduz risco de MITM para mobile.
- Aprovação silenciosa SSH é uma conveniência; ainda registrada + revogável.
- Descoberta nunca é uma âncora de confiança.
- Declarações de capacidade são verificadas contra listas de permissão do servidor por plataforma/tipo.

# Streaming + payloads grandes (mídia de node)

Plano de controle WS é adequado para mensagens pequenas, mas nodes também fazem:

- clipes de câmera
- gravações de tela
- streams de áudio

Opções:

1. Frames binários WS + chunking + regras de backpressure.
2. Endpoint de streaming separado (ainda TLS + autenticação).
3. Manter bridge mais tempo para comandos pesados de mídia, migrar por último.

Escolher um antes da implementação para evitar divergência.

# Política de capacidade + comando

- Caps/comandos reportados pelo node são tratados como **declarações**.
- Gateway impõe listas de permissão por plataforma.
- Qualquer novo comando requer aprovação do operador ou mudança explícita na lista de permissão.
- Auditar mudanças com timestamps.

# Auditoria + limitação de taxa

- Registrar: solicitações de pareamento, aprovações/negações, emissão/rotação/revogação de Token.
- Limitar taxa de spam de pareamento e prompts de aprovação.

# Higiene de protocolo

- Versão de protocolo explícita + códigos de erro.
- Regras de reconexão + política de heartbeat.
- TTL de presença e semânticas de último-visto.

---

# Perguntas em aberto

1. Dispositivo único rodando ambas as roles: modelo de Token
   - Recomendar Tokens separados por role (node vs operador).
   - Mesmo deviceId; escopos diferentes; revogação mais clara.

2. Granularidade de escopo de operador
   - read/write/admin + aprovações + pareamento (mínimo viável).
   - Considerar escopos por funcionalidade depois.

3. UX de rotação + revogação de Token
   - Auto-rotacionar em mudança de role.
   - UI para revogar por deviceId + role.

4. Descoberta
   - Estender TXT Bonjour atual para incluir fingerprint WS TLS + dicas de role.
   - Tratar como dicas de localizador apenas.

5. Aprovação cross-network
   - Broadcast para todos os clientes operadores; UI ativa mostra modal.
   - Primeira resposta vence; Gateway impõe atomicidade.

---

# Resumo (TL;DR)

- Hoje: plano de controle WS + transporte Bridge de node.
- Dor: aprovações + duplicação + duas pilhas.
- Proposta: um protocolo WS com roles + escopos explícitos, pareamento + pinning TLS unificados, aprovações hospedadas no Gateway, IDs de dispositivo estáveis + slugs fofos.
- Resultado: UX mais simples, segurança mais forte, menos duplicação, melhor roteamento mobile.
