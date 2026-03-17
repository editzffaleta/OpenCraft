#!/usr/bin/env bash
set -euo pipefail

cd /repo

export OPENCRAFT_STATE_DIR="/tmp/opencraft-test"
export OPENCRAFT_CONFIG_PATH="${OPENCRAFT_STATE_DIR}/opencraft.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${OPENCRAFT_STATE_DIR}/credentials"
mkdir -p "${OPENCRAFT_STATE_DIR}/agents/main/sessions"
echo '{}' >"${OPENCRAFT_CONFIG_PATH}"
echo 'creds' >"${OPENCRAFT_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${OPENCRAFT_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm opencraft reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${OPENCRAFT_CONFIG_PATH}"
test ! -d "${OPENCRAFT_STATE_DIR}/credentials"
test ! -d "${OPENCRAFT_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${OPENCRAFT_STATE_DIR}/credentials"
echo '{}' >"${OPENCRAFT_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm opencraft uninstall --state --yes --non-interactive

test ! -d "${OPENCRAFT_STATE_DIR}"

echo "OK"
