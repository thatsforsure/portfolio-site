#!/usr/bin/env node
/**
 * build-manifests.js
 *
 * Scans every subdirectory under /images/portfolio/ and writes a
 * manifest.json listing all media files (sorted by filename).
 *
 * Usage (from project root):
 *   node scripts/build-manifests.js
 *
 * Run this once after adding or removing images/videos in any folder.
 * The browser reads manifest.json to know which files to display —
 * no need to edit any HTML.
 *
 * Supported extensions: .webp .jpg .jpeg .png .gif .mp4 .mov .webm
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const MEDIA_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.webm']);
const ROOT       = path.join(__dirname, '..', 'images', 'portfolio');

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  // Collect media files in this directory, sorted alphabetically
  const media = entries
    .filter(e => e.isFile() && MEDIA_EXTS.has(path.extname(e.name).toLowerCase()))
    .map(e => e.name)
    .sort();

  if (media.length) {
    const out = path.join(dir, 'manifest.json');
    fs.writeFileSync(out, JSON.stringify(media, null, 2) + '\n');
    const rel = path.relative(process.cwd(), out);
    console.log(`  wrote  ${rel}  (${media.length} file${media.length === 1 ? '' : 's'})`);
  }

  // Recurse into subdirectories
  entries
    .filter(e => e.isDirectory())
    .forEach(e => walk(path.join(dir, e.name)));
}

console.log('Building manifests…\n');
walk(ROOT);
console.log('\nDone. Refresh the browser to see changes.');
