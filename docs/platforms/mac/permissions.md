---
summary: "Persistência de permissões do macOS (TCC) e requisitos de assinatura"
read_when:
  - Depurando prompts de permissão do macOS ausentes ou travados
  - Empacotando ou assinando o aplicativo macOS
  - Alterando identificadores de bundle ou caminhos de instalação do aplicativo
title: "Permissões macOS"
---

# Permissões macOS (TCC)

As concessões de permissão do macOS são frágeis. O TCC associa uma concessão de permissão com a
assinatura de código do aplicativo, identificador de bundle e caminho no disco. Se qualquer um deles mudar,
o macOS trata o aplicativo como novo e pode descartar ou ocultar prompts.

## Requisitos para permissões estáveis

- Mesmo caminho: execute o aplicativo de um local fixo (para OpenCraft, `dist/OpenCraft.app`).
- Mesmo identificador de bundle: alterar o bundle ID cria uma nova identidade de permissão.
- Aplicativo assinado: builds não assinados ou assinados ad-hoc não persistem permissões.
- Assinatura consistente: use um certificado real Apple Development ou Developer ID
  para que a assinatura permaneça estável entre recompilações.

Assinaturas ad-hoc geram uma nova identidade a cada build. O macOS esquecerá concessões
anteriores, e os prompts podem desaparecer inteiramente até que as entradas obsoletas sejam limpas.

## Lista de recuperação quando prompts desaparecem

1. Feche o aplicativo.
2. Remova a entrada do aplicativo em Configurações do Sistema -> Privacidade e Segurança.
3. Reinicie o aplicativo do mesmo caminho e conceda as permissões novamente.
4. Se o prompt ainda não aparecer, redefina as entradas TCC com `tccutil` e tente novamente.
5. Algumas permissões só reaparecem após uma reinicialização completa do macOS.

Exemplos de redefinição (substitua o bundle ID conforme necessário):

```bash
sudo tccutil reset Accessibility ai.opencraft.mac
sudo tccutil reset ScreenCapture ai.opencraft.mac
sudo tccutil reset AppleEvents
```

## Permissões de arquivos e pastas (Desktop/Documents/Downloads)

O macOS também pode restringir Desktop, Documents e Downloads para processos de terminal/segundo plano. Se leituras de arquivo ou listagens de diretório travarem, conceda acesso ao mesmo contexto de processo que realiza as operações de arquivo (por exemplo Terminal/iTerm, aplicativo iniciado por LaunchAgent ou processo SSH).

Solução alternativa: mova os arquivos para o workspace do OpenCraft (`~/.opencraft/workspace`) se quiser evitar concessões por pasta.

Se você estiver testando permissões, sempre assine com um certificado real. Builds
ad-hoc são aceitáveis apenas para execuções locais rápidas onde as permissões não importam.
