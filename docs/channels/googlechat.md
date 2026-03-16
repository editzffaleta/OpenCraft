---
summary: "Status de suporte ao app Google Chat, capacidades e configuração"
read_when:
  - Trabalhando em recursos do canal Google Chat
title: "Google Chat"
---

# Google Chat (Chat API)

Status: pronto para DMs + espaços via webhooks da Google Chat API (somente HTTP).

## Configuração rápida (iniciante)

1. Crie um projeto no Google Cloud e habilite a **Google Chat API**.
   - Acesse: [Credenciais da Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Habilite a API se ainda não estiver habilitada.
2. Crie uma **Conta de Serviço**:
   - Clique em **Criar Credenciais** > **Conta de Serviço**.
   - Dê um nome qualquer (ex.: `opencraft-chat`).
   - Deixe as permissões em branco (clique em **Continuar**).
   - Deixe os principais com acesso em branco (clique em **Concluído**).
3. Crie e baixe a **Chave JSON**:
   - Na lista de contas de serviço, clique na que você acabou de criar.
   - Vá para a aba **Chaves**.
   - Clique em **Adicionar Chave** > **Criar nova chave**.
   - Selecione **JSON** e clique em **Criar**.
4. Armazene o arquivo JSON baixado no seu host gateway (ex.: `~/.opencraft/googlechat-service-account.json`).
5. Crie um app do Google Chat no [Console do Google Cloud - Configuração do Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Preencha as **Informações do aplicativo**:
     - **Nome do app**: (ex.: `OpenCraft`)
     - **URL do avatar**: (ex.: `https://openclaw.ai/logo.png`)
     - **Descrição**: (ex.: `Assistente de IA Pessoal`)
   - Habilite **Recursos interativos**.
   - Em **Funcionalidade**, marque **Participar de espaços e conversas em grupo**.
   - Em **Configurações de conexão**, selecione **URL do endpoint HTTP**.
   - Em **Gatilhos**, selecione **Usar um URL de endpoint HTTP comum para todos os gatilhos** e defina como a URL pública do seu gateway seguida de `/googlechat`.
     - _Dica: Execute `opencraft status` para encontrar a URL pública do seu gateway._
   - Em **Visibilidade**, marque **Disponibilizar este app de Chat para pessoas e grupos específicos em &lt;Seu Domínio&gt;**.
   - Insira seu endereço de email (ex.: `usuario@example.com`) na caixa de texto.
   - Clique em **Salvar** na parte inferior.
6. **Habilite o status do app**:
   - Após salvar, **atualize a página**.
   - Procure a seção **Status do app** (geralmente perto do topo ou da parte inferior após salvar).
   - Altere o status para **Ativo - disponível para usuários**.
   - Clique em **Salvar** novamente.
7. Configure o OpenCraft com o caminho da conta de serviço + audience do webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/caminho/para/service-account.json`
   - Ou config: `channels.googlechat.serviceAccountFile: "/caminho/para/service-account.json"`.
8. Defina o tipo de audience do webhook + valor (corresponde à config do seu app Chat).
9. Inicie o gateway. O Google Chat fará POST para o caminho do webhook.

## Adicionar ao Google Chat

Assim que o gateway estiver em execução e seu email estiver adicionado à lista de visibilidade:

1. Acesse o [Google Chat](https://chat.google.com/).
2. Clique no ícone **+** (mais) ao lado de **Mensagens diretas**.
3. Na barra de pesquisa (onde você geralmente adiciona pessoas), digite o **Nome do app** que você configurou no Console do Google Cloud.
   - **Nota**: o bot _não_ aparecerá na lista de navegação do "Marketplace" pois é um app privado. Você deve pesquisá-lo pelo nome.
4. Selecione seu bot nos resultados.
5. Clique em **Adicionar** ou **Chat** para iniciar uma conversa 1:1.
6. Envie "Olá" para acionar o assistente!

## URL pública (apenas webhook)

Os webhooks do Google Chat requerem um endpoint HTTPS público. Por segurança, **exponha apenas o caminho `/googlechat`** à internet. Mantenha o painel do OpenCraft e outros endpoints sensíveis na sua rede privada.

### Opção A: Tailscale Funnel (Recomendado)

Use o Tailscale Serve para o painel privado e o Funnel para o caminho de webhook público. Isso mantém `/` privado enquanto expõe apenas `/googlechat`.

1. **Verifique em qual endereço o gateway está vinculado:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Anote o endereço IP (ex.: `127.0.0.1`, `0.0.0.0` ou seu IP Tailscale como `100.x.x.x`).

2. **Exponha o painel apenas para a tailnet (porta 8443):**

   ```bash
   # Se vinculado ao localhost (127.0.0.1 ou 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Se vinculado apenas ao IP Tailscale (ex.: 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Exponha apenas o caminho do webhook publicamente:**

   ```bash
   # Se vinculado ao localhost (127.0.0.1 ou 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Se vinculado apenas ao IP Tailscale (ex.: 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorize o nó para acesso ao Funnel:**
   Se solicitado, acesse a URL de autorização mostrada na saída para habilitar o Funnel para este nó na sua política tailnet.

5. **Verifique a configuração:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Sua URL de webhook público será:
`https://<nome-do-no>.<tailnet>.ts.net/googlechat`

Seu painel privado fica apenas na tailnet:
`https://<nome-do-no>.<tailnet>.ts.net:8443/`

Use a URL pública (sem `:8443`) na config do app Google Chat.

> Nota: esta configuração persiste entre reinicializações. Para removê-la mais tarde, execute `tailscale funnel reset` e `tailscale serve reset`.

### Opção B: Proxy Reverso (Caddy)

Se você usa um proxy reverso como o Caddy, faça proxy apenas do caminho específico:

```caddy
seu-dominio.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Com esta config, qualquer requisição para `seu-dominio.com/` será ignorada ou retornará 404, enquanto `seu-dominio.com/googlechat` é roteado com segurança para o OpenCraft.

### Opção C: Cloudflare Tunnel

Configure as regras de ingress do seu tunnel para rotear apenas o caminho do webhook:

- **Caminho**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regra padrão**: HTTP 404 (Not Found)

## Como funciona

1. O Google Chat envia webhook POSTs para o gateway. Cada requisição inclui um header `Authorization: Bearer <token>`.
   - O OpenCraft verifica a autenticação bearer antes de ler/parsear os corpos completos do webhook quando o header está presente.
   - Requisições de Google Workspace Add-on que carregam `authorizationEventObject.systemIdToken` no corpo são suportadas via um orçamento de corpo pré-auth mais rigoroso.
2. O OpenCraft verifica o token em relação ao `audienceType` + `audience` configurados:
   - `audienceType: "app-url"` → audience é sua URL HTTPS de webhook.
   - `audienceType: "project-number"` → audience é o número do projeto Cloud.
3. As mensagens são roteadas por espaço:
   - DMs usam a chave de sessão `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Espaços usam a chave de sessão `agent:<agentId>:googlechat:group:<spaceId>`.
4. O acesso a DM é por pareamento por padrão. Remetentes desconhecidos recebem um código de pareamento; aprove com:
   - `opencraft pairing approve googlechat <código>`
5. Espaços de grupo requerem @menção por padrão. Use `botUser` se a detecção de menção precisar do nome de usuário do app.

## Alvos

Use estes identificadores para entrega e listas de permissão:

- Mensagens diretas: `users/<userId>` (recomendado).
- Email bruto `nome@example.com` é mutável e usado apenas para correspondência direta de allowlist quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` é tratado como um user id, não um email allowlist.
- Espaços: `spaces/<spaceId>`.

## Destaques da config

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/caminho/para/service-account.json",
      // ou serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // opcional; auxilia na detecção de menção
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

- As credenciais da conta de serviço também podem ser passadas inline com `serviceAccount` (string JSON).
- `serviceAccountRef` também é suportado (SecretRef de env/arquivo), incluindo refs por conta em `channels.googlechat.accounts.<id>.serviceAccountRef`.
- O caminho de webhook padrão é `/googlechat` se `webhookPath` não estiver definido.
- `dangerouslyAllowNameMatching` reabilita a correspondência de principal de email mutável para allowlists (modo de compatibilidade emergencial).
- Reações estão disponíveis via ferramenta `reactions` e `channels action` quando `actions.reactions` está habilitado.
- `typingIndicator` suporta `none`, `message` (padrão) e `reaction` (reaction requer OAuth do usuário).
- Anexos são baixados pela Chat API e armazenados no pipeline de mídia (tamanho limitado por `mediaMaxMb`).

Detalhes de referência de segredos: [Gerenciamento de Segredos](/gateway/secrets).

## Solução de problemas

### 405 Method Not Allowed

Se o Google Cloud Logs Explorer mostrar erros como:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Isso significa que o handler de webhook não está registrado. Causas comuns:

1. **Canal não configurado**: a seção `channels.googlechat` está faltando na sua config. Verifique com:

   ```bash
   opencraft config get channels.googlechat
   ```

   Se retornar "Config path not found", adicione a configuração (veja [Destaques da config](#destaques-da-config)).

2. **Plugin não habilitado**: verifique o status do plugin:

   ```bash
   opencraft plugins list | grep googlechat
   ```

   Se mostrar "disabled", adicione `plugins.entries.googlechat.enabled: true` à sua config.

3. **Gateway não reiniciado**: após adicionar a config, reinicie o gateway:

   ```bash
   opencraft gateway restart
   ```

Verifique se o canal está em execução:

```bash
opencraft channels status
# Deve mostrar: Google Chat default: enabled, configured, ...
```

### Outros problemas

- Verifique `opencraft channels status --probe` para erros de autenticação ou config de audience ausente.
- Se nenhuma mensagem chegar, confirme a URL de webhook + assinaturas de eventos do app Chat.
- Se o controle por menção bloquear respostas, defina `botUser` como o nome de recurso de usuário do app e verifique `requireMention`.
- Use `opencraft logs --follow` enquanto envia uma mensagem de teste para ver se as requisições chegam ao gateway.

Docs relacionados:

- [Configuração do gateway](/gateway/configuration)
- [Segurança](/gateway/security)
- [Reações](/tools/reactions)
