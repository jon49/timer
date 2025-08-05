#!/bin/bash

echo "Building…"
./tasks/build.sh

echo "Publishing…"
rsync -ru dist/* $1:$2
echo "Done."
