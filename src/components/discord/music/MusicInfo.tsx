
import React, { useRef, useState, useEffect } from 'react';
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
  const [titleOverflows, setTitleOverflows] = useState(false);
  const [artistOverflows, setArtistOverflows] = useState(false);
  const [albumOverflows, setAlbumOverflows] = useState(false);
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const artistRef = useRef<HTMLParagraphElement>(null);
  const albumRef = useRef<HTMLParagraphElement>(null);

  // Debounce track info changes to prevent flickering during transitions
  const debouncedTitle = useDebounceState(title, 200);
  const debouncedArtist = useDebounceState(artist, 200);
  const debouncedAlbum = useDebounceState(album, 200);

  const cleanArtistName = (artistName: string) => {
    if (!artistName) return 'Unknown Artist';
    return artistName.replace(/^by\s+/i, '');
  };

  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        const isOverflowing = titleRef.current.scrollWidth > titleRef.current.clientWidth;
        setTitleOverflows(isOverflowing);
      }
      
      if (artistRef.current) {
        const isOverflowing = artistRef.current.scrollWidth > artistRef.current.clientWidth;
        setArtistOverflows(isOverflowing);
      }
      
      if (albumRef.current) {
        const isOverflowing = albumRef.current.scrollWidth > albumRef.current.clientWidth;
        setAlbumOverflows(isOverflowing);
      }
    };

    const timeoutId = setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [debouncedTitle, debouncedArtist, debouncedAlbum]);

  return (
    <div>
      <h3 
        ref={titleRef}
        className={`font-bold text-3xl mb-3 transition-opacity duration-150 text-white ${titleOverflows ? 'whitespace-normal break-words' : 'truncate'}`}
      >
        {debouncedTitle || 'Unknown Track'}
      </h3>
      
      <p 
        ref={artistRef}
        className={`text-xl mb-2 transition-opacity duration-150 text-gray-300 ${artistOverflows ? 'whitespace-normal break-words' : 'truncate'}`}
      >
        {cleanArtistName(debouncedArtist)}
      </p>
      
      {debouncedAlbum && (
        <p 
          ref={albumRef}
          className={`text-lg transition-opacity duration-150 text-gray-400 ${albumOverflows ? 'whitespace-normal break-words' : 'truncate'}`}
        >
          {debouncedAlbum}
        </p>
      )}
    </div>
  );
});

MusicInfo.displayName = 'MusicInfo';
