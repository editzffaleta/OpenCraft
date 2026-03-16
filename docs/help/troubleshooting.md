---
summary: "Hub de solução de problemas com abordagem baseada em sintomas para o OpenCraft"
read_when:
  - O OpenCraft não está funcionando e você precisa do caminho mais rápido para uma correção
  - Você quer um fluxo de triagem antes de mergulhar em runbooks detalhados
title: "Solução de Problemas"
---

# Solução de Problemas

Se você tem apenas 2 minutos, use esta página como ponto de entrada de triagem.

## Primeiros 60 segundos

Execute exatamente esta sequência em ordem:

```bash
opencraft status
opencraft status --all
opencraft gateway probe
opencraft gateway status
opencraft doctor
opencraft channels status --probe
opencraft logs --follow
```

Boa saída em uma linha:

- `opencraft status` → mostra canais configurados e sem erros de auth óbvios.
- `opencraft status --all` → relatório completo presente e compartilhável.
- `opencraft gateway probe` → alvo esperado do gateway é alcançável (`Reachable: yes`). `RPC: limited - missing scope: operator.read` é diagnóstico degradado, não falha de conexão.
- `opencraft gateway status` → `Runtime: running` e `RPC probe: ok`.
- `opencraft doctor` → sem erros de config/serviço bloqueadores.
- `opencraft channels status --probe` → canais reportam `connected` ou `ready`.
- `opencraft logs --follow` → atividade constante, sem erros fatais repetidos.

## Anthropic contexto longo 429

Se você vir:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
vá para [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Falha na instalação do plugin com extensões opencraft ausentes

Se a instalação falhar com `package.json missing openclaw.extensions`, o pacote do plugin
está usando um formato antigo que o OpenCraft não aceita mais.

Correção no pacote do plugin:

1. Adicione `openclaw.extensions` ao `package.json`.
2. Aponte as entradas para arquivos de runtime compilados (geralmente `./dist/index.js`).
3. Republique o plugin e execute `opencraft plugins install <npm-spec>` novamente.

Exemplo:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Referência: [/tools/plugin#distribution-npm](/tools/plugin#distribution-npm)

## Árvore de decisão

```mermaid
flowchart TD
  A[OpenCraft não está funcionando] --> B{O que quebra primeiro}
  B --> C[Sem respostas]
  B --> D[Dashboard ou UI de controle não conecta]
  B --> E[Gateway não inicia ou serviço não está em execução]
  B --> F[Canal conecta mas mensagens não fluem]
  B --> G[Cron ou heartbeat não disparou ou não entregou]
  B --> H[Nó está pareado mas câmera canvas screen exec falha]
  B --> I[Ferramenta de navegador falha]

  C --> C1[/Seção sem respostas/]
  D --> D1[/Seção UI de controle/]
  E --> E1[/Seção Gateway/]
  F --> F1[/Seção fluxo de canal/]
  G --> G1[/Seção automação/]
  H --> H1[/Seção ferramentas de nó/]
  I --> I1[/Seção navegador/]
```

<AccordionGroup>
  <Accordion title="Sem respostas">
    ```bash
    opencraft status
    opencraft gateway status
    opencraft channels status --probe
    opencraft pairing list --channel <canal> [--account <id>]
    opencraft logs --follow
    ```

    Boa saída parece com:

    - `Runtime: running`
    - `RPC probe: ok`
    - Seu canal mostra connected/ready em `channels status --probe`
    - Remetente aparece aprovado (ou política de DM é aberta/lista de permissão)

    Assinaturas comuns nos logs:

    - `drop guild message (mention required` → bloqueio de menção impediu a mensagem no Discord.
    - `pairing request` → remetente não está aprovado e aguarda aprovação de pareamento por DM.
    - `blocked` / `allowlist` nos logs do canal → remetente, sala ou grupo está filtrado.

    Páginas detalhadas:

    - [/gateway/troubleshooting#no-replies](/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/channels/troubleshooting)
    - [/channels/pairing](/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard ou UI de controle não conecta">
    ```bash
    opencraft status
    opencraft gateway status
    opencraft logs --follow
    opencraft doctor
    opencraft channels status --probe
    ```

    Boa saída parece com:

    - `Dashboard: http://...` é mostrado em `opencraft gateway status`
    - `RPC probe: ok`
    - Sem loop de auth nos logs

    Assinaturas comuns nos logs:

    - `device identity required` → contexto HTTP/não seguro não pode completar o auth do dispositivo.
    - `AUTH_TOKEN_MISMATCH` com dicas de retry (`canRetryWithDeviceToken=true`) → uma tentativa de retry com token-de-dispositivo confiável pode ocorrer automaticamente.
    - `unauthorized` repetido após esse retry → token/senha errados, incompatibilidade de modo de auth, ou token de dispositivo pareado obsoleto.
    - `gateway connect failed:` → UI está apontando para URL/porta errada ou gateway inacessível.

    Páginas detalhadas:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway não inicia ou serviço instalado mas não está em execução">
    ```bash
    opencraft status
    opencraft gateway status
    opencraft logs --follow
    opencraft doctor
    opencraft channels status --probe
    ```

    Boa saída parece com:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `RPC probe: ok`

    Assinaturas comuns nos logs:

    - `Gateway start blocked: set gateway.mode=local` → modo do gateway não está definido/está remoto.
    - `refusing to bind gateway ... without auth` → bind não-loopback sem token/senha.
    - `another gateway instance is already listening` ou `EADDRINUSE` → porta já ocupada.

    Páginas detalhadas:

    - [/gateway/troubleshooting#gateway-service-not-running](/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/gateway/background-process)
    - [/gateway/configuration](/gateway/configuration)

  </Accordion>

  <Accordion title="Canal conecta mas mensagens não fluem">
    ```bash
    opencraft status
    opencraft gateway status
    opencraft logs --follow
    opencraft doctor
    opencraft channels status --probe
    ```

    Boa saída parece com:

    - Transporte do canal está conectado.
    - Verificações de pareamento/lista de permissão passam.
    - Menções são detectadas onde necessário.

    Assinaturas comuns nos logs:

    - `mention required` → bloqueio de menção em grupo impediu o processamento.
    - `pairing` / `pending` → remetente de DM ainda não foi aprovado.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problema com token de permissão do canal.

    Páginas detalhadas:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron ou heartbeat não disparou ou não entregou">
    ```bash
    opencraft status
    opencraft gateway status
    opencraft cron status
    opencraft cron list
    opencraft cron runs --id <jobId> --limit 20
    opencraft logs --follow
    ```

    Boa saída parece com:

    - `cron.status` mostra habilitado com um próximo despertar.
    - `cron runs` mostra entradas `ok` recentes.
    - Heartbeat está habilitado e não está fora do horário ativo.

    Assinaturas comuns nos logs:

    - `cron: scheduler disabled; jobs will not run automatically` → cron está desabilitado.
    - `heartbeat skipped` com `reason=quiet-hours` → fora do horário ativo configurado.
    - `requests-in-flight` → lane principal ocupada; despertar do heartbeat foi adiado.
    - `unknown accountId` → conta de destino de entrega do heartbeat não existe.

    Páginas detalhadas:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/troubleshooting](/automation/troubleshooting)
    - [/gateway/heartbeat](/gateway/heartbeat)

  </Accordion>

  <Accordion title="Nó está pareado mas ferramenta falha: câmera, canvas, screen, exec">
    ```bash
    opencraft status
    opencraft gateway status
    opencraft nodes status
    opencraft nodes describe --node <idOuNomeOuIp>
    opencraft logs --follow
    ```

    Boa saída parece com:

    - Nó está listado como conectado e pareado para o papel `node`.
    - Capacidade existe para o comando que você está invocando.
    - Estado de permissão está concedido para a ferramenta.

    Assinaturas comuns nos logs:

    - `NODE_BACKGROUND_UNAVAILABLE` → coloque o app do nó em primeiro plano.
    - `*_PERMISSION_REQUIRED` → permissão do SO foi negada/ausente.
    - `SYSTEM_RUN_DENIED: approval required` → aprovação de exec está pendente.
    - `SYSTEM_RUN_DENIED: allowlist miss` → comando não está na lista de permissão de exec.

    Páginas detalhadas:

    - [/gateway/troubleshooting#node-paired-tool-fails](/gateway/troubleshooting#node-paired-tool-fails)
    - [/nodes/troubleshooting](/nodes/troubleshooting)
    - [/tools/exec-approvals](/tools/exec-approvals)

  </Accordion>

  <Accordion title="Ferramenta de navegador falha">
    ```bash
    opencraft status
    opencraft gateway status
    opencraft browser status
    opencraft logs --follow
    opencraft doctor
    ```

    Boa saída parece com:

    - Status do navegador mostra `running: true` e um navegador/perfil escolhido.
    - Perfil `opencraft` inicia ou relay `chrome` tem uma aba conectada.

    Assinaturas comuns nos logs:

    - `Failed to start Chrome CDP on port` → falha ao iniciar o navegador local.
    - `browser.executablePath not found` → caminho de binário configurado está errado.
    - `Chrome extension relay is running, but no tab is connected` → extensão não está conectada.
    - `Browser attachOnly is enabled ... not reachable` → perfil de attach-only não tem target CDP ativo.

    Páginas detalhadas:

    - [/gateway/troubleshooting#browser-tool-fails](/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
    - [/tools/chrome-extension](/tools/chrome-extension)

  </Accordion>
</AccordionGroup>
