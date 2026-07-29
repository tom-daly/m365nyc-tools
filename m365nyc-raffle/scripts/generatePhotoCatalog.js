#!/usr/bin/env node
/**
 * Build-time replacement for the old /api/photo-catalog route handler.
 *
 * A static export has no server, so the catalog of users that have photos on
 * disk is snapshotted into public/photo-catalog.json at build time instead of
 * being read from the filesystem per request.
 */
const { promises: fs } = require('node:fs');
const path = require('node:path');

const PHOTO_FILES = new Set(['avatar.webp', 'lg.webp', 'sm.webp', 'thumbnail.webp']);

const getAvailablePhotoUsers = async (usersDirectory) => {
  try {
    const directoryEntries = await fs.readdir(usersDirectory, { withFileTypes: true });
    const users = await Promise.all(
      directoryEntries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          try {
            const files = await fs.readdir(path.join(usersDirectory, entry.name));
            return files.some((file) => PHOTO_FILES.has(file)) ? entry.name : null;
          } catch (error) {
            console.warn(`⚠️ Could not inspect photo directory for ${entry.name}:`, error);
            return null;
          }
        })
    );

    return users.filter(Boolean);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('⚠️ Could not read public/users while building the photo catalog:', error);
    }

    return [];
  }
};

const main = async () => {
  const publicDirectory = path.join(process.cwd(), 'public');
  const users = await getAvailablePhotoUsers(path.join(publicDirectory, 'users'));
  const payload = {
    hasPhotos: users.length > 0,
    users: users.sort(),
  };

  await fs.mkdir(publicDirectory, { recursive: true });
  await fs.writeFile(
    path.join(publicDirectory, 'photo-catalog.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  console.log(`🖼️ Photo catalog written with ${users.length} user(s).`);
  if (users.length === 0) {
    console.log('   No public/users/<name>/*.webp found — avatars will fall back to gradients.');
  }
};

main().catch((error) => {
  console.error('❌ Failed to generate the photo catalog:', error);
  process.exit(1);
});
