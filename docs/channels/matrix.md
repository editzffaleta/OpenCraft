---
summary: "Status de suporte, capacidades e configuração do Matrix"
read_when:
  - Trabalhando em funcionalidades do canal Matrix
title: "Matrix"
---

# Matrix (plugin)

Matrix é um protocolo de mensagens aberto e descentralizado. O OpenCraft se conecta como um **usuário** Matrix
em qualquer homeserver, então você precisa de uma conta Matrix para o Bot. Uma vez logado, você pode enviar DM
diretamente para o Bot ou convidá-lo para salas (os "grupos" do Matrix). O Beeper também é uma opção válida de cliente,
mas requer que o E2EE esteja habilitado.

Status: suportado via Plugin (@vector-im/matrix-bot-sdk). Mensagens diretas, salas, threads, mídia, reações,
enquetes (envio + poll-start como texto), localização e E2EE (com suporte a criptografia).

## Plugin necessário

O Matrix é distribuído como Plugin e não está incluído na instalação principal.

Instalar via CLI (registro npm):

```bash
opencraft plugins install @opencraft/matrix
```

Checkout local (ao executar a partir de um repositório git):

```bash
opencraft plugins install ./extensions/matrix
```

Se você escolher Matrix durante a configuração e um checkout git for detectado,
o OpenCraft oferecerá o caminho de instalação local automaticamente.

Detalhes: [Plugins](/tools/plugin)

## Configuração

1. Instale o Plugin Matrix:
   - Do npm: `opencraft plugins install @opencraft/matrix`
   - De um checkout local: `opencraft plugins install ./extensions/matrix`
2. Crie uma conta Matrix em um homeserver:
   - Veja opções de hospedagem em [https://matrix.org/ecosystem/hosting/](https://matrix.org/ecosystem/hosting/)
   - Ou hospede você mesmo.
3. Obtenha um Token de acesso para a conta do Bot:
   - Use a API de login do Matrix com `curl` no seu homeserver:

   ```bash
   curl --request POST \
     --url https://matrix.example.org/_matrix/client/v3/login \
     --header 'Content-Type: application/json' \
     --data '{
     "type": "m.login.password",
     "identifier": {
       "type": "m.id.user",
       "user": "your-user-name"
     },
     "password": "your-password"
   }'
   ```

   - Substitua `matrix.example.org` pela URL do seu homeserver.
   - Ou defina `channels.matrix.userId` + `channels.matrix.password`: o OpenCraft chama o mesmo
     endpoint de login, armazena o Token de acesso em `~/.opencraft/credentials/matrix/credentials.json`
     e o reutiliza na próxima inicialização.

4. Configure as credenciais:
   - Env: `MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN` (ou `MATRIX_USER_ID` + `MATRIX_PASSWORD`)
   - Ou config: `channels.matrix.*`
   - Se ambos estiverem definidos, a configuração tem precedência.
   - Com Token de acesso: o ID do usuário é obtido automaticamente via `/whoami`.
   - Quando definido, `channels.matrix.userId` deve ser o ID completo do Matrix (exemplo: `@bot:example.org`).
5. Reinicie o Gateway (ou finalize a configuração).
6. Inicie uma DM com o Bot ou convide-o para uma sala a partir de qualquer cliente Matrix
   (Element, Beeper, etc.; veja [https://matrix.org/ecosystem/clients/](https://matrix.org/ecosystem/clients/)). O Beeper requer E2EE,
   então defina `channels.matrix.encryption: true` e verifique o dispositivo.

Configuração mínima (Token de acesso, ID do usuário obtido automaticamente):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      dm: { policy: "pairing" },
    },
  },
}
```

Configuração E2EE (criptografia ponta a ponta habilitada):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

## Criptografia (E2EE)

A criptografia ponta a ponta é **suportada** via Rust crypto SDK.

Habilite com `channels.matrix.encryption: true`:

- Se o módulo de criptografia carregar, salas criptografadas são descriptografadas automaticamente.
- Mídia de saída é criptografada ao enviar para salas criptografadas.
- Na primeira conexão, o OpenCraft solicita verificação do dispositivo das suas outras sessões.
- Verifique o dispositivo em outro cliente Matrix (Element, etc.) para habilitar o compartilhamento de chaves.
- Se o módulo de criptografia não puder ser carregado, o E2EE é desabilitado e salas criptografadas não serão descriptografadas;
  o OpenCraft registra um aviso.
- Se você vir erros de módulo de criptografia ausente (por exemplo, `@matrix-org/matrix-sdk-crypto-nodejs-*`),
  permita scripts de build para `@matrix-org/matrix-sdk-crypto-nodejs` e execute
  `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs` ou obtenha o binário com
  `node node_modules/@matrix-org/matrix-sdk-crypto-nodejs/download-lib.js`.

O estado de criptografia é armazenado por conta + Token de acesso em
`~/.opencraft/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/crypto/`
(banco de dados SQLite). O estado de sincronização fica ao lado em `bot-storage.json`.
Se o Token de acesso (dispositivo) mudar, um novo armazenamento é criado e o Bot deve ser
reverificado para salas criptografadas.

**Verificação de dispositivo:**
Quando o E2EE está habilitado, o Bot solicitará verificação das suas outras sessões na inicialização.
Abra o Element (ou outro cliente) e aprove a solicitação de verificação para estabelecer confiança.
Uma vez verificado, o Bot pode descriptografar mensagens em salas criptografadas.

## Múltiplas contas

Suporte a múltiplas contas: use `channels.matrix.accounts` com credenciais por conta e `name` opcional. Veja [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) para o padrão compartilhado.

Cada conta funciona como um usuário Matrix separado em qualquer homeserver. A configuração por conta
herda das configurações de nível superior `channels.matrix` e pode sobrescrever qualquer opção
(política de DM, grupos, criptografia, etc.).

```json5
{
  channels: {
    matrix: {
      enabled: true,
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          name: "Main assistant",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_***",
          encryption: true,
        },
        alerts: {
          name: "Alerts bot",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_***",
          dm: { policy: "allowlist", allowFrom: ["@admin:example.org"] },
        },
      },
    },
  },
}
```

Notas:

- A inicialização de contas é serializada para evitar condições de corrida com importações de módulos concorrentes.
- Variáveis de ambiente (`MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN`, etc.) aplicam-se apenas à conta **padrão**.
- Configurações base do canal (política de DM, política de grupo, exigência de menção, etc.) aplicam-se a todas as contas, a menos que sejam sobrescritas por conta.
- Use `bindings[].match.accountId` para rotear cada conta para um agente diferente.
- O estado de criptografia é armazenado por conta + Token de acesso (armazenamentos de chaves separados por conta).

## Modelo de roteamento

- Respostas sempre voltam para o Matrix.
- DMs compartilham a sessão principal do agente; salas mapeiam para sessões de grupo.

## Controle de acesso (DMs)

- Padrão: `channels.matrix.dm.policy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprovar via:
  - `opencraft pairing list matrix`
  - `opencraft pairing approve matrix <CODE>`
- DMs públicas: `channels.matrix.dm.policy="open"` mais `channels.matrix.dm.allowFrom=["*"]`.
- `channels.matrix.dm.allowFrom` aceita IDs completos de usuários Matrix (exemplo: `@user:server`). O assistente de configuração resolve nomes de exibição para IDs de usuário quando a busca no diretório encontra uma correspondência exata única.
- Não use nomes de exibição ou localparts simples (exemplo: `"Alice"` ou `"alice"`). Eles são ambíguos e são ignorados para correspondência de allowlist. Use IDs completos `@user:server`.

## Salas (grupos)

- Padrão: `channels.matrix.groupPolicy = "allowlist"` (com exigência de menção). Use `channels.defaults.groupPolicy` para sobrescrever o padrão quando não definido.
- Nota de tempo de execução: se `channels.matrix` estiver completamente ausente, o tempo de execução retorna para `groupPolicy="allowlist"` para verificações de sala (mesmo que `channels.defaults.groupPolicy` esteja definido).
- Adicione salas à allowlist com `channels.matrix.groups` (IDs de sala ou aliases; nomes são resolvidos para IDs quando a busca no diretório encontra uma correspondência exata única):

```json5
{
  channels: {
    matrix: {
      groupPolicy: "allowlist",
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
      groupAllowFrom: ["@owner:example.org"],
    },
  },
}
```

- `requireMention: false` habilita resposta automática naquela sala.
- `groups."*"` pode definir padrões para exigência de menção em todas as salas.
- `groupAllowFrom` restringe quais remetentes podem acionar o Bot em salas (IDs completos de usuários Matrix).
- Allowlists `users` por sala podem restringir ainda mais os remetentes dentro de uma sala específica (use IDs completos de usuários Matrix).
- O assistente de configuração solicita allowlists de salas (IDs de sala, aliases ou nomes) e resolve nomes apenas em uma correspondência exata e única.
- Na inicialização, o OpenCraft resolve nomes de sala/usuário em allowlists para IDs e registra o mapeamento; entradas não resolvidas são ignoradas para correspondência de allowlist.
- Convites são aceitos automaticamente por padrão; controle com `channels.matrix.autoJoin` e `channels.matrix.autoJoinAllowlist`.
- Para não permitir **nenhuma sala**, defina `channels.matrix.groupPolicy: "disabled"` (ou mantenha uma allowlist vazia).
- Chave legada: `channels.matrix.rooms` (mesma estrutura que `groups`).

## Threads

- Threads de resposta são suportadas.
- `channels.matrix.threadReplies` controla se as respostas ficam em threads:
  - `off`, `inbound` (padrão), `always`
- `channels.matrix.replyToMode` controla metadados de resposta quando não está respondendo em um thread:
  - `off` (padrão), `first`, `all`

## Capacidades

| Funcionalidade    | Status                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Mensagens diretas | ✅ Suportado                                                                                            |
| Salas             | ✅ Suportado                                                                                            |
| Threads           | ✅ Suportado                                                                                            |
| Mídia             | ✅ Suportado                                                                                            |
| E2EE              | ✅ Suportado (módulo de criptografia necessário)                                                        |
| Reações           | ✅ Suportado (enviar/ler via ferramentas)                                                               |
| Enquetes          | ✅ Envio suportado; poll starts de entrada são convertidos em texto (respostas/encerramentos ignorados) |
| Localização       | ✅ Suportado (geo URI; altitude ignorada)                                                               |
| Comandos nativos  | ✅ Suportado                                                                                            |

## Solução de problemas

Execute esta sequência primeiro:

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Em seguida, confirme o estado de pareamento de DM se necessário:

```bash
opencraft pairing list matrix
```

Falhas comuns:

- Logado mas mensagens de sala ignoradas: sala bloqueada por `groupPolicy` ou allowlist de sala.
- DMs ignoradas: remetente pendente de aprovação quando `channels.matrix.dm.policy="pairing"`.
- Salas criptografadas falham: suporte a criptografia ou incompatibilidade de configurações de criptografia.

Para fluxo de triagem: [/channels/troubleshooting](/channels/troubleshooting).

## Referência de configuração (Matrix)

Configuração completa: [Configuration](/gateway/configuration)

Opções do provedor:

- `channels.matrix.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.matrix.homeserver`: URL do homeserver.
- `channels.matrix.userId`: ID de usuário Matrix (opcional com Token de acesso).
- `channels.matrix.accessToken`: Token de acesso.
- `channels.matrix.password`: senha para login (Token armazenado).
- `channels.matrix.deviceName`: nome de exibição do dispositivo.
- `channels.matrix.encryption`: habilitar E2EE (padrão: false).
- `channels.matrix.initialSyncLimit`: limite de sincronização inicial.
- `channels.matrix.threadReplies`: `off | inbound | always` (padrão: inbound).
- `channels.matrix.textChunkLimit`: tamanho do bloco de texto de saída (caracteres).
- `channels.matrix.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.matrix.dm.policy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.matrix.dm.allowFrom`: allowlist de DM (IDs completos de usuários Matrix). `open` requer `"*"`. O assistente resolve nomes para IDs quando possível.
- `channels.matrix.groupPolicy`: `allowlist | open | disabled` (padrão: allowlist).
- `channels.matrix.groupAllowFrom`: remetentes na allowlist para mensagens de grupo (IDs completos de usuários Matrix).
- `channels.matrix.allowlistOnly`: forçar regras de allowlist para DMs + salas.
- `channels.matrix.groups`: allowlist de grupo + mapa de configurações por sala.
- `channels.matrix.rooms`: allowlist/configuração de grupo legada.
- `channels.matrix.replyToMode`: modo de resposta para threads/tags.
- `channels.matrix.mediaMaxMb`: limite de mídia de entrada/saída (MB).
- `channels.matrix.autoJoin`: tratamento de convites (`always | allowlist | off`, padrão: always).
- `channels.matrix.autoJoinAllowlist`: IDs/aliases de sala permitidos para auto-join.
- `channels.matrix.accounts`: configuração de múltiplas contas indexada por ID de conta (cada conta herda configurações de nível superior).
- `channels.matrix.actions`: controle de ferramentas por ação (reactions/messages/pins/memberInfo/channelInfo).
