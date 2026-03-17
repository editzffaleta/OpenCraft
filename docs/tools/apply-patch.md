---
summary: "Aplicar patches multi-arquivo com a ferramenta apply_patch"
read_when:
  - Você precisa de edições estruturadas em múltiplos arquivos
  - Você quer documentar ou depurar edições baseadas em patch
title: "Ferramenta apply_patch"
---

# Ferramenta apply_patch

Aplique alterações em arquivos usando um formato de patch estruturado. Isso é ideal para edições
em múltiplos arquivos ou múltiplos hunks onde uma única chamada `edit` seria frágil.

A ferramenta aceita uma única string `input` que encapsula uma ou mais operações de arquivo:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parâmetros

- `input` (obrigatório): Conteúdo completo do patch incluindo `*** Begin Patch` e `*** End Patch`.

## Notas

- Caminhos do patch suportam caminhos relativos (a partir do diretório do workspace) e caminhos absolutos.
- `tools.exec.applyPatch.workspaceOnly` é `true` por padrão (contido no workspace). Defina como `false` apenas se você intencionalmente quiser que `apply_patch` escreva/exclua fora do diretório do workspace.
- Use `*** Move to:` dentro de um hunk `*** Update File:` para renomear arquivos.
- `*** End of File` marca uma inserção apenas no final do arquivo quando necessário.
- Experimental e desabilitado por padrão. Habilite com `tools.exec.applyPatch.enabled`.
- Apenas OpenAI (incluindo OpenAI Codex). Opcionalmente restrinja por modelo via
  `tools.exec.applyPatch.allowModels`.
- A config está apenas em `tools.exec`.

## Exemplo

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
