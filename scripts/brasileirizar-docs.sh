#!/usr/bin/env bash
# Traduz todos os arquivos .md de docs/ e skills/ para pt-BR usando a API do Claude
# Uso: ./scripts/brasileirizar-docs.sh [--force] [--dir <subdir>] [--concurrency <n>]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONCURRENCY=${CONCURRENCY:-5}
FORCE=0
FILTER_DIR=""
MODEL="claude-haiku-4-5-20251001"
API_KEY="${ANTHROPIC_API_KEY:-}"

if [[ -z "$API_KEY" ]]; then
  echo "❌ ANTHROPIC_API_KEY não definida" >&2
  exit 1
fi

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    --dir) FILTER_DIR="$2"; shift 2 ;;
    --concurrency) CONCURRENCY="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    *) echo "Opção desconhecida: $1" >&2; exit 1 ;;
  esac
done

SYSTEM_PROMPT='Você é um tradutor técnico especializado em documentação de software. Traduza o conteúdo Markdown fornecido para Português Brasileiro (pt-BR) seguindo EXATAMENTE estas regras:

REGRAS DE SUBSTITUIÇÃO (aplicar a todo o conteúdo incluindo código e exemplos):
- "OpenCraft" em prosa/UI → "OpenCraft"
- ~/.opencraft/ → ~/.opencraft/
- opencraft.json → opencraft.json
- CLI `opencraft` → `opencraft`
- opencraft@latest → opencraft@latest
- ~/Projects/opencraft → ~/Projects/opencraft
- ~/.opencraft-dev → ~/.opencraft-dev
- ~/.opencraft-a → ~/.opencraft-a (e similares: ~/.opencraft-b etc)
- OPENCRAFT_CONFIG_PATH=~/.opencraft/ → OPENCRAFT_CONFIG_PATH=~/.opencraft/
- OPENCRAFT_STATE_DIR=~/.opencraft → OPENCRAFT_STATE_DIR=~/.opencraft (preservar sufixos como -a, -b, -dev)
- friends-of-opencraft → friends-of-opencraft (slugs de exemplo)
- groupChannels: ["opencraft-dm"] → ["opencraft-dm"]
- mentionPatterns: ["@opencraft"] → ["@opencraft"]
- browser.profiles.opencraft → browser.profiles.opencraft
- ui.assistant.name: "OpenCraft" → "OpenCraft"
- controlUi.basePath: "/opencraft" → "/opencraft"
- cwd: "/workspace/opencraft" → "/workspace/opencraft"
- "All your chats, one OpenCraft." → "All your chats, one OpenCraft."
- slashCommand.name: "opencraft" → "opencraft"

MANTER SEM ALTERAÇÃO (não traduzir nem substituir):
- Variáveis de ambiente OPENCLAW_* (ex: OPENCLAW_GATEWAY_TOKEN, OPENCRAFT_CONFIG_PATH)
- Nomes de plugins @opencraft/ (ex: @opencraft/mattermost)
- URLs externas do GitHub e outras URLs externas
- Chaves de configuração JSON/JSON5 opencraft (ex: "opencraft" como valor de chave de config interna)
- Header x-opencraft-token, x-opencraft-message-channel, x-opencraft-account-id
- Caminhos de código-fonte
- Nomes de serviços Docker
- E-mails de exemplo opencraft@gmail.com
- Nomes de scripts (ex: opencraft-vault-resolver)
- Caminhos /tmp/opencraft/
- URLs /__opencraft__/
- Prefixo openclaw-sbx- (containers sandbox)
- Rede openclaw-sandbox-browser
- Perfil AppArmor openclaw-sandbox
- Imagem openclaw-sandbox:bookworm-slim
- Chave de grupo group:opencraft
- Diretório zh-CN (não tocar em conteúdo zh-CN)

REGRAS DE TRADUÇÃO:
- Traduza TODO o texto em prosa para pt-BR (incluindo front matter: summary, description, title, read_when)
- Preserve TODA a formatação Markdown (headings, listas, tabelas, blocos de código, links)
- Preserve blocos de código (```...```) — traduza apenas comentários e strings de texto dentro deles
- Preserve âncoras de links internos e links relativos
- Não adicione nem remova conteúdo
- Retorne APENAS o conteúdo Markdown traduzido, sem explicações adicionais'

# Função: verifica se arquivo já foi traduzido
is_translated() {
  local file="$1"
  # Verifica presença de palavras em português comuns em docs
  grep -qP 'Quando|configuração|você|também|está|são|mais|para|com|uma|não|esse|este|essa|pelo|pela|através|nosso|sua|seu|pode|deve|será|têm|tem|após|antes|então|ainda|mesmo|cada|todo|todos|todas|assim|porque|sendo|sobre|entre|dentro|fora|sempre|nunca|apenas|além|já|mas|ou|se|como|onde|quando|quem|por que|devido|exemplo|padrão|valor|tipo|campo|nome|descrição|opção|recurso|módulo|arquivo|diretório|processo|serviço|conexão|autenticação|autorização|configurar|instalar|atualizar|iniciar|parar|reiniciar|verificar|definir|obter|enviar|receber|criar|remover|listar|mostrar|habilitar|desabilitar|permitir|bloquear|redirecionar|registrar|monitorar|depurar|testar|executar|rodar|compilar|construir|publicar|implantar|gerenciar|controlar|proteger|criptografar|assinar|validar|autenticar|autorizar|conectar|desconectar|sincronizar|atualizar|substituir|migrar|exportar|importar|converter|processar|analisar|verificar|detectar|corrigir|resolver|depurar|registrar|reportar|notificar|alertar|monitorar' "$file" 2>/dev/null
}

# Função: traduz um arquivo via API
translate_file() {
  local file="$1"
  local rel="${file#$REPO_ROOT/}"

  if [[ $FORCE -eq 0 ]] && is_translated "$file"; then
    echo "⏭  Já traduzido: $rel"
    return 0
  fi

  local content
  content=$(cat "$file")

  # Pula arquivos muito pequenos (< 50 bytes) ou vazios
  if [[ ${#content} -lt 50 ]]; then
    echo "⏭  Muito pequeno: $rel"
    return 0
  fi

  echo "🔄 Traduzindo: $rel (${#content} chars)"

  # Chama a API do Claude
  local response
  response=$(curl -s -f --max-time 120 \
    "https://api.anthropic.com/v1/messages" \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$(jq -n \
      --arg model "$MODEL" \
      --arg system "$SYSTEM_PROMPT" \
      --arg content "$content" \
      '{
        model: $model,
        max_tokens: 8192,
        system: $system,
        messages: [{
          role: "user",
          content: ("Traduza o seguinte arquivo Markdown para pt-BR:\n\n" + $content)
        }]
      }'
    )") || {
    echo "❌ Erro na API para: $rel" >&2
    return 1
  }

  local translated
  translated=$(echo "$response" | jq -r '.content[0].text // empty')

  if [[ -z "$translated" ]]; then
    echo "❌ Resposta vazia da API para: $rel" >&2
    echo "   Resposta: $(echo "$response" | jq -r '.error.message // .')" >&2
    return 1
  fi

  # Escreve o arquivo traduzido
  echo "$translated" > "$file"
  echo "✅ Traduzido: $rel"
}

export -f translate_file is_translated
export REPO_ROOT API_KEY SYSTEM_PROMPT MODEL FORCE

# Coleta arquivos a processar
mapfile -t FILES < <(
  if [[ -n "$FILTER_DIR" ]]; then
    find "$REPO_ROOT/$FILTER_DIR" -name "*.md" -type f | sort
  else
    {
      find "$REPO_ROOT/docs" -name "*.md" -type f
      find "$REPO_ROOT/skills" -name "SKILL.md" -type f
    } | sort
  fi
)

TOTAL=${#FILES[@]}
echo "📚 Total de arquivos: $TOTAL"
echo "⚙️  Concorrência: $CONCURRENCY | Modelo: $MODEL"
echo ""

# Processa com xargs em paralelo
printf '%s\n' "${FILES[@]}" | xargs -P "$CONCURRENCY" -I{} bash -c 'translate_file "$@"' _ {}

echo ""
echo "🎉 Concluído!"
