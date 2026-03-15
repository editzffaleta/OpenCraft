---
name: healthcheck
description: Hardening de segurança do host e configuração de tolerância a risco para deployments do OpenCraft. Use quando o usuário pedir auditorias de segurança, hardening de firewall/SSH/atualizações, postura de risco, revisão de exposição, agendamento de verificações periódicas via cron do OpenCraft, ou verificações de status de versão numa máquina rodando o OpenCraft (laptop, workstation, Pi, VPS).
---

# Hardening do Host OpenCraft

## Visão Geral

Avalie e fortaleça o host que executa o OpenCraft, depois alinhe-o à tolerância de risco definida pelo usuário sem quebrar o acesso. Use as ferramentas de segurança do OpenCraft como sinal de primeira classe, mas trate o hardening de SO como um conjunto separado e explícito de etapas.

## Regras principais

- Recomende executar esta habilidade com um modelo de ponta (ex: Opus 4.5, GPT 5.2+). O agente deve verificar o modelo atual e sugerir trocar se estiver abaixo desse nível; não bloqueie a execução.
- Exija aprovação explícita antes de qualquer ação que altere estado.
- Não modifique configurações de acesso remoto sem confirmar como o usuário se conecta.
- Prefira mudanças reversíveis e graduais com um plano de rollback.
- Nunca afirme que o OpenCraft muda o firewall do host, SSH ou atualizações de SO; ele não faz isso.
- Se a função/identidade for desconhecida, forneça apenas recomendações.
- Formatação: cada conjunto de escolhas do usuário deve ser numerado para que o usuário possa responder com um único dígito.
- Backups em nível de sistema são recomendados; tente verificar o status.

## Fluxo de trabalho (siga em ordem)

### 0) Verificação automática de modelo (não bloqueante)

Antes de começar, verifique o modelo atual. Se estiver abaixo do estado da arte (ex: Opus 4.5, GPT 5.2+), recomende trocar. Não bloqueie a execução.

### 1) Estabelecer contexto (somente leitura)

Tente inferir 1–5 do ambiente antes de perguntar. Prefira perguntas simples e não técnicas se precisar de confirmação.

Determine (em ordem):

1. SO e versão (Linux/macOS/Windows), container vs host.
2. Nível de privilégio (root/admin vs usuário).
3. Caminho de acesso (console local, SSH, RDP, tailnet).
4. Exposição de rede (IP público, proxy reverso, túnel).
5. Status do gateway OpenCraft e endereço de bind.
6. Sistema de backup e status (ex: Time Machine, imagens de sistema, snapshots).
7. Contexto de deployment (app macOS local, host de gateway sem cabeça, gateway remoto, container/CI).
8. Status de criptografia de disco (FileVault/LUKS/BitLocker).
9. Status de atualizações automáticas de segurança do SO.
   Nota: esses não são itens bloqueantes, mas são altamente recomendados, especialmente se o OpenCraft pode acessar dados sensíveis.
10. Modo de uso de um assistente pessoal com acesso total (workstation local vs sem cabeça/remoto vs outro).

Peça uma vez permissão para executar verificações somente leitura. Se concedido, execute-as por padrão e faça perguntas apenas para itens que não consegue inferir ou verificar. Não pergunte por informações já visíveis no runtime ou saída de comandos.

Se precisar perguntar, use prompts não técnicos:

- "Você usa Mac, PC Windows ou Linux?"
- "Você está conectado diretamente na máquina, ou se conectando de outro computador?"
- "Essa máquina é acessível pela internet pública, ou apenas na sua rede doméstica/corporativa?"
- "Você tem backups habilitados (ex: Time Machine), e estão atualizados?"
- "A criptografia de disco está ativada (FileVault/BitLocker/LUKS)?"
- "As atualizações automáticas de segurança estão habilitadas?"
- "Como você usa essa máquina?"
  Exemplos:
  - Máquina pessoal compartilhada com o assistente
  - Máquina local dedicada ao assistente
  - Máquina/servidor remoto dedicado acessado remotamente (sempre ligado)
  - Outro?

Pergunte pelo perfil de risco somente após conhecer o contexto do sistema.

Se o usuário conceder permissão somente leitura, execute as verificações apropriadas para o SO por padrão. Se não, ofereça-as (numeradas). Exemplos:

1. SO: `uname -a`, `sw_vers`, `cat /etc/os-release`.
2. Portas em escuta:
   - Linux: `ss -ltnup` (ou `ss -ltnp` se `-u` não suportado).
   - macOS: `lsof -nP -iTCP -sTCP:LISTEN`.
3. Status do firewall:
   - Linux: `ufw status`, `firewall-cmd --state`, `nft list ruleset` (escolha o que estiver instalado).
   - macOS: `/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate` e `pfctl -s info`.
4. Backups (macOS): `tmutil status` (se Time Machine for usado).

### 2) Executar auditorias de segurança do OpenCraft (somente leitura)

Como parte das verificações padrão somente leitura, execute `opencraft security audit --deep`. Ofereça alternativas somente se o usuário solicitar:

1. `opencraft security audit` (mais rápido, sem probing)
2. `opencraft security audit --json` (saída estruturada)

Ofereça aplicar os padrões seguros do OpenCraft (numerado):

1. `opencraft security audit --fix`

Seja explícito que `--fix` apenas fortalece os padrões do OpenCraft e permissões de arquivos. Não altera firewall do host, SSH ou políticas de atualização de SO.

Se o controle de browser estiver habilitado, recomende que 2FA seja ativado em todas as contas importantes, com chaves de hardware como preferência e SMS insuficiente.

### 3) Verificar status de versão/atualização do OpenCraft (somente leitura)

Como parte das verificações padrão somente leitura, execute `opencraft update status`.

Informe o canal atual e se uma atualização está disponível.

### 4) Determinar tolerância de risco (após contexto do sistema)

Peça ao usuário para escolher ou confirmar uma postura de risco e quaisquer serviços/portas que precisam ficar abertos (opções numeradas abaixo).
Não force em perfis fixos; se o usuário preferir, capture os requisitos em vez de escolher um perfil.
Ofereça perfis sugeridos como padrões opcionais (numerados). Note que a maioria dos usuários escolhe Casa/Workstation Equilibrado:

1. Casa/Workstation Equilibrado (mais comum): firewall ativado com padrões razoáveis, acesso remoto restrito à LAN ou tailnet.
2. VPS Reforçado: firewall de entrada com deny-by-default, portas mínimas abertas, SSH apenas com chave, sem login root, atualizações automáticas de segurança.
3. Conveniência para Desenvolvedor: mais serviços locais permitidos, avisos explícitos de exposição, ainda auditado.
4. Personalizado: restrições definidas pelo usuário (serviços, exposição, cadência de atualização, métodos de acesso).

### 5) Produzir um plano de remediação

Forneça um plano que inclua:

- Perfil alvo
- Resumo da postura atual
- Lacunas vs alvo
- Remediação passo a passo com comandos exatos
- Estratégia de preservação de acesso e rollback
- Riscos e possíveis cenários de bloqueio
- Notas de menor privilégio (ex: evitar uso admin, restringir ownership/permissões onde seguro)
- Notas de higiene de credenciais (localização dos creds do OpenCraft, prefira criptografia de disco)

Sempre mostre o plano antes de qualquer mudança.

### 6) Oferecer opções de execução

Ofereça uma dessas escolhas (numeradas para o usuário responder com um único dígito):

1. Faça por mim (guiado, aprovações passo a passo)
2. Mostrar apenas o plano
3. Corrigir apenas problemas críticos
4. Exportar comandos para depois

### 7) Executar com confirmações

Para cada etapa:

- Mostre o comando exato
- Explique o impacto e rollback
- Confirme que o acesso permanecerá disponível
- Pare em saída inesperada e peça orientação

### 8) Verificar e reportar

Verifique novamente:

- Status do firewall
- Portas em escuta
- Acesso remoto ainda funciona
- Auditoria de segurança do OpenCraft (re-executar)

Entregue um relatório de postura final e note itens adiados.

## Confirmações obrigatórias (sempre)

Exija aprovação explícita para:

- Mudanças em regras de firewall
- Abertura/fechamento de portas
- Mudanças de configuração SSH/RDP
- Instalação/remoção de pacotes
- Habilitação/desabilitação de serviços
- Modificações de usuário/grupo
- Agendamento de tarefas ou persistência na inicialização
- Mudanças de política de atualização
- Acesso a arquivos sensíveis ou credenciais

Se não tiver certeza, pergunte.

## Verificações periódicas

Após a instalação do OpenCraft ou primeira passagem de hardening, execute pelo menos uma auditoria de baseline e verificação de versão:

- `opencraft security audit`
- `opencraft security audit --deep`
- `opencraft update status`

Monitoramento contínuo é recomendado. Use a ferramenta/CLI de cron do OpenCraft para agendar auditorias periódicas (agendador do Gateway). Não crie tarefas agendadas sem aprovação explícita. Armazene saídas em um local aprovado pelo usuário e evite secrets em logs.

Ao agendar execuções cron sem cabeça, inclua uma nota na saída instruindo o usuário a chamar `healthcheck` para que os problemas possam ser corrigidos.

### Prompt obrigatório para agendar (sempre)

Após qualquer auditoria ou passagem de hardening, ofereça explicitamente o agendamento e exija uma resposta direta. Use um prompt curto como (numerado):

1. "Quer que eu agende auditorias periódicas (ex: diárias/semanais) via `opencraft cron add`?"

Se o usuário disser sim, pergunte por:

- Cadência (diária/semanal), janela de horário preferida, e localização da saída
- Se também agendar `opencraft update status`

Use um nome de cron job estável para que as atualizações sejam determinísticas. Prefira nomes exatos:

- `healthcheck:security-audit`
- `healthcheck:update-status`

Antes de criar, `opencraft cron list` e combine pelo `name` exato. Se encontrado, `opencraft cron edit <id> ...`.
Se não encontrado, `opencraft cron add --name <name> ...`.

Ofereça também uma verificação periódica de versão para que o usuário possa decidir quando atualizar (numerado):

1. `opencraft update status` (preferido para checkouts de código-fonte e canais)
2. `npm view opencraft version` (versão publicada no npm)

## Precisão dos comandos do OpenCraft

Use apenas comandos e flags suportados:

- `opencraft security audit [--deep] [--fix] [--json]`
- `opencraft status` / `opencraft status --deep`
- `opencraft health --json`
- `opencraft update status`
- `opencraft cron add|list|runs|run`

Não invente flags CLI nem implique que o OpenCraft aplica políticas de firewall/SSH do host.

## Log e trilha de auditoria

Registre:

- Identidade e papel do Gateway
- ID do plano e timestamp
- Etapas aprovadas e comandos exatos
- Códigos de saída e arquivos modificados (melhor esforço)

Oculte secrets. Nunca registre tokens ou conteúdo completo de credenciais.

## Escritas em memória (condicional)

Escreva em arquivos de memória somente quando o usuário optar explicitamente e a sessão for um workspace privado/local
(conforme `docs/reference/templates/AGENTS.md`). Caso contrário, forneça um resumo redigido e pronto para colar que o usuário pode decidir salvar em outro lugar.

Siga o formato de prompt de memória durável usado pela compactação do OpenCraft:

- Escreva notas duradouras em `memory/YYYY-MM-DD.md`.

Após cada execução de auditoria/hardening, se o usuário tiver optado, acrescente um breve resumo datado em `memory/YYYY-MM-DD.md`
(o que foi verificado, principais descobertas, ações tomadas, cron jobs agendados, decisões chave,
e todos os comandos executados). Somente adição: nunca sobrescreva entradas existentes.
Oculte detalhes sensíveis do host (nomes de usuário, hostnames, IPs, seriais, nomes de serviço, tokens).
Se houver preferências ou decisões duradouras (postura de risco, portas permitidas, política de atualização),
também atualize `MEMORY.md` (memória de longo prazo é opcional e usada apenas em sessões privadas).

Se a sessão não puder escrever no workspace, peça permissão ou forneça entradas exatas
que o usuário pode colar nos arquivos de memória.
