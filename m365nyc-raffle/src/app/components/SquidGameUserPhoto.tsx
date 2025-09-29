import React, { useState } from 'react';
import Image from 'next/image';
import { getOptimalPhotoPath } from '@/utils/photoUtils';

interface SquidGameUserPhotoProps {
  name: string;
  className?: string;
  size: number; // Exact pixel size for the grid
}

const SquidGameUserPhoto: React.FC<SquidGameUserPhotoProps> = ({ 
  name, 
  className = '',
  size = 50
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const photoPath = getOptimalPhotoPath(name, size);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div 
      className={`relative overflow-hidden ${className} ${
        isLoading ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-500 ease-in-out`}
      style={{ width: size, height: size }}
    >
      {photoPath && !imageError ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
              {/* Spinning loading indicator */}
              <div 
                className="border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
                style={{
                  width: Math.max(20, size * 0.3) + 'px',
                  height: Math.max(20, size * 0.3) + 'px',
                  borderWidth: Math.max(2, size * 0.05) + 'px'
                }}
              />
            </div>
          )}
          <Image
            src={photoPath}
            alt={`${name}'s photo`}
            width={size}
            height={size}
            className={`object-cover w-full h-full ${
              isLoading ? 'opacity-0' : 'opacity-100'
            } transition-opacity duration-300`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority // Load immediately for game performance
            unoptimized // Since we already optimized manually
          />
        </>
      ) : (
        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
          <span className="text-white text-xs">No Photo</span>
        </div>
      )}
    </div>
  );
};

export default SquidGameUserPhoto;
