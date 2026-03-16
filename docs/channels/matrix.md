---
summary: "Status de suporte ao Matrix, capacidades e configuração"
read_when:
  - Trabalhando em recursos do canal Matrix
title: "Matrix"
---

# Matrix (plugin)

Matrix é um protocolo de mensagens aberto e descentralizado. O OpenCraft conecta como um **usuário** Matrix em qualquer homeserver, então você precisa de uma conta Matrix para o bot. Uma vez conectado, você pode enviar DM ao bot diretamente ou convidá-lo para salas (os "grupos" do Matrix). O Beeper também é uma opção de cliente válida, mas requer que o E2EE esteja habilitado.

Status: suportado via plugin (@vector-im/matrix-bot-sdk). Mensagens diretas, salas, threads, mídia, reações, enquetes (envio + início de enquete como texto), localização e E2EE (com suporte a cripto).

## Plugin necessário

O Matrix é disponibilizado como plugin e não está incluído na instalação principal.

Instalar via CLI (registro npm):

```bash
opencraft plugins install @openclaw/matrix
```

Checkout local (quando executando a partir de um repositório git):

```bash
opencraft plugins install ./extensions/matrix
```

Se você escolher Matrix durante configure/onboarding e um checkout git for detectado, o OpenCraft oferecerá o caminho de instalação local automaticamente.

Detalhes: [Plugins](/tools/plugin)

## Configuração

1. Instale o plugin Matrix:
   - Do npm: `opencraft plugins install @openclaw/matrix`
   - De um checkout local: `opencraft plugins install ./extensions/matrix`
2. Crie uma conta Matrix em um homeserver:
   - Navegue pelas opções de hospedagem em [https://matrix.org/ecosystem/hosting/](https://matrix.org/ecosystem/hosting/)
   - Ou hospede o seu próprio.
3. Obtenha um token de acesso para a conta do bot:
   - Use a API de login do Matrix com `curl` no seu homeserver:

   ```bash
   curl --request POST \
     --url https://matrix.example.org/_matrix/client/v3/login \
     --header 'Content-Type: application/json' \
     --data '{
     "type": "m.login.password",
     "identifier": {
       "type": "m.id.user",
       "user": "seu-nome-de-usuario"
     },
     "password": "sua-senha"
   }'
   ```

   - Substitua `matrix.example.org` pela URL do seu homeserver.
   - Ou defina `channels.matrix.userId` + `channels.matrix.password`: o OpenCraft chama o mesmo endpoint de login, armazena o token de acesso em `~/.opencraft/credentials/matrix/credentials.json` e o reutiliza na próxima inicialização.

4. Configure as credenciais:
   - Env: `MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN` (ou `MATRIX_USER_ID` + `MATRIX_PASSWORD`)
   - Ou config: `channels.matrix.*`
   - Se ambos estiverem definidos, a config tem precedência.
   - Com token de acesso: o ID do usuário é obtido automaticamente via `/whoami`.
   - Quando definido, `channels.matrix.userId` deve ser o ID Matrix completo (exemplo: `@bot:example.org`).
5. Reinicie o gateway (ou conclua o onboarding).
6. Inicie um DM com o bot ou convide-o para uma sala de qualquer cliente Matrix (Element, Beeper, etc.; veja [https://matrix.org/ecosystem/clients/](https://matrix.org/ecosystem/clients/)). O Beeper requer E2EE, então defina `channels.matrix.encryption: true` e verifique o dispositivo.

Config mínima (token de acesso, ID de usuário obtido automaticamente):

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

Config E2EE (criptografia de ponta a ponta habilitada):

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

A criptografia de ponta a ponta é **suportada** via SDK de cripto Rust.

Habilite com `channels.matrix.encryption: true`:

- Se o módulo de cripto carregar, salas criptografadas são decriptografadas automaticamente.
- Mídia de saída é criptografada ao enviar para salas criptografadas.
- Na primeira conexão, o OpenCraft solicita verificação de dispositivo das suas outras sessões.
- Verifique o dispositivo em outro cliente Matrix (Element, etc.) para habilitar o compartilhamento de chaves.
- Se o módulo de cripto não puder ser carregado, o E2EE é desabilitado e salas criptografadas não serão decriptografadas; o OpenCraft registra um aviso.
- Se você vir erros de módulo de cripto ausente (por exemplo, `@matrix-org/matrix-sdk-crypto-nodejs-*`), permita scripts de build para `@matrix-org/matrix-sdk-crypto-nodejs` e execute `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs` ou obtenha o binário com `node node_modules/@matrix-org/matrix-sdk-crypto-nodejs/download-lib.js`.

O estado de cripto é armazenado por conta + token de acesso em `~/.opencraft/matrix/accounts/<conta>/<homeserver>__<user>/<token-hash>/crypto/` (banco de dados SQLite). O estado de sincronização fica junto em `bot-storage.json`. Se o token de acesso (dispositivo) mudar, um novo store é criado e o bot deve ser verificado novamente para salas criptografadas.

**Verificação de dispositivo:**
Quando o E2EE está habilitado, o bot solicitará verificação das suas outras sessões na inicialização. Abra o Element (ou outro cliente) e aprove a solicitação de verificação para estabelecer confiança. Uma vez verificado, o bot pode decriptografar mensagens em salas criptografadas.

## Múltiplas contas

Suporte a múltiplas contas: use `channels.matrix.accounts` com credenciais por conta e `name` opcional. Veja [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) para o padrão compartilhado.

Cada conta executa como um usuário Matrix separado em qualquer homeserver. A config por conta herda das configurações de nível superior `channels.matrix` e pode substituir qualquer opção (política de DM, grupos, criptografia, etc.).

```json5
{
  channels: {
    matrix: {
      enabled: true,
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          name: "Assistente principal",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_***",
          encryption: true,
        },
        alerts: {
          name: "Bot de alertas",
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

- A inicialização da conta é serializada para evitar condições de corrida com importações de módulo concorrentes.
- Variáveis de ambiente (`MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN`, etc.) se aplicam apenas à conta **padrão**.
- Configurações de canal base (política de DM, política de grupo, controle de menção, etc.) se aplicam a todas as contas, a menos que sejam substituídas por conta.
- Use `bindings[].match.accountId` para rotear cada conta para um agente diferente.
- O estado de cripto é armazenado por conta + token de acesso (stores de chaves separados por conta).

## Modelo de roteamento

- Respostas sempre voltam para o Matrix.
- DMs compartilham a sessão principal do agente; salas mapeiam para sessões de grupo.

## Controle de acesso (DMs)

- Padrão: `channels.matrix.dm.policy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprovar via:
  - `opencraft pairing list matrix`
  - `opencraft pairing approve matrix <CÓDIGO>`
- DMs públicos: `channels.matrix.dm.policy="open"` mais `channels.matrix.dm.allowFrom=["*"]`.
- `channels.matrix.dm.allowFrom` aceita IDs completos de usuário Matrix (exemplo: `@usuario:servidor`). O wizard resolve nomes de exibição para IDs de usuário quando a busca no diretório encontra uma correspondência exata única.
- Não use nomes de exibição ou partes locais bare (exemplo: `"Alice"` ou `"alice"`). Eles são ambíguos e são ignorados para correspondência de lista de permissão. Use IDs completos `@usuario:servidor`.

## Salas (grupos)

- Padrão: `channels.matrix.groupPolicy = "allowlist"` (controlado por menção). Use `channels.defaults.groupPolicy` para substituir o padrão quando não estiver definido.
- Nota de runtime: se `channels.matrix` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` para verificações de sala (mesmo se `channels.defaults.groupPolicy` estiver definido).
- Liste salas na lista de permissão com `channels.matrix.groups` (IDs de sala ou aliases; nomes são resolvidos para IDs quando a busca no diretório encontra uma correspondência exata única):

```json5
{
  channels: {
    matrix: {
      groupPolicy: "allowlist",
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
      groupAllowFrom: ["@dono:example.org"],
    },
  },
}
```

- `requireMention: false` habilita resposta automática naquela sala.
- `groups."*"` pode definir padrões para controle de menção em todas as salas.
- `groupAllowFrom` restringe quais remetentes podem acionar o bot em salas (IDs completos de usuário Matrix).
- Listas de permissão de `users` por sala podem restringir ainda mais os remetentes dentro de uma sala específica (use IDs completos de usuário Matrix).
- O wizard de configuração solicita listas de permissão de sala (IDs de sala, aliases ou nomes) e resolve nomes apenas em correspondência exata e única.
- Na inicialização, o OpenCraft resolve nomes de sala/usuário nas listas de permissão para IDs e registra o mapeamento; entradas não resolvidas são ignoradas para correspondência de lista de permissão.
- Convites são aceitos automaticamente por padrão; controle com `channels.matrix.autoJoin` e `channels.matrix.autoJoinAllowlist`.
- Para não permitir **nenhuma sala**, defina `channels.matrix.groupPolicy: "disabled"` (ou mantenha uma lista de permissão vazia).
- Chave legada: `channels.matrix.rooms` (mesmo formato que `groups`).

## Threads

- Threading de resposta é suportado.
- `channels.matrix.threadReplies` controla se as respostas ficam em threads:
  - `off`, `inbound` (padrão), `always`
- `channels.matrix.replyToMode` controla metadados de resposta quando não responde em thread:
  - `off` (padrão), `first`, `all`

## Capacidades

| Recurso            | Status                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Mensagens diretas  | ✅ Suportado                                                                             |
| Salas              | ✅ Suportado                                                                             |
| Threads            | ✅ Suportado                                                                             |
| Mídia              | ✅ Suportado                                                                             |
| E2EE               | ✅ Suportado (módulo de cripto necessário)                                               |
| Reações            | ✅ Suportado (envio/leitura via ferramentas)                                             |
| Enquetes           | ✅ Envio suportado; inícios de enquete de entrada são convertidos em texto (respostas/encerramentos ignorados) |
| Localização        | ✅ Suportado (URI geo; altitude ignorada)                                                |
| Comandos nativos   | ✅ Suportado                                                                             |

## Solução de problemas

Execute esta sequência primeiro:

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Depois confirme o estado de pareamento de DM se necessário:

```bash
opencraft pairing list matrix
```

Falhas comuns:

- Conectado mas mensagens de sala ignoradas: sala bloqueada por `groupPolicy` ou lista de permissão de sala.
- DMs ignorados: remetente aguardando aprovação quando `channels.matrix.dm.policy="pairing"`.
- Salas criptografadas falham: incompatibilidade de suporte a cripto ou configurações de criptografia.

Para o fluxo de triagem: [/channels/troubleshooting](/channels/troubleshooting).

## Referência de configuração (Matrix)

Configuração completa: [Configuração](/gateway/configuration)

Opções do provedor:

- `channels.matrix.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.matrix.homeserver`: URL do homeserver.
- `channels.matrix.userId`: ID de usuário Matrix (opcional com token de acesso).
- `channels.matrix.accessToken`: token de acesso.
- `channels.matrix.password`: senha para login (token armazenado).
- `channels.matrix.deviceName`: nome de exibição do dispositivo.
- `channels.matrix.encryption`: habilitar E2EE (padrão: false).
- `channels.matrix.initialSyncLimit`: limite de sincronização inicial.
- `channels.matrix.threadReplies`: `off | inbound | always` (padrão: inbound).
- `channels.matrix.textChunkLimit`: tamanho do bloco de texto de saída (caracteres).
- `channels.matrix.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.matrix.dm.policy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.matrix.dm.allowFrom`: lista de permissão de DM (IDs completos de usuário Matrix). `open` requer `"*"`. O wizard resolve nomes para IDs quando possível.
- `channels.matrix.groupPolicy`: `allowlist | open | disabled` (padrão: allowlist).
- `channels.matrix.groupAllowFrom`: remetentes na lista de permissão para mensagens de grupo (IDs completos de usuário Matrix).
- `channels.matrix.allowlistOnly`: forçar regras de lista de permissão para DMs + salas.
- `channels.matrix.groups`: lista de permissão de grupo + mapa de configurações por sala.
- `channels.matrix.rooms`: lista de permissão/config de grupo legada.
- `channels.matrix.replyToMode`: modo de resposta para threads/tags.
- `channels.matrix.mediaMaxMb`: cap de mídia de entrada/saída (MB).
- `channels.matrix.autoJoin`: tratamento de convites (`always | allowlist | off`, padrão: always).
- `channels.matrix.autoJoinAllowlist`: IDs de sala/aliases permitidos para auto-join.
- `channels.matrix.accounts`: configuração de múltiplas contas com chave por ID de conta (cada conta herda configurações de nível superior).
- `channels.matrix.actions`: controle de ferramentas por ação (reactions/messages/pins/memberInfo/channelInfo).
