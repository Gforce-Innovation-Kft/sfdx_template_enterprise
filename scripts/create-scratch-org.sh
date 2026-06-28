#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/create-scratch-org.sh [alias] [definition]
ALIAS="${1:-dev-scratch}"
DEF="${2:-config/scratch-orgs/dev.json}"
DURATION="${3:-30}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "▶ Creating scratch org: $ALIAS (definition: $DEF, duration: ${DURATION}d)"

sf org create scratch \
  --definition-file "$DEF" \
  --alias "$ALIAS" \
  --duration-days "$DURATION" \
  --set-default

echo "▶ Pushing source..."
sf project deploy start --target-org "$ALIAS"



echo "✔ Scratch org ready: $ALIAS"
echo "  Open: sf org open --target-org $ALIAS"
