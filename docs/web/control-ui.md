---
summary: "Interface de controle no navegador para o Gateway (chat, nós, configuração)"
read_when:
  - Você quer operar o Gateway a partir de um navegador
  - Você quer acesso via Tailnet sem túneis SSH
title: "Control UI"
---

# Control UI (navegador)

A Control UI é uma pequena aplicação single-page **Vite + Lit** servida pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (ex.: `/opencraft`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway está rodando no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie o Gateway primeiro: `opencraft gateway`.

A autenticação é fornecida durante o handshake WebSocket via:

- `connect.params.auth.token`
- `connect.params.auth.password`
  O painel de configurações do dashboard mantém um Token para a sessão atual da aba do navegador e a URL do Gateway selecionada; senhas não são persistidas.
  O onboarding gera um Token do Gateway por padrão, então cole-o aqui na primeira conexão.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à Control UI a partir de um novo navegador ou dispositivo, o Gateway
requer uma **aprovação única de pareamento** — mesmo que você esteja na mesma Tailnet
com `gateway.auth.allowTailscale: true`. Esta é uma medida de segurança para prevenir
acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

**Para aprovar o dispositivo:**

```bash
# Listar solicitações pendentes
opencraft devices list

# Aprovar por ID da solicitação
opencraft devices approve <requestId>
```

Uma vez aprovado, o dispositivo é lembrado e não precisará de reaprovação a menos que
você o revogue com `opencraft devices revoke --device <id> --role <role>`. Veja
[CLI de Dispositivos](/cli/devices) para rotação e revogação de Token.

**Notas:**

- Conexões locais (`127.0.0.1`) são aprovadas automaticamente.
- Conexões remotas (LAN, Tailnet, etc.) requerem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo único, então trocar de navegador ou
  limpar dados do navegador exigirá novo pareamento.

## Suporte a idiomas

A Control UI pode se localizar no primeiro carregamento com base no idioma do seu navegador, e você pode alterar depois pelo seletor de idioma no cartão de Acesso.

- Idiomas suportados: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Traduções não-inglesas são carregadas sob demanda no navegador.
- O idioma selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes usam o inglês como fallback.

## O que ela pode fazer (hoje)

- Conversar com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Transmitir chamadas de ferramentas + cartões de saída de ferramentas ao vivo no Chat (eventos do agente)
- Canais: WhatsApp/Telegram/Discord/Slack + canais de Plugin (Mattermost, etc.) status + login por QR + config por canal (`channels.status`, `web.login.*`, `config.patch`)
- Instâncias: lista de presença + atualização (`system-presence`)
- Sessões: listar + sobrescritas por sessão de thinking/fast/verbose/reasoning (`sessions.list`, `sessions.patch`)
- Cron jobs: listar/adicionar/editar/executar/habilitar/desabilitar + histórico de execução (`cron.*`)
- Skills: status, habilitar/desabilitar, instalar, atualização de API key (`skills.*`)
- Nós: listar + capacidades (`node.list`)
- Aprovações de exec: editar allowlists do Gateway ou nó + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`)
- Config: visualizar/editar `~/.editzffaleta/OpenCraft.json` (`config.get`, `config.set`)
- Config: aplicar + reiniciar com validação (`config.apply`) e despertar a última sessão ativa
- Escritas de config incluem uma proteção de base-hash para prevenir sobrescrita de edições concorrentes
- Schema de config + renderização de formulário (`config.schema`, incluindo schemas de Plugin + canal); Editor JSON bruto permanece disponível
- Debug: snapshots de status/saúde/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`)
- Logs: tail ao vivo de logs de arquivo do Gateway com filtro/exportação (`logs.tail`)
- Atualização: executar atualização de pacote/git + reiniciar (`update.run`) com relatório de reinício

Notas do painel de Cron jobs:

- Para jobs isolados, a entrega padrão é resumo de anúncio. Você pode mudar para nenhum se quiser execuções apenas internas.
- Campos de canal/destino aparecem quando anúncio é selecionado.
- O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL Webhook HTTP(S) válida.
- Para jobs de sessão principal, os modos de entrega Webhook e nenhum estão disponíveis.
- Controles de edição avançada incluem excluir após execução, limpar sobrescrita de agente, opções exatas/escalonadas de Cron,
  sobrescritas de modelo/thinking do agente, e alternâncias de entrega best-effort.
- A validação do formulário é inline com erros no nível do campo; valores inválidos desabilitam o botão salvar até serem corrigidos.
- Defina `cron.webhookToken` para enviar um Token bearer dedicado; se omitido, o Webhook é enviado sem cabeçalho de autenticação.
- Fallback descontinuado: jobs legados armazenados com `notify: true` ainda podem usar `cron.webhook` até serem migrados.

## Comportamento do chat

- `chat.send` é **não-bloqueante**: ele confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida via eventos `chat`.
- Reenviar com a mesma `idempotencyKey` retorna `{ status: "in_flight" }` enquanto em execução, e `{ status: "ok" }` após conclusão.
- Respostas de `chat.history` são limitadas em tamanho para segurança da interface. Quando entradas de transcrição são muito grandes, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens muito grandes por um placeholder (`[chat.history omitted: message too large]`).
- `chat.inject` adiciona uma nota do assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas da interface (sem execução do agente, sem entrega por canal).
- Parar:
  - Clique em **Parar** (chama `chat.abort`)
  - Digite `/stop` (ou frases de aborto independentes como `stop`, `stop action`, `stop run`, `stop opencraft`, `please stop`) para abortar fora de banda
  - `chat.abort` suporta `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas para aquela sessão
- Retenção parcial de aborto:
  - Quando uma execução é abortada, texto parcial do assistente ainda pode ser exibido na interface
  - O Gateway persiste texto parcial do assistente abortado no histórico de transcrição quando existe saída em buffer
  - Entradas persistidas incluem metadados de aborto para que consumidores da transcrição possam distinguir parciais de aborto de saída de conclusão normal

## Acesso via Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy com HTTPS:

```bash
opencraft gateway --tailscale serve
```

Abra:

- `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

Por padrão, requisições de Control UI/WebSocket Serve podem autenticar via cabeçalhos de identidade Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenCraft
verifica a identidade resolvendo o endereço `x-forwarded-for` com
`tailscale whois` e comparando com o cabeçalho, e só aceita quando a
requisição chega ao loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Defina
`gateway.auth.allowTailscale: false` (ou force `gateway.auth.mode: "password"`)
se quiser exigir Token/senha mesmo para tráfego Serve.
Autenticação Serve sem Token assume que o host do Gateway é confiável. Se código local
não confiável pode rodar naquele host, exija autenticação por Token/senha.

### Vincular à tailnet + Token

```bash
opencraft gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Depois abra:

- `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

Cole o Token nas configurações da interface (enviado como `connect.params.auth.token`).

## HTTP inseguro

Se você abrir o dashboard via HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`),
o navegador roda em um **contexto não seguro** e bloqueia WebCrypto. Por padrão,
o OpenCraft **bloqueia** conexões da Control UI sem identidade de dispositivo.

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a interface localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do Gateway)

**Comportamento do toggle de autenticação insegura:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` é apenas um toggle de compatibilidade local:

- Ele permite que sessões localhost da Control UI prossigam sem identidade de dispositivo em
  contextos HTTP não seguros.
- Ele não ignora verificações de pareamento.
- Ele não relaxa requisitos de identidade de dispositivo remoto (não-localhost).

**Apenas para emergência:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desabilita verificações de identidade de dispositivo da Control UI e é uma
redução severa de segurança. Reverta rapidamente após uso emergencial.

Veja [Tailscale](/gateway/tailscale) para orientação de configuração HTTPS.

## Compilando a interface

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build # instala dependências da UI automaticamente na primeira execução
```

Base absoluta opcional (quando você quer URLs de assets fixas):

```bash
OPENCRAFT_CONTROL_UI_BASE_PATH=/opencraft/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev # instala dependências da UI automaticamente na primeira execução
```

Depois aponte a interface para a URL do Gateway WS (ex.: `ws://127.0.0.1:18789`).

## Depuração/teste: servidor de desenvolvimento + Gateway remoto

A Control UI são arquivos estáticos; o alvo WebSocket é configurável e pode ser
diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento Vite
localmente mas o Gateway roda em outro lugar.

1. Inicie o servidor de desenvolvimento da interface: `pnpm ui:dev`
2. Abra uma URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticação única opcional (se necessário):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notas:

- `gatewayUrl` é armazenado no localStorage após o carregamento e removido da URL.
- `token` é importado do fragmento da URL, armazenado no sessionStorage para a sessão atual da aba do navegador e URL do Gateway selecionada, e removido da URL; não é armazenado no localStorage.
- `password` é mantido apenas em memória.
- Quando `gatewayUrl` é definido, a interface não faz fallback para credenciais de config ou ambiente.
  Forneça `token` (ou `password`) explicitamente. Credenciais explícitas ausentes é um erro.
- Use `wss://` quando o Gateway está atrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para prevenir clickjacking.
- Deployments não-loopback da Control UI devem definir `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Isso inclui configurações de desenvolvimento remoto.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  modo de fallback de origem por cabeçalho Host, mas é um modo de segurança perigoso.

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
