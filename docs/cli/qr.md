---
summary: "Referência do CLI para `opencraft qr` (gerar QR de pareamento iOS + código de setup)"
read_when:
  - Você quer parear o app iOS com um gateway rapidamente
  - Você precisa de saída de setup-code para compartilhamento remoto/manual
title: "qr"
---

# `opencraft qr`

Gerar um QR de pareamento iOS e código de setup a partir da sua configuração atual do Gateway.

## Uso

```bash
opencraft qr
opencraft qr --setup-code-only
opencraft qr --json
opencraft qr --remote
opencraft qr --url wss://gateway.example/ws
```

## Opções

- `--remote`: usar `gateway.remote.url` mais token/senha remota da config
- `--url <url>`: sobrescrever URL do gateway usada no payload
- `--public-url <url>`: sobrescrever URL pública usada no payload
- `--token <token>`: sobrescrever qual token de gateway o fluxo de bootstrap autentica
- `--password <password>`: sobrescrever qual senha de gateway o fluxo de bootstrap autentica
- `--setup-code-only`: imprimir apenas o código de setup
- `--no-ascii`: pular renderização ASCII do QR
- `--json`: emitir JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notas

- `--token` e `--password` são mutuamente exclusivos.
- O código de setup agora carrega um `bootstrapToken` opaco de curta duração, não o token/senha compartilhado do gateway.
- Com `--remote`, se credenciais remotas efetivamente ativas estiverem configuradas como SecretRefs e você não passar `--token` ou `--password`, o comando as resolve do snapshot ativo do gateway. Se o gateway não estiver disponível, o comando falha rapidamente.
- Sem `--remote`, SecretRefs de auth do gateway local são resolvidos quando nenhum override de auth CLI é passado:
  - `gateway.auth.token` resolve quando auth por token pode vencer (modo `gateway.auth.mode="token"` explícito ou modo inferido onde nenhuma fonte de senha vence).
  - `gateway.auth.password` resolve quando auth por senha pode vencer (modo `gateway.auth.mode="password"` explícito ou modo inferido sem token vencedor de auth/env).
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados (incluindo SecretRefs) e `gateway.auth.mode` não estiver definido, a resolução do setup-code falha até que o modo seja definido explicitamente.
- Nota de skew de versão do Gateway: este path de comando requer um gateway que suporte `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- Após escanear, aprove o pareamento do dispositivo com:
  - `opencraft devices list`
  - `opencraft devices approve <requestId>`
