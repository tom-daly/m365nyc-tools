import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { getSquidGamePhotoPath, getFallbackAvatar } from '@/utils/photoUtils';

interface UserPhotoOptimizedProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Memoized component for better performance in lists
const UserPhotoOptimized: React.FC<UserPhotoOptimizedProps> = React.memo(({ 
  name, 
  size = 'sm', 
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);

  // Memoize paths to prevent recalculation
  const { photoPath, fallbackAvatar, sizeClass } = useMemo(() => {
    const photoPath = getSquidGamePhotoPath(name); // Use optimized thumbnails
    const fallbackAvatar = getFallbackAvatar(name);
    
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12', 
      lg: 'w-16 h-16'
    };
    
    return {
      photoPath,
      fallbackAvatar,
      sizeClass: sizeClasses[size]
    };
  }, [name, size]);

  const handleImageError = () => {
    setImageError(true);
  };

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
        />
      ) : (
        <Image
          src={fallbackAvatar}
          alt={`${name}'s avatar`}
          width={32}
          height={32}
          className="rounded-full border-2 border-gray-200 dark:border-gray-600"
          priority={false}
        />
      )}
    </div>
  );
});

UserPhotoOptimized.displayName = 'UserPhotoOptimized';

export default UserPhotoOptimized;