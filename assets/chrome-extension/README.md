# Extensão Chrome do OpenCraft (Browser Relay)

Propósito: conectar o OpenCraft a uma aba Chrome existente para que o Gateway possa automatizá-la (via servidor relay CDP local).

## Dev / carregar sem pacote

1. Construa/execute o OpenCraft Gateway com controle de browser habilitado.
2. Certifique-se de que o servidor relay está acessível em `http://127.0.0.1:18792/` (padrão).
3. Instale a extensão em um caminho estável:

   ```bash
   opencraft browser extension install
   opencraft browser extension path
   ```

4. Chrome → `chrome://extensions` → habilite o "Modo do desenvolvedor".
5. "Carregar sem pacote" → selecione o caminho impresso acima.
6. Fixe a extensão. Clique no ícone em uma aba para conectar/desconectar.

## Opções

- `Relay port`: padrão `18792`.
- `Gateway token`: obrigatório. Defina como `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
