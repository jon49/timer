#!/usr/bin/env bash
# Checks that every implementation behaves the same for the user, in headless
# Chromium against the builds in dist/.
#   ./tasks/e2e.sh                     build, then check all
#   ./tasks/e2e.sh --no-build van-timer solid-timer   check only these
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${1:-}" = "--no-build" ]; then shift; else ./tasks/build.sh > /dev/null; fi
node tasks/e2e.mjs "$@"
