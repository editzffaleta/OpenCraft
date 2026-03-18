# OpenClaw iOS (Super Alpha)

Este app para iPhone é super-alpha e de uso interno apenas. Ele se conecta a um OpenCraft Gateway como `role: node`.

## Status de Distribuição

- Distribuição pública: não disponível.
- Distribuição beta interna: archive local + upload para TestFlight via Fastlane.
- Deploy local/manual a partir do código-fonte via Xcode permanece como o caminho padrão de desenvolvimento.

## Aviso Super-Alpha

- Mudanças que quebram compatibilidade são esperadas.
- Fluxos de UI e onboarding podem mudar sem garantias de migração.
- O uso em primeiro plano é o único modo confiável no momento.
- Trate este build como sensível enquanto as permissões e o comportamento em segundo plano ainda estão sendo refinados.

## Fluxo Exato de Deploy Manual pelo Xcode

1. Pré-requisitos:
   - Xcode 16+
   - `pnpm`
   - `xcodegen`
   - Assinatura Apple Development configurada no Xcode
2. A partir da raiz do repositório:

```bash
pnpm install
./scripts/ios-configure-signing.sh
cd apps/ios
xcodegen generate
open OpenClaw.xcodeproj
```

3. No Xcode:
   - Scheme: `OpenClaw`
   - Destino: iPhone conectado (recomendado para comportamento real)
   - Configuração de build: `Debug`
   - Executar (`Product` -> `Run`)
4. Se a assinatura falhar em um time pessoal:
   - Use IDs de bundle locais únicos via `apps/ios/LocalSigning.xcconfig`.
   - Comece de `apps/ios/LocalSigning.xcconfig.example`.

Comando de atalho (mesmo fluxo + abre o projeto):

```bash
pnpm ios:open
```

## Fluxo de Release Beta Local

Pré-requisitos:

- Xcode 16+
- `pnpm`
- `xcodegen`
- `fastlane`
- Conta Apple conectada no Xcode para assinatura/provisionamento automático
- Chave de API do App Store Connect configurada no Keychain via `scripts/ios-asc-keychain-setup.sh` ao resolver automaticamente um número de build beta ou fazer upload para o TestFlight

Comportamento do release:

- O desenvolvimento local continua usando IDs de bundle únicos por desenvolvedor de `scripts/ios-configure-signing.sh`.
- O release beta usa os IDs de bundle canônicos `ai.openclaw.client*` através de um xcconfig gerado temporariamente em `apps/ios/build/BetaRelease.xcconfig`.
- O release beta também muda o app para `OpenClawPushTransport=relay`, `OpenClawPushDistribution=official`, e `OpenClawPushAPNsEnvironment=production`.
- O fluxo beta não modifica `apps/ios/.local-signing.xcconfig` ou `apps/ios/LocalSigning.xcconfig`.
- `package.json.version` na raiz é a única fonte de versão para iOS.
- Uma versão raiz como `2026.3.13-beta.1` se torna:
  - `CFBundleShortVersionString = 2026.3.13`
  - `CFBundleVersion = próximo número de build TestFlight para 2026.3.13`

Env obrigatório para builds beta:

- `OPENCLAW_PUSH_RELAY_BASE_URL=https://relay.example.com`
  Deve ser uma URL base simples `https://host[:port][/path]` sem espaços em branco, parâmetros de query, fragmentos ou metacaracteres xcconfig.

Archive sem upload:

```bash
pnpm ios:beta:archive
```

Archive e upload para TestFlight:

```bash
pnpm ios:beta
```

Se precisar forçar um número de build específico:

```bash
pnpm ios:beta -- --build-number 7
```

## Expectativas de APNs para Builds Locais/Manuais

- O app chama `registerForRemoteNotifications()` no lançamento.
- `apps/ios/Sources/OpenClaw.entitlements` define `aps-environment` como `development`.
- O registro do token APNs no gateway ocorre apenas após a conexão com o gateway (`push.apns.register`).
- Builds locais/manuais usam por padrão `OpenClawPushTransport=direct` e `OpenClawPushDistribution=local`.
- O time/perfil selecionado deve suportar Push Notifications para o ID de bundle do app que você está assinando.
- Se a capability de push ou o provisionamento estiver incorreto, o registro APNs falha em runtime (verifique os logs do Xcode para `APNs registration failed`).
- Builds Debug usam por padrão `OpenClawPushAPNsEnvironment=sandbox`; builds Release usam por padrão `production`.

## Expectativas de APNs para Builds Oficiais

- Builds oficiais/TestFlight registram-se no relay de push externo antes de publicar `push.apns.register` no gateway.
- O registro no gateway para o modo relay contém um handle opaco do relay, um grant de envio com escopo de registro, metadados de origem do relay e metadados de instalação, em vez do token APNs bruto.
- O registro do relay está vinculado à identidade do gateway obtida de `gateway.identity.get`, portanto outro gateway não pode reutilizar esse registro armazenado.
- O app persiste os metadados do handle do relay localmente para que as reconexões possam republicar o registro do gateway sem re-registrar em cada conexão.
- Se a URL base do relay mudar em um build posterior, o app atualiza o registro do relay em vez de reutilizar a origem antiga do relay.
- O modo relay requer uma URL base do relay acessível e usa App Attest mais o recibo do app durante o registro.
- O envio pelo relay no lado do gateway é configurado através de `gateway.push.apns.relay.baseUrl` em `opencraft.json`. `OPENCLAW_APNS_RELAY_BASE_URL` permanece apenas como um override de env temporário.

## Modelo de Confiança do Relay de Build Oficial

- `iOS -> gateway`
  - O app deve fazer par com o gateway e estabelecer tanto sessões node quanto operator.
  - A sessão operator é usada para buscar `gateway.identity.get`.
- `iOS -> relay`
  - O app se registra no relay via HTTPS usando App Attest mais o recibo do app.
  - O relay exige o caminho oficial de distribuição production/TestFlight, razão pela qual
    instalações locais via Xcode/dev não podem usar o relay hospedado.
- `delegação do gateway`
  - O app inclui a identidade do gateway no registro do relay.
  - O relay retorna um handle do relay e um grant de envio com escopo de registro delegado àquele gateway.
- `gateway -> relay`
  - O gateway assina as solicitações de envio do relay com sua própria identidade de dispositivo.
  - O relay verifica tanto o grant de envio delegado quanto a assinatura do gateway antes de enviar para
    APNs.
- `relay -> APNs`
  - As credenciais de APNs de produção e os tokens APNs brutos de builds oficiais ficam na implantação do relay,
    não no gateway.

Isso existe para manter o relay hospedado limitado a builds oficiais genuínos do OpenClaw e para garantir que um gateway possa enviar pushes apenas para dispositivos iOS que fizeram par com aquele gateway.

## O que Funciona Agora (Concreto)

- Pareamento via fluxo de código de configuração (`/pair` depois `/pair approve` no Telegram).
- Conexão com o gateway via descoberta ou host/porta manual com prompt de confiança de fingerprint TLS.
- Superfícies de Chat + Talk pela sessão operator do gateway.
- Comandos node do iPhone em primeiro plano: captura/clipe de câmera, apresentar/navegar/eval/snapshot do canvas, gravação de tela, localização, contatos, calendário, lembretes, fotos, movimento, notificações locais.
- Encaminhamento de deep-link da extensão de compartilhamento para a sessão conectada do gateway.

## Caso de Uso de Automação de Localização (Testes)

Use isso para sinais de automação ("eu me movi", "eu cheguei", "eu saí"), não como mecanismo de manter o app ativo.

- Intenção do produto:
  - automações conscientes de movimento impulsionadas por eventos de localização do iOS
  - exemplo: chegada/saída de geofence, movimento significativo, detecção de visita
- Não é objetivo:
  - polling contínuo de GPS apenas para manter o app ativo

Caminho de teste a incluir nas execuções de QA:

1. Habilitar permissão de localização no app:
   - defina a permissão `Always`
   - verifique se a capability de localização em segundo plano está habilitada no perfil de build
2. Coloque o app em segundo plano e acione movimento:
   - caminhe/dirija o suficiente para uma atualização significativa de localização, ou cruze um geofence configurado
3. Valide efeitos colaterais no lado do gateway:
   - reconexão/wake do node se necessário
   - evento de localização/movimento esperado chega no gateway
   - gatilho de automação executa uma vez (sem tempestade de duplicatas)
4. Valide impacto nos recursos:
   - sem estado térmico alto sustentado
   - sem drenagem excessiva de bateria em segundo plano durante uma janela de observação curta

Critérios de aprovação:

- eventos de movimento são entregues de forma suficientemente confiável para a UX de automação
- sem loops de spam de reconexão impulsionados por localização
- o app permanece estável após transições repetidas de segundo plano/primeiro plano

## Problemas Conhecidos / Limitações / Questões

- Primeiro plano em primeiro lugar: o iOS pode suspender sockets em segundo plano; a recuperação de reconexão ainda está sendo ajustada.
- Os limites de comandos em segundo plano são estritos: `canvas.*`, `camera.*`, `screen.*`, e `talk.*` são bloqueados quando em segundo plano.
- Localização em segundo plano requer permissão de localização `Always`.
- Erros de pareamento/auth pausam intencionalmente os loops de reconexão até que um humano corrija o estado de auth/pareamento.
- Voice Wake e Talk competem pelo mesmo microfone; Talk suprime a captura de wake enquanto está ativo.
- A confiabilidade do APNs depende do alinhamento de assinatura/provisionamento/tópico local.
- Espere arestas brutas de UX e agitação ocasional de reconexão durante o desenvolvimento ativo.

## Workstream Atual em Andamento

Robustez de wake/reconexão automática:

- melhorar o comportamento de wake/resume entre transições de cena
- reduzir estados de socket morto após segundo plano -> primeiro plano
- ajustar a coordenação de reconexão de sessão node/operator
- reduzir etapas de recuperação manual após falhas transitórias de rede

## Checklist de Depuração

1. Confirme o baseline de build/assinatura:
   - regenere o projeto (`xcodegen generate`)
   - verifique o time selecionado + IDs de bundle
2. No app `Settings -> Gateway`:
   - confirme o texto de status, servidor e endereço remoto
   - verifique se o status mostra bloqueio de pareamento/auth
3. Se o pareamento for necessário:
   - execute `/pair approve` no Telegram, depois reconecte
4. Se a descoberta estiver instável:
   - habilite `Discovery Debug Logs`
   - inspecione `Settings -> Gateway -> Discovery Logs`
5. Se o caminho de rede estiver unclear:
   - mude para host/porta manual + TLS nas configurações avançadas do Gateway
6. No console do Xcode, filtre por sinais de subsistema/categoria:
   - `ai.openclaw.ios`
   - `GatewayDiag`
   - `APNs registration failed`
7. Valide as expectativas de segundo plano:
   - reproduza em primeiro plano primeiro
   - depois teste as transições de segundo plano e confirme a reconexão no retorno
