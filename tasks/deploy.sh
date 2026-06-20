#!/bin/bash

echo "Building…"
./tasks/build.sh

echo "Publishing…"
# -c (--checksum): skip rebuilt-but-unchanged files so they keep their old
# mtime on the server, keeping nginx's ETag ("mtime-size") stable.
rsync -ruc dist/* $1:$2
echo "Done."
