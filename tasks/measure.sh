#!/usr/bin/env bash
# Builds every implementation, then measures them in headless Chromium and
# prints the comparison table for README.md.
#   ./tasks/measure.sh           build, then measure
#   ./tasks/measure.sh --no-build measure what's already in dist/
set -euo pipefail
cd "$(dirname "$0")/.."
[ "${1:-}" = "--no-build" ] || ./tasks/build.sh > /dev/null
node tasks/measure.mjs
