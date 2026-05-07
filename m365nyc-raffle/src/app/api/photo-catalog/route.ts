import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const PHOTO_FILES = new Set(['avatar.webp', 'lg.webp', 'sm.webp', 'thumbnail.webp']);

const getAvailablePhotoUsers = async (): Promise<string[]> => {
  const usersDirectory = path.join(process.cwd(), 'public', 'users');

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

    return users.filter((user): user is string => Boolean(user));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('⚠️ Could not read public\\users while building the photo catalog:', error);
    }

    return [];
  }
};

export async function GET() {
  const users = await getAvailablePhotoUsers();
  const payload = {
    hasPhotos: users.length > 0,
    users,
  };

  console.log('🖼️ Photo catalog request resolved', {
    hasPhotos: payload.hasPhotos,
    userCount: users.length,
  });

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
