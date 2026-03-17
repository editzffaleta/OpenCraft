---
summary: "Status de suporte, capacidades e configuracao do app Google Chat"
read_when:
  - Working on Google Chat channel features
title: "Google Chat"
---

# Google Chat (Chat API)

Status: pronto para DMs + espacos via Webhooks da API do Google Chat (somente HTTP).

## Configuracao rapida (iniciante)

1. Crie um projeto no Google Cloud e habilite a **Google Chat API**.
   - Acesse: [Credenciais da Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Habilite a API se ainda nao estiver habilitada.
2. Crie uma **Conta de Servico**:
   - Pressione **Create Credentials** > **Service Account**.
   - Nomeie como quiser (ex.: `opencraft-chat`).
   - Deixe as permissoes em branco (pressione **Continue**).
   - Deixe os principals com acesso em branco (pressione **Done**).
3. Crie e baixe a **Chave JSON**:
   - Na lista de contas de servico, clique na que voce acabou de criar.
   - Va para a aba **Keys**.
   - Clique em **Add Key** > **Create new key**.
   - Selecione **JSON** e pressione **Create**.
4. Armazene o arquivo JSON baixado no seu host do Gateway (ex.: `~/.opencraft/googlechat-service-account.json`).
5. Crie um app do Google Chat no [Console Google Cloud - Configuracao do Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Preencha as **Informacoes do aplicativo**:
     - **App name**: (ex.: `OpenCraft`)
     - **Avatar URL**: (ex.: `https://opencraft.ai/logo.png`)
     - **Description**: (ex.: `Assistente pessoal de IA`)
   - Habilite **Interactive features**.
   - Em **Functionality**, marque **Join spaces and group conversations**.
   - Em **Connection settings**, selecione **HTTP endpoint URL**.
   - Em **Triggers**, selecione **Use a common HTTP endpoint URL for all triggers** e defina como a URL publica do seu Gateway seguida de `/googlechat`.
     - _Dica: Execute `opencraft status` para encontrar a URL publica do seu Gateway._
   - Em **Visibility**, marque **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Insira seu endereco de email (ex.: `user@example.com`) na caixa de texto.
   - Clique em **Save** na parte inferior.
6. **Habilite o status do app**:
   - Apos salvar, **atualize a pagina**.
   - Procure a secao **App status** (geralmente perto do topo ou final apos salvar).
   - Altere o status para **Live - available to users**.
   - Clique em **Save** novamente.
7. Configure o OpenCraft com o caminho da conta de servico + audiencia do Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Ou config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Defina o tipo e valor da audiencia do Webhook (corresponde a configuracao do seu app do Chat).
9. Inicie o Gateway. O Google Chat enviara POSTs para o seu caminho de Webhook.

## Adicionar ao Google Chat

Assim que o Gateway estiver em execucao e seu email adicionado a lista de visibilidade:

1. Va para [Google Chat](https://chat.google.com/).
2. Clique no icone **+** (mais) ao lado de **Direct Messages**.
3. Na barra de pesquisa (onde voce normalmente adiciona pessoas), digite o **Nome do app** que voce configurou no Console Google Cloud.
   - **Nota**: O Bot _nao_ aparecera na lista "Marketplace" porque e um app privado. Voce deve procura-lo pelo nome.
4. Selecione seu Bot nos resultados.
5. Clique em **Add** ou **Chat** para iniciar uma conversa 1:1.
6. Envie "Ola" para acionar o assistente!

## URL publica (somente Webhook)

Os Webhooks do Google Chat requerem um endpoint HTTPS publico. Por seguranca, **exponha apenas o caminho `/googlechat`** para a internet. Mantenha o painel do OpenCraft e outros endpoints sensiveis na sua rede privada.

### Opcao A: Tailscale Funnel (recomendado)

Use o Tailscale Serve para o painel privado e o Funnel para o caminho publico do Webhook. Isso mantém `/` privado enquanto expoe apenas `/googlechat`.

1. **Verifique em qual endereco seu Gateway esta vinculado:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Anote o endereco IP (ex.: `127.0.0.1`, `0.0.0.0` ou seu IP Tailscale como `100.x.x.x`).

2. **Exponha o painel apenas para o tailnet (porta 8443):**

   ```bash
   # Se vinculado ao localhost (127.0.0.1 ou 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Se vinculado apenas ao IP Tailscale (ex.: 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Exponha apenas o caminho do Webhook publicamente:**

   ```bash
   # Se vinculado ao localhost (127.0.0.1 ou 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Se vinculado apenas ao IP Tailscale (ex.: 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorize o no para acesso ao Funnel:**
   Se solicitado, visite a URL de autorizacao mostrada na saida para habilitar o Funnel para este no na sua politica de tailnet.

5. **Verifique a configuracao:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Sua URL publica de Webhook sera:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Seu painel privado permanece somente no tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Use a URL publica (sem `:8443`) na configuracao do app do Google Chat.

> Nota: Esta configuracao persiste entre reinicializacoes. Para remove-la depois, execute `tailscale funnel reset` e `tailscale serve reset`.

### Opcao B: Proxy reverso (Caddy)

Se voce usa um proxy reverso como Caddy, faca proxy apenas do caminho especifico:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Com esta configuracao, qualquer requisicao para `your-domain.com/` sera ignorada ou retornara 404, enquanto `your-domain.com/googlechat` e roteado com seguranca para o OpenCraft.

### Opcao C: Cloudflare Tunnel

Configure as regras de ingresso do seu tunnel para rotear apenas o caminho do Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regra padrao**: HTTP 404 (Not Found)

## Como funciona

1. O Google Chat envia POSTs de Webhook para o Gateway. Cada requisicao inclui um header `Authorization: Bearer <token>`.
   - O OpenCraft verifica a autenticacao bearer antes de ler/analisar o corpo completo do Webhook quando o header esta presente.
   - Requisicoes de Google Workspace Add-on que carregam `authorizationEventObject.systemIdToken` no corpo sao suportadas via um orcamento de corpo pre-autenticacao mais restrito.
2. O OpenCraft verifica o Token contra o `audienceType` + `audience` configurados:
   - `audienceType: "app-url"` -> audiencia e sua URL HTTPS de Webhook.
   - `audienceType: "project-number"` -> audiencia e o numero do projeto Cloud.
3. As mensagens sao roteadas por espaco:
   - DMs usam chave de sessao `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Espacos usam chave de sessao `agent:<agentId>:googlechat:group:<spaceId>`.
4. O acesso a DM e por pareamento por padrao. Remetentes desconhecidos recebem um codigo de pareamento; aprove com:
   - `opencraft pairing approve googlechat <code>`
5. Espacos de grupo requerem @mencao por padrao. Use `botUser` se a deteccao de mencao precisar do nome de usuario do app.

## Alvos

Use estes identificadores para entrega e listas de permitidos:

- Mensagens diretas: `users/<userId>` (recomendado).
- Email bruto `name@example.com` e mutavel e so e usado para correspondencia direta de lista de permitidos quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` e tratado como um user id, nao como email de lista de permitidos.
- Espacos: `spaces/<spaceId>`.

## Destaques da configuracao

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // ou serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // opcional; ajuda na deteccao de mencao
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Respostas curtas apenas.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Notas:

- As credenciais da conta de servico tambem podem ser passadas inline com `serviceAccount` (string JSON).
- `serviceAccountRef` tambem e suportado (SecretRef env/file), incluindo refs por conta em `channels.googlechat.accounts.<id>.serviceAccountRef`.
- O caminho padrao do Webhook e `/googlechat` se `webhookPath` nao estiver definido.
- `dangerouslyAllowNameMatching` reabilita a correspondencia de principal por email mutavel para listas de permitidos (modo de compatibilidade de emergencia).
- Reacoes estao disponiveis via a ferramenta `reactions` e `channels action` quando `actions.reactions` esta habilitado.
- `typingIndicator` suporta `none`, `message` (padrao) e `reaction` (reacao requer OAuth do usuario).
- Anexos sao baixados pela Chat API e armazenados no pipeline de midia (tamanho limitado por `mediaMaxMb`).

Detalhes de referencia de segredos: [Gerenciamento de segredos](/gateway/secrets).

## Solucao de problemas

### 405 Method Not Allowed

Se o Google Cloud Logs Explorer mostrar erros como:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Isso significa que o handler do Webhook nao esta registrado. Causas comuns:

1. **Canal nao configurado**: A secao `channels.googlechat` esta faltando na sua configuracao. Verifique com:

   ```bash
   opencraft config get channels.googlechat
   ```

   Se retornar "Config path not found", adicione a configuracao (veja [Destaques da configuracao](#destaques-da-configuracao)).

2. **Plugin nao habilitado**: Verifique o status do Plugin:

   ```bash
   opencraft plugins list | grep googlechat
   ```

   Se mostrar "disabled", adicione `plugins.entries.googlechat.enabled: true` a sua configuracao.

3. **Gateway nao reiniciado**: Apos adicionar a configuracao, reinicie o Gateway:

   ```bash
   opencraft gateway restart
   ```

Verifique se o canal esta em execucao:

```bash
opencraft channels status
# Deve mostrar: Google Chat default: enabled, configured, ...
```

### Outros problemas

- Verifique `opencraft channels status --probe` para erros de autenticacao ou configuracao de audiencia ausente.
- Se nenhuma mensagem chegar, confirme a URL do Webhook + inscricoes de eventos do app do Chat.
- Se o controle por mencao bloquear respostas, defina `botUser` para o nome do recurso de usuario do app e verifique `requireMention`.
- Use `opencraft logs --follow` enquanto envia uma mensagem de teste para ver se as requisicoes chegam ao Gateway.

Documentacao relacionada:

- [Configuracao do Gateway](/gateway/configuration)
- [Seguranca](/gateway/security)
- [Reacoes](/tools/reactions)
