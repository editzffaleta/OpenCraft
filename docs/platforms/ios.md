---
summary: "App nó iOS: conectar ao Gateway, pareamento, canvas e troubleshooting"
read_when:
  - Pareando ou reconectando o nó iOS
  - Rodando o app iOS do código-fonte
  - Depurando descoberta de gateway ou comandos de canvas
title: "App iOS"
---

# App iOS (Nó)

Disponibilidade: preview interno. O app iOS ainda não é distribuído publicamente.

## O que ele faz

- Conecta a um Gateway via WebSocket (LAN ou tailnet).
- Expõe capacidades de nó: Canvas, Snapshot de tela, Captura de câmera, Localização, Modo Talk, Voice wake.
- Recebe comandos `node.invoke` e reporta eventos de status do nó.

## Requisitos

- Gateway rodando em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via unicast DNS-SD (domínio exemplo: `openclaw.internal.`), **ou**
  - Host/porta manual (fallback).

## Início rápido (parear + conectar)

1. Inicie o Gateway:

```bash
opencraft gateway --port 18789
```

2. No app iOS, abra Configurações e escolha um gateway descoberto (ou habilite Host Manual e insira host/porta).

3. Aprove a requisição de pareamento no host do gateway:

```bash
opencraft devices list
opencraft devices approve <requestId>
```

4. Verifique a conexão:

```bash
opencraft nodes status
opencraft gateway call node.list --params "{}"
```

## Push respaldado por relay para builds oficiais

Builds iOS oficialmente distribuídos usam o relay de push externo em vez de publicar o token APNs bruto para o gateway.

Requisito do lado do Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Como o fluxo funciona:

- O app iOS se registra no relay usando App Attest e o recibo do app.
- O relay retorna um handle de relay opaco mais um grant de envio com escopo de registro.
- O app iOS busca a identidade do gateway pareado e a inclui no registro do relay, para que o registro respaldado pelo relay seja delegado àquele gateway específico.
- O app encaminha esse registro respaldado pelo relay para o gateway pareado com `push.apns.register`.
- O gateway usa esse handle de relay armazenado para `push.test`, acordar em background e nudges de acordo.
- A URL base do relay do gateway deve corresponder à URL do relay embutida no build oficial/TestFlight do iOS.
- Se o app conectar posteriormente a um gateway diferente ou um build com uma URL base de relay diferente, ele atualiza o registro do relay em vez de reutilizar o binding antigo.

O que o gateway **não** precisa para este caminho:

- Sem token de relay em toda a implantação.
- Sem chave APNs direta para envios oficiais/TestFlight respaldados pelo relay.

Fluxo esperado do operador:

1. Instale o build oficial/TestFlight do iOS.
2. Defina `gateway.push.apns.relay.baseUrl` no gateway.
3. Pareie o app com o gateway e deixe-o terminar de conectar.
4. O app publica `push.apns.register` automaticamente após ter um token APNs, a sessão do operador estar conectada e o registro do relay ter sucesso.
5. Após isso, `push.test`, acordar na reconexão e nudges de acordo podem usar o registro respaldado pelo relay armazenado.

Nota de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como sobrescrita de env temporária para o gateway.

## Fluxo de autenticação e confiança

O relay existe para enforçar duas restrições que o APNs direto no gateway não pode fornecer para
builds oficiais do iOS:

- Apenas builds iOS genuínos do OpenCraft distribuídos pela Apple podem usar o relay hospedado.
- Um gateway pode enviar pushes respaldados pelo relay apenas para dispositivos iOS que parearam com aquele gateway específico.

Hop a hop:

1. `App iOS -> gateway`
   - O app primeiro pareia com o gateway pelo fluxo normal de auth do Gateway.
   - Isso dá ao app uma sessão de nó autenticada mais uma sessão de operador autenticada.
   - A sessão do operador é usada para chamar `gateway.identity.get`.

2. `App iOS -> relay`
   - O app chama os endpoints de registro do relay via HTTPS.
   - O registro inclui prova App Attest mais o recibo do app.
   - O relay valida o bundle ID, prova App Attest e recibo Apple, e requer o caminho de distribuição oficial/de produção.
   - Isso é o que bloqueia builds locais Xcode/dev de usar o relay hospedado.

3. `Delegação de identidade do gateway`
   - Antes do registro no relay, o app busca a identidade do gateway pareado via `gateway.identity.get`.
   - O app inclui essa identidade do gateway no payload de registro do relay.
   - O relay retorna um handle de relay e um grant de envio com escopo de registro delegados àquela identidade do gateway.

4. `Gateway -> relay`
   - O gateway armazena o handle de relay e grant de envio de `push.apns.register`.
   - Em `push.test`, acordar na reconexão e nudges de acordo, o gateway assina a requisição de envio com sua própria identidade de dispositivo.
   - O relay verifica tanto o grant de envio armazenado quanto a assinatura do gateway em relação à identidade do gateway delegada no registro.
   - Outro gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o handle.

5. `Relay -> APNs`
   - O relay detém as credenciais APNs de produção e o token APNs bruto para o build oficial.
   - O gateway nunca armazena o token APNs bruto para builds oficiais respaldados pelo relay.
   - O relay envia o push final para APNs em nome do gateway pareado.

Por que esse design foi criado:

- Para manter credenciais APNs de produção fora dos gateways dos usuários.
- Para evitar armazenar tokens APNs brutos do build oficial no gateway.
- Para permitir uso do relay hospedado apenas para builds oficiais/TestFlight do OpenCraft.
- Para impedir que um gateway envie pushes de acorde para dispositivos iOS pertencentes a um gateway diferente.

Builds locais/manuais permanecem em APNs direto. Se você estiver testando esses builds sem o relay, o
gateway ainda precisa de credenciais APNs diretas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Caminhos de descoberta

### Bonjour (LAN)

O Gateway anuncia `_openclaw-gw._tcp` em `local.`. O app iOS lista esses automaticamente.

### Tailnet (cross-network)

Se mDNS estiver bloqueado, use uma zona unicast DNS-SD (escolha um domínio; exemplo: `openclaw.internal.`) e Tailscale split DNS.
Veja [Bonjour](/gateway/bonjour) para o exemplo CoreDNS.

### Host/porta manual

Em Configurações, habilite **Host Manual** e insira o host + porta do gateway (padrão `18789`).

## Canvas + A2UI

O nó iOS renderiza um canvas WKWebView. Use `node.invoke` para controlá-lo:

```bash
opencraft nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- O host canvas do Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- É servido pelo servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).
- O nó iOS navega automaticamente para A2UI ao conectar quando um URL de host canvas é anunciado.
- Retorne ao scaffold embutido com `canvas.navigate` e `{"url":""}`.

### Canvas eval / snapshot

```bash
opencraft nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
opencraft nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + modo talk

- Voice wake e modo talk estão disponíveis em Configurações.
- O iOS pode suspender áudio em background; trate recursos de voz como melhor esforço quando o app não está ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o app iOS para o primeiro plano (comandos de canvas/câmera/tela requerem isso).
- `A2UI_HOST_NOT_CONFIGURED`: o Gateway não anunciou um URL de host canvas; verifique `canvasHost` na [configuração do Gateway](/gateway/configuration).
- Prompt de pareamento nunca aparece: execute `opencraft devices list` e aprove manualmente.
- Reconexão falha após reinstalação: o token de pareamento do Keychain foi limpo; pareie o nó novamente.

## Docs relacionados

- [Pareamento](/channels/pairing)
- [Descoberta](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
