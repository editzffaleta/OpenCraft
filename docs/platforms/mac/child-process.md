---
summary: "Ciclo de vida do Gateway no macOS (launchd)"
read_when:
  - Integrando o app mac com o ciclo de vida do gateway
title: "Ciclo de Vida do Gateway"
---

# Ciclo de vida do Gateway no macOS

O app macOS **gerencia o Gateway via launchd** por padrão e não inicializa o
Gateway como processo filho. Ele primeiro tenta se conectar a um Gateway já em execução
na porta configurada; se nenhum estiver acessível, habilita o serviço launchd
via a CLI `opencraft` externa (sem runtime embutido). Isso fornece
auto-início confiável no login e reinicialização em caso de crashes.

O modo de processo filho (Gateway iniciado diretamente pelo app) **não está em uso** hoje.
Se você precisar de acoplamento mais estreito à UI, execute o Gateway manualmente em um terminal.

## Comportamento padrão (launchd)

- O app instala um LaunchAgent por usuário rotulado `ai.openclaw.gateway`
  (ou `ai.openclaw.<profile>` quando usando `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` legado é suportado).
- Quando o modo Local está habilitado, o app garante que o LaunchAgent está carregado e
  inicia o Gateway se necessário.
- Os logs são gravados no caminho de log do gateway launchd (visível nas Configurações de Debug).

Comandos comuns:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o label por `ai.openclaw.<profile>` quando executar um perfil nomeado.

## Builds de dev sem assinatura

`scripts/restart-mac.sh --no-sign` é para builds locais rápidos quando você não tem
chaves de assinatura. Para evitar que o launchd aponte para um binário relay sem assinatura, ele:

- Escreve `~/.opencraft/disable-launchagent`.

Execuções assinadas de `scripts/restart-mac.sh` limpam esse override se o marcador estiver
presente. Para redefinir manualmente:

```bash
rm ~/.opencraft/disable-launchagent
```

## Modo somente-anexar

Para forçar o app macOS a **nunca instalar ou gerenciar launchd**, lance-o com
`--attach-only` (ou `--no-launchd`). Isso define `~/.opencraft/disable-launchagent`,
para que o app apenas se conecte a um Gateway já em execução. Você pode alternar o mesmo
comportamento nas Configurações de Debug.

## Modo remoto

O modo remoto nunca inicia um Gateway local. O app usa um túnel SSH para o
host remoto e se conecta por esse túnel.

## Por que preferimos launchd

- Auto-início no login.
- Semântica de reinicialização/KeepAlive integrada.
- Logs e supervisão previsíveis.

Se um modo de processo filho real for necessário novamente, ele deve ser documentado como um
modo separado e explícito somente para dev.
