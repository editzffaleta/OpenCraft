---
summary: "Rodar o OpenCraft em um container Podman rootless"
read_when:
  - Você quer um gateway em container com Podman em vez de Docker
title: "Podman"
---

# Podman

Rode o gateway OpenCraft em um container Podman **rootless**. Usa a mesma imagem do Docker (compilada a partir do [Dockerfile](https://github.com/openclaw/openclaw/blob/main/Dockerfile) do repositório).

## Requisitos

- Podman (rootless)
- Sudo para configuração única (criar usuário, construir imagem)

## Início rápido

**1. Configuração única** (a partir da raiz do repositório; cria usuário, constrói imagem, instala script de inicialização):

```bash
./setup-podman.sh
```

Isso também cria um `~opencraft/.opencraft/opencraft.json` mínimo (define `gateway.mode="local"`) para que o gateway possa iniciar sem executar o wizard.

Por padrão o container **não** é instalado como serviço systemd, você o inicia manualmente (veja abaixo). Para uma configuração estilo produção com auto-start e reinicializações, instale-o como um serviço de usuário Quadlet systemd:

```bash
./setup-podman.sh --quadlet
```

(Ou defina `OPENCLAW_PODMAN_QUADLET=1`; use `--container` para instalar apenas o container e o script de inicialização.)

Variáveis de ambiente opcionais no momento do build (defina antes de executar `setup-podman.sh`):

- `OPENCLAW_DOCKER_APT_PACKAGES` — instalar pacotes apt extras durante a construção da imagem
- `OPENCLAW_EXTENSIONS` — pré-instalar dependências de extensões (nomes de extensões separados por espaço, ex.: `diagnostics-otel matrix`)

**2. Iniciar gateway** (manual, para testes rápidos):

```bash
./scripts/run-openclaw-podman.sh launch
```

**3. Wizard de onboarding** (ex.: para adicionar canais ou provedores):

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Depois abra `http://127.0.0.1:18789/` e use o token de `~opencraft/.opencraft/.env` (ou o valor impresso pelo setup).

## Systemd (Quadlet, opcional)

Se você executou `./setup-podman.sh --quadlet` (ou `OPENCLAW_PODMAN_QUADLET=1`), uma unidade [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) é instalada para que o gateway rode como serviço de usuário systemd para o usuário opencraft. O serviço é habilitado e iniciado ao final do setup.

- **Iniciar:** `sudo systemctl --machine opencraft@ --user start opencraft.service`
- **Parar:** `sudo systemctl --machine opencraft@ --user stop opencraft.service`
- **Status:** `sudo systemctl --machine opencraft@ --user status opencraft.service`
- **Logs:** `sudo journalctl --machine opencraft@ --user -u opencraft.service -f`

O arquivo quadlet fica em `~opencraft/.config/containers/systemd/opencraft.container`. Para mudar portas ou env, edite esse arquivo (ou o `.env` que ele importa), depois `sudo systemctl --machine opencraft@ --user daemon-reload` e reinicie o serviço. Na inicialização, o serviço começa automaticamente se o lingering estiver habilitado para opencraft (o setup faz isso quando loginctl está disponível).

Para adicionar quadlet **depois** de uma configuração inicial que não o usou, execute novamente: `./setup-podman.sh --quadlet`.

## O usuário opencraft (sem login)

`setup-podman.sh` cria um usuário de sistema dedicado `opencraft`:

- **Shell:** `nologin` — sem login interativo; reduz a superfície de ataque.
- **Home:** ex.: `/home/opencraft` — contém `~/.opencraft` (config, workspace) e o script de inicialização `run-openclaw-podman.sh`.
- **Podman rootless:** O usuário deve ter um intervalo **subuid** e **subgid**. Muitas distros atribuem automaticamente quando o usuário é criado. Se o setup exibir um aviso, adicione linhas em `/etc/subuid` e `/etc/subgid`:

  ```text
  opencraft:100000:65536
  ```

  Depois inicie o gateway como esse usuário (ex.: via cron ou systemd):

  ```bash
  sudo -u opencraft /home/opencraft/run-openclaw-podman.sh
  sudo -u opencraft /home/opencraft/run-openclaw-podman.sh setup
  ```

- **Config:** Apenas `opencraft` e root podem acessar `/home/opencraft/.opencraft`. Para editar a config: use a UI de Controle quando o gateway estiver rodando, ou `sudo -u opencraft $EDITOR /home/opencraft/.opencraft/opencraft.json`.

## Ambiente e config

- **Token:** Armazenado em `~opencraft/.opencraft/.env` como `OPENCLAW_GATEWAY_TOKEN`. `setup-podman.sh` e `run-openclaw-podman.sh` o geram se ausente (usa `openssl`, `python3` ou `od`).
- **Opcional:** Nesse `.env` você pode definir chaves de provedor (ex.: `GROQ_API_KEY`, `OLLAMA_API_KEY`) e outras variáveis de ambiente do OpenCraft.
- **Portas no host:** Por padrão o script mapeia `18789` (gateway) e `18790` (bridge). Sobrescreva o mapeamento de porta do **host** com `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` e `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` ao iniciar.
- **Bind do gateway:** Por padrão, `run-openclaw-podman.sh` inicia o gateway com `--bind loopback` para acesso local seguro. Para expor na LAN, defina `OPENCLAW_GATEWAY_BIND=lan` e configure `gateway.controlUi.allowedOrigins` (ou habilite explicitamente o fallback de host-header) em `opencraft.json`.
- **Caminhos:** Config e workspace do host padrão para `~opencraft/.opencraft` e `~opencraft/.opencraft/workspace`. Sobrescreva os caminhos do host usados pelo script de inicialização com `OPENCLAW_CONFIG_DIR` e `OPENCLAW_WORKSPACE_DIR`.

## Modelo de armazenamento

- **Dados persistentes no host:** `OPENCLAW_CONFIG_DIR` e `OPENCLAW_WORKSPACE_DIR` são montados por bind no container e retêm estado no host.
- **Sandbox tmpfs efêmero:** se você habilitar `agents.defaults.sandbox`, os containers sandbox de ferramentas montam `tmpfs` em `/tmp`, `/var/tmp` e `/run`. Esses caminhos são respaldados pela memória e desaparecem com o container sandbox; a configuração top-level do Podman não adiciona seus próprios mounts tmpfs.
- **Pontos de crescimento de disco:** os principais caminhos a monitorar são `media/`, `agents/<agentId>/sessions/sessions.json`, arquivos JSONL de transcrição, `cron/runs/*.jsonl` e logs de arquivo rotativo em `/tmp/opencraft/` (ou seu `logging.file` configurado).

`setup-podman.sh` agora armazena o tar da imagem em um diretório temporário privado e imprime o diretório base escolhido durante o setup. Para execuções não-root aceita `TMPDIR` apenas quando essa base é segura para uso; caso contrário recorre a `/var/tmp`, depois `/tmp`. O tar salvo fica como proprietário-only e é transmitido para o `podman load` do usuário alvo, para que diretórios temporários privados do chamador não bloqueiem o setup.

## Comandos úteis

- **Logs:** Com quadlet: `sudo journalctl --machine opencraft@ --user -u opencraft.service -f`. Com script: `sudo -u opencraft podman logs -f opencraft`
- **Parar:** Com quadlet: `sudo systemctl --machine opencraft@ --user stop opencraft.service`. Com script: `sudo -u opencraft podman stop opencraft`
- **Iniciar novamente:** Com quadlet: `sudo systemctl --machine opencraft@ --user start opencraft.service`. Com script: reexecute o script de inicialização ou `podman start opencraft`
- **Remover container:** `sudo -u opencraft podman rm -f opencraft` — config e workspace no host são mantidos

## Solução de problemas

- **Permissão negada (EACCES) na config ou auth-profiles:** O container padrão usa `--userns=keep-id` e roda como o mesmo uid/gid do usuário host que executa o script. Certifique-se de que seu `OPENCLAW_CONFIG_DIR` e `OPENCLAW_WORKSPACE_DIR` no host são de propriedade desse usuário.
- **Inicialização do gateway bloqueada (falta `gateway.mode=local`):** Certifique-se de que `~opencraft/.opencraft/opencraft.json` existe e define `gateway.mode="local"`. `setup-podman.sh` cria este arquivo se ausente.
- **Podman rootless falha para usuário opencraft:** Verifique se `/etc/subuid` e `/etc/subgid` contêm uma linha para `opencraft` (ex.: `opencraft:100000:65536`). Adicione se ausente e reinicie.
- **Nome do container em uso:** O script de inicialização usa `podman run --replace`, então o container existente é substituído ao iniciar novamente. Para limpar manualmente: `podman rm -f opencraft`.
- **Script não encontrado ao rodar como opencraft:** Certifique-se de que `setup-podman.sh` foi executado para que `run-openclaw-podman.sh` seja copiado para o home do opencraft (ex.: `/home/opencraft/run-openclaw-podman.sh`).
- **Serviço quadlet não encontrado ou falha ao iniciar:** Execute `sudo systemctl --machine opencraft@ --user daemon-reload` após editar o arquivo `.container`. O Quadlet requer cgroups v2: `podman info --format '{{.Host.CgroupsVersion}}'` deve mostrar `2`.

## Opcional: rodar como seu próprio usuário

Para rodar o gateway como seu usuário normal (sem usuário opencraft dedicado): construa a imagem, crie `~/.opencraft/.env` com `OPENCLAW_GATEWAY_TOKEN` e rode o container com `--userns=keep-id` e mounts para seu `~/.opencraft`. O script de inicialização foi projetado para o fluxo com usuário opencraft; para uma configuração de usuário único você pode executar o comando `podman run` do script manualmente, apontando config e workspace para seu home. Recomendado para a maioria dos usuários: use `setup-podman.sh` e rode como usuário opencraft para que config e processo fiquem isolados.
