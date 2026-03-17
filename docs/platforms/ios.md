---
summary: "Aplicativo de nó iOS: conexão com o Gateway, emparelhamento, canvas e solução de problemas"
read_when:
  - Emparelhando ou reconectando o nó iOS
  - Executando o aplicativo iOS a partir da fonte
  - Depurando descoberta do Gateway ou comandos canvas
title: "Aplicativo iOS"
---

# Aplicativo iOS (Nó)

Disponibilidade: visualização interna. O aplicativo iOS ainda não é distribuído publicamente.

## O que ele faz

- Se conecta a um Gateway via WebSocket (LAN ou tailnet).
- Expõe recursos de nó: Canvas, Snapshot de Tela, Captura de Câmera, Localização, Talk Mode, Voice Wake.
- Recebe comandos `node.invoke` e relata eventos de status do nó.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesmo LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `opencraft.internal.`), **ou**
  - Host/porta manual (fallback).

## Início rápido (emparelhar + conectar)

1. Inicie o Gateway:

```bash
opencraft gateway --port 18789
```

2. No aplicativo iOS, abra Configurações e escolha um Gateway descoberto (ou ative Manual Host e insira host/porta).

3. Aprove a solicitação de emparelhamento no host do Gateway:

```bash
opencraft devices list
opencraft devices approve <requestId>
```

4. Verifique a conexão:

```bash
opencraft nodes status
opencraft gateway call node.list --params "{}"
```

## Push com suporte de relay para compilações oficiais

As compilações iOS oficiais distribuídas usam o relay de push externo em vez de publicar o token APNs bruto
para o Gateway.

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

- O aplicativo iOS se registra no relay usando App Attest e o recebimento do aplicativo.
- O relay retorna um identificador de relay opaco mais uma concessão de envio com escopo de registro.
- O aplicativo iOS busca a identidade do Gateway emparelhado e o inclui no registro do relay, para que o registro com suporte de relay seja delegado a esse Gateway específico.
- O aplicativo encaminha esse registro com suporte de relay para o Gateway emparelhado com `push.apns.register`.
- O Gateway usa esse identificador de relay armazenado para `push.test`, despertares em segundo plano e empurrões de despertar.
- A URL base do relay do Gateway deve corresponder à URL do relay incorporada na compilação iOS oficial/TestFlight.
- Se o aplicativo se conectar posteriormente a um Gateway diferente ou a uma compilação com uma URL de base de relay diferente, ele atualiza o registro de relay em vez de reutilizar a ligação antiga.

O que o Gateway **não** precisa para esse caminho:

- Nenhum token de relay em toda a implantação.
- Nenhuma chave APNs direta para envios com suporte de relay oficial/TestFlight.

Fluxo de operador esperado:

1. Instale a compilação iOS oficial/TestFlight.
2. Defina `gateway.push.apns.relay.baseUrl` no Gateway.
3. Emparelhe o aplicativo com o Gateway e deixe-o terminar de conectar.
4. O aplicativo publica `push.apns.register` automaticamente depois de ter um token APNs, a sessão do operador está conectada e o registro do relay tem sucesso.
5. Depois disso, `push.test`, reconectar despertares e empurrões de despertar podem usar o registro com suporte de relay armazenado.

Nota de compatibilidade:

- `OPENCRAFT_APNS_RELAY_BASE_URL` ainda funciona como substituição de env temporária para o Gateway.

## Fluxo de autenticação e confiança

O relay existe para impor dois restrições que direct APNs-on-Gateway não pode fornecer para
compilações iOS oficiais:

- Apenas compilações genuínas do OpenCraft iOS distribuídas através da Apple podem usar o relay hospedado.
- Um Gateway pode enviar pushes com suporte de relay apenas para dispositivos iOS que foram emparelhados com esse Gateway específico.

Hop a hop:

1. `Aplicativo iOS -> Gateway`
   - O aplicativo primeiro é emparelhado com o Gateway através do fluxo de autenticação normal do Gateway.
   - Isso fornece ao aplicativo uma sessão de nó autenticada mais uma sessão de operador autenticada.
   - A sessão do operador é usada para chamar `gateway.identity.get`.

2. `Aplicativo iOS -> relay`
   - O aplicativo chama os endpoints de registro do relay via HTTPS.
   - O registro inclui prova de App Attest plus recebimento do aplicativo.
   - O relay valida o bundle ID, prova de App Attest e recebimento da Apple, e requer o
     caminho de distribuição oficial/produção.
   - Isso é o que bloqueia compilações locais do Xcode/dev de usar o relay hospedado. Uma compilação local pode ser
     assinada, mas não satisfaz a prova oficial de distribuição da Apple que o relay espera.

3. `Delegação de identidade do Gateway`
   - Antes do registro no relay, o aplicativo busca a identidade do Gateway emparelhado de
     `gateway.identity.get`.
   - O aplicativo inclui essa identidade do Gateway na carga de registro do relay.
   - O relay retorna um identificador de relay e uma concessão de envio com escopo de registro que são delegados a
     essa identidade do Gateway.

4. `Gateway -> relay`
   - O Gateway armazena o identificador de relay e a concessão de envio de `push.apns.register`.
   - Em `push.test`, reconectar despertares e empurrões de despertar, o Gateway assina a solicitação de envio com seu
     própria identidade do dispositivo.
   - O relay verifica tanto a concessão de envio armazenada quanto a assinatura do Gateway contra a delegada
     identidade do Gateway do registro.
   - Outro Gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.

5. `relay -> APNs`
   - O relay possui as credenciais de APNs de produção e o token APNs bruto para a compilação oficial.
   - O Gateway nunca armazena o token APNs bruto para compilações oficiais com suporte de relay.
   - O relay envia o push final para APNs em nome do Gateway emparelhado.

Por que esse design foi criado:

- Para manter credenciais de APNs de produção fora dos Gateways dos usuários.
- Para evitar armazenar tokens APNs brutos de compilação oficial no Gateway.
- Para permitir o uso do relay hospedado apenas para compilações OpenCraft oficiais/TestFlight.
- Para impedir que um Gateway envie despertares para dispositivos iOS pertencentes a um Gateway diferente.

Compilações locais/manuais permanecem em APNs direto. Se você estiver testando essas compilações sem o relay, o
Gateway ainda precisa de credenciais APNs diretas:

```bash
export OPENCRAFT_APNS_TEAM_ID="TEAMID"
export OPENCRAFT_APNS_KEY_ID="KEYID"
export OPENCRAFT_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Caminhos de descoberta

### Bonjour (LAN)

O Gateway anuncia `_opencraft-gw._tcp` em `local.`. O aplicativo iOS lista esses automaticamente.

### Tailnet (entre redes)

Se o mDNS for bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo: `opencraft.internal.`) e DNS de divisão do Tailscale.
Consulte [Bonjour](/gateway/bonjour) para o exemplo do CoreDNS.

### Host/porta manual

Em Configurações, ative **Manual Host** e insira o host + porta do Gateway (padrão `18789`).

## Canvas + A2UI

O nó iOS renderiza um Canvas WKWebView. Use `node.invoke` para direcioná-lo:

```bash
opencraft nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__opencraft__/canvas/"}'
```

Notas:

- O host do Canvas do Gateway serve `/__opencraft__/canvas/` e `/__opencraft__/a2ui/`.
- É servido a partir do servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).
- O nó iOS navega automaticamente para A2UI ao conectar quando uma URL de host de Canvas é anunciada.
- Retorne ao scaffold incorporado com `canvas.navigate` e `{"url":""}`.

### Canvas eval / snapshot

```bash
opencraft nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__opencraft; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
opencraft nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice Wake + Talk Mode

- Voice Wake e Talk Mode estão disponíveis em Configurações.
- o iOS pode suspender áudio em segundo plano; trate Voice Wake e Talk Mode como melhores esforços quando o aplicativo não está ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o aplicativo iOS para o primeiro plano (comandos canvas/câmera/tela requerem isso).
- `A2UI_HOST_NOT_CONFIGURED`: o Gateway não anunciou uma URL de host de Canvas; verifique `canvasHost` em [Configuração do Gateway](/gateway/configuration).
- Prompt de emparelhamento nunca aparece: execute `opencraft devices list` e aprove manualmente.
- Reconexão falha após reinstalar: o token de emparelhamento do Keychain foi limpo; re-emparelhe o nó.

## Documentação relacionada

- [Emparelhamento](/channels/pairing)
- [Descoberta](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
