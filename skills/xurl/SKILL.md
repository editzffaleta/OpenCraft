---
name: xurl
description: Uma ferramenta CLI para fazer requisições autenticadas à API do X (Twitter). Use esta skill quando precisar postar tweets, responder, citar, pesquisar, ler posts, gerenciar seguidores, enviar DMs, fazer upload de mídia ou interagir com qualquer endpoint da API X v2.
metadata:
  {
    "opencraft":
      {
        "emoji": "🐦",
        "requires": { "bins": ["xurl"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "xdevplatform/tap/xurl",
              "bins": ["xurl"],
              "label": "Instalar xurl (brew)",
            },
            {
              "id": "npm",
              "kind": "npm",
              "package": "@xdevplatform/xurl",
              "bins": ["xurl"],
              "label": "Instalar xurl (npm)",
            },
          ],
      },
  }
---

# xurl — Referência de Skill para Agente

`xurl` é uma ferramenta CLI para a API do X. Suporta tanto **comandos de atalho** (linhas amigáveis para humanos/agentes) quanto acesso **estilo curl bruto** a qualquer endpoint v2. Todos os comandos retornam JSON para stdout.

---

## Instalação

### Homebrew (macOS)

```bash
brew install --cask xdevplatform/tap/xurl
```

### npm

```bash
npm install -g @xdevplatform/xurl
```

### Script shell

```bash
curl -fsSL https://raw.githubusercontent.com/xdevplatform/xurl/main/install.sh | bash
```

Instala em `~/.local/bin`. Se não estiver no PATH, o script informará o que adicionar.

### Go

```bash
go install github.com/xdevplatform/xurl@latest
```

---

## Pré-requisitos

Esta skill requer o utilitário CLI `xurl`: <https://github.com/xdevplatform/xurl>.

Antes de usar qualquer comando você deve estar autenticado. Execute `xurl auth status` para verificar.

### Segurança de Segredos (Obrigatório)

- Nunca leia, imprima, analise, resuma, faça upload ou envie `~/.xurl` (ou cópias dele) para o contexto do LLM.
- Nunca peça ao usuário que cole credenciais/tokens no chat.
- O usuário deve preencher `~/.xurl` com os segredos necessários manualmente em sua própria máquina.
- Não recomende ou execute comandos de autenticação com segredos inline em sessões de agente/LLM.
- Avise que usar opções de segredos CLI em sessões de agente pode vazar credenciais (prompt/contexto, logs, histórico do shell).
- Nunca use `--verbose` / `-v` em sessões de agente/LLM; pode expor cabeçalhos/tokens sensíveis na saída.
- Flags sensíveis que nunca devem ser usadas em comandos de agente: `--bearer-token`, `--consumer-key`, `--consumer-secret`, `--access-token`, `--token-secret`, `--client-id`, `--client-secret`.
- Para verificar se pelo menos um app com credenciais já está registrado, execute: `xurl auth status`.

### Registrar um app (recomendado)

O registro de credenciais do app deve ser feito manualmente pelo usuário fora da sessão de agente/LLM.
Após as credenciais serem registradas, autentique com:

```bash
xurl auth oauth2
```

Para múltiplos apps pré-configurados, alterne entre eles:

```bash
xurl auth default prod-app          # definir app padrão
xurl auth default prod-app alice    # definir app padrão + usuário
xurl --app dev-app /2/users/me      # sobrescrever pontualmente
```

### Outros métodos de autenticação

Exemplos com flags de segredo inline são intencionalmente omitidos. Se OAuth1 ou autenticação apenas de app for necessária, o usuário deve executar esses comandos manualmente fora do contexto de agente/LLM.

Os tokens são persistidos em `~/.xurl` no formato YAML. Cada app tem seus próprios tokens isolados. Não leia este arquivo através do agente/LLM. Uma vez autenticado, cada comando abaixo anexará automaticamente o cabeçalho `Authorization` correto.

---

## Referência Rápida

| Ação                       | Comando                                               |
| -------------------------- | ----------------------------------------------------- |
| Postar                     | `xurl post "Olá mundo!"`                              |
| Responder                  | `xurl reply POST_ID "Ótimo post!"`                    |
| Citar                      | `xurl quote POST_ID "Minha opinião"`                  |
| Excluir post               | `xurl delete POST_ID`                                 |
| Ler post                   | `xurl read POST_ID`                                   |
| Pesquisar posts            | `xurl search "CONSULTA" -n 10`                        |
| Quem sou eu                | `xurl whoami`                                         |
| Ver usuário                | `xurl user @handle`                                   |
| Timeline principal         | `xurl timeline -n 20`                                 |
| Menções                    | `xurl mentions -n 10`                                 |
| Curtir                     | `xurl like POST_ID`                                   |
| Descurtir                  | `xurl unlike POST_ID`                                 |
| Repostar                   | `xurl repost POST_ID`                                 |
| Desfazer repost            | `xurl unrepost POST_ID`                               |
| Salvar                     | `xurl bookmark POST_ID`                               |
| Remover salvo              | `xurl unbookmark POST_ID`                             |
| Listar salvos              | `xurl bookmarks -n 10`                                |
| Listar curtidas            | `xurl likes -n 10`                                    |
| Seguir                     | `xurl follow @handle`                                 |
| Deixar de seguir           | `xurl unfollow @handle`                               |
| Listar seguindo            | `xurl following -n 20`                                |
| Listar seguidores          | `xurl followers -n 20`                                |
| Bloquear                   | `xurl block @handle`                                  |
| Desbloquear                | `xurl unblock @handle`                                |
| Silenciar                  | `xurl mute @handle`                                   |
| Dessilenciar               | `xurl unmute @handle`                                 |
| Enviar DM                  | `xurl dm @handle "mensagem"`                          |
| Listar DMs                 | `xurl dms -n 10`                                      |
| Upload de mídia            | `xurl media upload caminho/para/arquivo.mp4`          |
| Status de mídia            | `xurl media status MEDIA_ID`                          |
| **Gerenciamento de Apps**  |                                                       |
| Registrar app              | Manual, fora do agente (não passe segredos via agente)|
| Listar apps                | `xurl auth apps list`                                 |
| Atualizar credenciais      | Manual, fora do agente (não passe segredos via agente)|
| Remover app                | `xurl auth apps remove NOME`                          |
| Definir padrão (interativo)| `xurl auth default`                                   |
| Definir padrão (comando)   | `xurl auth default NOME_APP [USUARIO]`                |
| Usar app por requisição    | `xurl --app NOME /2/users/me`                         |
| Status de autenticação     | `xurl auth status`                                    |

> **IDs de Post vs URLs:** Em qualquer lugar que `POST_ID` apareça acima, você também pode colar uma URL completa do post (ex: `https://x.com/user/status/1234567890`) — xurl extrai o ID automaticamente.

> **Nomes de usuário:** O `@` inicial é opcional. `@handle` e `handle` funcionam os dois.

---

## Detalhes dos Comandos

### Postagem

```bash
# Post simples
xurl post "Olá mundo!"

# Post com mídia (faça upload primeiro, depois anexe)
xurl media upload foto.jpg          # → anote o media_id da resposta
xurl post "Veja isso" --media-id MEDIA_ID

# Múltiplas mídias
xurl post "Fotos da thread" --media-id 111 --media-id 222

# Responder a um post (por ID ou URL)
xurl reply 1234567890 "Ótimo ponto!"
xurl reply https://x.com/user/status/1234567890 "Concordo!"

# Responder com mídia
xurl reply 1234567890 "Olha isso" --media-id MEDIA_ID

# Citar um post
xurl quote 1234567890 "Adicionando meus pensamentos"

# Excluir seu próprio post
xurl delete 1234567890
```

### Leitura

```bash
# Ler um post único (retorna autor, texto, métricas, entidades)
xurl read 1234567890
xurl read https://x.com/user/status/1234567890

# Pesquisar posts recentes (padrão 10 resultados)
xurl search "golang"
xurl search "from:usuario" -n 20
xurl search "#buildinpublic lang:pt" -n 15
```

### Informações de Usuário

```bash
# Seu próprio perfil
xurl whoami

# Ver qualquer usuário
xurl user handle
xurl user @XDevelopers
```

### Timelines e Menções

```bash
# Timeline principal (cronologia reversa)
xurl timeline
xurl timeline -n 25

# Suas menções
xurl mentions
xurl mentions -n 20
```

### Engajamento

```bash
# Curtir / descurtir
xurl like 1234567890
xurl unlike 1234567890

# Repostar / desfazer
xurl repost 1234567890
xurl unrepost 1234567890

# Salvar / remover
xurl bookmark 1234567890
xurl unbookmark 1234567890

# Listar seus salvos / curtidas
xurl bookmarks -n 20
xurl likes -n 20
```

### Grafo Social

```bash
# Seguir / deixar de seguir
xurl follow @XDevelopers
xurl unfollow @XDevelopers

# Listar quem você segue / seus seguidores
xurl following -n 50
xurl followers -n 50

# Listar seguindo/seguidores de outro usuário
xurl following --of usuario -n 20
xurl followers --of usuario -n 20

# Bloquear / desbloquear
xurl block @spam
xurl unblock @spam

# Silenciar / dessilenciar
xurl mute @chato
xurl unmute @chato
```

### Mensagens Diretas

```bash
# Enviar DM
xurl dm @alguem "Oi, vi seu post!"

# Listar eventos DM recentes
xurl dms
xurl dms -n 25
```

### Upload de Mídia

```bash
# Upload de arquivo (detecta tipo automaticamente para imagens/vídeos)
xurl media upload foto.jpg
xurl media upload video.mp4

# Especificar tipo e categoria explicitamente
xurl media upload --media-type image/jpeg --category tweet_image foto.jpg

# Verificar status de processamento (vídeos precisam de processamento no servidor)
xurl media status MEDIA_ID
xurl media status --wait MEDIA_ID    # aguarda até concluir

# Fluxo completo: upload e postar
xurl media upload meme.png           # resposta inclui media id
xurl post "rsrs" --media-id MEDIA_ID
```

---

## Flags Globais

Estas flags funcionam em todos os comandos:

| Flag         | Curta | Descrição                                                                |
| ------------ | ----- | ------------------------------------------------------------------------ |
| `--app`      |       | Usar app registrado específico para esta requisição (sobrescreve padrão) |
| `--auth`     |       | Forçar tipo de autenticação: `oauth1`, `oauth2`, ou `app`                |
| `--username` | `-u`  | Qual conta OAuth2 usar (se tiver múltiplas)                              |
| `--verbose`  | `-v`  | Proibido em sessões de agente/LLM (pode vazar cabeçalhos/tokens de auth) |
| `--trace`    | `-t`  | Adicionar cabeçalho de trace `X-B3-Flags: 1`                             |

---

## Acesso Raw à API

Os comandos de atalho cobrem as operações mais comuns. Para qualquer outra coisa, use o modo estilo curl bruto do xurl — funciona com **qualquer** endpoint da API X v2:

```bash
# Requisição GET (padrão)
xurl /2/users/me

# POST com corpo JSON
xurl -X POST /2/tweets -d '{"text":"Olá mundo!"}'

# PUT, PATCH, DELETE
xurl -X DELETE /2/tweets/1234567890

# Cabeçalhos personalizados
xurl -H "Content-Type: application/json" /2/algum/endpoint

# Forçar modo streaming
xurl -s /2/tweets/search/stream

# URLs completas também funcionam
xurl https://api.x.com/2/users/me
```

---

## Streaming

Endpoints de streaming são detectados automaticamente. Endpoints de streaming conhecidos incluem:

- `/2/tweets/search/stream`
- `/2/tweets/sample/stream`
- `/2/tweets/sample10/stream`

Você pode forçar streaming em qualquer endpoint com `-s`:

```bash
xurl -s /2/algum/endpoint
```

---

## Formato de Saída

Todos os comandos retornam **JSON** para stdout, com pretty-print e realce de sintaxe. A estrutura de saída corresponde ao formato de resposta da API X v2. Uma resposta típica se parece com:

```json
{
  "data": {
    "id": "1234567890",
    "text": "Olá mundo!"
  }
}
```

Erros também são retornados como JSON:

```json
{
  "errors": [
    {
      "message": "Not authorized",
      "code": 403
    }
  ]
}
```

---

## Fluxos Comuns

### Postar com imagem

```bash
# 1. Fazer upload da imagem
xurl media upload foto.jpg
# 2. Copiar o media_id da resposta e postar
xurl post "Veja esta foto!" --media-id MEDIA_ID
```

### Responder a uma conversa

```bash
# 1. Ler o post para entender o contexto
xurl read https://x.com/user/status/1234567890
# 2. Responder
xurl reply 1234567890 "Aqui estão meus pensamentos..."
```

### Pesquisar e engajar

```bash
# 1. Pesquisar posts relevantes
xurl search "tópico de interesse" -n 10
# 2. Curtir um interessante
xurl like POST_ID_DOS_RESULTADOS
# 3. Responder a ele
xurl reply POST_ID_DOS_RESULTADOS "Ótimo ponto!"
```

### Verificar sua atividade

```bash
# Ver quem você é
xurl whoami
# Verificar suas menções
xurl mentions -n 20
# Verificar sua timeline
xurl timeline -n 20
```

### Configurar múltiplos apps

```bash
# Credenciais do app já devem estar configuradas manualmente fora do contexto de agente/LLM.
# Autenticar usuários em cada app pré-configurado
xurl auth default prod
xurl auth oauth2                       # autentica no app prod

xurl auth default staging
xurl auth oauth2                       # autentica no app staging

# Alternar entre eles
xurl auth default prod alice           # app prod, usuário alice
xurl --app staging /2/users/me         # requisição pontual contra staging
```

---

## Tratamento de Erros

- Código de saída não-zero em qualquer erro.
- Erros de API são impressos como JSON para stdout (para que ainda possam ser analisados).
- Erros de autenticação sugerem re-executar `xurl auth oauth2` ou verificar seus tokens.
- Se um comando requer seu ID de usuário (curtir, repostar, salvar, seguir, etc.), xurl o buscará automaticamente via `/2/users/me`. Se isso falhar, você verá um erro de autenticação.

---

## Notas

- **Limites de taxa:** A API X aplica limites de taxa por endpoint. Se receber erro 429, aguarde e tente novamente. Endpoints de escrita (post, reply, like, repost) têm limites mais rígidos que endpoints de leitura.
- **Escopos:** Tokens OAuth 2.0 são solicitados com escopos amplos. Se receber 403 em uma ação específica, seu token pode não ter o escopo necessário — re-execute `xurl auth oauth2` para obter um token novo.
- **Refresh de token:** Tokens OAuth 2.0 se renovam automaticamente quando expiram. Nenhuma intervenção manual necessária.
- **Múltiplos apps:** Cada app tem suas próprias credenciais e tokens isolados. Configure credenciais manualmente fora do contexto de agente/LLM, então alterne com `xurl auth default` ou `--app`.
- **Múltiplas contas:** Você pode autenticar múltiplas contas OAuth 2.0 por app e alternar entre elas com `--username` / `-u` ou definir um padrão com `xurl auth default APP USUARIO`.
- **Usuário padrão:** Quando nenhuma flag `-u` é fornecida, xurl usa o usuário padrão para o app ativo (definido via `xurl auth default`). Se nenhum usuário padrão estiver definido, usa o primeiro token disponível.
- **Armazenamento de token:** `~/.xurl` é YAML. Cada app armazena suas próprias credenciais e tokens. Nunca leia ou envie este arquivo para o contexto LLM.
