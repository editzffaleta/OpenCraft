---
summary: "Logging do OpenCraft: log de diagnóstico rotativo + flags de privacidade do unified log"
read_when:
  - Capturando logs do macOS ou investigando logging de dados privados
  - Depurando problemas de ciclo de vida de Voice Wake/sessão
title: "Logging no macOS"
---

# Logging (macOS)

## Log de diagnóstico rotativo (painel Debug)

O OpenCraft roteia os logs do aplicativo macOS através do swift-log (unified logging por padrão) e pode escrever um log de arquivo local rotativo no disco quando você precisa de uma captura durável.

- Verbosidade: **Painel Debug → Logs → App logging → Verbosity**
- Ativar: **Painel Debug → Logs → App logging → "Write rolling diagnostics log (JSONL)"**
- Localização: `~/Library/Logs/OpenCraft/diagnostics.jsonl` (rotaciona automaticamente; arquivos antigos são sufixados com `.1`, `.2`, ...)
- Limpar: **Painel Debug → Logs → App logging → "Clear"**

Notas:

- Isso está **desativado por padrão**. Ative apenas enquanto estiver depurando ativamente.
- Trate o arquivo como sensível; não compartilhe sem revisar.

## Dados privados do unified logging no macOS

O unified logging redige a maioria dos payloads a menos que um subsistema opte por `privacy -off`. Conforme o artigo de Peter sobre [questões de privacidade de logging](https://steipete.me/posts/2025/logging-privacy-shenanigans) no macOS (2025), isso é controlado por um plist em `/Library/Preferences/Logging/Subsystems/` identificado pelo nome do subsistema. Apenas novas entradas de log captam o flag, então ative antes de reproduzir um problema.

## Ativar para OpenCraft (`ai.opencraft`)

- Escreva o plist em um arquivo temporário primeiro, depois instale atomicamente como root:

```bash
cat <<'EOF' >/tmp/ai.opencraft.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.opencraft.plist /Library/Preferences/Logging/Subsystems/ai.opencraft.plist
```

- Nenhuma reinicialização é necessária; o logd detecta o arquivo rapidamente, mas apenas novas linhas de log incluirão payloads privados.
- Visualize a saída mais rica com o auxiliar existente, por exemplo `./scripts/clawlog.sh --category WebChat --last 5m`.

## Desativar após depuração

- Remova a substituição: `sudo rm /Library/Preferences/Logging/Subsystems/ai.opencraft.plist`.
- Opcionalmente execute `sudo log config --reload` para forçar o logd a descartar a substituição imediatamente.
- Lembre-se de que esta superfície pode incluir números de telefone e corpos de mensagens; mantenha o plist no lugar apenas enquanto precisar ativamente do detalhe extra.
