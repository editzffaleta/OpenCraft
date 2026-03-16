---
summary: "Control UI no browser para o Gateway (chat, nodes, config)"
read_when:
  - Você quer operar o Gateway a partir de um browser
  - Você quer acesso Tailnet sem túneis SSH
title: "Control UI"
---

# Control UI (browser)

A Control UI é uma pequena app de página única **Vite + Lit** servida pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (ex.: `/opencraft`)

Ela fala **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver rodando no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie o Gateway primeiro: `opencraft gateway`.

A auth é fornecida durante o handshake WebSocket via:

- `connect.params.auth.token`
- `connect.params.auth.password`
  O painel de configurações do dashboard mantém um token para a sessão do tab atual do browser e URL do gateway selecionado; senhas não são persistidas.
  O wizard de onboarding gera um token de gateway por padrão, então cole-o aqui na primeira conexão.

## Pareamento de dispositivo (primeira conexão)

Quando você conecta à Control UI de um novo browser ou dispositivo, o Gateway
requer uma **aprovação única de pareamento** — mesmo se você estiver na mesma Tailnet
com `gateway.auth.allowTailscale: true`. Esta é uma medida de segurança para prevenir
acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

**Para aprovar o dispositivo:**

```bash
# Listar requisições pendentes
opencraft devices list

# Aprovar pelo ID da requisição
opencraft devices approve <requestId>
```

Uma vez aprovado, o dispositivo é lembrado e não precisará de re-aprovação, a menos que
você o revogue com `opencraft devices revoke --device <id> --role <role>`. Veja
[CLI de Devices](/cli/devices) para rotação e revogação de token.

**Notas:**

- Conexões locais (`127.0.0.1`) são aprovadas automaticamente.
- Conexões remotas (LAN, Tailnet, etc.) requerem aprovação explícita.
- Cada perfil de browser gera um ID de dispositivo único, então trocar de browser ou
  limpar os dados do browser exigirá re-pareamento.

## Suporte a idiomas

A Control UI pode se localizar na primeira carga com base no locale do seu browser, e você pode sobrescrevê-lo depois pelo seletor de idioma no card de Acesso.

- Locales suportados: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Traduções não-inglesas são carregadas preguiçosamente no browser.
- O locale selecionado é salvo no armazenamento do browser e reutilizado em visitas futuras.
- Chaves de tradução ausentes caem de volta para o inglês.

## O que pode fazer (hoje)

- Chat com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Stream de chamadas de tool + cards de saída ao vivo de tool no Chat (eventos de agente)
- Canais: status do WhatsApp/Telegram/Discord/Slack + canais por plugin (Mattermost, etc.) + login por QR + config por canal (`channels.status`, `web.login.*`, `config.patch`)
- Instâncias: lista de presença + atualização (`system-presence`)
- Sessões: lista + sobrescrições de thinking/fast/verbose/reasoning por sessão (`sessions.list`, `sessions.patch`)
- Cron jobs: listar/adicionar/editar/rodar/habilitar/desabilitar + histórico de execuções (`cron.*`)
- Skills: status, habilitar/desabilitar, instalar, atualizações de chave de API (`skills.*`)
- Nodes: lista + capacidades (`node.list`)
- Aprovações de exec: editar allowlists do gateway ou node + política de ask para `exec host=gateway/node` (`exec.approvals.*`)
- Config: visualizar/editar `~/.opencraft/opencraft.json` (`config.get`, `config.set`)
- Config: aplicar + reiniciar com validação (`config.apply`) e despertar a última sessão ativa
- Escritas de config incluem um guarda de hash-base para prevenir sobrescrição de edições concorrentes
- Schema de config + renderização de formulário (`config.schema`, incluindo schemas de plugin + canal); Editor JSON bruto permanece disponível
- Debug: snapshots de status/health/models + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`)
- Logs: tail ao vivo de logs do arquivo do gateway com filtro/exportação (`logs.tail`)
- Atualização: rodar uma atualização de pacote/git + reiniciar (`update.run`) com relatório de reinicialização

Notas do painel de Cron jobs:

- Para jobs isolados, a entrega padrão é resumo de anúncio. Você pode mudar para nenhum se quiser execuções apenas internas.
- Campos de canal/alvo aparecem quando anúncio está selecionado.
- Modo webhook usa `delivery.mode = "webhook"` com `delivery.to` definido para uma URL de webhook HTTP(S) válida.
- Para jobs de sessão principal, modos de entrega webhook e nenhum estão disponíveis.
- Controles de edição avançada incluem deletar após execução, limpar override de agente, opções de exato/stagger de cron, sobrescrições de modelo/thinking do agente, e toggles de entrega best-effort.
- A validação de formulário é inline com erros no nível de campo; valores inválidos desabilitam o botão salvar até serem corrigidos.
- Defina `cron.webhookToken` para enviar um bearer token dedicado; se omitido, o webhook é enviado sem header de auth.
- Fallback obsoleto: jobs legados armazenados com `notify: true` ainda podem usar `cron.webhook` até migrarem.

## Comportamento do Chat

- `chat.send` é **não-bloqueante**: faz ack imediatamente com `{ runId, status: "started" }` e a resposta faz stream via eventos `chat`.
- Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` enquanto rodando, e `{ status: "ok" }` após a conclusão.
- Respostas de `chat.history` têm tamanho limitado para segurança da UI. Quando entradas do transcript são muito grandes, o Gateway pode truncar campos de texto longos, omitir blocos de metadados pesados e substituir mensagens muito grandes por um placeholder (`[chat.history omitted: message too large]`).
- `chat.inject` acrescenta uma nota de assistente ao transcript da sessão e transmite um evento `chat` para atualizações apenas na UI (sem execução de agente, sem entrega ao canal).
- Parar:
  - Clique em **Stop** (chama `chat.abort`)
  - Digite `/stop` (ou frases de abort standalone como `stop`, `stop action`, `stop run`, `stop opencraft`, `please stop`) para abortar fora de banda
  - `chat.abort` suporta `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas para aquela sessão
- Retenção de parcial abortado:
  - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI
  - O Gateway persiste texto parcial de assistente abortado no histórico do transcript quando há saída em buffer
  - Entradas persistidas incluem metadados de abort para que consumidores do transcript possam distinguir parciais abortados de saída de conclusão normal

## Acesso via Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantenha o Gateway no loopback e deixe o Tailscale Serve fazer proxy com HTTPS:

```bash
opencraft gateway --tailscale serve
```

Abra:

- `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

Por padrão, requisições Control UI/WebSocket via Serve podem autenticar via headers de identidade Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenCraft
verifica a identidade resolvendo o endereço `x-forwarded-for` com
`tailscale whois` e correspondendo ao header, e só aceita quando a
requisição chega no loopback com os headers `x-forwarded-*` do Tailscale. Defina
`gateway.auth.allowTailscale: false` (ou force `gateway.auth.mode: "password"`)
se quiser exigir token/senha mesmo para tráfego via Serve.
Auth via Serve sem token assume que o host do gateway é confiável. Se código local não confiável
puder rodar nesse host, exija auth por token/senha.

### Bind ao tailnet + token

```bash
opencraft gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Então abra:

- `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

Cole o token nas configurações da UI (enviado como `connect.params.auth.token`).

## HTTP Inseguro

Se você abrir o dashboard via HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`),
o browser roda em um **contexto não-seguro** e bloqueia WebCrypto. Por padrão,
o OpenCraft **bloqueia** conexões à Control UI sem identidade de dispositivo.

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

**Comportamento do toggle de auth insegura:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "substitua-aqui" },
  },
}
```

`allowInsecureAuth` é apenas um toggle de compatibilidade local:

- Permite que sessões da Control UI no localhost prossigam sem identidade de dispositivo em
  contextos HTTP não-seguros.
- Não ignora verificações de pareamento.
- Não relaxa requisitos de identidade de dispositivo para conexões remotas (não-localhost).

**Apenas para emergências:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "substitua-aqui" },
  },
}
```

`dangerouslyDisableDeviceAuth` desabilita as verificações de identidade de dispositivo da Control UI e é uma
degradação severa de segurança. Reverta rapidamente após uso de emergência.

Veja [Tailscale](/gateway/tailscale) para orientação de configuração HTTPS.

## Compilando a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build # auto-instala deps da UI na primeira execução
```

Base absoluta opcional (quando você quer URLs de assets fixas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/opencraft/ pnpm ui:build
```

Para desenvolvimento local (servidor dev separado):

```bash
pnpm ui:dev # auto-instala deps da UI na primeira execução
```

Então aponte a UI para sua URL WS do Gateway (ex.: `ws://127.0.0.1:18789`).

## Debug/teste: servidor dev + Gateway remoto

A Control UI são arquivos estáticos; o alvo WebSocket é configurável e pode ser
diferente da origem HTTP. Isso é útil quando você quer o servidor dev Vite
localmente mas o Gateway roda em outro lugar.

1. Inicie o servidor dev da UI: `pnpm ui:dev`
2. Abra uma URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Auth única opcional (se necessário):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notas:

- `gatewayUrl` é armazenado no localStorage após o carregamento e removido da URL.
- `token` é importado do fragmento da URL, armazenado no sessionStorage para a sessão do tab atual do browser e URL do gateway selecionado, e removido da URL; não é armazenado no localStorage.
- `password` é mantido apenas em memória.
- Quando `gatewayUrl` está definido, a UI não cai de volta para credenciais de config ou ambiente.
  Forneça `token` (ou `password`) explicitamente. Credenciais explícitas ausentes é um erro.
- Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` só é aceito em uma janela de nível superior (não embutida) para prevenir clickjacking.
- Deployments da Control UI não-loopback devem definir `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Isso inclui setups de dev remoto.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  o modo de fallback de origem por header Host, mas é um modo de segurança perigoso.

Exemplo:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detalhes de configuração de acesso remoto: [Acesso remoto](/gateway/remote).
