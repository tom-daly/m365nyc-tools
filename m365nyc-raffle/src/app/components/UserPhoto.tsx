import React, { useState } from 'react';
import Image from 'next/image';
import { getUserThumbnailPath, getFallbackAvatar } from '@/utils/photoUtils';

interface UserPhotoProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

const UserPhoto: React.FC<UserPhotoProps> = ({ 
  name, 
  size = 'md', 
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const photoPath = getUserThumbnailPath(name);
  const fallbackAvatar = getFallbackAvatar(name);

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
    setImageError(true);
    setIsLoading(false);
  };

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
          />
        </>
      ) : (
        <Image
          src={fallbackAvatar}
          alt={`${name}'s avatar`}
          fill
          className="rounded-full border-2 border-gray-200 dark:border-gray-600"
        />
      )}
    </div>
  );
};

export default UserPhoto;
