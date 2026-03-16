---
summary: "Rodar o OpenCraft em uma VM macOS sandbox (local ou hospedada) quando você precisa de isolamento ou iMessage"
read_when:
  - Você quer o OpenCraft isolado do seu ambiente macOS principal
  - Você quer integração iMessage (BlueBubbles) em um sandbox
  - Você quer um ambiente macOS reiniciável que pode ser clonado
  - Você quer comparar opções de VM macOS local vs hospedada
title: "VMs macOS"
---

# OpenCraft em VMs macOS (Sandboxing)

## Padrão recomendado (maioria dos usuários)

- **VPS Linux pequeno** para um Gateway sempre ativo e baixo custo. Veja [Hospedagem VPS](/vps).
- **Hardware dedicado** (Mac mini ou servidor Linux) se você quiser controle total e um **IP residencial** para automação de navegador. Muitos sites bloqueiam IPs de data center, então navegação local frequentemente funciona melhor.
- **Híbrido:** mantenha o Gateway em um VPS barato e conecte seu Mac como um **nó** quando precisar de automação de navegador/UI. Veja [Nós](/nodes) e [Gateway remoto](/gateway/remote).

Use uma VM macOS quando precisar especificamente de capacidades exclusivas do macOS (iMessage/BlueBubbles) ou quiser isolamento estrito do seu Mac diário.

## Opções de VM macOS

### VM local no seu Mac Apple Silicon (Lume)

Rode o OpenCraft em uma VM macOS sandbox no seu Mac Apple Silicon existente usando [Lume](https://cua.ai/docs/lume).

Isso oferece:

- Ambiente macOS completo em isolamento (seu host fica limpo)
- Suporte a iMessage via BlueBubbles (impossível no Linux/Windows)
- Reset instantâneo clonando VMs
- Sem hardware extra ou custos cloud

### Provedores Mac hospedados (cloud)

Se você quiser macOS na nuvem, provedores Mac hospedados também funcionam:

- [MacStadium](https://www.macstadium.com/) (Macs hospedados)
- Outros fornecedores de Mac hospedados também funcionam; siga a documentação de VM + SSH deles

Assim que tiver acesso SSH a uma VM macOS, continue no passo 6 abaixo.

---

## Caminho rápido (Lume, usuários experientes)

1. Instalar Lume
2. `lume create opencraft --os macos --ipsw latest`
3. Completar o Assistente de Configuração, habilitar Login Remoto (SSH)
4. `lume run opencraft --no-display`
5. Acessar via SSH, instalar OpenCraft, configurar canais
6. Pronto

---

## O que você precisa (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia ou posterior no host
- ~60 GB de espaço em disco por VM
- ~20 minutos

---

## 1) Instalar Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Se `~/.local/bin` não estiver no seu PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifique:

```bash
lume --version
```

Docs: [Instalação do Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Criar a VM macOS

```bash
lume create opencraft --os macos --ipsw latest
```

Isso baixa o macOS e cria a VM. Uma janela VNC abre automaticamente.

Nota: O download pode demorar dependendo da sua conexão.

---

## 3) Completar o Assistente de Configuração

Na janela VNC:

1. Selecione idioma e região
2. Pule o Apple ID (ou entre se quiser iMessage depois)
3. Crie uma conta de usuário (lembre o nome de usuário e senha)
4. Pule todos os recursos opcionais

Após a conclusão da configuração, habilite SSH:

1. Abra Configurações do Sistema → Geral → Compartilhamento
2. Habilite "Login Remoto"

---

## 4) Obter o endereço IP da VM

```bash
lume get opencraft
```

Procure o endereço IP (geralmente `192.168.64.x`).

---

## 5) Acessar a VM via SSH

```bash
ssh seuusuario@192.168.64.X
```

Substitua `seuusuario` pela conta que você criou e o IP pelo IP da sua VM.

---

## 6) Instalar o OpenCraft

Dentro da VM:

```bash
npm install -g opencraft@latest
opencraft onboard --install-daemon
```

Siga os prompts de onboarding para configurar seu provedor de modelo (Anthropic, OpenAI, etc.).

---

## 7) Configurar canais

Edite o arquivo de config:

```bash
nano ~/.opencraft/opencraft.json
```

Adicione seus canais:

```json
{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+5511999999999"]
    },
    "telegram": {
      "botToken": "SEU_TOKEN_DE_BOT"
    }
  }
}
```

Depois faça login no WhatsApp (escaneie o QR):

```bash
opencraft channels login
```

---

## 8) Rodar a VM sem display

Pare a VM e reinicie sem display:

```bash
lume stop opencraft
lume run opencraft --no-display
```

A VM roda em segundo plano. O daemon do OpenCraft mantém o gateway rodando.

Para verificar o status:

```bash
ssh seuusuario@192.168.64.X "opencraft status"
```

---

## Bônus: integração iMessage

Esta é a funcionalidade killer de rodar no macOS. Use [BlueBubbles](https://bluebubbles.app) para adicionar iMessage ao OpenCraft.

Dentro da VM:

1. Baixe o BlueBubbles de bluebubbles.app
2. Entre com seu Apple ID
3. Habilite a Web API e defina uma senha
4. Aponte os webhooks do BlueBubbles para seu gateway (exemplo: `https://seu-host-gateway:3000/bluebubbles-webhook?password=<senha>`)

Adicione à sua config do OpenCraft:

```json
{
  "channels": {
    "bluebubbles": {
      "serverUrl": "http://localhost:1234",
      "password": "sua-senha-de-api",
      "webhookPath": "/bluebubbles-webhook"
    }
  }
}
```

Reinicie o gateway. Agora seu agente pode enviar e receber iMessages.

Detalhes completos de configuração: [Canal BlueBubbles](/channels/bluebubbles)

---

## Salvar uma imagem dourada

Antes de personalizar mais, faça snapshot do seu estado limpo:

```bash
lume stop opencraft
lume clone opencraft opencraft-golden
```

Resetar a qualquer momento:

```bash
lume stop opencraft && lume delete opencraft
lume clone opencraft-golden opencraft
lume run opencraft --no-display
```

---

## Rodando 24/7

Mantenha a VM rodando:

- Mantenha seu Mac conectado na tomada
- Desabilite o sono em Configurações do Sistema → Economizador de Energia
- Use `caffeinate` se necessário

Para verdadeiro sempre ativo, considere um Mac mini dedicado ou um VPS pequeno. Veja [Hospedagem VPS](/vps).

---

## Solução de problemas

| Problema                         | Solução                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| Não consigo SSH na VM            | Verifique se "Login Remoto" está habilitado nas Configurações do Sistema da VM                |
| IP da VM não aparece             | Aguarde a VM iniciar completamente, execute `lume get opencraft` novamente                    |
| Comando lume não encontrado      | Adicione `~/.local/bin` ao seu PATH                                                           |
| QR do WhatsApp não escaneia      | Certifique-se de estar logado na VM (não no host) ao executar `opencraft channels login`      |

---

## Docs relacionados

- [Hospedagem VPS](/vps)
- [Nós](/nodes)
- [Gateway remoto](/gateway/remote)
- [Canal BlueBubbles](/channels/bluebubbles)
- [Início rápido do Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referência de CLI do Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuração de VM sem supervisão](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avançado)
- [Sandboxing Docker](/install/docker) (abordagem alternativa de isolamento)
