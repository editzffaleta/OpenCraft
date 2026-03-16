---
summary: "Delegue autenticação do gateway a um reverse proxy confiável (Pomerium, Caddy, nginx + OAuth)"
read_when:
  - Rodando o OpenCraft atrás de um proxy com reconhecimento de identidade
  - Configurando Pomerium, Caddy ou nginx com OAuth na frente do OpenCraft
  - Corrigindo erros WebSocket 1008 unauthorized com configurações de reverse proxy
  - Decidindo onde definir HSTS e outros headers de endurecimento HTTP
---

# Auth de Proxy Confiável

> ⚠️ **Recurso sensível à segurança.** Este modo delega autenticação completamente ao seu reverse proxy. Má configuração pode expor seu Gateway a acesso não autorizado. Leia esta página cuidadosamente antes de habilitar.

## Quando usar

Use o modo de auth `trusted-proxy` quando:

- Você roda o OpenCraft atrás de um **proxy com reconhecimento de identidade** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Seu proxy lida com toda a autenticação e passa a identidade do usuário via headers
- Você está em um ambiente Kubernetes ou container onde o proxy é o único caminho para o Gateway
- Você está encontrando erros WebSocket `1008 unauthorized` porque browsers não conseguem passar tokens em payloads WS

## Quando NÃO usar

- Se seu proxy não autentica usuários (apenas terminador TLS ou balanceador de carga)
- Se há algum caminho para o Gateway que bypass o proxy (buracos de firewall, acesso a rede interna)
- Se você não tem certeza se seu proxy corretamente remove/sobrescreve headers encaminhados
- Se você só precisa de acesso pessoal de usuário único (considere Tailscale Serve + loopback para configuração mais simples)

## Como funciona

1. Seu reverse proxy autentica usuários (OAuth, OIDC, SAML, etc.)
2. O proxy adiciona um header com a identidade do usuário autenticado (ex. `x-forwarded-user: nick@example.com`)
3. O OpenCraft verifica que a requisição veio de um **IP de proxy confiável** (configurado em `gateway.trustedProxies`)
4. O OpenCraft extrai a identidade do usuário do header configurado
5. Se tudo estiver correto, a requisição é autorizada

## Comportamento de pareamento da Control UI

Quando `gateway.auth.mode = "trusted-proxy"` está ativo e a requisição passa as
verificações de proxy confiável, sessões WebSocket da Control UI podem conectar sem identidade de
pareamento de dispositivo.

Implicações:

- O pareamento não é mais o portão principal para acesso à Control UI neste modo.
- Sua política de auth do reverse proxy e `allowUsers` tornam-se o controle de acesso efetivo.
- Mantenha o ingress do gateway bloqueado a IPs de proxy confiáveis apenas (`gateway.trustedProxies` + firewall).

## Configuração

```json5
{
  gateway: {
    // Use loopback para configurações de proxy no mesmo host; use lan/custom para hosts de proxy remotos
    bind: "loopback",

    // CRÍTICO: Adicione apenas os IPs do seu proxy aqui
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header contendo identidade de usuário autenticado (obrigatório)
        userHeader: "x-forwarded-user",

        // Opcional: headers que DEVEM estar presentes (verificação do proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringir a usuários específicos (vazio = permitir todos)
        allowUsers: ["nick@example.com", "admin@empresa.com.br"],
      },
    },
  },
}
```

Se `gateway.bind` é `loopback`, inclua um endereço de proxy loopback em
`gateway.trustedProxies` (`127.0.0.1`, `::1` ou um CIDR loopback equivalente).

### Referência de configuração

| Campo                                       | Obrigatório | Descrição                                                                         |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Sim         | Array de endereços IP de proxy a confiar. Requisições de outros IPs são rejeitadas. |
| `gateway.auth.mode`                         | Sim         | Deve ser `"trusted-proxy"`                                                        |
| `gateway.auth.trustedProxy.userHeader`      | Sim         | Nome do header contendo a identidade do usuário autenticado                       |
| `gateway.auth.trustedProxy.requiredHeaders` | Não         | Headers adicionais que devem estar presentes para a requisição ser confiável      |
| `gateway.auth.trustedProxy.allowUsers`      | Não         | Allowlist de identidades de usuário. Vazio significa permitir todos os usuários autenticados. |

## Terminação TLS e HSTS

Use um único ponto de terminação TLS e aplique HSTS lá.

### Padrão recomendado: terminação TLS no proxy

Quando seu reverse proxy lida com HTTPS para `https://control.example.com`, defina
`Strict-Transport-Security` no proxy para esse domínio.

- Boa opção para deployments voltados para a internet.
- Mantém certificado + política de endurecimento HTTP em um único lugar.
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

`strictTransportSecurity` aceita um valor de header string, ou `false` para desabilitar explicitamente.

### Orientação de rollout

- Comece com um max age curto (por exemplo `max-age=300`) enquanto valida o tráfego.
- Aumente para valores de longa duração (por exemplo `max-age=31536000`) apenas após alta confiança.
- Adicione `includeSubDomains` apenas se cada subdomínio estiver pronto para HTTPS.
- Use preload apenas se você intencionalmente atende aos requisitos de preload para todo o seu conjunto de domínios.
- Desenvolvimento local somente loopback não se beneficia de HSTS.

## Exemplos de configuração de proxy

### Pomerium

O Pomerium passa identidade em `x-pomerium-claim-email` (ou outros headers de claim) e um JWT em `x-pomerium-jwt-assertion`.

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

Trecho de config do Pomerium:

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

Trecho de Caddyfile:

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

O oauth2-proxy autentica usuários e passa identidade em `x-auth-request-email`.

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

Trecho de config do nginx:

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

Antes de habilitar auth de proxy confiável, verifique:

- [ ] **O proxy é o único caminho**: A porta do Gateway está firewallada de tudo exceto seu proxy
- [ ] **trustedProxies é mínimo**: Apenas seus IPs reais de proxy, não sub-redes inteiras
- [ ] **O proxy remove headers**: Seu proxy sobrescreve (não adiciona) headers `x-forwarded-*` de clientes
- [ ] **Terminação TLS**: Seu proxy lida com TLS; usuários conectam via HTTPS
- [ ] **allowUsers está definido** (recomendado): Restrinja a usuários conhecidos em vez de permitir qualquer um autenticado

## Auditoria de segurança

`opencraft security audit` sinalizará auth de proxy confiável com um achado de severidade **crítica**. Isso é intencional — é um lembrete de que você está delegando segurança à sua configuração de proxy.

A auditoria verifica:

- Configuração `trustedProxies` ausente
- Configuração `userHeader` ausente
- `allowUsers` vazio (permite qualquer usuário autenticado)

## Resolução de problemas

### "trusted_proxy_untrusted_source"

A requisição não veio de um IP em `gateway.trustedProxies`. Verifique:

- O IP do proxy está correto? (IPs de containers Docker podem mudar)
- Há um balanceador de carga na frente do seu proxy?
- Use `docker inspect` ou `kubectl get pods -o wide` para encontrar IPs reais

### "trusted_proxy_user_missing"

O header do usuário estava vazio ou ausente. Verifique:

- Seu proxy está configurado para passar headers de identidade?
- O nome do header está correto? (case-insensitive, mas ortografia importa)
- O usuário está realmente autenticado no proxy?

### "trusted_proxy_missing_header_\*"

Um header obrigatório não estava presente. Verifique:

- Sua configuração de proxy para esses headers específicos
- Se os headers estão sendo removidos em algum lugar da cadeia

### "trusted_proxy_user_not_allowed"

O usuário está autenticado mas não está em `allowUsers`. Adicione-o ou remova a allowlist.

### WebSocket Ainda Falhando

Certifique-se de que seu proxy:

- Suporta upgrades WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Passa os headers de identidade em requisições de upgrade WebSocket (não apenas HTTP)
- Não tem um caminho de auth separado para conexões WebSocket

## Migração de auth por token

Se você está migrando de auth por token para proxy confiável:

1. Configure seu proxy para autenticar usuários e passar headers
2. Teste a configuração do proxy independentemente (curl com headers)
3. Atualize a config do OpenCraft com auth de proxy confiável
4. Reinicie o Gateway
5. Teste conexões WebSocket da Control UI
6. Execute `opencraft security audit` e revise os achados

## Relacionado

- [Segurança](/gateway/security) — guia completo de segurança
- [Configuração](/gateway/configuration) — referência de config
- [Acesso Remoto](/gateway/remote) — outros padrões de acesso remoto
- [Tailscale](/gateway/tailscale) — alternativa mais simples para acesso somente tailnet
