/**
 * Utility functions for handling user photos
 */

export type PhotoVariant = 'large' | 'avatar' | 'small' | 'thumbnail';

export interface PhotoCatalogSnapshot {
  loaded: boolean;
  hasPhotos: boolean;
  users: Set<string>;
}

interface InitialGradientDefinition {
  classes: string;
  start: string;
  end: string;
}

export const sanitizePhotoName = (name: string | null | undefined): string | null => {
  if (!name) return null;

  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');

  return sanitizedName || null;
};

const buildUserPhotoPath = (name: string, fileName: string): string | null => {
  try {
    const sanitizedName = sanitizePhotoName(name);
    return sanitizedName ? `/users/${sanitizedName}/${fileName}` : null;
  } catch (error) {
    console.warn(`Could not get photo path for ${name}:`, error);
    return null;
  }
};

const escapeSvgText = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const createGeneratedAvatarDataUrl = (name: string | null | undefined): string => {
  const safeName = name?.trim() || 'Player';
  const initials = getInitials(safeName) || 'P';
  const { start, end } = getInitialsGradientColors(safeName);
  const escapedName = escapeSvgText(safeName);
  const escapedInitials = escapeSvgText(initials);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${escapedName}">
      <defs>
        <linearGradient id="avatar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="64" fill="url(#avatar-gradient)" />
      <text
        x="64"
        y="64"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif"
        font-size="44"
        font-weight="700"
        fill="#ffffff"
      >${escapedInitials}</text>
    </svg>
  `.replace(/\s+/g, ' ').trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Get the avatar path for a given user name (200x200 for large displays)
 * @param name - The user's full name
 * @returns The path to the user's avatar or null if not found
 */
export const getUserAvatarPath = (name: string): string | null => {
  if (!name) return null;

  return buildUserPhotoPath(name, 'avatar.webp');
};

/**
 * Get the large photo path for a given user name (300x300 for large displays)
 * @param name - The user's full name
 * @returns The path to the user's large photo or null if not found
 */
export const getUserLargePhotoPath = (name: string): string | null => {
  if (!name) return null;

  return buildUserPhotoPath(name, 'lg.webp');
};

/**
 * Get the small photo path for a given user name (150x150 for medium displays)
 * @param name - The user's full name
 * @returns The path to the user's small photo or null if not found
 */
export const getUserSmallPhotoPath = (name: string): string | null => {
  if (!name) return null;

  return buildUserPhotoPath(name, 'sm.webp');
};

/**
 * Get the thumbnail path for a given user name (50x50 for small displays)
 * @param name - The user's full name
 * @returns The path to the user's thumbnail or null if not found
 */
export const getUserThumbnailPath = (name: string): string | null => {
  if (!name) return null;

  return buildUserPhotoPath(name, 'thumbnail.webp');
};

/**
 * @deprecated Use getUserAvatarPath or getUserThumbnailPath instead
 * Legacy function for backwards compatibility
 */
export const getUserPhotoPath = getUserAvatarPath;


/**
 * Get the best photo size for a given cell size in the Squid Game grid
 * @param name - The user's full name
 * @param cellSize - The pixel size of the grid cell
 * @returns The path to the most appropriate sized photo
 */
export const getOptimalPhotoPath = (name: string, cellSize: number): string | null => {
  if (!name) return null;
  
  // Choose the appropriate size based on cell size
  if (cellSize >= 250) {
    return getUserLargePhotoPath(name); // 300x300 for large cells
  } else if (cellSize >= 150) {
    return getUserAvatarPath(name); // 200x200 for medium cells
  } else if (cellSize >= 100) {
    return getUserSmallPhotoPath(name); // 150x150 for small cells
  } else {
    return getUserThumbnailPath(name); // 50x50 for tiny cells
  }
};

/**
 * Get the ultra-optimized 50x50 photo path for Squid Game animation
 * This is just an alias for getUserThumbnailPath for backwards compatibility
 * @param name - The user's full name
 * @returns The path to the user's 50x50 thumbnail
 */
export const getSquidGamePhotoPath = getUserThumbnailPath;

export const userHasCatalogPhoto = (
  name: string | null | undefined,
  photoCatalog: PhotoCatalogSnapshot
): boolean => {
  const sanitizedName = sanitizePhotoName(name);
  return Boolean(
    photoCatalog.loaded &&
      photoCatalog.hasPhotos &&
      sanitizedName &&
      photoCatalog.users.has(sanitizedName)
  );
};

export const getCatalogPhotoPath = (
  name: string,
  variant: PhotoVariant,
  photoCatalog: PhotoCatalogSnapshot
): string | null => {
  if (!userHasCatalogPhoto(name, photoCatalog)) {
    return null;
  }

  switch (variant) {
    case 'large':
      return getUserLargePhotoPath(name);
    case 'avatar':
      return getUserAvatarPath(name);
    case 'small':
      return getUserSmallPhotoPath(name);
    case 'thumbnail':
      return getUserThumbnailPath(name);
    default:
      return null;
  }
};

export const getOptimalCatalogPhotoPath = (
  name: string,
  cellSize: number,
  photoCatalog: PhotoCatalogSnapshot
): string | null => {
  if (!userHasCatalogPhoto(name, photoCatalog)) {
    return null;
  }

  return getOptimalPhotoPath(name, cellSize);
};

export const getResolvedPhotoPath = (
  name: string,
  variant: PhotoVariant,
  photoCatalog: PhotoCatalogSnapshot,
  avatarSrc?: string
): string | null => {
  if (avatarSrc) {
    return avatarSrc;
  }

  return getCatalogPhotoPath(name, variant, photoCatalog);
};

export const getResolvedOptimalPhotoPath = (
  name: string,
  cellSize: number,
  photoCatalog: PhotoCatalogSnapshot,
  avatarSrc?: string
): string | null => {
  if (avatarSrc) {
    return avatarSrc;
  }

  return getOptimalCatalogPhotoPath(name, cellSize, photoCatalog);
};

/**
 * Generate initials for the avatar fallback. Uses first letter of first word
 * and first letter of last word; falls back to the first two letters when only
 * one word is present. Returns '' for empty/whitespace/missing input.
 */
export const getInitials = (fullName: string | null | undefined): string => {
  if (!fullName) return '';
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  const firstInitial = words[0][0] ?? '';
  const lastInitial = words[words.length - 1][0] ?? '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const INITIAL_GRADIENTS: InitialGradientDefinition[] = [
  { classes: 'from-purple-500 to-pink-500', start: '#a855f7', end: '#ec4899' },
  { classes: 'from-blue-500 to-cyan-500', start: '#3b82f6', end: '#06b6d4' },
  { classes: 'from-green-500 to-emerald-500', start: '#22c55e', end: '#10b981' },
  { classes: 'from-orange-500 to-red-500', start: '#f97316', end: '#ef4444' },
  { classes: 'from-indigo-500 to-purple-500', start: '#6366f1', end: '#a855f7' },
  { classes: 'from-teal-500 to-green-500', start: '#14b8a6', end: '#22c55e' },
  { classes: 'from-rose-500 to-pink-500', start: '#f43f5e', end: '#ec4899' },
  { classes: 'from-yellow-500 to-orange-500', start: '#eab308', end: '#f97316' },
];

/**
 * Deterministic Tailwind gradient pair for the avatar fallback, hashed from the
 * name so the same user gets the same color across every photo component.
 */
export const getInitialsGradient = (name: string | null | undefined): string => {
  if (!name) return INITIAL_GRADIENTS[0].classes;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return INITIAL_GRADIENTS[Math.abs(hash) % INITIAL_GRADIENTS.length].classes;
};

export const getInitialsGradientColors = (name: string | null | undefined): { start: string; end: string } => {
  if (!name) {
    return { start: INITIAL_GRADIENTS[0].start, end: INITIAL_GRADIENTS[0].end };
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const gradient = INITIAL_GRADIENTS[Math.abs(hash) % INITIAL_GRADIENTS.length];
  return { start: gradient.start, end: gradient.end };
};
