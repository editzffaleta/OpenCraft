---
name: oracle
description: Melhores práticas para usar o CLI oracle (bundling de prompt + arquivos, engines, sessões e padrões de anexo de arquivos).
homepage: https://askoracle.dev
metadata:
  {
    "opencraft":
      {
        "emoji": "🧿",
        "requires": { "bins": ["oracle"] },
        "install":
          [
            {
              "id": "node",
              "kind": "node",
              "package": "@steipete/oracle",
              "bins": ["oracle"],
              "label": "Instalar oracle (node)",
            },
          ],
      },
  }
---

# oracle — melhor uso

O Oracle agrupa seu prompt + arquivos selecionados em uma única solicitação "one-shot" para que outro modelo possa responder com contexto real do repositório (API ou automação de navegador). Trate a saída como consultiva: verifique com código + testes.

## Caso de uso principal (navegador, GPT-5.2 Pro)

Fluxo padrão aqui: `--engine browser` com GPT-5.2 Pro no ChatGPT. Este é o caminho comum de "longa reflexão": ~10 minutos a ~1 hora é normal; espere uma sessão armazenada que você pode reatachar.

Padrões recomendados:

- Engine: browser (`--engine browser`)
- Modelo: GPT-5.2 Pro (`--model gpt-5.2-pro` ou `--model "5.2 Pro"`)

## Caminho dourado

1. Escolha um conjunto de arquivos enxuto (o menor número de arquivos que ainda contém a verdade).
2. Pré-visualize payload + custo de tokens (`--dry-run` + `--files-report`).
3. Use modo browser para o fluxo usual GPT-5.2 Pro; use API apenas quando explicitamente quiser.
4. Se a execução se desconectar/timeout: reatachar à sessão armazenada (não re-executar).

## Comandos (preferidos)

- Ajuda:
  - `oracle --help`
  - Se o binário não estiver instalado: `npx -y @steipete/oracle --help` (evite `pnpx` aqui; bindings sqlite).

- Pré-visualizar (sem tokens):
  - `oracle --dry-run summary -p "<tarefa>" --file "src/**" --file "!**/*.test.*"`
  - `oracle --dry-run full -p "<tarefa>" --file "src/**"`

- Verificação de tokens:
  - `oracle --dry-run summary --files-report -p "<tarefa>" --file "src/**"`

- Execução browser (caminho principal; longa duração é normal):
  - `oracle --engine browser --model gpt-5.2-pro -p "<tarefa>" --file "src/**"`

- Fallback de cole manual:
  - `oracle --render --copy -p "<tarefa>" --file "src/**"`
  - Nota: `--copy` é um alias oculto para `--copy-markdown`.

## Anexar arquivos (`--file`)

`--file` aceita arquivos, diretórios e globs. Pode ser passado múltiplas vezes; entradas podem ser separadas por vírgula.

- Incluir:
  - `--file "src/**"`
  - `--file src/index.ts`
  - `--file docs --file README.md`

- Excluir:
  - `--file "src/**" --file "!src/**/*.test.ts" --file "!**/*.snap"`

- Padrões (comportamento de implementação):
  - Diretórios ignorados por padrão: `node_modules`, `dist`, `coverage`, `.git`, `.turbo`, `.next`, `build`, `tmp` (ignorados a menos que passados explicitamente como dirs/arquivos literais).
  - Respeita `.gitignore` ao expandir globs.
  - Não segue symlinks.
  - Dotfiles filtrados a menos que opted in via padrão (ex: `--file ".github/**"`).
  - Arquivos > 1 MB rejeitados.

## Engines (API vs navegador)

- Auto-selecionar: `api` quando `OPENAI_API_KEY` está definida; caso contrário `browser`.
- Browser suporta apenas GPT + Gemini; use `--engine api` para Claude/Grok/Codex ou execuções multi-modelo.
- Anexos browser:
  - `--browser-attachments auto|never|always` (auto cola inline até ~60k chars e então faz upload).
- Host browser remoto:
  - Host: `oracle serve --host 0.0.0.0 --port 9473 --token <segredo>`
  - Cliente: `oracle --engine browser --remote-host <host:porta> --remote-token <segredo> -p "<tarefa>" --file "src/**"`

## Sessões + slugs

- Armazenadas em `~/.oracle/sessions` (sobrescreva com `ORACLE_HOME_DIR`).
- Execuções podem se desconectar ou demorar muito (browser + GPT-5.2 Pro frequentemente faz isso). Se o CLI timeout: não re-execute; reatachar.
  - Listar: `oracle status --hours 72`
  - Atachar: `oracle session <id> --render`
- Use `--slug "<3-5 palavras>"` para manter IDs de sessão legíveis.
- Há proteção contra prompt duplicado; use `--force` apenas quando realmente quiser uma nova execução.

## Template de prompt (alto sinal)

O Oracle começa com **zero** conhecimento do projeto. Assuma que o modelo não pode inferir sua stack, ferramentas de build, convenções ou caminhos "óbvios". Inclua:

- Briefing do projeto (stack + comandos de build/teste + restrições de plataforma).
- "Onde as coisas ficam" (diretórios chave, pontos de entrada, arquivos de configuração, limites).
- Pergunta exata + o que você tentou + o texto do erro (verbatim).
- Restrições ("não mude X", "deve manter API pública", etc).
- Saída desejada ("retorne plano de patch + testes", "dê 3 opções com trade-offs").

## Segurança

- Não anexe segredos por padrão (`.env`, arquivos de chave, tokens de autenticação). Redija agressivamente; compartilhe apenas o necessário.

## Padrão de restauração de "prompt exaustivo"

Para investigações longas, escreva um prompt independente + conjunto de arquivos para poder re-executar dias depois:

- Briefing do projeto de 6–30 frases + o objetivo.
- Passos de reprodução + erros exatos + o que você tentou.
- Anexe todos os arquivos de contexto necessários (pontos de entrada, configs, módulos chave, docs).

Execuções Oracle são one-shot; o modelo não lembra execuções anteriores. "Restaurar contexto" significa re-executar com o mesmo prompt + conjunto `--file …` (ou reatachar uma sessão armazenada ainda em execução).
