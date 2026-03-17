#!/usr/bin/env bash
# scripts/sync-upstream.sh
#
# Sync seletivo com o upstream OpenClaw, aplicando renaming openclaw→opencraft
# em cada cherry-pick.
#
# Uso:
#   ./scripts/sync-upstream.sh           # mostra últimos 20 commits do upstream
#   ./scripts/sync-upstream.sh -n 50     # mostra últimos 50 commits
#   ./scripts/sync-upstream.sh -h <hash> # aplica um commit específico diretamente

set -euo pipefail

# ── Cores ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Constantes ───────────────────────────────────────────────────────────────
UPSTREAM_URL="https://github.com/editzffaleta/OpenCraft.git"
UPSTREAM_REMOTE="upstream"
UPSTREAM_BRANCH="main"
DEFAULT_N=20

# ── Regras de renaming openclaw→opencraft ────────────────────────────────────
# Exceções que NUNCA devem ser renomeadas:
#   - OPENCLAW_* env vars de runtime (OPENCLAW_GATEWAY_TOKEN, etc.)
#   - @openclaw/ npm packages externos
#   - openclaw-sandbox* nomes de container Docker
#   - group:openclaw
#   - /__openclaw__/ URL paths internos
#   - /tmp/openclaw/ caminhos de log
#   - OpenClaw.xcodeproj / OpenClawKit / OpenClawProtocol (Swift identifiers)
#   - ai.openclaw.* / com.openclaw.* bundle IDs
#   - openclaw.mjs binário de compatibilidade

apply_renames() {
    local file="$1"

    # Pula arquivos binários
    if ! file "$file" | grep -qE 'text|empty'; then
        return
    fi

    # Pula arquivos que não devem ser tocados
    case "$file" in
        apps/macos/*.xcodeproj/*|apps/macos/OpenClaw*|apps/shared/*/OpenClawKit/*|apps/shared/*/OpenClawProtocol/*)
            return ;;
        *.pbxproj|*.plist)
            return ;;
    esac

    # Renaming em cascata (mais específico primeiro para não fazer double-replace)
    # OpenClaw → OpenCraft (title case)
    sed -i '' \
        -e 's/OpenCraftDiscovery/OpenCraftDiscovery/g' \
        -e 's/OpenCraftMacCLI/OpenCraftMacCLI/g' \
        -e 's|editzffaleta/OpenCraft|editzffaleta/OpenCraft|g' \
        -e 's|openclaw\.ai|opencraft\.ai|g' \
        -e 's|docs\.openclaw\.ai|docs\.opencraft\.ai|g' \
        -e 's|"OpenCraft"|"OpenCraft"|g' \
        -e "s/'OpenCraft'/'OpenCraft'/g" \
        -e 's/OpenCraft Gateway/OpenCraft Gateway/g' \
        -e 's/OpenCraft CLI/OpenCraft CLI/g' \
        "$file" 2>/dev/null || true

    # openclaw → opencraft (lowercase) — exceto exceções
    sed -i '' \
        -e '/OPENCLAW_GATEWAY_TOKEN/!s/openclaw\.plugin\.json/opencraft\.plugin\.json/g' \
        -e '/OPENCLAW_GATEWAY_TOKEN/!s/@openclaw\/test-/@opencraft\/test-/g' \
        -e '/OPENCLAW_GATEWAY_TOKEN/!s/"openclaw": {/"opencraft": {/g' \
        -e '/OPENCLAW_GATEWAY_TOKEN/!s/openclaw\.hooks/opencraft\.hooks/g' \
        -e '/OPENCLAW_GATEWAY_TOKEN/!s/openclaw-bundled/opencraft-bundled/g' \
        -e '/OPENCLAW_GATEWAY_TOKEN/!s/openclaw-test-home/opencraft-test-home/g' \
        -e '/OPENCLAW_GATEWAY_TOKEN/!s/openclaw-test-/opencraft-test-/g' \
        -e '/OPENCLAW_GATEWAY_TOKEN/!s/openclaw-pnpm-store/opencraft-pnpm-store/g' \
        -e '/OPENCLAW_GATEWAY_TOKEN/!s/openclaw-bookworm/opencraft-bookworm/g' \
        "$file" 2>/dev/null || true

    # OPENCLAW_* build-time vars (Dockerfile ARGs, scripts internos) → OPENCRAFT_*
    # Exceção: manter OPENCLAW_GATEWAY_TOKEN e outros runtime env vars intactos
    sed -i '' \
        -e 's/OPENCRAFT_NODE_BOOKWORM/OPENCRAFT_NODE_BOOKWORM/g' \
        -e 's/OPENCRAFT_EXTENSIONS/OPENCRAFT_EXTENSIONS/g' \
        -e 's/OPENCRAFT_VARIANT/OPENCRAFT_VARIANT/g' \
        -e 's/OPENCRAFT_PREFER_PNPM/OPENCRAFT_PREFER_PNPM/g' \
        -e 's/OPENCRAFT_INSTALL_BROWSER/OPENCRAFT_INSTALL_BROWSER/g' \
        -e 's/OPENCRAFT_INSTALL_DOCKER_CLI/OPENCRAFT_INSTALL_DOCKER_CLI/g' \
        -e 's/OPENCRAFT_DOCKER_APT_PACKAGES/OPENCRAFT_DOCKER_APT_PACKAGES/g' \
        -e 's/OPENCRAFT_DOCKER_GPG_FINGERPRINT/OPENCRAFT_DOCKER_GPG_FINGERPRINT/g' \
        -e 's/OPENCRAFT_A2UI_/OPENCRAFT_A2UI_/g' \
        -e 's/OPENCRAFT_WATCH_MODE/OPENCRAFT_WATCH_MODE/g' \
        -e 's/OPENCRAFT_WATCH_SESSION/OPENCRAFT_WATCH_SESSION/g' \
        -e 's/OPENCRAFT_WATCH_COMMAND/OPENCRAFT_WATCH_COMMAND/g' \
        -e 's/OPENCRAFT_TEST_FAST/OPENCRAFT_TEST_FAST/g' \
        -e 's/OPENCRAFT_STATE_DIR/OPENCRAFT_STATE_DIR/g' \
        -e 's/OPENCRAFT_CONFIG_PATH/OPENCRAFT_CONFIG_PATH/g' \
        -e 's/OPENCRAFT_GATEWAY_PORT/OPENCRAFT_GATEWAY_PORT/g' \
        -e 's/OPENCRAFT_BIN/OPENCRAFT_BIN/g' \
        -e 's/OPENCRAFT_INSTALL_SH_NO_RUN/OPENCRAFT_INSTALL_SH_NO_RUN/g' \
        -e 's/OPENCRAFT_HOME/OPENCRAFT_HOME/g' \
        -e 's/OPENCRAFT_LIVE_TEST/OPENCRAFT_LIVE_TEST/g' \
        -e 's/OPENCRAFT_LIVE_GATEWAY/OPENCRAFT_LIVE_GATEWAY/g' \
        -e 's/OPENCRAFT_BRIDGE_/OPENCRAFT_BRIDGE_/g' \
        -e 's/OPENCRAFT_CANVAS_HOST_PORT/OPENCRAFT_CANVAS_HOST_PORT/g' \
        -e 's/OPENCRAFT_TEST_HOME/OPENCRAFT_TEST_HOME/g' \
        -e 's/OPENCRAFT_TEST_MEMORY/OPENCRAFT_TEST_MEMORY/g' \
        "$file" 2>/dev/null || true
}

# ── Helpers ──────────────────────────────────────────────────────────────────
log()  { echo -e "${CYAN}▶${RESET} $*"; }
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${YELLOW}⚠${RESET} $*"; }
err()  { echo -e "${RED}✗${RESET} $*" >&2; }

confirm() {
    local prompt="$1"
    local answer
    echo -en "${BOLD}${prompt}${RESET} [y/n/q] "
    read -r answer
    case "$answer" in
        y|Y|yes|YES) return 0 ;;
        q|Q|quit)    echo "Abortando."; exit 0 ;;
        *)           return 1 ;;
    esac
}

require_clean_tree() {
    if ! git diff --quiet || ! git diff --cached --quiet; then
        err "Árvore de trabalho suja. Faça commit ou stash antes de continuar."
        exit 1
    fi
}

ensure_upstream() {
    if ! git remote get-url "$UPSTREAM_REMOTE" &>/dev/null; then
        log "Adicionando remote upstream: $UPSTREAM_URL"
        git remote add "$UPSTREAM_REMOTE" "$UPSTREAM_URL"
    fi
    log "Fazendo fetch do upstream..."
    git fetch "$UPSTREAM_REMOTE" "$UPSTREAM_BRANCH" --quiet
    ok "Upstream atualizado."
}

apply_commit() {
    local hash="$1"

    log "Aplicando cherry-pick de $hash (sem commit automático)..."

    # Tenta cherry-pick sem commit; se conflito, para e avisa
    if ! git cherry-pick "$hash" --no-commit 2>/dev/null; then
        warn "Cherry-pick resultou em conflitos. Resolva manualmente e rode:"
        echo "  git cherry-pick --continue"
        echo "  (ou use: git cherry-pick --abort para cancelar)"
        return 1
    fi

    # Lista arquivos alterados pelo cherry-pick
    local changed_files
    changed_files=$(git diff --cached --name-only)

    if [[ -z "$changed_files" ]]; then
        warn "Nenhum arquivo alterado pelo cherry-pick. Pulando."
        git cherry-pick --abort 2>/dev/null || true
        return 0
    fi

    echo ""
    log "Aplicando renaming openclaw→opencraft nos arquivos alterados:"
    while IFS= read -r f; do
        if [[ -f "$f" ]]; then
            apply_renames "$f"
            git add "$f"
            echo "  📝 $f"
        fi
    done <<< "$changed_files"

    # Pega a mensagem original do commit upstream
    local original_msg
    original_msg=$(git log -1 --format="%s%n%n%b" "$hash")
    local short_hash
    short_hash=$(git log -1 --format="%h" "$hash")

    echo ""
    echo -e "${BOLD}Mensagem do commit original:${RESET}"
    echo "$original_msg" | head -5
    echo ""

    if confirm "Confirmar commit com esta mensagem?"; then
        git commit -m "$(printf '%s\n\nPortado do upstream %s (openclaw→opencraft)\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>' "$original_msg" "$short_hash")"
        ok "Commit aplicado: $short_hash"
    else
        warn "Commit cancelado. Mudanças ficam em stage — use 'git reset HEAD' para desfazer."
    fi
}

# ── Modo hash direto ──────────────────────────────────────────────────────────
if [[ "${1:-}" == "-h" && -n "${2:-}" ]]; then
    require_clean_tree
    ensure_upstream

    HASH="$2"
    echo ""
    echo -e "${BOLD}=== Diff do commit $HASH ===${RESET}"
    git show "$HASH" --stat
    echo ""
    git show "$HASH" -p | head -80
    echo ""

    if confirm "Aplicar este commit?"; then
        apply_commit "$HASH"
    fi
    exit 0
fi

# ── Modo interativo (padrão) ──────────────────────────────────────────────────
N="${1:-$DEFAULT_N}"
if [[ "$N" == "-n" ]]; then
    N="${2:-$DEFAULT_N}"
fi

require_clean_tree
ensure_upstream

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Últimos $N commits do upstream (openclaw/main)${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo ""

# Lista commits com hash, data e mensagem
git log "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" --oneline -"$N" --format="%C(yellow)%h%Creset %C(dim)%ad%Creset %s" --date=short
echo ""

echo -e "${BOLD}Para aplicar commits individualmente:${RESET}"
echo "  $0 -h <hash>    aplica um commit específico"
echo "  $0 -n 50        lista 50 commits"
echo ""

# Modo de aplicação em lote opcional
if confirm "Percorrer commits interativamente e escolher quais aplicar?"; then
    echo ""
    HASHES=$(git log "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" --oneline -"$N" --format="%H")

    while IFS= read -r hash; do
        short=$(git log -1 --format="%h %s" "$hash")
        echo ""
        echo -e "${BOLD}── $short${RESET}"
        git show "$hash" --stat --no-commit-id | tail -6

        case "$(bash -c 'read -rp "[a]plicar / [p]ular / [d]etalhes / [q]sair: " r; echo $r')" in
            a|A)
                apply_commit "$hash"
                ;;
            d|D)
                git show "$hash" -p | "${PAGER:-less}"
                if confirm "Aplicar este commit?"; then
                    apply_commit "$hash"
                fi
                ;;
            q|Q)
                echo "Saindo."
                exit 0
                ;;
            *)
                log "Pulando $short"
                ;;
        esac
    done <<< "$HASHES"
fi

echo ""
ok "Sessão de sync concluída."
