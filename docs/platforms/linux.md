---
summary: "Suporte Linux + status do app companion"
read_when:
  - Procurando status do app companion Linux
  - Planejando cobertura de plataformas ou contribuições
title: "App Linux"
---

# App Linux

O Gateway é totalmente suportado no Linux. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway (bugs no WhatsApp/Telegram).

Apps companion nativos Linux estão planejados. Contribuições são bem-vindas se quiser ajudar a construir um.

## Caminho rápido para iniciantes (VPS)

1. Instale o Node 24 (recomendado; Node 22 LTS, atualmente `22.16+`, ainda funciona por compatibilidade)
2. `npm i -g opencraft@latest`
3. `opencraft onboard --install-daemon`
4. Do seu laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abra `http://127.0.0.1:18789/` e cole seu token

Guia passo a passo para VPS: [exe.dev](/install/exe-dev)

## Instalação

- [Primeiros Passos](/start/getting-started)
- [Instalar e atualizar](/install/updating)
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

Reparar/migrar:

```
opencraft doctor
```

## Controle do sistema (unidade de usuário systemd)

O OpenCraft instala um serviço de **usuário** systemd por padrão. Use um serviço de
**sistema** para servidores compartilhados ou sempre ligados. O exemplo completo de unidade e
orientações ficam no [Runbook do Gateway](/gateway).

Configuração mínima:

Crie `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

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

Habilite-o:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
