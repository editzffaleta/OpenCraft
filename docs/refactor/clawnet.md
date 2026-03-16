---
summary: "Refatoração Clawnet: unificar protocolo de rede, roles, autenticação, aprovações, identidade"
read_when:
  - Planejando um protocolo de rede unificado para nodes + clientes operadores
  - Reformulando aprovações, pareamento, TLS e presença entre dispositivos
title: "Refatoração Clawnet"
---

# Refatoração Clawnet (unificação de protocolo + autenticação)

## Oi

Oi Peter — ótima direção; isso desbloqueia UX mais simples + segurança mais forte.

## Propósito

Documento único e rigoroso para:

- Estado atual: protocolos, fluxos, limites de confiança.
- Pontos de dor: aprovações, roteamento multi-hop, duplicação de UI.
- Novo estado proposto: um protocolo, roles com escopo, auth/pareamento unificados, pinning de TLS.
- Modelo de identidade: IDs estáveis + slugs simpáticos.
- Plano de migração, riscos, questões em aberto.

## Objetivos (da discussão)

- Um protocolo para todos os clientes (app macOS, CLI, iOS, Android, node headless).
- Todo participante de rede autenticado + pareado.
- Clareza de roles: nodes vs operadores.
- Aprovações centrais roteadas para onde o usuário está.
- Criptografia TLS + pinning opcional para todo tráfego remoto.
- Duplicação mínima de código.
- Uma única máquina deve aparecer uma vez (sem entrada duplicada de UI/node).

## Não-objetivos (explícitos)

- Remover separação de capacidades (ainda precisamos de menor privilégio).
- Expor plano de controle completo do gateway sem verificações de escopo.
- Fazer autenticação depender de rótulos humanos (slugs permanecem não-segurança).

---

# Estado atual (como está)

## Dois protocolos

### 1) WebSocket do Gateway (plano de controle)

- Superfície completa de API: config, canais, modelos, sessões, execuções de agente, logs, nodes, etc.
- Bind padrão: loopback. Acesso remoto via SSH/Tailscale.
- Autenticação: token/senha via `connect`.
- Sem pinning TLS (depende de loopback/tunnel).
- Código:
  - `src/gateway/server/ws-connection/message-handler.ts`
  - `src/gateway/client.ts`
  - `docs/gateway/protocol.md`

### 2) Bridge (transporte de node)

- Superfície de allowlist restrita, identidade de node + pareamento.
- JSONL sobre TCP; TLS opcional + pinning de fingerprint de certificado.
- TLS anuncia fingerprint no TXT de descoberta.
- Código:
  - `src/infra/bridge/server/connection.ts`
  - `src/gateway/server-bridge.ts`
  - `src/node-host/bridge-client.ts`
  - `docs/gateway/bridge-protocol.md`

## Clientes do plano de controle hoje

- CLI → Gateway WS via `callGateway` (`src/gateway/call.ts`).
- UI do app macOS → Gateway WS (`GatewayConnection`).
- UI de Controle Web → Gateway WS.
- ACP → Gateway WS.
- Controle do browser usa seu próprio servidor de controle HTTP.

## Nodes hoje

- App macOS em modo node conecta ao bridge do Gateway (`MacNodeBridgeSession`).
- Apps iOS/Android conectam ao bridge do Gateway.
- Pareamento + token por node armazenados no gateway.

## Fluxo de aprovação atual (exec)

- Agente usa `system.run` via Gateway.
- Gateway invoca node pelo bridge.
- Runtime do node decide aprovação.
- Prompt de UI exibido pelo app macOS (quando node == app macOS).
- Node retorna `invoke-res` ao Gateway.
- Multi-hop, UI vinculada ao host do node.

## Presença + identidade hoje

- Entradas de presença do gateway de clientes WS.
- Entradas de presença de node do bridge.
- App macOS pode mostrar duas entradas para a mesma máquina (UI + node).
- Identidade do node armazenada no armazenamento de pareamento; identidade de UI separada.

---

# Problemas / pontos de dor

- Duas stacks de protocolo para manter (WS + Bridge).
- Aprovações em nodes remotos: prompt aparece no host do node, não onde o usuário está.
- Pinning TLS existe apenas para bridge; WS depende de SSH/Tailscale.
- Duplicação de identidade: a mesma máquina aparece como múltiplas instâncias.
- Roles ambíguas: capacidades de UI + node + CLI não claramente separadas.

---

# Novo estado proposto (Clawnet)

## Um protocolo, dois roles

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
- Pode receber comandos `invoke` (`system.run`, `camera.*`, `canvas.*`, `screen.record`, etc.).
- Pode enviar eventos: `voice.transcript`, `agent.request`, `chat.subscribe`.
- Não pode chamar APIs de plano de controle de config/modelos/canais/sessões/agente.

**Operador**

- API completa do plano de controle, controlada por escopo.
- Recebe todas as aprovações.
- Não executa diretamente ações do SO; roteia para nodes.

### Regra principal

Role é por conexão, não por dispositivo. Um dispositivo pode abrir ambas as roles, separadamente.

---

# Autenticação + pareamento unificados

## Identidade do cliente

Cada cliente fornece:

- `deviceId` (estável, derivado da chave do dispositivo).
- `displayName` (nome humano).
- `role` + `scope` + `caps` + `commands`.

## Fluxo de pareamento (unificado)

- Cliente conecta sem autenticação.
- Gateway cria uma **solicitação de pareamento** para aquele `deviceId`.
- Operador recebe prompt; aprova/nega.
- Gateway emite credenciais vinculadas a:
  - chave pública do dispositivo
  - role(s)
  - escopo(s)
  - capacidades/comandos
- Cliente persiste token, reconecta autenticado.

## Autenticação vinculada ao dispositivo (evitar replay de bearer token)

Preferido: pares de chaves de dispositivo.

- Dispositivo gera par de chaves uma vez.
- `deviceId = fingerprint(publicKey)`.
- Gateway envia nonce; dispositivo assina; gateway verifica.
- Tokens são emitidos para uma chave pública (prova de posse), não uma string.

Alternativas:

- mTLS (certs de cliente): mais forte, mais complexidade de operações.
- Tokens bearer de curta duração apenas como fase temporária (rotar + revogar cedo).

## Aprovação silenciosa (heurística SSH)

Defini-la precisamente para evitar um elo fraco. Preferir uma:

- **Somente local**: auto-parear quando cliente conecta via loopback/socket Unix.
- **Desafio via SSH**: gateway emite nonce; cliente prova SSH buscando-o.
- **Janela de presença física**: após uma aprovação local na UI do host do gateway, permitir auto-parear por uma janela curta (ex.: 10 minutos).

Sempre registrar + gravar aprovações automáticas.

---

# TLS em todo lugar (dev + prod)

## Reutilizar TLS do bridge existente

Usar runtime TLS atual + pinning de fingerprint:

- `src/infra/bridge/server/tls.ts`
- lógica de verificação de fingerprint em `src/node-host/bridge-client.ts`

## Aplicar ao WS

- Servidor WS suporta TLS com mesmo cert/chave + fingerprint.
- Clientes WS podem fixar fingerprint (opcional).
- Descoberta anuncia TLS + fingerprint para todos os endpoints.
  - Descoberta é apenas dicas de localizador; nunca âncora de confiança.

## Por que

- Reduzir dependência do SSH/Tailscale para confidencialidade.
- Tornar conexões móveis remotas seguras por padrão.

---

# Redesenho de aprovações (centralizado)

## Atual

Aprovação acontece no host do node (runtime do node do app macOS). Prompt aparece onde o node executa.

## Proposto

Aprovação é **hospedada no gateway**, UI entregue para clientes operadores.

### Novo fluxo

1. Gateway recebe intenção `system.run` (agente).
2. Gateway cria registro de aprovação: `approval.requested`.
3. UI(s) do operador exibem prompt.
4. Decisão de aprovação enviada ao gateway: `approval.resolve`.
5. Gateway invoca comando do node se aprovado.
6. Node executa, retorna `invoke-res`.

### Semântica de aprovação (proteção)

- Transmitir para todos os operadores; apenas a UI ativa mostra um modal (outros recebem um toast).
- Primeira resolução vence; gateway rejeita resoluções subsequentes como já resolvidas.
- Timeout padrão: negar após N segundos (ex.: 60s), registrar motivo.
- Resolução requer escopo `operator.approvals`.

## Benefícios

- Prompt aparece onde o usuário está (mac/celular).
- Aprovações consistentes para nodes remotos.
- Runtime do node permanece headless; sem dependência de UI.

---

# Exemplos de clareza de roles

## App iPhone

- **Role node** para: microfone, câmera, chat de voz, localização, push-to-talk.
- **operator.read** opcional para status e visualização de chat.
- **operator.write/admin** opcional apenas quando explicitamente habilitado.

## App macOS

- Role de operador por padrão (UI de controle).
- Role de node quando "Mac node" habilitado (system.run, tela, câmera).
- Mesmo deviceId para ambas as conexões → entrada de UI mesclada.

## CLI

- Role de operador sempre.
- Escopo derivado por subcomando:
  - `status`, `logs` → read
  - `agent`, `message` → write
  - `config`, `channels` → admin
  - aprovações + pareamento → `operator.approvals` / `operator.pairing`

---

# Identidade + slugs

## ID estável

Necessário para autenticação; nunca muda.
Preferido:

- Fingerprint do par de chaves (hash da chave pública).

## Slug simpático (temático de lagosta)

Apenas rótulo humano.

- Exemplo: `scarlet-claw`, `saltwave`, `mantis-pinch`.
- Armazenado no registry do gateway, editável.
- Tratamento de colisão: `-2`, `-3`.

## Agrupamento na UI

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
- Adicionar controle de allowlist para role de node.

## Fase 2: Compatibilidade do Bridge

- Manter bridge em funcionamento.
- Adicionar suporte a node WS em paralelo.
- Controlar recursos por flag de configuração.

## Fase 3: Aprovações centrais

- Adicionar eventos de solicitação + resolução de aprovação no WS.
- Atualizar UI do app macOS para exibir prompt + responder.
- Runtime do node para de exibir prompt na UI.

## Fase 4: Unificação TLS

- Adicionar configuração TLS para WS usando runtime TLS do bridge.
- Adicionar pinning aos clientes.

## Fase 5: Deprecar bridge

- Migrar iOS/Android/mac node para WS.
- Manter bridge como fallback; remover quando estável.

## Fase 6: Autenticação vinculada ao dispositivo

- Exigir identidade baseada em chave para todas as conexões não locais.
- Adicionar UI de revogação + rotação.

---

# Notas de segurança

- Role/allowlist aplicados no limite do gateway.
- Nenhum cliente obtém API "completa" sem escopo de operador.
- Pareamento necessário para _todas_ as conexões.
- TLS + pinning reduz risco de MITM para mobile.
- Aprovação silenciosa SSH é conveniência; ainda registrada + revogável.
- Descoberta nunca é âncora de confiança.
- Declarações de capacidade são verificadas contra allowlists do servidor por plataforma/tipo.

# Streaming + payloads grandes (mídia de node)

Plano de controle WS é adequado para mensagens pequenas, mas nodes também fazem:

- clipes de câmera
- gravações de tela
- streams de áudio

Opções:

1. Frames binários WS + chunking + regras de backpressure.
2. Endpoint de streaming separado (ainda TLS + autenticação).
3. Manter bridge por mais tempo para comandos com muita mídia, migrar por último.

Escolher um antes da implementação para evitar divergência.

# Política de capacidade + comando

- Capacidades/comandos relatados pelo node são tratados como **declarações**.
- Gateway aplica allowlists por plataforma.
- Qualquer novo comando requer aprovação do operador ou mudança explícita na allowlist.
- Auditar mudanças com timestamps.

# Auditoria + limitação de taxa

- Registrar: solicitações de pareamento, aprovações/negações, emissão/rotação/revogação de token.
- Limitar taxa de spam de pareamento e prompts de aprovação.

# Higiene do protocolo

- Versão explícita do protocolo + códigos de erro.
- Regras de reconexão + política de heartbeat.
- TTL de presença e semântica de último visto.

---

# Questões em aberto

1. Dispositivo único executando ambas as roles: modelo de token
   - Recomendar tokens separados por role (node vs operador).
   - Mesmo deviceId; escopos diferentes; revogação mais clara.

2. Granularidade de escopo do operador
   - read/write/admin + aprovações + pareamento (mínimo viável).
   - Considerar escopos por recurso depois.

3. UX de rotação + revogação de token
   - Auto-rotar na mudança de role.
   - UI para revogar por deviceId + role.

4. Descoberta
   - Estender TXT Bonjour atual para incluir fingerprint WS TLS + dicas de role.
   - Tratar apenas como dicas de localizador.

5. Aprovação entre redes
   - Transmitir para todos os clientes operadores; UI ativa mostra modal.
   - Primeira resposta vence; gateway aplica atomicidade.

---

# Resumo (TL;DR)

- Hoje: plano de controle WS + transporte de node Bridge.
- Dor: aprovações + duplicação + duas stacks.
- Proposta: um protocolo WS com roles + escopos explícitos, pareamento + pinning TLS unificados, aprovações hospedadas no gateway, IDs de dispositivo estáveis + slugs simpáticos.
- Resultado: UX mais simples, segurança mais forte, menos duplicação, melhor roteamento mobile.
