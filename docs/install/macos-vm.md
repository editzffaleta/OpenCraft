---
summary: "Execute o OpenCraft em uma VM macOS sandboxed (local ou hospedada) quando você precisa de isolamento ou iMessage"
read_when:
  - Você quer o OpenCraft isolado do seu ambiente macOS principal
  - Você quer integração com iMessage (BlueBubbles) em um sandbox
  - Você quer um ambiente macOS resetável que pode clonar
  - Você quer comparar opções de VM macOS local vs hospedada
title: "VMs macOS"
---

# OpenCraft em VMs macOS (Sandboxing)

## Padrão recomendado (maioria dos usuários)

- **Pequeno VPS Linux** para um Gateway sempre ativo e baixo custo. Veja [Hospedagem VPS](/vps).
- **Hardware dedicado** (Mac mini ou máquina Linux) se você quer controle total e um **IP residencial** para automação de navegador. Muitos sites bloqueiam IPs de data center, então navegação local frequentemente funciona melhor.
- **Híbrido:** mantenha o Gateway em um VPS barato, e conecte seu Mac como **node** quando precisar de automação de navegador/UI. Veja [Nodes](/nodes) e [Gateway remoto](/gateway/remote).

Use uma VM macOS quando você especificamente precisa de capacidades exclusivas do macOS (iMessage/BlueBubbles) ou quer isolamento rigoroso do seu Mac do dia a dia.

## Opções de VM macOS

### VM local no seu Mac Apple Silicon (Lume)

Execute o OpenCraft em uma VM macOS sandboxed no seu Mac Apple Silicon existente usando [Lume](https://cua.ai/docs/lume).

Isso oferece:

- Ambiente macOS completo em isolamento (seu host fica limpo)
- Suporte a iMessage via BlueBubbles (impossível no Linux/Windows)
- Reset instantâneo clonando VMs
- Sem custos extras de hardware ou nuvem

### Provedores Mac hospedados (nuvem)

Se você quer macOS na nuvem, provedores Mac hospedados também funcionam:

- [MacStadium](https://www.macstadium.com/) (Macs hospedados)
- Outros fornecedores de Mac hospedado também funcionam; siga a documentação de VM + SSH deles

Uma vez que você tenha acesso SSH a uma VM macOS, continue na etapa 6 abaixo.

---

## Caminho rápido (Lume, usuários experientes)

1. Instalar Lume
2. `lume create opencraft --os macos --ipsw latest`
3. Completar o Assistente de Configuração, habilitar Login Remoto (SSH)
4. `lume run opencraft --no-display`
5. Conectar via SSH, instalar OpenCraft, configurar canais
6. Pronto

---

## O que você precisa (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia ou posterior no host
- ~60 GB de espaço livre em disco por VM
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

Documentação: [Instalação do Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

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
2. Pule o Apple ID (ou faça login se quiser iMessage depois)
3. Crie uma conta de usuário (lembre do nome de usuário e senha)
4. Pule todos os recursos opcionais

Após a configuração completar, habilite SSH:

1. Abra Ajustes do Sistema → Geral → Compartilhamento
2. Habilite "Login Remoto"

---

## 4) Obter o endereço IP da VM

```bash
lume get opencraft
```

Procure pelo endereço IP (geralmente `192.168.64.x`).

---

## 5) Conectar via SSH na VM

```bash
ssh youruser@192.168.64.X
```

Substitua `youruser` pela conta que você criou, e o IP pelo IP da sua VM.

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

Edite o arquivo de configuração:

```bash
nano ~/.editzffaleta/OpenCraft.json
```

Adicione seus canais:

```json
{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+15551234567"]
    },
    "telegram": {
      "botToken": "YOUR_BOT_TOKEN"
    }
  }
}
```

Depois faça login no WhatsApp (escaneie QR):

```bash
opencraft channels login
```

---

## 8) Executar a VM sem interface gráfica

Pare a VM e reinicie sem display:

```bash
lume stop opencraft
lume run opencraft --no-display
```

A VM roda em background. O daemon do OpenCraft mantém o gateway rodando.

Para verificar o status:

```bash
ssh youruser@192.168.64.X "opencraft status"
```

---

## Extra: integração com iMessage

Este é o recurso matador de rodar no macOS. Use [BlueBubbles](https://bluebubbles.app) para adicionar iMessage ao OpenCraft.

Dentro da VM:

1. Baixe BlueBubbles de bluebubbles.app
2. Faça login com seu Apple ID
3. Habilite a Web API e defina uma senha
4. Aponte os webhooks do BlueBubbles para seu gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Adicione à sua configuração do OpenCraft:

```json
{
  "channels": {
    "bluebubbles": {
      "serverUrl": "http://localhost:1234",
      "password": "your-api-password",
      "webhookPath": "/bluebubbles-webhook"
    }
  }
}
```

Reinicie o gateway. Agora seu agente pode enviar e receber iMessages.

Detalhes completos da configuração: [Canal BlueBubbles](/channels/bluebubbles)

---

## Salvar uma imagem golden

Antes de personalizar mais, faça um snapshot do seu estado limpo:

```bash
lume stop opencraft
lume clone opencraft opencraft-golden
```

Resete a qualquer momento:

```bash
lume stop opencraft && lume delete opencraft
lume clone opencraft-golden opencraft
lume run opencraft --no-display
```

---

## Rodando 24/7

Mantenha a VM rodando:

- Mantendo seu Mac conectado na tomada
- Desabilitando suspensão em Ajustes do Sistema → Economia de Energia
- Usando `caffeinate` se necessário

Para sempre ativo de verdade, considere um Mac mini dedicado ou um pequeno VPS. Veja [Hospedagem VPS](/vps).

---

## Solução de problemas

| Problema                    | Solução                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Não consigo SSH na VM       | Verifique se "Login Remoto" está habilitado nos Ajustes do Sistema da VM                 |
| IP da VM não aparece        | Aguarde a VM iniciar completamente, execute `lume get opencraft` novamente               |
| Comando Lume não encontrado | Adicione `~/.local/bin` ao seu PATH                                                      |
| QR do WhatsApp não escaneia | Certifique-se de estar logado na VM (não no host) ao executar `opencraft channels login` |

---

## Documentação relacionada

- [Hospedagem VPS](/vps)
- [Nodes](/nodes)
- [Gateway remoto](/gateway/remote)
- [Canal BlueBubbles](/channels/bluebubbles)
- [Início Rápido do Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referência CLI do Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuração de VM sem Supervisão](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avançado)
- [Sandboxing Docker](/install/docker) (abordagem alternativa de isolamento)
