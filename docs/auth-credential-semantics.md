# Semântica de Credenciais de Auth

Este documento define a elegibilidade canônica de credenciais e a semântica de resolução usadas em:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

O objetivo é manter o comportamento de seleção e o comportamento em runtime alinhados.

## Códigos de Motivo Estáveis

- `ok`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`

## Credenciais de Token

Credenciais de token (`type: "token"`) suportam `token` inline e/ou `tokenRef`.

### Regras de elegibilidade

1. Um perfil de token é inelegível quando tanto `token` quanto `tokenRef` estão ausentes.
2. `expires` é opcional.
3. Se `expires` estiver presente, deve ser um número finito maior que `0`.
4. Se `expires` for inválido (`NaN`, `0`, negativo, não-finito ou tipo errado), o perfil é inelegível com `invalid_expires`.
5. Se `expires` estiver no passado, o perfil é inelegível com `expired`.
6. `tokenRef` não ignora a validação de `expires`.

### Regras de resolução

1. A semântica do resolvedor corresponde à semântica de elegibilidade para `expires`.
2. Para perfis elegíveis, o material do token pode ser resolvido a partir do valor inline ou de `tokenRef`.
3. Refs não resolvíveis produzem `unresolved_ref` na saída de `models status --probe`.

## Mensagens Compatíveis com Legacy

Para compatibilidade com scripts, erros de probe mantêm esta primeira linha inalterada:

`Auth profile credentials are missing or expired.`

Detalhes amigáveis e códigos de motivo estáveis podem ser adicionados nas linhas seguintes.
