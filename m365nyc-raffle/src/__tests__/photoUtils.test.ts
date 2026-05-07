import { describe, expect, it } from '@jest/globals';
import {
  createGeneratedAvatarDataUrl,
  getCatalogPhotoPath,
  getOptimalCatalogPhotoPath,
  getResolvedPhotoPath,
  sanitizePhotoName,
  userHasCatalogPhoto,
  type PhotoCatalogSnapshot,
} from '@/utils/photoUtils';

const buildCatalog = (overrides?: Partial<PhotoCatalogSnapshot>): PhotoCatalogSnapshot => ({
  loaded: true,
  hasPhotos: true,
  users: new Set(['tommy_salami']),
  ...overrides,
});

describe('photoUtils catalog helpers', () => {
  it('sanitizes names consistently for photo directories', () => {
    expect(sanitizePhotoName(' Tommy Salami! ')).toBe('tommy_salami');
    expect(sanitizePhotoName('')).toBeNull();
    expect(sanitizePhotoName(undefined)).toBeNull();
  });

  it('returns false when the catalog says no photos are available', () => {
    const emptyCatalog = buildCatalog({ hasPhotos: false, users: new Set() });

    expect(userHasCatalogPhoto('Tommy Salami', emptyCatalog)).toBe(false);
    expect(getCatalogPhotoPath('Tommy Salami', 'thumbnail', emptyCatalog)).toBeNull();
  });

  it('returns the expected path when the user exists in the catalog', () => {
    const catalog = buildCatalog();

    expect(userHasCatalogPhoto('Tommy Salami', catalog)).toBe(true);
    expect(getCatalogPhotoPath('Tommy Salami', 'thumbnail', catalog)).toBe('/users/tommy_salami/thumbnail.webp');
    expect(getOptimalCatalogPhotoPath('Tommy Salami', 160, catalog)).toBe('/users/tommy_salami/avatar.webp');
  });

  it('prefers a generated avatar source when one is provided', () => {
    const generatedAvatar = createGeneratedAvatarDataUrl('Tommy Salami');

    expect(generatedAvatar).toContain('data:image/svg+xml');
    expect(getResolvedPhotoPath('Tommy Salami', 'thumbnail', buildCatalog(), generatedAvatar)).toBe(generatedAvatar);
  });
});
