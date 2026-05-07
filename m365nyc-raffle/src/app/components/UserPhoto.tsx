import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getInitials, getInitialsGradient, getResolvedPhotoPath } from '@/utils/photoUtils';
import { usePhotoCatalog } from '@/utils/photoCatalog';

interface UserPhotoProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  avatarSrc?: string;
}

const UserPhoto: React.FC<UserPhotoProps> = ({
  name,
  size = 'md',
  className = '',
  avatarSrc
}) => {
  const photoCatalog = usePhotoCatalog();
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const photoPath = getResolvedPhotoPath(name, 'thumbnail', photoCatalog, avatarSrc);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-28 h-28',
    '3xl': 'w-36 h-36',
    '4xl': 'w-44 h-44'
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    console.warn('🖼️ UserPhoto falling back to initials', { name, photoPath });
    setImageError(true);
    setIsLoading(false);
  };

  useEffect(() => {
    setImageError(false);
    setIsLoading(Boolean(photoPath));
  }, [name, photoPath]);

  return (
    <div className={`relative ${className.includes('w-') && className.includes('h-') ? '' : sizeClasses[size]} ${className}`}>
      {photoPath && !imageError ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          )}
          <Image
            src={photoPath}
            alt={`${name}'s photo`}
            fill
            className={`rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            } transition-opacity`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
            unoptimized
          />
        </>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${getInitialsGradient(name)} rounded-full border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center`}>
          <span className="text-white font-bold">{getInitials(name)}</span>
        </div>
      )}
    </div>
  );
};

export default UserPhoto;
