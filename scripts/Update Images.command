#!/bin/bash
# Double-click this file in Finder to update image manifests.
# Run it any time you add or remove images from the /images/ folder.

cd "$(dirname "$0")/.."
node scripts/build-manifests.js
echo ""
echo "Press any key to close..."
read -n 1
