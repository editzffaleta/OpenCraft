---
summary: "Delegar autenticação do gateway a um reverse proxy confiável (Pomerium, Caddy, nginx + OAuth)"
read_when:
  - Executando OpenCraft atrás de um proxy com reconhecimento de identidade
  - Configurando Pomerium, Caddy ou nginx com OAuth na frente do OpenCraft
  - Corrigindo erros WebSocket 1008 unauthorized com setups de reverse proxy
  - Decidindo onde definir HSTS e outros headers de hardening HTTP
---

# Trusted Proxy Auth

> ⚠️ **Feature sensível à segurança.** Este modo delega autenticação inteiramente ao seu reverse proxy. Configuração incorreta pode expor seu Gateway a acesso não autorizado. Leia esta página cuidadosamente antes de habilitar.

## Quando usar

Use o modo de auth `trusted-proxy` quando:

- Você executa o OpenCraft atrás de um **proxy com reconhecimento de identidade** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Seu proxy cuida de toda a autenticação e passa a identidade do usuário via headers
- Você está em um ambiente Kubernetes ou container onde o proxy é o único caminho até o Gateway
- Você está recebendo erros WebSocket `1008 unauthorized` porque navegadores não conseguem passar tokens em payloads WS

## Quando NÃO usar

- Se seu proxy não autentica usuários (apenas um terminador TLS ou balanceador de carga)
- Se existe qualquer caminho até o Gateway que ignora o proxy (buracos no firewall, acesso por rede interna)
- Se você não tem certeza se seu proxy corretamente remove/sobrescreve headers encaminhados
- Se você precisa apenas de acesso pessoal de um único usuário (considere Tailscale Serve + loopback para um setup mais simples)

## Como funciona

1. Seu reverse proxy autentica usuários (OAuth, OIDC, SAML, etc.)
2. O proxy adiciona um header com a identidade do usuário autenticado (ex: `x-forwarded-user: nick@example.com`)
3. O OpenCraft verifica se a requisição veio de um **IP de proxy confiável** (configurado em `gateway.trustedProxies`)
4. O OpenCraft extrai a identidade do usuário do header configurado
5. Se tudo estiver correto, a requisição é autorizada

## Comportamento de pareamento da Control UI

Quando `gateway.auth.mode = "trusted-proxy"` está ativo e a requisição passa
nas verificações de trusted-proxy, sessões WebSocket da Control UI podem conectar sem
identidade de pareamento de dispositivo.

Implicações:

- O pareamento não é mais o gate principal para acesso à Control UI neste modo.
- A política de auth do seu reverse proxy e `allowUsers` se tornam o controle de acesso efetivo.
- Mantenha o ingresso do gateway restrito apenas a IPs de proxy confiáveis (`gateway.trustedProxies` + firewall).

## Configuração

```json5
{
  gateway: {
    // Use loopback para setups de proxy no mesmo host; use lan/custom para hosts de proxy remotos
    bind: "loopback",

    // CRÍTICO: Adicione apenas o(s) IP(s) do seu proxy aqui
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header contendo a identidade do usuário autenticado (obrigatório)
        userHeader: "x-forwarded-user",

        // Opcional: headers que DEVEM estar presentes (verificação de proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringir a usuários específicos (vazio = permitir todos)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Se `gateway.bind` for `loopback`, inclua um endereço de proxy loopback em
`gateway.trustedProxies` (`127.0.0.1`, `::1` ou um CIDR loopback equivalente).

### Referência de configuração

| Campo                                       | Obrigatório | Descrição                                                                                     |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Sim         | Array de endereços IP de proxy confiáveis. Requisições de outros IPs são rejeitadas.          |
| `gateway.auth.mode`                         | Sim         | Deve ser `"trusted-proxy"`                                                                    |
| `gateway.auth.trustedProxy.userHeader`      | Sim         | Nome do header contendo a identidade do usuário autenticado                                   |
| `gateway.auth.trustedProxy.requiredHeaders` | Não         | Headers adicionais que devem estar presentes para a requisição ser confiável                  |
| `gateway.auth.trustedProxy.allowUsers`      | Não         | Allowlist de identidades de usuário. Vazio significa permitir todos os usuários autenticados. |

## Terminação TLS e HSTS

Use um ponto de terminação TLS e aplique HSTS nele.

### Padrão recomendado: terminação TLS no proxy

Quando seu reverse proxy cuida do HTTPS para `https://control.example.com`, defina
`Strict-Transport-Security` no proxy para esse domínio.

- Bom ajuste para deploys voltados para a internet.
- Mantém certificado + política de hardening HTTP em um só lugar.
- O OpenCraft pode permanecer em HTTP loopback atrás do proxy.

Valor de header de exemplo:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminação TLS no Gateway

Se o próprio OpenCraft serve HTTPS diretamente (sem proxy de terminação TLS), defina:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` aceita um valor de header em string, ou `false` para desabilitar explicitamente.

### Orientação de rollout

- Comece com um max age curto primeiro (por exemplo `max-age=300`) enquanto valida o tráfego.
- Aumente para valores de longa duração (por exemplo `max-age=31536000`) apenas depois de alta confiança.
- Adicione `includeSubDomains` apenas se todo subdomínio estiver pronto para HTTPS.
- Use preload apenas se você intencionalmente atende aos requisitos de preload para todo o seu conjunto de domínios.
- Desenvolvimento local somente em loopback não se beneficia de HSTS.

## Exemplos de setup de proxy

### Pomerium

O Pomerium passa a identidade em `x-pomerium-claim-email` (ou outros headers de claim) e um JWT em `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP do Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Trecho de configuração do Pomerium:

```yaml
routes:
  - from: https://opencraft.example.com
    to: http://opencraft-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy com OAuth

O Caddy com o plugin `caddy-security` pode autenticar usuários e passar headers de identidade.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["127.0.0.1"], // IP do Caddy (se no mesmo host)
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Trecho do Caddyfile:

```
opencraft.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy opencraft:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

O oauth2-proxy autentica usuários e passa a identidade em `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP do nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Trecho de configuração do nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://opencraft:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik com Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP do container Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Checklist de segurança

Antes de habilitar a auth trusted-proxy, verifique:

- [ ] **Proxy é o único caminho**: A porta do Gateway está protegida por firewall de tudo exceto seu proxy
- [ ] **trustedProxies é mínimo**: Apenas os IPs reais do seu proxy, não sub-redes inteiras
- [ ] **Proxy remove headers**: Seu proxy sobrescreve (não adiciona) headers `x-forwarded-*` dos clientes
- [ ] **Terminação TLS**: Seu proxy cuida do TLS; usuários conectam via HTTPS
- [ ] **allowUsers está definido** (recomendado): Restrinja a usuários conhecidos em vez de permitir qualquer pessoa autenticada

## Auditoria de segurança

`opencraft security audit` irá sinalizar a auth trusted-proxy com um achado de severidade **critical**. Isso é intencional -- é um lembrete de que você está delegando segurança ao seu setup de proxy.

A auditoria verifica:

- Configuração de `trustedProxies` ausente
- Configuração de `userHeader` ausente
- `allowUsers` vazio (permite qualquer usuário autenticado)

## Solução de problemas

### "trusted_proxy_untrusted_source"

A requisição não veio de um IP em `gateway.trustedProxies`. Verifique:

- O IP do proxy está correto? (IPs de containers Docker podem mudar)
- Existe um balanceador de carga na frente do seu proxy?
- Use `docker inspect` ou `kubectl get pods -o wide` para encontrar os IPs reais

### "trusted_proxy_user_missing"

O header do usuário estava vazio ou ausente. Verifique:

- Seu proxy está configurado para passar headers de identidade?
- O nome do header está correto? (case-insensitive, mas a grafia importa)
- O usuário está realmente autenticado no proxy?

### "trusted*proxy_missing_header*\*"

Um header obrigatório não estava presente. Verifique:

- A configuração do seu proxy para esses headers específicos
- Se os headers estão sendo removidos em algum ponto da cadeia

### "trusted_proxy_user_not_allowed"

O usuário está autenticado mas não está em `allowUsers`. Adicione-o ou remova a allowlist.

### WebSocket ainda falhando

Certifique-se de que seu proxy:

- Suporta upgrades de WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Passa os headers de identidade em requisições de upgrade WebSocket (não apenas HTTP)
- Não tem um caminho de auth separado para conexões WebSocket

## Migração de Token Auth

Se você está migrando de token auth para trusted-proxy:

1. Configure seu proxy para autenticar usuários e passar headers
2. Teste o setup do proxy independentemente (curl com headers)
3. Atualize a configuração do OpenCraft com auth trusted-proxy
4. Reinicie o Gateway
5. Teste conexões WebSocket a partir da Control UI
6. Execute `opencraft security audit` e revise os achados

## Relacionado

- [Segurança](/gateway/security) -- guia completo de segurança
- [Configuração](/gateway/configuration) -- referência de configuração
- [Acesso Remoto](/gateway/remote) -- outros padrões de acesso remoto
- [Tailscale](/gateway/tailscale) -- alternativa mais simples para acesso somente tailnet
