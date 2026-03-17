---
summary: "Contrato para planos de `secrets apply`: validação de target, correspondência de path e escopo de target `auth-profiles.json`"
read_when:
  - Gerando ou revisando planos de `opencraft secrets apply`
  - Debugando erros de `Invalid plan target path`
  - Entendendo comportamento de validação de tipo e path de target
title: "Secrets Apply Plan Contract"
---

# Contrato do plano secrets apply

Esta página define o contrato estrito aplicado por `opencraft secrets apply`.

Se um target não corresponde a essas regras, apply falha antes de mutar a configuração.

## Formato do arquivo de plano

`opencraft secrets apply --from <plan.json>` espera um array `targets` de targets de plano:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## Escopo de target suportado

Targets de plano são aceitos para caminhos de credenciais suportados em:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

## Comportamento do tipo de target

Regra geral:

- `target.type` deve ser reconhecido e deve corresponder ao formato normalizado de `target.path`.

Aliases de compatibilidade permanecem aceitos para planos existentes:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regras de validação de path

Cada target é validado com todas as seguintes:

- `type` deve ser um tipo de target reconhecido.
- `path` deve ser um dot path não vazio.
- `pathSegments` pode ser omitido. Se fornecido, deve normalizar para exatamente o mesmo path que `path`.
- Segmentos proibidos são rejeitados: `__proto__`, `prototype`, `constructor`.
- O path normalizado deve corresponder ao formato de path registrado para o tipo de target.
- Se `providerId` ou `accountId` está definido, deve corresponder ao id codificado no path.
- Targets `auth-profiles.json` requerem `agentId`.
- Ao criar um novo mapeamento `auth-profiles.json`, inclua `authProfileProvider`.

## Comportamento de falha

Se um target falha na validação, apply sai com um erro como:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Nenhuma escrita é comitada para um plano inválido.

## Notas de escopo de runtime e auditoria

- Entradas `auth-profiles.json` apenas-ref (`keyRef`/`tokenRef`) são incluídas na resolução de runtime e cobertura de auditoria.
- `secrets apply` escreve targets `opencraft.json` suportados, targets `auth-profiles.json` suportados e targets opcionais de scrub.

## Verificações do operador

```bash
# Validar plano sem escritas
opencraft secrets apply --from /tmp/opencraft-secrets-plan.json --dry-run

# Depois aplicar de verdade
opencraft secrets apply --from /tmp/opencraft-secrets-plan.json
```

Se apply falha com uma mensagem de path de target inválido, regenere o plano com `opencraft secrets configure` ou corrija o path do target para um formato suportado acima.

## Documentação relacionada

- [Secrets Management](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef Credential Surface](/reference/secretref-credential-surface)
- [Configuration Reference](/gateway/configuration-reference)
