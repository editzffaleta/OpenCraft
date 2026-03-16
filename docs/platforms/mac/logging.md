---
summary: "Logging do OpenCraft: log de arquivo de diagnóstico rotativo + flags de privacidade do unified log"
read_when:
  - Capturando logs do macOS ou investigando logging de dados privados
  - Depurando problemas de ciclo de vida de voice wake/sessão
title: "Logging macOS"
---

# Logging (macOS)

## Log de arquivo de diagnóstico rotativo (painel Debug)

O OpenCraft roteia logs do app macOS pelo swift-log (unified logging por padrão) e pode gravar um log de arquivo local rotativo no disco quando você precisa de uma captura durável.

- Verbosidade: **painel Debug → Logs → App logging → Verbosity**
- Habilitar: **painel Debug → Logs → App logging → "Write rolling diagnostics log (JSONL)"**
- Localização: `~/Library/Logs/OpenCraft/diagnostics.jsonl` (rotaciona automaticamente; arquivos antigos têm sufixo `.1`, `.2`, …)
- Limpar: **painel Debug → Logs → App logging → "Clear"**

Notas:

- Isso está **desabilitado por padrão**. Habilite apenas durante depuração ativa.
- Trate o arquivo como sensível; não compartilhe sem revisão.

## Dados privados do unified logging no macOS

O unified logging redige a maioria dos payloads a menos que um subsystem opte por `privacy -off`. Conforme o artigo de Peter sobre [privacidade de logging no macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), isso é controlado por um plist em `/Library/Preferences/Logging/Subsystems/` com a chave sendo o nome do subsystem. Apenas novas entradas de log capturam a flag, portanto habilite antes de reproduzir um problema.

## Habilitar para o OpenCraft (`ai.openclaw`)

- Grave o plist em um arquivo temporário primeiro, depois instale-o atomicamente como root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
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
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- Não é necessária reinicialização; o logd percebe o arquivo rapidamente, mas apenas novas linhas de log incluirão payloads privados.
- Veja a saída mais rica com o helper existente, ex: `./scripts/clawlog.sh --category WebChat --last 5m`.

## Desabilitar após a depuração

- Remova o override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcionalmente execute `sudo log config --reload` para forçar o logd a descartar o override imediatamente.
- Lembre-se que essa superfície pode incluir números de telefone e corpos de mensagens; mantenha o plist no lugar apenas enquanto você precisar ativamente dos detalhes extras.
