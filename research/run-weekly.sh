#!/bin/bash
# Research Agent — eseguito da launchd ogni domenica alle 09:00
# Log: research/logs/weekly.log e weekly-error.log

set -euo pipefail

# Auto-localizzante: il progetto è la cartella che contiene research/.
# Così lo script funziona ovunque sposti il repo, senza path hardcoded.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$(dirname "$SCRIPT_DIR")"
LOGS="$PROJECT/research/logs"

mkdir -p "$LOGS"

echo ""
echo "=== SELF OS Research Agent — $(date '+%Y-%m-%d %H:%M:%S %Z') ==="

# Carica nvm (non disponibile nell'ambiente launchd)
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
elif command -v node &>/dev/null; then
  : # node già nel PATH (homebrew o sistema)
elif [ -x "/opt/homebrew/bin/node" ]; then
  export PATH="/opt/homebrew/bin:$PATH"
elif [ -x "/usr/local/bin/node" ]; then
  export PATH="/usr/local/bin:$PATH"
else
  echo "ERROR: node non trovato — installa nvm o homebrew node" >&2
  exit 1
fi

echo "node: $(node --version)  npm: $(npm --version)"

cd "$PROJECT"
npm run research

echo "=== Fine run $(date '+%H:%M:%S') ==="
