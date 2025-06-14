
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
        className={`w-32 h-32 rounded-xl object-cover shadow-2xl transition-opacity ${
          !isPlaying ? 'opacity-60' : 'opacity-100'
        }`}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-2">
            <div className="text-white text-xs font-medium">PAUSED</div>
          </div>
        </div>
      )}
    </div>
  );
};
