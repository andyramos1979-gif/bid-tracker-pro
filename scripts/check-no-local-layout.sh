#!/usr/bin/env bash
# Drift guard (Item 7): fail if a local duplicate of the @are/ui layout primitives
# reappears. @are/ui is the single source of truth — import from it, never re-declare
# ResponsiveShell/Grid/KPIGrid/Table locally. Run in CI or pre-commit: npm run check:layout
set -euo pipefail
hits=$(grep -rlE "export (function|const) (ResponsiveShell|ResponsiveGrid|ResponsiveKPIGrid|ResponsiveTable)\b" \
  --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' . 2>/dev/null | grep -v node_modules || true)
if [ -n "$hits" ]; then
  echo "ERROR: local duplicate of @are/ui layout primitives found — import from @are/ui instead:" >&2
  echo "$hits" >&2
  exit 1
fi
echo "OK — no local @are/ui layout duplicates."
