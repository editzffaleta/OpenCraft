---
summary: "Fluxo do app macOS para controlar um gateway OpenCraft remoto via SSH"
read_when:
  - Configurando ou depurando controle remoto no mac
title: "Controle Remoto"
---

# OpenCraft Remoto (macOS ⇄ host remoto)

Este fluxo permite que o app macOS atue como controle remoto completo para um gateway OpenCraft rodando em outro host (desktop/servidor). É o recurso **Remote over SSH** (execução remota) do app. Todos os recursos — verificações de saúde, encaminhamento de Voice Wake e Web Chat — reutilizam a mesma configuração SSH remota de _Configurações → Geral_.

## Modos

- **Local (este Mac)**: Tudo roda no laptop. Sem SSH envolvido.
- **Remote over SSH (padrão)**: Os comandos do OpenCraft são executados no host remoto. O app mac abre uma conexão SSH com `-o BatchMode` mais sua identidade/chave escolhida e um encaminhamento de porta local.
- **Remote direct (ws/wss)**: Sem túnel SSH. O app mac conecta diretamente à URL do gateway (por exemplo, via Tailscale Serve ou um proxy reverso HTTPS público).

## Transportes remotos

O modo remoto suporta dois transportes:

- **Túnel SSH** (padrão): Usa `ssh -N -L ...` para encaminhar a porta do gateway para localhost. O gateway verá o IP do nó como `127.0.0.1` porque o túnel é loopback.
- **Direto (ws/wss)**: Conecta diretamente à URL do gateway. O gateway vê o IP real do cliente.

## Pré-requisitos no host remoto

1. Instale Node + pnpm e compile/instale o CLI do OpenCraft (`pnpm install && pnpm build && pnpm link --global`).
2. Certifique-se de que `opencraft` está no PATH para shells não-interativos (crie symlink em `/usr/local/bin` ou `/opt/homebrew/bin` se necessário).
3. Abra SSH com auth por chave. Recomendamos IPs do **Tailscale** para alcançabilidade estável fora da LAN.

## Configuração do app macOS

1. Abra _Configurações → Geral_.
2. Em **OpenCraft runs**, escolha **Remote over SSH** e defina:
   - **Transporte**: **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:porta` opcional).
     - Se o gateway estiver na mesma LAN e anunciar Bonjour, selecione-o na lista descoberta para preencher automaticamente este campo.
   - **Gateway URL** (somente Direct): `wss://gateway.example.ts.net` (ou `ws://...` para local/LAN).
   - **Identity file** (avançado): caminho para sua chave.
   - **Project root** (avançado): caminho do checkout remoto usado para comandos.
   - **CLI path** (avançado): caminho opcional para um entrypoint/binário `opencraft` executável (preenchido automaticamente quando anunciado).
3. Clique em **Test remote**. Sucesso indica que o `opencraft status --json` remoto está funcionando corretamente. Falhas geralmente significam problemas de PATH/CLI; exit 127 significa que o CLI não foi encontrado remotamente.
4. Verificações de saúde e Web Chat agora vão rodar por este túnel SSH automaticamente.

## Web Chat

- **Túnel SSH**: O Web Chat conecta ao gateway pela porta de controle WebSocket encaminhada (padrão 18789).
- **Direto (ws/wss)**: O Web Chat conecta diretamente à URL do gateway configurado.
- Não há mais um servidor HTTP WebChat separado.

## Permissões

- O host remoto precisa das mesmas aprovações TCC que o local (Automação, Acessibilidade, Gravação de Tela, Microfone, Reconhecimento de Fala, Notificações). Execute o onboarding naquela máquina para concedê-las uma vez.
- Os nós anunciam seu estado de permissão via `node.list` / `node.describe` para que os agentes saibam o que está disponível.

## Notas de segurança

- Prefira binds loopback no host remoto e conecte via SSH ou Tailscale.
- O tunnel SSH usa verificação estrita de host-key; confie a chave do host primeiro para que ela exista em `~/.ssh/known_hosts`.
- Se você vincular o Gateway a uma interface não-loopback, exija auth por token/senha.
- Veja [Segurança](/gateway/security) e [Tailscale](/gateway/tailscale).

## Fluxo de login do WhatsApp (remoto)

- Execute `opencraft channels login --verbose` **no host remoto**. Escaneie o QR com o WhatsApp no seu telefone.
- Execute o login novamente naquele host se o auth expirar. A verificação de saúde vai expor problemas de vinculação.

## Troubleshooting

- **exit 127 / not found**: `opencraft` não está no PATH para shells não-login. Adicione-o a `/etc/paths`, seu rc de shell, ou crie symlink em `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe falhou**: verifique a acessibilidade SSH, PATH, e se o Baileys está logado (`opencraft status --json`).
- **Web Chat travado**: confirme se o gateway está rodando no host remoto e se a porta encaminhada corresponde à porta WS do gateway; a UI requer uma conexão WS saudável.
- **IP do nó mostra 127.0.0.1**: esperado com o túnel SSH. Mude o **Transporte** para **Direct (ws/wss)** se quiser que o gateway veja o IP real do cliente.
- **Voice Wake**: frases de gatilho são encaminhadas automaticamente no modo remoto; não é necessário um encaminhador separado.

## Sons de notificação

Escolha sons por notificação a partir de scripts com `opencraft` e `node.invoke`, ex:

```bash
opencraft nodes notify --node <id> --title "Ping" --body "Gateway remoto pronto" --sound Glass
```

Não há mais um toggle global de "som padrão" no app; os chamadores escolhem um som (ou nenhum) por requisição.
