---
summary: "Validação estrita de configuração + migrações apenas via doctor"
read_when:
  - Projetando ou implementando comportamento de validação de configuração
  - Trabalhando em migrações de configuração ou fluxos de trabalho do doctor
  - Tratando esquemas de configuração de plugin ou controle de carregamento de plugin
title: "Validação Estrita de Configuração"
---

# Validação estrita de configuração (migrações apenas via doctor)

## Objetivos

- **Rejeitar chaves de configuração desconhecidas em todo lugar** (raiz + aninhadas), exceto metadados `$schema` na raiz.
- **Rejeitar configuração de plugin sem esquema**; não carregar esse plugin.
- **Remover auto-migração legada no carregamento**; migrações executam apenas via doctor.
- **Executar automaticamente o doctor (dry-run) na inicialização**; se inválido, bloquear comandos não diagnósticos.

## Não-Objetivos

- Compatibilidade retroativa no carregamento (chaves legadas não migram automaticamente).
- Descarte silencioso de chaves não reconhecidas.

## Regras de validação estrita

- A configuração deve corresponder exatamente ao esquema em todos os níveis.
- Chaves desconhecidas são erros de validação (sem passagem na raiz ou aninhadas), exceto `$schema` na raiz quando for uma string.
- `plugins.entries.<id>.config` deve ser validado pelo esquema do plugin.
  - Se um plugin não tiver esquema, **rejeitar carregamento do plugin** e exibir um erro claro.
- Chaves `channels.<id>` desconhecidas são erros a menos que um manifesto de plugin declare o id do canal.
- Manifestos de plugin (`opencraft.plugin.json`) são obrigatórios para todos os plugins.

## Aplicação do esquema de plugin

- Cada plugin fornece um JSON Schema estrito para sua configuração (inline no manifesto).
- Fluxo de carregamento do plugin:
  1. Resolver manifesto do plugin + esquema (`opencraft.plugin.json`).
  2. Validar configuração contra o esquema.
  3. Se esquema ausente ou configuração inválida: bloquear carregamento do plugin, registrar erro.
- A mensagem de erro inclui:
  - ID do plugin
  - Motivo (esquema ausente / configuração inválida)
  - Caminho(s) que falharam na validação
- Plugins desabilitados mantêm sua configuração, mas Doctor + logs exibem um aviso.

## Fluxo do Doctor

- O Doctor executa **toda vez** que a configuração é carregada (dry-run por padrão).
- Se a configuração for inválida:
  - Imprimir um resumo + erros acionáveis.
  - Instruir: `opencraft doctor --fix`.
- `opencraft doctor --fix`:
  - Aplica migrações.
  - Remove chaves desconhecidas.
  - Escreve configuração atualizada.

## Controle de comandos (quando a configuração é inválida)

Permitido (apenas diagnóstico):

- `opencraft doctor`
- `opencraft logs`
- `opencraft health`
- `opencraft help`
- `opencraft status`
- `opencraft gateway status`

Todo o resto deve falhar com: "Configuração inválida. Execute `opencraft doctor --fix`."

## Formato de UX de erro

- Cabeçalho de resumo único.
- Seções agrupadas:
  - Chaves desconhecidas (caminhos completos)
  - Chaves legadas / migrações necessárias
  - Falhas de carregamento de plugin (id do plugin + motivo + caminho)

## Pontos de contato de implementação

- `src/config/zod-schema.ts`: remover passagem na raiz; objetos estritos em todo lugar.
- `src/config/zod-schema.providers.ts`: garantir esquemas de canal estritos.
- `src/config/validation.ts`: falhar em chaves desconhecidas; não aplicar migrações legadas.
- `src/config/io.ts`: remover auto-migrações legadas; sempre executar dry-run do doctor.
- `src/config/legacy*.ts`: mover uso apenas para o doctor.
- `src/plugins/*`: adicionar registry de esquema + controle.
- Controle de comandos CLI em `src/cli`.

## Testes

- Rejeição de chave desconhecida (raiz + aninhada).
- Plugin com esquema ausente → carregamento do plugin bloqueado com erro claro.
- Configuração inválida → inicialização do gateway bloqueada exceto comandos diagnósticos.
- Doctor dry-run automático; `doctor --fix` escreve configuração corrigida.
