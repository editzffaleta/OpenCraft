---
summary: "Fluxo do aplicativo macOS para controlar um Gateway OpenCraft remoto via SSH"
read_when:
  - Configurando ou depurando controle remoto no macOS
title: "Controle Remoto"
---

# OpenCraft Remoto (macOS ⇄ host remoto)

Este fluxo permite que o aplicativo macOS atue como um controle remoto completo para um Gateway OpenCraft em execução em outro host (desktop/servidor). Este é o recurso **Remote over SSH** (execução remota) do aplicativo. Todos os recursos — verificações de integridade, encaminhamento de Voice Wake e Web Chat — reutilizam a mesma configuração SSH remota de _Configurações → General_.

## Modos

- **Local (este Mac)**: Tudo roda no laptop. Sem SSH envolvido.
- **Remote over SSH (padrão)**: Comandos do OpenCraft são executados no host remoto. O aplicativo macOS abre uma conexão SSH com `-o BatchMode` mais sua identidade/chave escolhida e um encaminhamento de porta local.
- **Remote direct (ws/wss)**: Sem túnel SSH. O aplicativo macOS se conecta diretamente à URL do Gateway (por exemplo, via Tailscale Serve ou um proxy reverso HTTPS público).

## Transportes remotos

O modo remoto suporta dois transportes:

- **Túnel SSH** (padrão): Usa `ssh -N -L ...` para encaminhar a porta do Gateway para localhost. O Gateway verá o IP do nó como `127.0.0.1` porque o túnel é loopback.
- **Direct (ws/wss)**: Conecta direto à URL do Gateway. O Gateway vê o IP real do cliente.

## Pré-requisitos no host remoto

1. Instale Node + pnpm e compile/instale a CLI do OpenCraft (`pnpm install && pnpm build && pnpm link --global`).
2. Certifique-se de que `opencraft` está no PATH para shells não-interativos (faça um symlink em `/usr/local/bin` ou `/opt/homebrew/bin` se necessário).
3. Abra SSH com autenticação por chave. Recomendamos IPs do **Tailscale** para alcançabilidade estável fora da LAN.

## Configuração do aplicativo macOS

1. Abra _Configurações → General_.
2. Em **OpenCraft runs**, escolha **Remote over SSH** e defina:
   - **Transport**: **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:porta` opcional).
     - Se o Gateway estiver na mesma LAN e anunciar Bonjour, escolha-o da lista descoberta para preencher automaticamente este campo.
   - **Gateway URL** (somente Direct): `wss://gateway.example.ts.net` (ou `ws://...` para local/LAN).
   - **Identity file** (avançado): caminho para sua chave.
   - **Project root** (avançado): caminho do checkout remoto usado para comandos.
   - **CLI path** (avançado): caminho opcional para um executável/binário `opencraft` (preenchido automaticamente quando anunciado).
3. Clique em **Test remote**. O sucesso indica que `opencraft status --json` remoto executou corretamente. Falhas geralmente significam problemas de PATH/CLI; exit 127 significa que a CLI não foi encontrada remotamente.
4. Verificações de integridade e Web Chat agora funcionarão automaticamente através deste túnel SSH.

## Web Chat

- **Túnel SSH**: O Web Chat se conecta ao Gateway pela porta de controle WebSocket encaminhada (padrão 18789).
- **Direct (ws/wss)**: O Web Chat se conecta diretamente à URL do Gateway configurada.
- Não existe mais um servidor HTTP de WebChat separado.

## Permissões

- O host remoto precisa das mesmas aprovações TCC que o local (Automação, Acessibilidade, Gravação de Tela, Microfone, Reconhecimento de Fala, Notificações). Execute o onboarding nessa máquina para concedê-las uma vez.
- Os nós anunciam seu estado de permissão via `node.list` / `node.describe` para que os agentes saibam o que está disponível.

## Notas de segurança

- Prefira binds em loopback no host remoto e conecte via SSH ou Tailscale.
- O túnel SSH usa verificação estrita de chave do host; confie na chave do host primeiro para que ela exista em `~/.ssh/known_hosts`.
- Se você vincular o Gateway a uma interface não-loopback, exija autenticação por token/senha.
- Veja [Segurança](/gateway/security) e [Tailscale](/gateway/tailscale).

## Fluxo de login do WhatsApp (remoto)

- Execute `opencraft channels login --verbose` **no host remoto**. Escaneie o QR com o WhatsApp no seu telefone.
- Execute o login novamente nesse host se a autenticação expirar. A verificação de integridade exibirá problemas de vinculação.

## Solução de problemas

- **exit 127 / not found**: `opencraft` não está no PATH para shells não-login. Adicione-o a `/etc/paths`, seu shell rc, ou faça um symlink em `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sondagem de integridade falhou**: verifique alcançabilidade SSH, PATH, e se o Baileys está logado (`opencraft status --json`).
- **Web Chat travado**: confirme que o Gateway está em execução no host remoto e a porta encaminhada corresponde à porta WS do Gateway; a UI requer uma conexão WS saudável.
- **IP do nó mostra 127.0.0.1**: esperado com o túnel SSH. Mude o **Transport** para **Direct (ws/wss)** se quiser que o Gateway veja o IP real do cliente.
- **Voice Wake**: frases de ativação são encaminhadas automaticamente no modo remoto; nenhum encaminhador separado é necessário.

## Sons de notificação

Escolha sons por notificação a partir de scripts com `opencraft` e `node.invoke`, por exemplo:

```bash
opencraft nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Não existe mais um toggle global de "som padrão" no aplicativo; os chamadores escolhem um som (ou nenhum) por solicitação.
