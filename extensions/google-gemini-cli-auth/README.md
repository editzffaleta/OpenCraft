# Google Gemini CLI Auth (plugin OpenCraft)

Plugin de provedor OAuth para o **Gemini CLI** (Google Code Assist).

## Aviso de segurança da conta

- Este plugin é uma integração não oficial e não é endossado pelo Google.
- Alguns usuários relataram restrições ou suspensões de conta após usar clientes OAuth de terceiros do Gemini CLI e Antigravity.
- Use com cuidado, revise os termos de serviço aplicáveis do Google e evite usar uma conta de missão crítica.

## Ativar

Plugins incluídos são desativados por padrão. Ative este:

```bash
opencraft plugins enable google-gemini-cli-auth
```

Reinicie o Gateway após ativar.

## Autenticar

```bash
opencraft models auth login --provider google-gemini-cli --set-default
```

## Requisitos

Requer o Gemini CLI instalado (as credenciais são extraídas automaticamente):

```bash
brew install gemini-cli
# ou: npm install -g @google/gemini-cli
```

## Variáveis de ambiente (opcional)

Substitua as credenciais detectadas automaticamente com:

- `OPENCRAFT_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
- `OPENCRAFT_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`
