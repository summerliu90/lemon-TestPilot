#!/bin/zsh
set -e
SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR"
NODE_BIN="/Users/huahua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [[ ! -x "$NODE_BIN" ]]; then NODE_BIN="$(command -v node)"; fi
exec "$NODE_BIN" server.mjs
