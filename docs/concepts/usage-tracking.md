---
summary: "Superfícies de rastreamento de uso e requisitos de credenciais"
read_when:
  - Você está conectando superfícies de uso/cota de provedores
  - Você precisa explicar o comportamento de rastreamento de uso ou requisitos de autenticação
title: "Usage Tracking"
---

# Rastreamento de uso

## O que é

- Obtém uso/cota do provedor diretamente dos seus endpoints de uso.
- Sem custos estimados; apenas as janelas reportadas pelo provedor.

## Onde aparece

- `/status` em chats: cartão de status rico em emojis com Token de sessão + custo estimado (apenas API key). Uso do provedor é exibido para o **provedor do modelo atual** quando disponível.
- `/usage off|tokens|full` em chats: rodapé de uso por resposta (OAuth mostra apenas Token).
- `/usage cost` em chats: resumo de custos local agregado dos logs de sessão do OpenCraft.
- CLI: `opencraft status --usage` imprime um detalhamento completo por provedor.
- CLI: `opencraft channels list` imprime o mesmo snapshot de uso junto com a configuração do provedor (use `--no-usage` para pular).
- Barra de menu do macOS: seção "Usage" em Contexto (apenas se disponível).

## Provedores + credenciais

- **Anthropic (Claude)**: Token OAuth em perfis de autenticação.
- **GitHub Copilot**: Token OAuth em perfis de autenticação.
- **Gemini CLI**: Token OAuth em perfis de autenticação.
- **Antigravity**: Token OAuth em perfis de autenticação.
- **OpenAI Codex**: Token OAuth em perfis de autenticação (accountId usado quando presente).
- **MiniMax**: API key (chave de plano de codificação; `MINIMAX_CODE_PLAN_KEY` ou `MINIMAX_API_KEY`); usa a janela de plano de codificação de 5 horas.
- **z.ai**: API key via env/config/auth store.

O uso é ocultado se não existirem credenciais OAuth/API key correspondentes.
