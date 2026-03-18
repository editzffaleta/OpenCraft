---
name: healthcheck
description: Fortalecimento de segurança do host e configuração de tolerância a riscos para implantações OpenCraft. Use quando um usuário solicitar auditorias de segurança, fortalecimento de firewall/SSH/atualizações, postura de risco, revisão de exposição, agendamento de cron do OpenCraft para verificações periódicas, ou verificações de status de versão em uma máquina executando o OpenCraft (laptop, workstation, Pi, VPS).
---

# Fortalecimento do Host OpenCraft

## Visão geral

Avalie e fortaleça o host que executa o OpenCraft, alinhando-o a uma tolerância a riscos definida pelo usuário sem interromper o acesso. Use as ferramentas de segurança do OpenCraft como sinal principal, mas trate o fortalecimento do SO como um conjunto separado e explícito de etapas.

## Regras principais

- Recomende executar esta skill com um modelo de última geração (ex.: Opus 4.5, GPT 5.2+). O agente deve verificar o modelo atual e sugerir a troca se estiver abaixo desse nível; não bloqueie a execução.
- Exija aprovação explícita antes de qualquer ação que altere o estado.
- Não modifique configurações de acesso remoto sem confirmar como o usuário se conecta.
- Prefira mudanças reversíveis e em etapas com um plano de reversão.
- Nunca afirme que o OpenCraft muda o firewall do host, SSH ou atualizações do SO; ele não faz isso.
- Se a função/identidade for desconhecida, forneça apenas recomendações.
- Formatação: cada conjunto de escolhas do usuário deve ser numerado para que o usuário possa responder com um único dígito.
- Backups no nível do sistema são recomendados; tente verificar o status.

## Fluxo de trabalho (siga em ordem)

### 0) Verificação do modelo (sem bloqueio)

Antes de começar, verifique o modelo atual. Se estiver abaixo do estado da arte (ex.: Opus 4.5, GPT 5.2+), recomende a troca. Não bloqueie a execução.

### 1) Estabelecer contexto (somente leitura)

Tente inferir 1 a 5 do ambiente antes de perguntar. Prefira perguntas simples e não técnicas se precisar de confirmação.

Determine (em ordem):

1. SO e versão (Linux/macOS/Windows), container vs host.
2. Nível de privilégio (root/admin vs usuário).
3. Caminho de acesso (console local, SSH, RDP, tailnet).
4. Exposição de rede (IP público, proxy reverso, túnel).
5. Status e endereço de bind do gateway OpenCraft.
6. Sistema de backup e status (ex.: Time Machine, imagens do sistema, snapshots).
7. Contexto de implantação (app mac local, host de gateway sem cabeça, gateway remoto, container/CI).
8. Status de criptografia do disco (FileVault/LUKS/BitLocker).
9. Status de atualizações automáticas de segurança do SO.
   Observação: esses não são itens bloqueantes, mas são altamente recomendados, especialmente se o OpenCraft puder acessar dados sensíveis.
10. Modo de uso para um assistente pessoal com acesso total (workstation local vs remoto/sem cabeça vs outro).

Primeiro peça uma vez permissão para executar verificações somente leitura. Se concedida, execute-as por padrão e faça perguntas apenas para itens que não pode inferir ou verificar. Não pergunte por informações já visíveis no runtime ou na saída dos comandos. Mantenha o pedido de permissão como uma única frase e liste as informações adicionais necessárias como uma lista não ordenada (não numerada), a menos que esteja apresentando escolhas selecionáveis.

Se precisar perguntar, use prompts não técnicos:

- "Você está usando um Mac, PC Windows ou Linux?"
- "Você está conectado diretamente na máquina, ou conectando de outro computador?"
- "Esta máquina está acessível pela internet pública, ou apenas na sua rede doméstica/local?"
- "Você tem backups ativados (ex.: Time Machine) e estão atualizados?"
- "A criptografia de disco está ativada (FileVault/BitLocker/LUKS)?"
- "As atualizações automáticas de segurança estão ativadas?"
- "Como você usa esta máquina?"
  Exemplos:
  - Máquina pessoal compartilhada com o assistente
  - Máquina local dedicada para o assistente
  - Máquina/servidor remoto dedicado acessado remotamente (sempre ligado)
  - Outra situação?

Pergunte sobre o perfil de risco apenas depois que o contexto do sistema for conhecido.

Se o usuário conceder permissão somente leitura, execute as verificações apropriadas ao SO por padrão. Se não, ofereça-as (numeradas). Exemplos:

1. SO: `uname -a`, `sw_vers`, `cat /etc/os-release`.
2. Portas em escuta:
   - Linux: `ss -ltnup` (ou `ss -ltnp` se `-u` não for suportado).
   - macOS: `lsof -nP -iTCP -sTCP:LISTEN`.
3. Status do firewall:
   - Linux: `ufw status`, `firewall-cmd --state`, `nft list ruleset` (escolha o que estiver instalado).
   - macOS: `/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate` e `pfctl -s info`.
4. Backups (macOS): `tmutil status` (se o Time Machine for usado).

### 2) Executar auditorias de segurança do OpenCraft (somente leitura)

Como parte das verificações somente leitura padrão, execute `opencraft security audit --deep`. Ofereça alternativas somente se o usuário solicitar:

1. `opencraft security audit` (mais rápido, sem probing)
2. `opencraft security audit --json` (saída estruturada)

Ofereça para aplicar os padrões seguros do OpenCraft (numerados):

1. `opencraft security audit --fix`

Seja explícito de que `--fix` apenas fortalece os padrões do OpenCraft e permissões de arquivo. Não muda o firewall do host, SSH ou políticas de atualização do SO.

Se o controle do navegador estiver ativado, recomende que a autenticação de dois fatores esteja ativada em todas as contas importantes, com chaves de hardware preferidas e SMS não sendo suficiente.

### 3) Verificar status de versão/atualização do OpenCraft (somente leitura)

Como parte das verificações somente leitura padrão, execute `opencraft update status`.

Informe o canal atual e se há uma atualização disponível.

### 4) Determinar tolerância a riscos (após contexto do sistema)

Peça ao usuário para escolher ou confirmar uma postura de risco e quaisquer serviços/portas abertas necessários (opções numeradas abaixo).
Não force perfis fixos; se o usuário preferir, capture os requisitos em vez de escolher um perfil.
Ofereça perfis sugeridos como padrões opcionais (numerados). Observe que a maioria dos usuários escolhe Home/Workstation Balanced:

1. Home/Workstation Balanced (mais comum): firewall ativado com padrões razoáveis, acesso remoto restrito à LAN ou tailnet.
2. VPS Hardened: firewall de entrada deny-by-default, portas abertas mínimas, SSH apenas com chave, sem login root, atualizações automáticas de segurança.
3. Developer Convenience: mais serviços locais permitidos, avisos explícitos de exposição, ainda auditado.
4. Custom: restrições definidas pelo usuário (serviços, exposição, cadência de atualização, métodos de acesso).

### 5) Produzir um plano de remediação

Forneça um plano que inclua:

- Perfil alvo
- Resumo da postura atual
- Lacunas em relação ao alvo
- Remediação passo a passo com comandos exatos
- Estratégia de preservação de acesso e reversão
- Riscos e possíveis cenários de bloqueio
- Notas de menor privilégio (ex.: evitar uso de admin, restringir propriedade/permissões onde for seguro)
- Notas de higiene de credenciais (localização das credenciais do OpenCraft, preferência por criptografia de disco)

Sempre mostre o plano antes de qualquer mudança.

### 6) Oferecer opções de execução

Ofereça uma dessas opções (numeradas para que os usuários possam responder com um único dígito):

1. Faça por mim (guiado, aprovações passo a passo)
2. Mostrar apenas o plano
3. Corrigir apenas problemas críticos
4. Exportar comandos para depois

### 7) Executar com confirmações

Para cada etapa:

- Mostre o comando exato
- Explique o impacto e a reversão
- Confirme que o acesso permanecerá disponível
- Pare em saída inesperada e peça orientação

### 8) Verificar e reportar

Verifique novamente:

- Status do firewall
- Portas em escuta
- Acesso remoto ainda funciona
- Auditoria de segurança do OpenCraft (re-execute)

Entregue um relatório final de postura e note quaisquer itens adiados.

## Confirmações obrigatórias (sempre)

Exija aprovação explícita para:

- Mudanças de regras do firewall
- Abrir/fechar portas
- Mudanças de configuração SSH/RDP
- Instalar/remover pacotes
- Ativar/desativar serviços
- Modificações de usuário/grupo
- Agendamento de tarefas ou persistência na inicialização
- Mudanças na política de atualização
- Acesso a arquivos sensíveis ou credenciais

Em caso de dúvida, pergunte.

## Verificações periódicas

Após a instalação do OpenCraft ou a primeira passagem de fortalecimento, execute pelo menos uma auditoria de baseline e verificação de versão:

- `opencraft security audit`
- `opencraft security audit --deep`
- `opencraft update status`

O monitoramento contínuo é recomendado. Use a ferramenta/CLI cron do OpenCraft para agendar auditorias periódicas (agendador do Gateway). Não crie tarefas agendadas sem aprovação explícita. Armazene as saídas em um local aprovado pelo usuário e evite segredos nos logs.
Ao agendar execuções cron sem cabeça, inclua uma nota na saída instruindo o usuário a chamar `healthcheck` para que os problemas possam ser corrigidos.

### Prompt obrigatório para agendar (sempre)

Após qualquer auditoria ou passagem de fortalecimento, ofereça explicitamente o agendamento e exija uma resposta direta. Use um prompt curto como (numerado):

1. "Você quer que eu agende auditorias periódicas (ex.: diárias/semanais) via `opencraft cron add`?"

Se o usuário disser sim, pergunte:

- cadência (diária/semanal), janela de horário preferida e localização da saída
- se também deve agendar `opencraft update status`

Use um nome estável para o cron job para que as atualizações sejam determinísticas. Prefira nomes exatos:

- `healthcheck:security-audit`
- `healthcheck:update-status`

Antes de criar, execute `opencraft cron list` e compare com o `name` exato. Se encontrado, use `opencraft cron edit <id> ...`.
Se não encontrado, use `opencraft cron add --name <name> ...`.

Ofereça também uma verificação periódica de versão para que o usuário possa decidir quando atualizar (numerado):

1. `opencraft update status` (preferido para checkouts de fonte e canais)
2. `npm view opencraft version` (versão npm publicada)

## Precisão dos comandos OpenCraft

Use apenas comandos e flags suportados:

- `opencraft security audit [--deep] [--fix] [--json]`
- `opencraft status` / `opencraft status --deep`
- `opencraft health --json`
- `opencraft update status`
- `opencraft cron add|list|runs|run`

Não invente flags do CLI nem implique que o OpenCraft aplica políticas de firewall/SSH do host.

## Registro e trilha de auditoria

Registre:

- Identidade e função do gateway
- ID do plano e timestamp
- Etapas aprovadas e comandos exatos
- Códigos de saída e arquivos modificados (melhor esforço)

Redija segredos. Nunca registre tokens ou conteúdo completo de credenciais.

## Escritas na memória (condicionais)

Escreva em arquivos de memória apenas quando o usuário optar explicitamente e a sessão for um workspace privado/local
(conforme `docs/reference/templates/AGENTS.md`). Caso contrário, forneça um resumo redigido e pronto para colar que o usuário
pode decidir salvar em outro lugar.

Siga o formato de prompt de memória durável usado pela compactação do OpenCraft:

- Escreva notas duradouras em `memory/YYYY-MM-DD.md`.

Após cada execução de auditoria/fortalecimento, se o opt-in for feito, acrescente um resumo curto e datado em `memory/YYYY-MM-DD.md`
(o que foi verificado, principais descobertas, ações realizadas, cron jobs agendados, decisões-chave
e todos os comandos executados). Somente adição: nunca sobrescreva entradas existentes.
Redija detalhes sensíveis do host (nomes de usuário, hostnames, IPs, seriais, nomes de serviços, tokens).
Se houver preferências ou decisões duradouras (postura de risco, portas permitidas, política de atualização),
atualize também `MEMORY.md` (memória de longo prazo é opcional e usada apenas em sessões privadas).

Se a sessão não puder gravar no workspace, peça permissão ou forneça entradas exatas
que o usuário possa colar nos arquivos de memória.
