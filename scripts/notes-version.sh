#!/usr/bin/env bash
# Affiche la section d'une version de CHANGELOG.md (sans son titre) : notes de la release GitHub.
# Usage : scripts/notes-version.sh 0.8.0
set -euo pipefail
cd "$(dirname "$0")/.."
awk -v v="$1" '
  index($0, "## [" v "]") == 1 { on = 1; next }
  on && /^## \[/ { exit }
  on { print }
' CHANGELOG.md | sed '/^Versions antérieures/d' | sed -e '/./,$!d' -e :a -e '/^\n*$/{$d;N;ba' -e '}'
