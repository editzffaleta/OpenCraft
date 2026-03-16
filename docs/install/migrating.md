---
summary: "Mover (migrar) uma instalação do OpenCraft de uma máquina para outra"
read_when:
  - Você está movendo o OpenCraft para um novo laptop/servidor
  - Você quer preservar sessões, auth e logins de canal (WhatsApp, etc.)
title: "Guia de Migração"
---

# Migrando o OpenCraft para uma nova máquina

Este guia migra um Gateway do OpenCraft de uma máquina para outra **sem refazer o onboarding**.

A migração é conceitualmente simples:

- Copie o **diretório de estado** (`$OPENCLAW_STATE_DIR`, padrão: `~/.opencraft/`) — isso inclui config, auth, sessões e estado de canal.
- Copie seu **workspace** (`~/.opencraft/workspace/` por padrão) — isso inclui seus arquivos de agente (memória, prompts, etc.).

Mas há armadilhas comuns em torno de **perfis**, **permissões** e **cópias parciais**.

## Antes de começar (o que você está migrando)

### 1) Identifique seu diretório de estado

A maioria das instalações usa o padrão:

- **Diretório de estado:** `~/.opencraft/`

Mas pode ser diferente se você usa:

- `--profile <name>` (frequentemente se torna `~/.opencraft-<profile>/`)
- `OPENCLAW_STATE_DIR=/some/path`

Se não tiver certeza, execute na máquina **antiga**:

```bash
opencraft status
```

Procure por menções de `OPENCLAW_STATE_DIR` / perfil na saída. Se você executa múltiplos gateways, repita para cada perfil.

### 2) Identifique seu workspace

Padrões comuns:

- `~/.opencraft/workspace/` (workspace recomendado)
- uma pasta personalizada que você criou

Seu workspace é onde ficam arquivos como `MEMORY.md`, `USER.md` e `memory/*.md`.

### 3) Entenda o que você vai preservar

Se você copiar **tanto** o diretório de estado quanto o workspace, você mantém:

- Configuração do Gateway (`opencraft.json`)
- Perfis de auth / chaves de API / tokens OAuth
- Histórico de sessão + estado do agente
- Estado de canal (ex.: login/sessão do WhatsApp)
- Seus arquivos de workspace (memória, notas de skills, etc.)

Se você copiar **apenas** o workspace (ex.: via Git), você **não** preserva:

- sessões
- credenciais
- logins de canal

Esses ficam em `$OPENCLAW_STATE_DIR`.

## Etapas de migração (recomendado)

### Etapa 0 — Faça um backup (máquina antiga)

Na máquina **antiga**, pare o gateway primeiro para que os arquivos não estejam mudando durante a cópia:

```bash
opencraft gateway stop
```

(Opcional mas recomendado) arquive o diretório de estado e workspace:

```bash
# Ajuste os caminhos se você usa um perfil ou locais personalizados
cd ~
tar -czf opencraft-state.tgz .opencraft

tar -czf opencraft-workspace.tgz .opencraft/workspace
```

Se você tiver múltiplos perfis/diretórios de estado (ex.: `~/.opencraft-main`, `~/.opencraft-work`), arquive cada um.

### Etapa 1 — Instale o OpenCraft na nova máquina

Na máquina **nova**, instale o CLI (e o Node se necessário):

- Veja: [Instalação](/install)

Neste ponto, tudo bem se o onboarding criar um `~/.opencraft/` novo — você irá sobrescrevê-lo na próxima etapa.

### Etapa 2 — Copie o diretório de estado + workspace para a nova máquina

Copie **ambos**:

- `$OPENCLAW_STATE_DIR` (padrão `~/.opencraft/`)
- seu workspace (padrão `~/.opencraft/workspace/`)

Abordagens comuns:

- `scp` os tarballs e extraia
- `rsync -a` via SSH
- unidade externa

Após copiar, certifique-se de:

- Diretórios ocultos foram incluídos (ex.: `.opencraft/`)
- A propriedade dos arquivos está correta para o usuário que executa o gateway

### Etapa 3 — Execute o Doctor (migrações + reparo de serviço)

Na máquina **nova**:

```bash
opencraft doctor
```

O Doctor é o comando "seguro e tedioso". Ele repara serviços, aplica migrações de config e avisa sobre incompatibilidades.

Em seguida:

```bash
opencraft gateway restart
opencraft status
```

## Armadilhas comuns (e como evitá-las)

### Armadilha: incompatibilidade de perfil / diretório de estado

Se você executou o gateway antigo com um perfil (ou `OPENCLAW_STATE_DIR`), e o novo gateway usa um diferente, você verá sintomas como:

- mudanças de config não tendo efeito
- canais ausentes / desconectados
- histórico de sessão vazio

Correção: execute o gateway/serviço usando o **mesmo** perfil/diretório de estado que você migrou, depois execute novamente:

```bash
opencraft doctor
```

### Armadilha: copiar apenas `opencraft.json`

`opencraft.json` não é suficiente. Muitos provedores armazenam estado em:

- `$OPENCLAW_STATE_DIR/credentials/`
- `$OPENCLAW_STATE_DIR/agents/<agentId>/...`

Sempre migre a pasta `$OPENCLAW_STATE_DIR` inteira.

### Armadilha: permissões / propriedade

Se você copiou como root ou mudou de usuário, o gateway pode falhar ao ler credenciais/sessões.

Correção: certifique-se de que o diretório de estado + workspace são de propriedade do usuário que executa o gateway.

### Armadilha: migrando entre modos remoto/local

- Se sua UI (WebUI/TUI) aponta para um gateway **remoto**, o host remoto possui o armazenamento de sessão + workspace.
- Migrar seu laptop não irá mover o estado do gateway remoto.

Se você está no modo remoto, migre o **host do gateway**.

### Armadilha: segredos em backups

`$OPENCLAW_STATE_DIR` contém segredos (chaves de API, tokens OAuth, credenciais do WhatsApp). Trate backups como segredos de produção:

- armazene criptografados
- evite compartilhar por canais inseguros
- rotacione chaves se suspeitar de exposição

## Lista de verificação de verificação

Na nova máquina, confirme:

- `opencraft status` mostra o gateway em execução
- Seus canais ainda estão conectados (ex.: WhatsApp não requer novo pareamento)
- O dashboard abre e mostra sessões existentes
- Seus arquivos de workspace (memória, configs) estão presentes

## Relacionados

- [Doctor](/gateway/doctor)
- [Solução de problemas do Gateway](/gateway/troubleshooting)
- [Onde o OpenCraft armazena seus dados?](/help/faq#where-does-openclaw-store-its-data)
