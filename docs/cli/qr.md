---
summary: "Referência CLI para `opencraft qr` (gerar QR de pareamento iOS + código de configuração)"
read_when:
  - Você quer parear o app iOS com um Gateway rapidamente
  - Você precisa de saída de código de configuração para compartilhamento remoto/manual
title: "qr"
---

# `opencraft qr`

Gerar um QR de pareamento iOS e código de configuração a partir da sua configuração atual do Gateway.

## Uso

```bash
opencraft qr
opencraft qr --setup-code-only
opencraft qr --json
opencraft qr --remote
opencraft qr --url wss://gateway.example/ws
```

## Opções

- `--remote`: usar `gateway.remote.url` mais Token/senha remoto do config
- `--url <url>`: sobrepor URL do Gateway usada no payload
- `--public-url <url>`: sobrepor URL pública usada no payload
- `--token <token>`: sobrepor qual Token do Gateway o fluxo de bootstrap autentica contra
- `--password <password>`: sobrepor qual senha do Gateway o fluxo de bootstrap autentica contra
- `--setup-code-only`: imprimir apenas o código de configuração
- `--no-ascii`: pular renderização ASCII do QR
- `--json`: emitir JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notas

- `--token` e `--password` são mutuamente exclusivos.
- O código de configuração agora carrega um `bootstrapToken` opaco de curta duração, não o Token/senha compartilhado do Gateway.
- Com `--remote`, se credenciais remotas efetivamente ativas estiverem configuradas como SecretRefs e você não passar `--token` ou `--password`, o comando as resolve do snapshot do Gateway ativo. Se o Gateway estiver indisponível, o comando falha imediatamente.
- Sem `--remote`, SecretRefs de autenticação local do Gateway são resolvidos quando nenhuma sobrescrita de autenticação CLI é passada:
  - `gateway.auth.token` resolve quando autenticação por Token pode vencer (explícito `gateway.auth.mode="token"` ou modo inferido onde nenhuma fonte de senha vence).
  - `gateway.auth.password` resolve quando autenticação por senha pode vencer (explícito `gateway.auth.mode="password"` ou modo inferido sem Token vencedor de auth/env).
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados (incluindo SecretRefs) e `gateway.auth.mode` não estiver definido, a resolução do código de configuração falha até que o modo seja definido explicitamente.
- Nota sobre diferença de versão do Gateway: este caminho de comando requer um Gateway que suporte `secrets.resolve`; Gateways mais antigos retornam erro de método desconhecido.
- Após escanear, aprove o pareamento de dispositivo com:
  - `opencraft devices list`
  - `opencraft devices approve <requestId>`
