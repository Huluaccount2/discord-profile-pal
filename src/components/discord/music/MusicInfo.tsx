
import React from 'react';
import { useDebounceState } from '@/hooks/useDebounceState';

interface MusicInfoProps {
  title: string;
  artist: string;
  album?: string;
  isPlaying: boolean;
}

export const MusicInfo: React.FC<MusicInfoProps> = React.memo(({
  title,
  artist,
  album,
  isPlaying
}) => {
  // Debounce track info changes to prevent flickering during transitions
  const debouncedTitle = useDebounceState(title, 200);
  const debouncedArtist = useDebounceState(artist, 200);
  const debouncedAlbum = useDebounceState(album, 200);

  const cleanArtistName = (artistName: string) => {
    if (!artistName) return 'Unknown Artist';
    return artistName.replace(/^by\s+/i, '');
  };

  return (
    <div>
      <h3 className="font-bold text-3xl mb-3 transition-opacity duration-150 text-white leading-tight break-words">
        {debouncedTitle || 'Unknown Track'}
      </h3>
      
      <p className="text-xl mb-2 transition-opacity duration-150 text-gray-300 leading-tight break-words">
        {cleanArtistName(debouncedArtist)}
      </p>
      
      {debouncedAlbum && (
        <p className="text-lg transition-opacity duration-150 text-gray-400 leading-tight break-words">
          {debouncedAlbum}
        </p>
      )}
    </div>
  );
});

MusicInfo.displayName = 'MusicInfo';
