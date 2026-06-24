#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/run-tests.sh [org-alias] [test-level]
TARGET="${1:?Usage: run-tests.sh <org-alias> [RunLocalTests|RunAllTestsInOrg|RunSpecifiedTests]}"
LEVEL="${2:-RunLocalTests}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "▶ Running Apex tests on $TARGET (level: $LEVEL)"

sf apex run test \
  --target-org "$TARGET" \
  --test-level "$LEVEL" \
  --result-format human \
  --output-dir test-results \
  --wait 10

echo "✔ Tests complete. Results in test-results/"
