---
summary: "Validação estrita de configuração + migrações somente via doctor"
read_when:
  - Projetando ou implementando comportamento de validação de configuração
  - Trabalhando em migrações de configuração ou fluxos de trabalho doctor
  - Lidando com esquemas de configuração de Plugin ou gating de carregamento de Plugin
title: "Strict Config Validation"
---

# Validação estrita de configuração (migrações somente via doctor)

## Objetivos

- **Rejeitar chaves de configuração desconhecidas em todo lugar** (raiz + aninhado), exceto metadados `$schema` na raiz.
- **Rejeitar configuração de Plugin sem um esquema**; não carregar aquele Plugin.
- **Remover auto-migração legada no carregamento**; migrações executam somente via doctor.
- **Auto-executar doctor (dry-run) na inicialização**; se inválido, bloquear comandos não diagnósticos.

## Não-objetivos

- Compatibilidade retroativa no carregamento (chaves legadas não auto-migram).
- Drops silenciosos de chaves não reconhecidas.

## Regras de validação estrita

- A configuração deve corresponder ao esquema exatamente em todos os níveis.
- Chaves desconhecidas são erros de validação (sem passthrough na raiz ou aninhado), exceto `$schema` na raiz quando é uma string.
- `plugins.entries.<id>.config` deve ser validado pelo esquema do Plugin.
  - Se um Plugin não tem esquema, **rejeitar carregamento do Plugin** e exibir um erro claro.
- Chaves desconhecidas em `channels.<id>` são erros a menos que um manifesto de Plugin declare o id do canal.
- Manifestos de Plugin (`opencraft.plugin.json`) são obrigatórios para todos os Plugins.

## Imposição de esquema de Plugin

- Cada Plugin fornece um JSON Schema estrito para sua configuração (inline no manifesto).
- Fluxo de carregamento do Plugin:
  1. Resolver manifesto + esquema do Plugin (`opencraft.plugin.json`).
  2. Validar configuração contra o esquema.
  3. Se esquema ausente ou configuração inválida: bloquear carregamento do Plugin, registrar erro.
- Mensagem de erro inclui:
  - ID do Plugin
  - Motivo (esquema ausente / configuração inválida)
  - Caminho(s) que falharam na validação
- Plugins desabilitados mantêm sua configuração, mas Doctor + logs exibem um aviso.

## Fluxo Doctor

- Doctor executa **toda vez** que a configuração é carregada (dry-run por padrão).
- Se configuração inválida:
  - Imprimir um resumo + erros acionáveis.
  - Instruir: `opencraft doctor --fix`.
- `opencraft doctor --fix`:
  - Aplica migrações.
  - Remove chaves desconhecidas.
  - Escreve configuração atualizada.

## Gating de comandos (quando configuração é inválida)

Permitidos (somente diagnóstico):

- `opencraft doctor`
- `opencraft logs`
- `opencraft health`
- `opencraft help`
- `opencraft status`
- `opencraft gateway status`

Todo o resto deve falhar com: "Config invalid. Run `opencraft doctor --fix`."

## Formato de UX de erro

- Cabeçalho de resumo único.
- Seções agrupadas:
  - Chaves desconhecidas (caminhos completos)
  - Chaves legadas / migrações necessárias
  - Falhas de carregamento de Plugin (ID do Plugin + motivo + caminho)

## Pontos de contato da implementação

- `src/config/zod-schema.ts`: remover passthrough da raiz; objetos estritos em todo lugar.
- `src/config/zod-schema.providers.ts`: garantir esquemas estritos de canal.
- `src/config/validation.ts`: falhar em chaves desconhecidas; não aplicar migrações legadas.
- `src/config/io.ts`: remover auto-migrações legadas; sempre executar doctor dry-run.
- `src/config/legacy*.ts`: mover uso somente para doctor.
- `src/plugins/*`: adicionar registro de esquema + gating.
- Gating de comandos CLI em `src/cli`.

## Testes

- Rejeição de chave desconhecida (raiz + aninhado).
- Plugin sem esquema → carregamento do Plugin bloqueado com erro claro.
- Configuração inválida → inicialização do Gateway bloqueada exceto comandos diagnósticos.
- Doctor dry-run automático; `doctor --fix` escreve configuração corrigida.
