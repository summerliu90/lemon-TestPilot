#!/bin/zsh
set -e
SCRIPT_DIR="${0:A:h}"
NODE_BIN="/Users/huahua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [[ ! -x "$NODE_BIN" ]]; then NODE_BIN="$(command -v node)"; fi
if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  echo "未找到 Node.js，请先安装 Node.js 22 或更高版本。"
  read -k 1 "?按任意键关闭..."
  exit 1
fi
cd /private/tmp
exec "$NODE_BIN" "$SCRIPT_DIR/server-runtime.mjs" --production
