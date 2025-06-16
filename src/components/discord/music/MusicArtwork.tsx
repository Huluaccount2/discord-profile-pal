
import React from 'react';

interface MusicArtworkProps {
  imageUrl: string;
  altText: string;
  isPlaying: boolean;
}

export const MusicArtwork: React.FC<MusicArtworkProps> = ({
  imageUrl,
  altText,
  isPlaying
}) => {
  return (
    <div className="flex-shrink-0 relative">
      <img
        src={imageUrl || '/placeholder.svg'}
        alt={altText || 'Album Art'}
        className="w-40 h-40 rounded-lg object-cover shadow-lg transition-all duration-300"
      />
    </div>
  );
};
