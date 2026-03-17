---
summary: "Ciclo de vida do Gateway no macOS (launchd)"
read_when:
  - Integrando o aplicativo macOS com o ciclo de vida do Gateway
title: "Ciclo de Vida do Gateway"
---

# Ciclo de vida do Gateway no macOS

O aplicativo macOS **gerencia o Gateway via launchd** por padrão e não gera
o Gateway como um processo filho. Ele primeiro tenta se conectar a um Gateway já em
execução na porta configurada; se nenhum estiver acessível, ele ativa o serviço launchd
via a CLI `opencraft` externa (sem tempo de execução incorporado). Isso oferece
inicialização automática confiável no login e reinicialização em caso de falhas.

O modo de processo filho (Gateway gerado diretamente pelo aplicativo) **não está em uso** hoje.
Se você precisar de acoplamento mais forte com a UI, execute o Gateway manualmente em um terminal.

## Comportamento padrão (launchd)

- O aplicativo instala um LaunchAgent por usuário rotulado como `ai.opencraft.gateway`
  (ou `ai.opencraft.<profile>` ao usar `--profile`/`OPENCRAFT_PROFILE`; o legado `com.opencraft.*` é suportado).
- Quando o modo Local está ativado, o aplicativo garante que o LaunchAgent esteja carregado e
  inicia o Gateway se necessário.
- Os logs são escritos no caminho de log do Gateway do launchd (visível nas Configurações de Depuração).

Comandos comuns:

```bash
launchctl kickstart -k gui/$UID/ai.opencraft.gateway
launchctl bootout gui/$UID/ai.opencraft.gateway
```

Substitua o rótulo por `ai.opencraft.<profile>` ao executar um perfil nomeado.

## Builds de desenvolvimento não assinados

`scripts/restart-mac.sh --no-sign` é para builds locais rápidos quando você não tem
chaves de assinatura. Para evitar que o launchd aponte para um binário relay não assinado, ele:

- Escreve `~/.opencraft/disable-launchagent`.

Execuções assinadas de `scripts/restart-mac.sh` limpam essa substituição se o marcador
estiver presente. Para redefinir manualmente:

```bash
rm ~/.opencraft/disable-launchagent
```

## Modo somente conexão

Para forçar o aplicativo macOS a **nunca instalar ou gerenciar o launchd**, inicie-o com
`--attach-only` (ou `--no-launchd`). Isso define `~/.opencraft/disable-launchagent`,
então o aplicativo apenas se conecta a um Gateway já em execução. Você pode alternar o mesmo
comportamento nas Configurações de Depuração.

## Modo remoto

O modo remoto nunca inicia um Gateway local. O aplicativo usa um túnel SSH para o
host remoto e se conecta através desse túnel.

## Por que preferimos launchd

- Inicialização automática no login.
- Semântica de reinicialização/KeepAlive integrada.
- Logs e supervisão previsíveis.

Se um verdadeiro modo de processo filho for necessário novamente, ele deve ser documentado como um
modo separado, explicitamente apenas para desenvolvimento.
