#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

print_ok() {
  printf "✓ %s\n" "$1"
}

print_warn() {
  printf "⚠ %s\n" "$1"
}

print_fail() {
  printf "✖ %s\n" "$1"
}

if ! command -v node >/dev/null 2>&1; then
  print_fail "Node.js is not installed."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -ne 20 ]; then
  print_warn "Node $(node -v) detected. Recommended: Node v20.x for Expo SDK 54 stability."
  print_warn "Run: source ~/.nvm/nvm.sh && nvm install 20 && nvm use 20"
else
  print_ok "Node version is $(node -v)"
fi

if command -v watchman >/dev/null 2>&1; then
  print_ok "Watchman installed: $(watchman --version)"
else
  print_fail "Watchman not installed. Install with: /opt/homebrew/bin/brew install watchman"
  exit 1
fi

for port in 8081 8082 8083; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    print_warn "Port $port is busy. Clearing stale Node processes."
    killall node >/dev/null 2>&1 || true
    break
  fi
done

print_ok "Preflight complete."
