
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
        className={`w-32 h-32 rounded-xl object-cover shadow-2xl transition-all duration-300 ${
          !isPlaying ? 'opacity-60 grayscale' : 'opacity-100'
        }`}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/70 rounded-full p-3 backdrop-blur-sm">
            <div className="text-white text-xs font-bold">PAUSED</div>
          </div>
        </div>
      )}
    </div>
  );
};
