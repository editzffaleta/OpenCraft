---
summary: "Execute o OpenCraft em um contêiner Podman rootless"
read_when:
  - Você quer um gateway containerizado com Podman ao invés de Docker
title: "Podman"
---

# Podman

Execute o gateway OpenCraft em um contêiner **rootless** Podman. Usa a mesma imagem do Docker (construída a partir do [Dockerfile](https://github.com/editzffaleta/OpenCraft/blob/main/Dockerfile) do repositório).

## Requisitos

- Podman (rootless)
- Sudo para configuração única (criar usuário, construir imagem)

## Início rápido

**1. Configuração única** (da raiz do repositório; cria usuário, constrói imagem, instala script de inicialização):

```bash
./setup-podman.sh
```

Isso também cria um `~opencraft/.editzffaleta/OpenCraft.json` mínimo (define `gateway.mode="local"`) para que o gateway possa iniciar sem executar o wizard.

Por padrão o contêiner **não** é instalado como serviço systemd, você o inicia manualmente (veja abaixo). Para uma configuração estilo produção com auto-start e reinicializações, instale-o como serviço de usuário systemd Quadlet:

```bash
./setup-podman.sh --quadlet
```

(Ou defina `OPENCRAFT_PODMAN_QUADLET=1`; use `--container` para instalar apenas o contêiner e o script de inicialização.)

Variáveis de ambiente opcionais em tempo de build (defina antes de executar `setup-podman.sh`):

- `OPENCRAFT_DOCKER_APT_PACKAGES` - instalar pacotes apt extras durante o build da imagem
- `OPENCRAFT_EXTENSIONS` - pré-instalar dependências de extensões (nomes de extensões separados por espaço, ex.: `diagnostics-otel matrix`)

**2. Iniciar gateway** (manual, para teste rápido):

```bash
./scripts/run-opencraft-podman.sh launch
```

**3. Wizard de onboarding** (ex.: para adicionar canais ou provedores):

```bash
./scripts/run-opencraft-podman.sh launch setup
```

Depois abra `http://127.0.0.1:18789/` e use o token de `~opencraft/.opencraft/.env` (ou o valor impresso pelo setup).

## Systemd (Quadlet, opcional)

Se você executou `./setup-podman.sh --quadlet` (ou `OPENCRAFT_PODMAN_QUADLET=1`), uma unidade [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) é instalada para que o gateway rode como serviço de usuário systemd para o usuário opencraft. O serviço é habilitado e iniciado ao final do setup.

- **Iniciar:** `sudo systemctl --machine opencraft@ --user start opencraft.service`
- **Parar:** `sudo systemctl --machine opencraft@ --user stop opencraft.service`
- **Status:** `sudo systemctl --machine opencraft@ --user status opencraft.service`
- **Logs:** `sudo journalctl --machine opencraft@ --user -u opencraft.service -f`

O arquivo quadlet fica em `~opencraft/.config/containers/systemd/opencraft.container`. Para mudar portas ou env, edite esse arquivo (ou o `.env` que ele usa como source), depois `sudo systemctl --machine opencraft@ --user daemon-reload` e reinicie o serviço. No boot, o serviço inicia automaticamente se lingering estiver habilitado para opencraft (o setup faz isso quando loginctl está disponível).

Para adicionar quadlet **após** um setup inicial que não o usou, execute novamente: `./setup-podman.sh --quadlet`.

## O usuário opencraft (non-login)

`setup-podman.sh` cria um usuário dedicado do sistema `opencraft`:

- **Shell:** `nologin` - sem login interativo; reduz superfície de ataque.
- **Home:** ex.: `/home/opencraft` - contém `~/.opencraft` (config, workspace) e o script de inicialização `run-opencraft-podman.sh`.
- **Podman rootless:** O usuário deve ter um range de **subuid** e **subgid**. Muitas distros atribuem estes automaticamente quando o usuário é criado. Se o setup imprimir um aviso, adicione linhas em `/etc/subuid` e `/etc/subgid`:

  ```text
  opencraft:100000:65536
  ```

  Depois inicie o gateway como esse usuário (ex.: via cron ou systemd):

  ```bash
  sudo -u opencraft /home/opencraft/run-opencraft-podman.sh
  sudo -u opencraft /home/opencraft/run-opencraft-podman.sh setup
  ```

- **Config:** Apenas `opencraft` e root podem acessar `/home/opencraft/.opencraft`. Para editar config: use a Control UI quando o gateway estiver rodando, ou `sudo -u opencraft $EDITOR /home/opencraft/.editzffaleta/OpenCraft.json`.

## Ambiente e configuração

- **Token:** Armazenado em `~opencraft/.opencraft/.env` como `OPENCLAW_GATEWAY_TOKEN`. `setup-podman.sh` e `run-opencraft-podman.sh` geram-no se estiver faltando (usa `openssl`, `python3` ou `od`).
- **Opcional:** Nesse `.env` você pode definir chaves de provedor (ex.: `GROQ_API_KEY`, `OLLAMA_API_KEY`) e outras variáveis de ambiente do OpenCraft.
- **Portas do host:** Por padrão o script mapeia `18789` (gateway) e `18790` (bridge). Sobrescreva o mapeamento de porta do **host** com `OPENCRAFT_PODMAN_GATEWAY_HOST_PORT` e `OPENCRAFT_PODMAN_BRIDGE_HOST_PORT` ao iniciar.
- **Bind do Gateway:** Por padrão, `run-opencraft-podman.sh` inicia o gateway com `--bind loopback` para acesso local seguro. Para expor na LAN, defina `OPENCRAFT_GATEWAY_BIND=lan` e configure `gateway.controlUi.allowedOrigins` (ou habilite explicitamente fallback de host-header) em `opencraft.json`.
- **Caminhos:** Config e workspace do host padrão são `~opencraft/.opencraft` e `~opencraft/.opencraft/workspace`. Sobrescreva os caminhos do host usados pelo script de inicialização com `OPENCRAFT_CONFIG_DIR` e `OPENCRAFT_WORKSPACE_DIR`.

## Modelo de armazenamento

- **Dados persistentes do host:** `OPENCRAFT_CONFIG_DIR` e `OPENCRAFT_WORKSPACE_DIR` são bind-mounted no contêiner e retêm estado no host.
- **Tmpfs sandbox efêmero:** se você habilitar `agents.defaults.sandbox`, os contêineres sandbox de ferramentas montam `tmpfs` em `/tmp`, `/var/tmp` e `/run`. Esses caminhos são baseados em memória e desaparecem com o contêiner sandbox; a configuração do contêiner Podman de nível superior não adiciona suas próprias montagens tmpfs.
- **Pontos de crescimento de disco:** os principais caminhos a monitorar são `media/`, `agents/<agentId>/sessions/sessions.json`, arquivos JSONL de transcrição, `cron/runs/*.jsonl` e logs de arquivo rotativos em `/tmp/opencraft/` (ou seu `logging.file` configurado).

`setup-podman.sh` agora prepara o tar da imagem em um diretório temporário privado e imprime o diretório base escolhido durante o setup. Para execuções não-root ele aceita `TMPDIR` apenas quando essa base é segura para uso; caso contrário ele faz fallback para `/var/tmp`, depois `/tmp`. O tar salvo fica com permissão apenas do proprietário e é transmitido via stream para o `podman load` do usuário alvo, para que diretórios temp privados do chamador não bloqueiem o setup.

## Comandos úteis

- **Logs:** Com quadlet: `sudo journalctl --machine opencraft@ --user -u opencraft.service -f`. Com script: `sudo -u opencraft podman logs -f opencraft`
- **Parar:** Com quadlet: `sudo systemctl --machine opencraft@ --user stop opencraft.service`. Com script: `sudo -u opencraft podman stop opencraft`
- **Iniciar novamente:** Com quadlet: `sudo systemctl --machine opencraft@ --user start opencraft.service`. Com script: reexecute o script de inicialização ou `podman start opencraft`
- **Remover contêiner:** `sudo -u opencraft podman rm -f opencraft` - config e workspace no host são mantidos

## Solução de problemas

- **Permissão negada (EACCES) em config ou auth-profiles:** O contêiner usa `--userns=keep-id` por padrão e roda com o mesmo uid/gid do usuário host que executa o script. Certifique-se de que seus `OPENCRAFT_CONFIG_DIR` e `OPENCRAFT_WORKSPACE_DIR` no host pertencem a esse usuário.
- **Início do Gateway bloqueado (faltando `gateway.mode=local`):** Certifique-se de que `~opencraft/.editzffaleta/OpenCraft.json` existe e define `gateway.mode="local"`. `setup-podman.sh` cria este arquivo se estiver faltando.
- **Podman rootless falha para o usuário opencraft:** Verifique se `/etc/subuid` e `/etc/subgid` contêm uma linha para `opencraft` (ex.: `opencraft:100000:65536`). Adicione se estiver faltando e reinicie.
- **Nome do contêiner em uso:** O script de inicialização usa `podman run --replace`, então o contêiner existente é substituído quando você inicia novamente. Para limpar manualmente: `podman rm -f opencraft`.
- **Script não encontrado ao executar como opencraft:** Certifique-se de que `setup-podman.sh` foi executado para que `run-opencraft-podman.sh` seja copiado para o home do opencraft (ex.: `/home/opencraft/run-opencraft-podman.sh`).
- **Serviço quadlet não encontrado ou falha ao iniciar:** Execute `sudo systemctl --machine opencraft@ --user daemon-reload` após editar o arquivo `.container`. Quadlet requer cgroups v2: `podman info --format '{{.Host.CgroupsVersion}}'` deve mostrar `2`.

## Opcional: executar como seu próprio usuário

Para executar o gateway como seu usuário normal (sem usuário opencraft dedicado): construa a imagem, crie `~/.opencraft/.env` com `OPENCLAW_GATEWAY_TOKEN`, e execute o contêiner com `--userns=keep-id` e montagens para seu `~/.opencraft`. O script de inicialização é projetado para o fluxo do usuário opencraft; para uma configuração de usuário único você pode executar o comando `podman run` do script manualmente, apontando config e workspace para seu home. Recomendado para a maioria dos usuários: use `setup-podman.sh` e execute como o usuário opencraft para que config e processo fiquem isolados.
