---
title: "Criando Skills"
summary: "Construir e testar Skills personalizadas de workspace com SKILL.md"
read_when:
  - Você está criando uma nova Skill personalizada no seu workspace
  - Você precisa de um fluxo de trabalho inicial rápido para Skills baseadas em SKILL.md
---

# Criando Skills Personalizadas

O OpenCraft foi projetado para ser facilmente extensível. "Skills" são a forma principal de adicionar novas capacidades ao seu assistente.

## O que é uma Skill?

Uma Skill é um diretório contendo um arquivo `SKILL.md` (que fornece instruções e definições de ferramentas para o LLM) e opcionalmente alguns scripts ou recursos.

## Passo a Passo: Sua Primeira Skill

### 1. Crie o Diretório

Skills ficam no seu workspace, geralmente `~/.opencraft/workspace/skills/`. Crie uma nova pasta para sua Skill:

```bash
mkdir -p ~/.opencraft/workspace/skills/hello-world
```

### 2. Defina o `SKILL.md`

Crie um arquivo `SKILL.md` nesse diretório. Este arquivo usa frontmatter YAML para metadados e Markdown para instruções.

```markdown
---
name: hello_world
description: A simple skill that says hello.
---

# Hello World Skill

When the user asks for a greeting, use the `echo` tool to say "Hello from your custom skill!".
```

### 3. Adicione Ferramentas (Opcional)

Você pode definir ferramentas personalizadas no frontmatter ou instruir o agente a usar ferramentas de sistema existentes (como `bash` ou `browser`).

### 4. Atualize o OpenCraft

Peça ao seu agente para "atualizar skills" ou reinicie o Gateway. O OpenCraft vai descobrir o novo diretório e indexar o `SKILL.md`.

## Boas Práticas

- **Seja Conciso**: Instrua o modelo sobre _o que_ fazer, não como ser uma IA.
- **Segurança Primeiro**: Se sua Skill usa `bash`, garanta que os prompts não permitam injeção arbitrária de comandos a partir de entrada de usuário não confiável.
- **Teste Localmente**: Use `opencraft agent --message "use my new skill"` para testar.

## Skills Compartilhadas

Você também pode navegar e contribuir com Skills no [ClawHub](https://clawhub.com).
