import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { getInitials, getInitialsGradient, getResolvedPhotoPath } from '@/utils/photoUtils';
import { usePhotoCatalog } from '@/utils/photoCatalog';

interface UserPhotoOptimizedProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  avatarSrc?: string;
}

// Memoized component for better performance in lists
const UserPhotoOptimized: React.FC<UserPhotoOptimizedProps> = React.memo(({
  name,
  size = 'sm',
  className = '',
  avatarSrc
}) => {
  const photoCatalog = usePhotoCatalog();
  const [imageError, setImageError] = useState(false);

  // Memoize paths to prevent recalculation
  const { photoPath, sizeClass } = useMemo(() => {
    const photoPath = getResolvedPhotoPath(name, 'thumbnail', photoCatalog, avatarSrc);

    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16'
    };

    return {
      photoPath,
      sizeClass: sizeClasses[size]
    };
  }, [avatarSrc, name, photoCatalog, size]);

  const handleImageError = () => {
    console.warn('🖼️ UserPhotoOptimized falling back to initials', { name, photoPath });
    setImageError(true);
  };

  useEffect(() => {
    setImageError(false);
  }, [name, photoPath]);

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      {photoPath && !imageError ? (
        <Image
          src={photoPath}
          alt={`${name}'s photo`}
          width={32} // Fixed size for better performance
          height={32}
          className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          onError={handleImageError}
          priority={false} // Don't prioritize table images
          loading="lazy" // Lazy load for better performance
          unoptimized
        />
      ) : (
        <div className={`${sizeClass} bg-gradient-to-br ${getInitialsGradient(name)} rounded-full border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center`}>
          <span className="text-white text-xs font-bold">{getInitials(name)}</span>
        </div>
      )}
    </div>
  );
});

UserPhotoOptimized.displayName = 'UserPhotoOptimized';

export default UserPhotoOptimized;
