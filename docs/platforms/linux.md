---
summary: "Suporte do Linux + status do aplicativo complementar"
read_when:
  - Procurando por status do aplicativo complementar do Linux
  - Planejando cobertura de plataforma ou contribuições
title: "Aplicativo Linux"
---

# Aplicativo Linux

O Gateway é totalmente suportado no Linux. **Node é o tempo de execução recomendado**.
Bun não é recomendado para o Gateway (bugs do WhatsApp/Telegram).

Aplicativos complementares nativos do Linux estão planejados. Contribuições são bem-vindas se você quiser ajudar a construir um.

## Caminho rápido para iniciantes (VPS)

1. Instale Node 24 (recomendado; Node 22 LTS, atualmente `22.16+`, ainda funciona para compatibilidade)
2. `npm i -g opencraft@latest`
3. `opencraft onboard --install-daemon`
4. Do seu laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abra `http://127.0.0.1:18789/` e cole seu token

Guia VPS passo a passo: [exe.dev](/install/exe-dev)

## Instalar

- [Guia de Introdução](/start/getting-started)
- [Instalar & atualizações](/install/updating)
- Fluxos opcionais: [Bun (experimental)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Runbook do Gateway](/gateway)
- [Configuração](/gateway/configuration)

## Instalação do serviço Gateway (CLI)

Use um destes:

```
opencraft onboard --install-daemon
```

Ou:

```
opencraft gateway install
```

Ou:

```
opencraft configure
```

Selecione **Gateway service** quando solicitado.

Reparo/migração:

```
opencraft doctor
```

## Controle de sistema (unidade de usuário systemd)

OpenCraft instala um serviço **usuário** systemd por padrão. Use um serviço **sistema**
para servidores compartilhados ou sempre ativados. O exemplo de unidade completo e a orientação
vivem no [Runbook do Gateway](/gateway).

Configuração mínima:

Crie `~/.config/systemd/user/opencraft-gateway[-<profile>].service`:

```
[Unit]
Description=OpenCraft Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/opencraft gateway --port 18789
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

Ative-o:

```
systemctl --user enable --now opencraft-gateway[-<profile>].service
```
