---
summary: "Contrato para planos `secrets apply`: validação de alvo, correspondência de path e escopo de alvo `auth-profiles.json`"
read_when:
  - Gerando ou revisando planos `opencraft secrets apply`
  - Depurando erros de `Invalid plan target path`
  - Entendendo comportamento de validação de tipo de alvo e path
title: "Contrato do Plano Secrets Apply"
---

# Contrato do plano secrets apply

Esta página define o contrato estrito aplicado por `opencraft secrets apply`.

Se um alvo não corresponder a estas regras, o apply falha antes de mutar a configuração.

## Formato do arquivo de plano

`opencraft secrets apply --from <plan.json>` espera um array `targets` de alvos de plano:

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

## Escopo de alvo suportado

Alvos de plano são aceitos para caminhos de credencial suportados em:

- [Superfície de Credencial SecretRef](/reference/secretref-credential-surface)

## Comportamento de tipo de alvo

Regra geral:

- `target.type` deve ser reconhecido e deve corresponder à forma normalizada de `target.path`.

Aliases de compatibilidade permanecem aceitos para planos existentes:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regras de validação de path

Cada alvo é validado com todos os seguintes:

- `type` deve ser um tipo de alvo reconhecido.
- `path` deve ser um dot path não-vazio.
- `pathSegments` pode ser omitido. Se fornecido, deve normalizar para exatamente o mesmo path que `path`.
- Segmentos proibidos são rejeitados: `__proto__`, `prototype`, `constructor`.
- O path normalizado deve corresponder à forma de path registrada para o tipo de alvo.
- Se `providerId` ou `accountId` estiver definido, deve corresponder ao id codificado no path.
- Alvos `auth-profiles.json` requerem `agentId`.
- Ao criar um novo mapeamento `auth-profiles.json`, inclua `authProfileProvider`.

## Comportamento de falha

Se um alvo falhar na validação, o apply sai com um erro como:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Nenhuma escrita é confirmada para um plano inválido.

## Notas de escopo de runtime e auditoria

- Entradas `auth-profiles.json` somente-ref (`keyRef`/`tokenRef`) são incluídas na resolução de runtime e cobertura de auditoria.
- `secrets apply` escreve alvos `opencraft.json` suportados, alvos `auth-profiles.json` suportados e alvos de limpeza opcionais.

## Verificações do operador

```bash
# Validar plano sem escritas
opencraft secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Depois aplicar de verdade
opencraft secrets apply --from /tmp/openclaw-secrets-plan.json
```

Se o apply falhar com uma mensagem de path de alvo inválido, regenere o plano com `opencraft secrets configure` ou corrija o path de alvo para uma forma suportada acima.

## Docs relacionados

- [Gerenciamento de Segredos](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [Superfície de Credencial SecretRef](/reference/secretref-credential-surface)
- [Referência de Configuração](/gateway/configuration-reference)
