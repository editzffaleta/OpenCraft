---
summary: "Persistência de permissões macOS (TCC) e requisitos de assinatura"
read_when:
  - Depurando prompts de permissão macOS ausentes ou travados
  - Empacotando ou assinando o app macOS
  - Alterando bundle IDs ou caminhos de instalação do app
title: "Permissões macOS"
---

# Permissões macOS (TCC)

As concessões de permissão do macOS são frágeis. O TCC associa uma concessão de permissão à
assinatura de código do app, identificador de bundle e caminho no disco. Se qualquer um desses mudar,
o macOS trata o app como novo e pode descartar ou ocultar prompts.

## Requisitos para permissões estáveis

- Mesmo caminho: execute o app a partir de um local fixo (para o OpenCraft, `dist/OpenCraft.app`).
- Mesmo identificador de bundle: alterar o bundle ID cria uma nova identidade de permissão.
- App assinado: builds sem assinatura ou com assinatura ad-hoc não persistem permissões.
- Assinatura consistente: use um certificado real Apple Development ou Developer ID
  para que a assinatura permaneça estável entre rebuilds.

Assinaturas ad-hoc geram uma nova identidade a cada build. O macOS vai esquecer as concessões anteriores,
e os prompts podem desaparecer completamente até que as entradas desatualizadas sejam limpas.

## Checklist de recuperação quando os prompts desaparecem

1. Feche o app.
2. Remova a entrada do app em Configurações do Sistema -> Privacidade e Segurança.
3. Relance o app a partir do mesmo caminho e conceda as permissões novamente.
4. Se o prompt ainda não aparecer, redefina as entradas do TCC com `tccutil` e tente novamente.
5. Algumas permissões só reaparecem após uma reinicialização completa do macOS.

Exemplos de redefinição (substitua o bundle ID conforme necessário):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permissões de arquivos e pastas (Desktop/Documentos/Downloads)

O macOS também pode controlar acesso a Desktop, Documentos e Downloads para processos de terminal/background. Se leituras de arquivo ou listagens de diretório travarem, conceda acesso ao mesmo contexto de processo que realiza operações de arquivo (por exemplo Terminal/iTerm, app lançado por LaunchAgent, ou processo SSH).

Solução alternativa: mova os arquivos para o workspace do OpenCraft (`~/.opencraft/workspace`) se quiser evitar concessões por pasta.

Se estiver testando permissões, sempre assine com um certificado real. Builds
ad-hoc são aceitáveis apenas para execuções locais rápidas onde as permissões não importam.
