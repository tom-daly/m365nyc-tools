#!/usr/bin/env node
/**
 * Clears photo data before a fresh Goosechase ingest.
 *
 *   ingest/raw/        SOURCE  — extracted photos, the only copy on disk
 *   ingest/teams.csv   derived — rebuilt by convertParticipants.js
 *   ingest/_*          scratch — safe to clear any time
 *   public/users/      derived — optimized avatars, rebuilt by optimize:images
 *
 * Dry run by default. ingest/raw is excluded unless explicitly requested, because
 * it is the only copy of the source photos — losing it means re-downloading the
 * ~360MB export, and anyone absent from the newer export is gone for good.
 *
 * Usage:
 *   node scripts/wipePhotoData.js                    # report only
 *   node scripts/wipePhotoData.js --confirm          # wipe derived + scratch
 *   node scripts/wipePhotoData.js --confirm --include-raw
 */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const DERIVED_TARGETS = [
  'public/users',
  'public/photo-catalog.json',
  'ingest/teams.csv',
  'ingest/_temp',
  'ingest/_backup',
  'out',
  // Legacy: earlier pipelines kept a duplicate of the source photos inside
  // public/, one prune-step failure away from being published.
  'public/originals-backup',
];

const SOURCE_TARGET = 'ingest/raw';

const countFiles = (target) => {
  if (!fs.existsSync(target)) return null;
  if (fs.statSync(target).isFile()) return 1;

  let total = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name));
      else total += 1;
    }
  };
  walk(target);
  return total;
};

const main = async () => {
  const confirm = process.argv.includes('--confirm');
  const includeRaw = process.argv.includes('--include-raw');

  const targets = [...DERIVED_TARGETS];
  if (includeRaw) targets.push(SOURCE_TARGET);

  console.log(confirm ? '🧹 Wiping:\n' : '🔎 Dry run — would wipe:\n');

  let found = 0;
  for (const relativePath of targets) {
    const target = path.join(process.cwd(), relativePath);
    const fileCount = countFiles(target);

    if (fileCount === null) {
      console.log(`   ·  ${relativePath} (absent)`);
      continue;
    }

    found += 1;
    console.log(`   ✗  ${relativePath} (${fileCount} file${fileCount === 1 ? '' : 's'})`);
    if (confirm) await fsp.rm(target, { recursive: true, force: true });
  }

  if (!includeRaw) {
    const sourceCount = countFiles(path.join(process.cwd(), SOURCE_TARGET));
    if (sourceCount !== null) {
      console.log(`\n   ✓  ${SOURCE_TARGET} kept (${sourceCount} files) — pass --include-raw to remove.`);
    }
  } else if (confirm) {
    console.log('\n⚠️ Source photos deleted. They exist only in the Goosechase export now.');
  }

  if (!confirm) {
    console.log(`\n${found} target(s) present. Re-run with --confirm to delete.`);
  } else {
    console.log('\n✅ Wipe complete.');
  }
};

main().catch((error) => {
  console.error('\n❌ Wipe failed:', error);
  process.exit(1);
});
