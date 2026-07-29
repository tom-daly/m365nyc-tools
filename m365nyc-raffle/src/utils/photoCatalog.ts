'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { PhotoCatalogSnapshot } from '@/utils/photoUtils';

interface PhotoCatalogResponse {
  hasPhotos: boolean;
  users: string[];
}

const createEmptyPhotoCatalogSnapshot = (loaded = false): PhotoCatalogSnapshot => ({
  loaded,
  hasPhotos: false,
  users: new Set<string>(),
});

let photoCatalogSnapshot: PhotoCatalogSnapshot = createEmptyPhotoCatalogSnapshot();
let photoCatalogPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const setPhotoCatalogSnapshot = (nextSnapshot: PhotoCatalogSnapshot) => {
  photoCatalogSnapshot = nextSnapshot;
  notifyListeners();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => photoCatalogSnapshot;

const getServerSnapshot = () => createEmptyPhotoCatalogSnapshot();

export const ensurePhotoCatalogLoaded = async (): Promise<void> => {
  if (photoCatalogSnapshot.loaded) {
    return;
  }

  if (photoCatalogPromise) {
    return photoCatalogPromise;
  }

  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.NODE_ENV === 'test') {
    setPhotoCatalogSnapshot(createEmptyPhotoCatalogSnapshot(true));
    return;
  }

  photoCatalogPromise = fetch('/photo-catalog.json', { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Photo catalog request failed with ${response.status}`);
      }

      const data = (await response.json()) as PhotoCatalogResponse;
      console.log('🖼️ Photo catalog loaded', {
        hasPhotos: data.hasPhotos,
        userCount: data.users.length,
      });

      setPhotoCatalogSnapshot({
        loaded: true,
        hasPhotos: data.hasPhotos,
        users: new Set(data.users),
      });
    })
    .catch((error) => {
      console.warn('⚠️ Falling back to gradients because the photo catalog could not be loaded.', error);
      setPhotoCatalogSnapshot(createEmptyPhotoCatalogSnapshot(true));
    })
    .finally(() => {
      photoCatalogPromise = null;
    });

  return photoCatalogPromise;
};

export const usePhotoCatalog = (): PhotoCatalogSnapshot => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void ensurePhotoCatalogLoaded();
  }, []);

  return snapshot;
};
