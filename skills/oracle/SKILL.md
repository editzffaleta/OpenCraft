---
name: oracle
description: Melhores práticas para usar o CLI oracle (agrupamento de prompt + arquivo, engines, sessões e padrões de anexo de arquivo).
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

O Oracle agrupa seu prompt + arquivos selecionados em uma única requisição "one-shot" para que outro modelo possa responder com contexto real do repositório (API ou automação de navegador). Trate a saída como consultiva: verifique no código + testes.

## Caso de uso principal (navegador, GPT-5.2 Pro)

Fluxo padrão aqui: `--engine browser` com GPT-5.2 Pro no ChatGPT. Este é o caminho comum de "reflexão longa": ~10 minutos a ~1 hora é normal; espere uma sessão armazenada à qual você possa se reconectar.

Padrões recomendados:

- Engine: browser (`--engine browser`)
- Modelo: GPT-5.2 Pro (`--model gpt-5.2-pro` ou `--model "5.2 Pro"`)

## Caminho ideal

1. Escolha um conjunto de arquivos enxuto (o mínimo de arquivos que ainda contém a verdade).
2. Visualize o payload + gasto de tokens (`--dry-run` + `--files-report`).
3. Use o modo browser para o fluxo habitual do GPT-5.2 Pro; use a API apenas quando quiser explicitamente.
4. Se a execução for desconectada/expirar: reconecte-se à sessão armazenada (não re-execute).

## Comandos (preferidos)

- Ajuda:
  - `oracle --help`
  - Se o binário não estiver instalado: `npx -y @steipete/oracle --help` (evite `pnpx` aqui; bindings sqlite).

- Visualizar (sem tokens):
  - `oracle --dry-run summary -p "<task>" --file "src/**" --file "!**/*.test.*"`
  - `oracle --dry-run full -p "<task>" --file "src/**"`

- Verificação de tokens:
  - `oracle --dry-run summary --files-report -p "<task>" --file "src/**"`

- Execução no navegador (caminho principal; longa duração é normal):
  - `oracle --engine browser --model gpt-5.2-pro -p "<task>" --file "src/**"`

- Alternativa com colagem manual:
  - `oracle --render --copy -p "<task>" --file "src/**"`
  - Observação: `--copy` é um alias oculto para `--copy-markdown`.

## Anexando arquivos (`--file`)

`--file` aceita arquivos, diretórios e globs. Você pode passá-lo várias vezes; as entradas podem ser separadas por vírgula.

- Incluir:
  - `--file "src/**"`
  - `--file src/index.ts`
  - `--file docs --file README.md`

- Excluir:
  - `--file "src/**" --file "!src/**/*.test.ts" --file "!**/*.snap"`

- Padrões (comportamento da implementação):
  - Diretórios ignorados por padrão: `node_modules`, `dist`, `coverage`, `.git`, `.turbo`, `.next`, `build`, `tmp` (ignorados a menos que sejam passados explicitamente como dirs/arquivos literais).
  - Respeita `.gitignore` ao expandir globs.
  - Não segue links simbólicos.
  - Dotfiles filtrados a menos que seja optado via padrão (ex.: `--file ".github/**"`).
  - Arquivos > 1 MB rejeitados.

## Engines (API vs browser)

- Seleção automática: `api` quando `OPENAI_API_KEY` está definido; caso contrário `browser`.
- O browser suporta apenas GPT + Gemini; use `--engine api` para Claude/Grok/Codex ou execuções com múltiplos modelos.
- Anexos no browser:
  - `--browser-attachments auto|never|always` (auto cola inline até ~60k chars depois faz upload).
- Host de browser remoto:
  - Host: `oracle serve --host 0.0.0.0 --port 9473 --token <secret>`
  - Cliente: `oracle --engine browser --remote-host <host:port> --remote-token <secret> -p "<task>" --file "src/**"`

## Sessões + slugs

- Armazenadas em `~/.oracle/sessions` (substitua com `ORACLE_HOME_DIR`).
- Execuções podem ser desconectadas ou demorar muito (browser + GPT-5.2 Pro frequentemente assim). Se o CLI expirar: não re-execute; reconecte-se.
  - Listar: `oracle status --hours 72`
  - Reconectar: `oracle session <id> --render`
- Use `--slug "<3-5 palavras>"` para manter os IDs de sessão legíveis.
- Proteção contra prompt duplicado existe; use `--force` apenas quando realmente quiser uma nova execução.

## Template de prompt (alto sinal)

O Oracle começa com **zero** conhecimento do projeto. Assuma que o modelo não consegue inferir sua stack, ferramentas de build, convenções ou caminhos "óbvios". Inclua:

- Briefing do projeto (stack + comandos de build/teste + restrições de plataforma).
- "Onde as coisas ficam" (diretórios-chave, pontos de entrada, arquivos de configuração, limites).
- Pergunta exata + o que você tentou + o texto do erro (verbatim).
- Restrições ("não altere X", "deve manter a API pública", etc.).
- Saída desejada ("retorne plano de patch + testes", "dê 3 opções com tradeoffs").

## Segurança

- Não anexe segredos por padrão (`.env`, arquivos de chave, tokens de autenticação). Redija agressivamente; compartilhe apenas o necessário.

## Padrão de restauração de "prompt exaustivo"

Para investigações longas, escreva um prompt independente + conjunto de arquivos para poder re-executar dias depois:

- Briefing do projeto de 6 a 30 frases + o objetivo.
- Passos de reprodução + erros exatos + o que você tentou.
- Anexe todos os arquivos de contexto necessários (pontos de entrada, configs, módulos-chave, docs).

As execuções do Oracle são one-shot; o modelo não se lembra de execuções anteriores. "Restaurar contexto" significa re-executar com o mesmo prompt + conjunto `--file …` (ou reconectar a uma sessão armazenada ainda ativa).
