---
name: ordercli
description: CLI exclusivo para Foodora para verificar pedidos anteriores e status de pedidos ativos (Deliveroo em desenvolvimento).
homepage: https://ordercli.sh
metadata:
  {
    "opencraft":
      {
        "emoji": "🛵",
        "requires": { "bins": ["ordercli"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/ordercli",
              "bins": ["ordercli"],
              "label": "Instalar ordercli (brew)",
            },
            {
              "id": "go",
              "kind": "go",
              "module": "github.com/steipete/ordercli/cmd/ordercli@latest",
              "bins": ["ordercli"],
              "label": "Instalar ordercli (go)",
            },
          ],
      },
  }
---

# ordercli

Use `ordercli` para verificar pedidos anteriores e acompanhar o status de pedidos ativos (apenas Foodora por enquanto).

Início rápido (Foodora)

- `ordercli foodora countries`
- `ordercli foodora config set --country AT`
- `ordercli foodora login --email you@example.com --password-stdin`
- `ordercli foodora orders`
- `ordercli foodora history --limit 20`
- `ordercli foodora history show <orderCode>`

Pedidos

- Lista ativa (chegada/status): `ordercli foodora orders`
- Monitorar: `ordercli foodora orders --watch`
- Detalhes do pedido ativo: `ordercli foodora order <orderCode>`
- Detalhes do histórico em JSON: `ordercli foodora history show <orderCode> --json`

Refazer pedido (adiciona ao carrinho)

- Visualizar: `ordercli foodora reorder <orderCode>`
- Confirmar: `ordercli foodora reorder <orderCode> --confirm`
- Endereço: `ordercli foodora reorder <orderCode> --confirm --address-id <id>`

Cloudflare / proteção contra bots

- Login pelo navegador: `ordercli foodora login --email you@example.com --password-stdin --browser`
- Reutilizar perfil: `--browser-profile "$HOME/Library/Application Support/ordercli/browser-profile"`
- Importar cookies do Chrome: `ordercli foodora cookies chrome --profile "Default"`

Importação de sessão (sem senha)

- `ordercli foodora session chrome --url https://www.foodora.at/ --profile "Default"`
- `ordercli foodora session refresh --client-id android`

Deliveroo (em desenvolvimento, ainda não funciona)

- Requer `DELIVEROO_BEARER_TOKEN` (`DELIVEROO_COOKIE` opcional).
- `ordercli deliveroo config set --market uk`
- `ordercli deliveroo history`

Observações

- Use `--config /tmp/ordercli.json` para testes.
- Confirme antes de qualquer ação de refazer pedido ou alteração de carrinho.
