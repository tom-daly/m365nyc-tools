import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getInitials, getInitialsGradient, getResolvedOptimalPhotoPath } from '@/utils/photoUtils';
import { usePhotoCatalog } from '@/utils/photoCatalog';

interface SquidGameUserPhotoProps {
  name: string;
  className?: string;
  size: number; // Exact pixel size for the grid
  avatarSrc?: string;
}

const SquidGameUserPhoto: React.FC<SquidGameUserPhotoProps> = ({
  name,
  className = '',
  size = 50,
  avatarSrc
}) => {
  const photoCatalog = usePhotoCatalog();
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const photoPath = getResolvedOptimalPhotoPath(name, size, photoCatalog, avatarSrc);
  const isPhotoPending = Boolean(photoPath) && !imageError && isLoading;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    console.warn('🖼️ SquidGameUserPhoto falling back to initials', { name, photoPath, size });
    setImageError(true);
    setIsLoading(false);
  };

  useEffect(() => {
    setImageError(false);
    setIsLoading(Boolean(photoPath));
  }, [name, photoPath]);

  // The gradient + initials always render as the backdrop. The actual photo
  // (when present) layers on top and fades in only if it loads. This way the
  // user always sees something — never a blank cell — regardless of whether
  // next/image's onLoad fires for SVG data URLs or 404s for missing files.
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${getInitialsGradient(name)} flex items-center justify-center`}>
        <span className="text-white font-bold" style={{ fontSize: size * 0.4 + 'px' }}>
          {getInitials(name)}
        </span>
      </div>
      {photoPath && !imageError && (
        <Image
          src={photoPath}
          alt={`${name}'s photo`}
          width={size}
          height={size}
          className={`object-cover w-full h-full absolute inset-0 ${
            isPhotoPending ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          unoptimized
          loading="lazy"
        />
      )}
    </div>
  );
};

export default SquidGameUserPhoto;
