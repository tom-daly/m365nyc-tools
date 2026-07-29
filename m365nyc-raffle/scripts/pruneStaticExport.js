#!/usr/bin/env node
/**
 * Next copies everything under public/ into the static export. Some of that is
 * local-only working data that must never be published — notably the ~340MB of
 * full-resolution attendee photos in public/originals-backup, which is both far
 * over the Azure Static Web Apps size limit and not ours to hand out.
 *
 * This prunes those paths from out/ after the export. Only the build artifact is
 * touched; public/ is left alone.
 */
const { promises: fs } = require('node:fs');
const path = require('node:path');

const EXCLUDED_FROM_DEPLOY = ['originals-backup'];

const main = async () => {
  const outDirectory = path.join(process.cwd(), 'out');

  try {
    await fs.access(outDirectory);
  } catch {
    console.error('❌ No out/ directory found — run `next build` with output: "export" first.');
    process.exit(1);
  }

  for (const relativePath of EXCLUDED_FROM_DEPLOY) {
    const target = path.join(outDirectory, relativePath);

    try {
      await fs.rm(target, { recursive: true, force: true });
      console.log(`🧹 Pruned out/${relativePath} from the static export.`);
    } catch (error) {
      console.warn(`⚠️ Could not prune out/${relativePath}:`, error);
    }
  }

  // Lives at the repo root rather than in public/ because .gitignore excludes
  // /public*, which would leave the host config untracked.
  try {
    await fs.copyFile(
      path.join(process.cwd(), 'staticwebapp.config.json'),
      path.join(outDirectory, 'staticwebapp.config.json')
    );
    console.log('📄 Copied staticwebapp.config.json into the static export.');
  } catch (error) {
    console.warn('⚠️ Could not copy staticwebapp.config.json:', error);
  }
};

main().catch((error) => {
  console.error('❌ Failed to prune the static export:', error);
  process.exit(1);
});
