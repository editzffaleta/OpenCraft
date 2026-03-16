---
title: "Criando Skills"
summary: "Crie e teste skills personalizadas de workspace com SKILL.md"
read_when:
  - Você está criando uma nova skill personalizada no seu workspace
  - Você precisa de um fluxo de trabalho de início rápido para skills baseadas em SKILL.md
---

# Criando Skills Personalizadas

O OpenCraft foi projetado para ser facilmente extensível. "Skills" são a principal forma de adicionar novas capacidades ao seu assistente.

## O que é uma Skill?

Uma skill é um diretório contendo um arquivo `SKILL.md` (que fornece instruções e definições de tools ao LLM) e, opcionalmente, alguns scripts ou recursos.

## Passo a Passo: Sua Primeira Skill

### 1. Criar o Diretório

Skills ficam no seu workspace, geralmente em `~/.opencraft/workspace/skills/`. Crie uma nova pasta para sua skill:

```bash
mkdir -p ~/.opencraft/workspace/skills/ola-mundo
```

### 2. Definir o `SKILL.md`

Crie um arquivo `SKILL.md` naquele diretório. Este arquivo usa frontmatter YAML para metadados e Markdown para instruções.

```markdown
---
name: ola_mundo
description: Uma skill simples que diz olá.
---

# Skill Olá Mundo

Quando o usuário pedir uma saudação, use a tool `echo` para dizer "Olá da sua skill personalizada!".
```

### 3. Adicionar Tools (Opcional)

Você pode definir tools personalizadas no frontmatter ou instruir o agente a usar tools do sistema existentes (como `bash` ou `browser`).

### 4. Atualizar o OpenCraft

Peça ao seu agente para "atualizar skills" ou reinicie o gateway. O OpenCraft descobrirá o novo diretório e indexará o `SKILL.md`.

## Boas Práticas

- **Seja Conciso**: Instrua o modelo sobre _o que_ fazer, não como ser uma IA.
- **Segurança em Primeiro Lugar**: Se sua skill usa `bash`, garanta que os prompts não permitam injeção arbitrária de comandos a partir de entrada não confiável do usuário.
- **Teste Localmente**: Use `opencraft agent --message "use minha nova skill"` para testar.

## Skills Compartilhadas

Você também pode navegar e contribuir skills para o [ClawHub](https://clawhub.com).
