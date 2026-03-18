# Lobster (plugin)

Adiciona a ferramenta de agente `lobster` como um plugin de ferramenta **opcional**.

## O que é isso

- Lobster é um shell de workflow independente (pipelines JSON tipados + aprovações/retomada).
- Este plugin integra o Lobster ao OpenCraft _sem alterações no núcleo_.

## Ativar

Como esta ferramenta pode desencadear efeitos colaterais (via workflows), ela é registrada com `optional: true`.

Ative-a em uma lista de permissões de agente:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": [
            "lobster" // id do plugin (ativa todas as ferramentas deste plugin)
          ]
        }
      }
    ]
  }
}
```

## Usando `opencraft.invoke` (Lobster → ferramentas OpenCraft)

Alguns pipelines do Lobster podem incluir um passo `opencraft.invoke` para chamar de volta as ferramentas/plugins do OpenCraft (por exemplo: `gog` para Google Workspace, `gh` para GitHub, `message.send`, etc.).

Para que isso funcione, o Gateway do OpenCraft deve expor o endpoint de bridge de ferramentas e a ferramenta alvo deve ser permitida pela política:

- O OpenCraft fornece um endpoint HTTP: `POST /tools/invoke`.
- A requisição é controlada por **autenticação do gateway** (ex.: `Authorization: Bearer …` quando a autenticação por token está ativada).
- A ferramenta invocada é controlada pela **política de ferramentas** (política global + por agente + por provedor + por grupo). Se a ferramenta não for permitida, o OpenCraft retorna `404 Tool not available`.

### Lista de permissões recomendada

Para evitar que workflows chamem ferramentas arbitrárias, defina uma lista de permissões restrita no agente que será usado pelo `opencraft.invoke`.

Exemplo (permite apenas um pequeno conjunto de ferramentas):

```jsonc
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": ["lobster", "web_fetch", "web_search", "gog", "gh"],
          "deny": ["gateway"],
        },
      },
    ],
  },
}
```

Notas:

- Se `tools.allow` for omitido ou vazio, o comportamento é "permitir tudo (exceto negados)". Para uma lista de permissões real, defina um `allow` **não vazio**.
- Os nomes das ferramentas dependem de quais plugins você tem instalados/ativados.

## Segurança

- Executa o executável `lobster` como um subprocesso local.
- Não gerencia OAuth/tokens.
- Usa timeouts, limites de stdout e análise estrita do envelope JSON.
- Certifique-se de que `lobster` esteja disponível no `PATH` para o processo do gateway.
