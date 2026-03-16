---
summary: "Superfícies de rastreamento de uso e requisitos de credencial"
read_when:
  - Você está conectando superfícies de uso/cota do provedor
  - Você precisa explicar o comportamento de rastreamento de uso ou requisitos de auth
title: "Rastreamento de Uso"
---

# Rastreamento de uso

## O que é

- Busca uso/cota do provedor diretamente dos seus endpoints de uso.
- Sem custos estimados; apenas as janelas reportadas pelo provedor.

## Onde aparece

- `/status` nos chats: cartão de status rico em emoji com tokens de sessão + custo estimado (apenas chave de API). O uso do provedor aparece para o **provedor de modelo atual** quando disponível.
- `/usage off|tokens|full` nos chats: rodapé de uso por resposta (OAuth mostra apenas tokens).
- `/usage cost` nos chats: resumo de custo local agregado dos logs de sessão do OpenCraft.
- CLI: `opencraft status --usage` imprime um detalhamento completo por provedor.
- CLI: `opencraft channels list` imprime o mesmo snapshot de uso junto com a config do provedor (use `--no-usage` para pular).
- Barra de menu do macOS: seção "Usage" em Context (apenas se disponível).

## Provedores + credenciais

- **Anthropic (Claude)**: tokens OAuth em perfis de auth.
- **GitHub Copilot**: tokens OAuth em perfis de auth.
- **Gemini CLI**: tokens OAuth em perfis de auth.
- **Antigravity**: tokens OAuth em perfis de auth.
- **OpenAI Codex**: tokens OAuth em perfis de auth (accountId usado quando presente).
- **MiniMax**: chave de API (chave do plano de coding; `MINIMAX_CODE_PLAN_KEY` ou `MINIMAX_API_KEY`); usa a janela do plano de coding de 5 horas.
- **z.ai**: chave de API via env/config/armazenamento de auth.

O uso é ocultado se não existirem credenciais OAuth/API correspondentes.
