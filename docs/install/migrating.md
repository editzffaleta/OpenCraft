---
summary: "Mover (migrar) uma instalação do OpenCraft de uma máquina para outra"
read_when:
  - Você está movendo o OpenCraft para um novo laptop/servidor
  - Você quer preservar sessões, autenticação e logins de canais (WhatsApp, etc.)
title: "Guia de Migração"
---

# Migrando o OpenCraft para uma nova máquina

Este guia migra um Gateway OpenCraft de uma máquina para outra **sem refazer o onboarding**.

A migração é conceitualmente simples:

- Copie o **diretório de estado** (`$OPENCRAFT_STATE_DIR`, padrão: `~/.opencraft/`) - isso inclui configuração, autenticação, sessões e estado dos canais.
- Copie seu **workspace** (`~/.opencraft/workspace/` por padrão) - isso inclui seus arquivos de agente (memória, prompts, etc.).

Mas existem armadilhas comuns em torno de **perfis**, **permissões** e **cópias parciais**.

## Antes de começar (o que você está migrando)

### 1) Identifique seu diretório de estado

A maioria das instalações usa o padrão:

- **Diretório de estado:** `~/.opencraft/`

Mas pode ser diferente se você usar:

- `--profile <name>` (frequentemente se torna `~/.opencraft-<profile>/`)
- `OPENCRAFT_STATE_DIR=/some/path`

Se não tiver certeza, execute na máquina **antiga**:

```bash
opencraft status
```

Procure por menções de `OPENCRAFT_STATE_DIR` / profile na saída. Se você roda múltiplos gateways, repita para cada perfil.

### 2) Identifique seu workspace

Padrões comuns:

- `~/.opencraft/workspace/` (workspace recomendado)
- uma pasta personalizada que você criou

Seu workspace é onde ficam arquivos como `MEMORY.md`, `USER.md` e `memory/*.md`.

### 3) Entenda o que você vai preservar

Se você copiar **ambos** o diretório de estado e workspace, você mantém:

- Configuração do Gateway (`opencraft.json`)
- Perfis de autenticação / chaves de API / tokens OAuth
- Histórico de sessões + estado do agente
- Estado dos canais (ex.: login/sessão do WhatsApp)
- Seus arquivos de workspace (memória, notas de Skills, etc.)

Se você copiar **apenas** o workspace (ex.: via Git), você **não** preserva:

- sessões
- credenciais
- logins de canais

Esses ficam em `$OPENCRAFT_STATE_DIR`.

## Etapas de migração (recomendado)

### Etapa 0 - Fazer backup (máquina antiga)

Na máquina **antiga**, pare o gateway primeiro para que os arquivos não mudem durante a cópia:

```bash
opencraft gateway stop
```

(Opcional, mas recomendado) arquive o diretório de estado e workspace:

```bash
# Ajuste os caminhos se você usar um perfil ou localizações personalizadas
cd ~
tar -czf opencraft-state.tgz .opencraft

tar -czf opencraft-workspace.tgz .opencraft/workspace
```

Se você tem múltiplos perfis/diretórios de estado (ex.: `~/.opencraft-main`, `~/.opencraft-work`), arquive cada um.

### Etapa 1 - Instalar o OpenCraft na nova máquina

Na máquina **nova**, instale o CLI (e Node.js se necessário):

- Veja: [Instalação](/install)

Nesta etapa, está ok se o onboarding criar um `~/.opencraft/` novo - você vai sobrescrevê-lo no próximo passo.

### Etapa 2 - Copiar o diretório de estado + workspace para a nova máquina

Copie **ambos**:

- `$OPENCRAFT_STATE_DIR` (padrão `~/.opencraft/`)
- seu workspace (padrão `~/.opencraft/workspace/`)

Abordagens comuns:

- `scp` os tarballs e extrair
- `rsync -a` via SSH
- drive externo

Após copiar, certifique-se de que:

- Diretórios ocultos foram incluídos (ex.: `.opencraft/`)
- A propriedade dos arquivos está correta para o usuário que executa o gateway

### Etapa 3 - Executar Doctor (migrações + reparo de serviço)

Na máquina **nova**:

```bash
opencraft doctor
```

Doctor é o comando "seguro e simples". Ele repara serviços, aplica migrações de configuração e avisa sobre incompatibilidades.

Depois:

```bash
opencraft gateway restart
opencraft status
```

## Armadilhas comuns (e como evitá-las)

### Armadilha: incompatibilidade de perfil / diretório de estado

Se você rodou o gateway antigo com um perfil (ou `OPENCRAFT_STATE_DIR`), e o novo gateway usa um diferente, você verá sintomas como:

- mudanças de configuração não tendo efeito
- canais faltando / deslogados
- histórico de sessões vazio

Correção: execute o gateway/serviço usando o **mesmo** perfil/diretório de estado que você migrou, depois execute novamente:

```bash
opencraft doctor
```

### Armadilha: copiar apenas `opencraft.json`

`opencraft.json` não é suficiente. Muitos provedores armazenam estado em:

- `$OPENCRAFT_STATE_DIR/credentials/`
- `$OPENCRAFT_STATE_DIR/agents/<agentId>/...`

Sempre migre a pasta `$OPENCRAFT_STATE_DIR` inteira.

### Armadilha: permissões / propriedade

Se você copiou como root ou mudou de usuário, o gateway pode falhar ao ler credenciais/sessões.

Correção: certifique-se de que o diretório de estado + workspace pertencem ao usuário que executa o gateway.

### Armadilha: migrando entre modos remoto/local

- Se sua UI (WebUI/TUI) aponta para um gateway **remoto**, o host remoto é dono do armazenamento de sessões + workspace.
- Migrar seu laptop não move o estado do gateway remoto.

Se você está em modo remoto, migre o **host do gateway**.

### Armadilha: secrets em backups

`$OPENCRAFT_STATE_DIR` contém secrets (chaves de API, tokens OAuth, credenciais do WhatsApp). Trate backups como secrets de produção:

- armazene criptografado
- evite compartilhar por canais inseguros
- rotacione chaves se suspeitar de exposição

## Lista de verificação

Na nova máquina, confirme:

- `opencraft status` mostra o gateway rodando
- Seus canais ainda estão conectados (ex.: WhatsApp não requer re-pareamento)
- O dashboard abre e mostra sessões existentes
- Seus arquivos de workspace (memória, configs) estão presentes

## Relacionado

- [Doctor](/gateway/doctor)
- [Solução de problemas do Gateway](/gateway/troubleshooting)
- [Onde o OpenCraft armazena seus dados?](/help/faq#where-does-opencraft-store-its-data)
