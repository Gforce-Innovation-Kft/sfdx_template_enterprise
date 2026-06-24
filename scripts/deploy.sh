#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/deploy.sh <org-alias>
TARGET="${1:?Usage: deploy.sh <org-alias>}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "▶ Deploying to: $TARGET"
sf project deploy start --target-org "$TARGET"
echo "✔ Deploy complete → $TARGET"
