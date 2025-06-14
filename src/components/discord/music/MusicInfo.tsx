
import React, { useRef, useState, useEffect } from 'react';

interface MusicInfoProps {
  title: string;
  artist: string;
  album?: string;
  isPlaying: boolean;
}

export const MusicInfo: React.FC<MusicInfoProps> = ({
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
  }, [title, artist, album]);

  return (
    <div className="mb-6">
      <h3 
        ref={titleRef}
        className={`font-bold text-3xl mb-2 transition-opacity ${
          !isPlaying ? 'text-gray-300' : 'text-white'
        } ${titleOverflows ? 'whitespace-normal break-words' : 'truncate'}`}
      >
        {title || 'Unknown Track'}
      </h3>
      
      <p 
        ref={artistRef}
        className={`text-xl mb-2 transition-opacity ${
          !isPlaying ? 'text-gray-400' : 'text-gray-300'
        } ${artistOverflows ? 'whitespace-normal break-words' : 'truncate'}`}
      >
        {cleanArtistName(artist)}
      </p>
      
      {album && (
        <p 
          ref={albumRef}
          className={`text-lg transition-opacity ${
            !isPlaying ? 'text-gray-500' : 'text-gray-400'
          } ${albumOverflows ? 'whitespace-normal break-words' : 'truncate'}`}
        >
          {album}
        </p>
      )}
    </div>
  );
};
