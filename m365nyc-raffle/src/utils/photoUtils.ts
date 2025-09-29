/**
 * Utility functions for handling user photos
 */

/**
 * Get the avatar path for a given user name (200x200 for large displays)
 * @param name - The user's full name
 * @returns The path to the user's avatar or null if not found
 */
export const getUserAvatarPath = (name: string): string | null => {
  if (!name) return null;
  
  try {
    // Convert name to lowercase with underscores (e.g., "John Doe" → "john_doe")
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').replace(/^_+|_+$/g, '');
    const avatarPath = `/users/${sanitizedName}/avatar.webp`;
    return avatarPath;
  } catch (error) {
    console.warn(`Could not get avatar path for ${name}:`, error);
    return null;
  }
};

/**
 * Get the large photo path for a given user name (300x300 for large displays)
 * @param name - The user's full name
 * @returns The path to the user's large photo or null if not found
 */
export const getUserLargePhotoPath = (name: string): string | null => {
  if (!name) return null;
  
  try {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').replace(/^_+|_+$/g, '');
    const largePath = `/users/${sanitizedName}/lg.webp`;
    return largePath;
  } catch (error) {
    console.warn(`Could not get large photo path for ${name}:`, error);
    return null;
  }
};

/**
 * Get the small photo path for a given user name (150x150 for medium displays)
 * @param name - The user's full name
 * @returns The path to the user's small photo or null if not found
 */
export const getUserSmallPhotoPath = (name: string): string | null => {
  if (!name) return null;
  
  try {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').replace(/^_+|_+$/g, '');
    const smallPath = `/users/${sanitizedName}/sm.webp`;
    return smallPath;
  } catch (error) {
    console.warn(`Could not get small photo path for ${name}:`, error);
    return null;
  }
};

/**
 * Get the thumbnail path for a given user name (50x50 for small displays)
 * @param name - The user's full name
 * @returns The path to the user's thumbnail or null if not found
 */
export const getUserThumbnailPath = (name: string): string | null => {
  if (!name) return null;
  
  try {
    // Convert name to lowercase with underscores (e.g., "John Doe" → "john_doe")
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').replace(/^_+|_+$/g, '');
    const thumbnailPath = `/users/${sanitizedName}/thumbnail.webp`;
    return thumbnailPath;
  } catch (error) {
    console.warn(`Could not get thumbnail path for ${name}:`, error);
    return null;
  }
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
