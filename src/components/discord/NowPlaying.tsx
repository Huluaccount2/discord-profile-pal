
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface NowPlayingProps {
  currentSong: any;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isSpotifyConnected?: boolean;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({
  currentSong,
  isSpotifyConnected = false
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const artistRef = useRef<HTMLDivElement>(null);
  const albumRef = useRef<HTMLDivElement>(null);
  const [shouldScrollTitle, setShouldScrollTitle] = useState(false);
  const [shouldScrollArtist, setShouldScrollArtist] = useState(false);
  const [shouldScrollAlbum, setShouldScrollAlbum] = useState(false);

  console.log('NowPlaying: Props received:', {
    currentSong: currentSong ? 'present' : 'null',
    isSpotifyConnected
  });

  useEffect(() => {
    if (!currentSong?.timestamps?.start || !currentSong?.timestamps?.end) {
      console.log('NowPlaying: No valid timestamps found');
      setIsPlaying(false);
      return;
    }

    const startTime = currentSong.timestamps.start;
    const endTime = currentSong.timestamps.end;
    const duration = endTime - startTime;
    
    console.log('NowPlaying: Setting up progress tracking:', { startTime, endTime, duration });

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const songIsCurrentlyPlaying = elapsed >= 0 && elapsed <= duration;
      
      setIsPlaying(songIsCurrentlyPlaying);
      
      // Only update progress if the song is currently playing
      if (songIsCurrentlyPlaying) {
        setCurrentTime(Math.max(0, Math.min(elapsed, duration)));
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [currentSong]);

  // Check if text overflows and needs scrolling
  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        const container = titleRef.current.parentElement;
        if (container) {
          setShouldScrollTitle(titleRef.current.scrollWidth > container.clientWidth);
        }
      }
      if (artistRef.current) {
        const container = artistRef.current.parentElement;
        if (container) {
          setShouldScrollArtist(artistRef.current.scrollWidth > container.clientWidth);
        }
      }
      if (albumRef.current) {
        const container = albumRef.current.parentElement;
        if (container) {
          setShouldScrollAlbum(albumRef.current.scrollWidth > container.clientWidth);
        }
      }
    };

    // Check overflow after render
    const timer = setTimeout(checkOverflow, 100);
    return () => clearTimeout(timer);
  }, [currentSong]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    console.log('NowPlaying: No current song, not rendering');
    return null;
  }

  const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;
  const progress = duration > 0 && isPlaying ? (currentTime / duration) * 100 : 0;

  console.log('NowPlaying: Rendering with progress:', progress, 'isPlaying:', isPlaying, 'isSpotifyConnected:', isSpotifyConnected);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {/* CSS for auto-scrolling text */}
      <style>
        {`
          .scrolling-text {
            display: inline-block;
            animation: scroll-left 15s linear infinite;
          }
          
          .scrolling-text:hover {
            animation-play-state: paused;
          }
          
          @keyframes scroll-left {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          
          .scrolling-text {
            min-width: 100%;
          }
        `}
      </style>

      {/* Lighter Blurred Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-sm"
        style={{ 
          backgroundImage: `url(${currentSong.assets?.large_image || '/placeholder.svg'})`,
          filter: 'blur(20px) brightness(0.6)'
        }}
      />
      
      {/* Content overlay with more transparency */}
      <Card className="relative bg-black/30 backdrop-blur-sm border-gray-700/50 p-8 w-full h-full flex items-center">
        <div className="flex items-center space-x-8 w-full">
          {/* Large Album Art */}
          <div className="flex-shrink-0">
            <img
              src={currentSong.assets?.large_image || '/placeholder.svg'}
              alt={currentSong.assets?.large_text || 'Album Art'}
              className="w-32 h-32 rounded-xl object-cover shadow-2xl"
            />
          </div>

          {/* Song Info with Conditional Auto-Scrolling Text */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              {/* Conditionally Scrolling Song Title */}
              <div className="h-12 mb-2 overflow-hidden">
                <div className={shouldScrollTitle ? 'scrolling-text' : ''}>
                  <h3 
                    ref={titleRef}
                    className="text-white font-bold text-3xl leading-tight whitespace-nowrap"
                  >
                    {currentSong.details || 'Unknown Track'}
                  </h3>
                </div>
              </div>
              
              {/* Conditionally Scrolling Artist */}
              <div className="h-8 mb-2 overflow-hidden">
                <div className={shouldScrollArtist ? 'scrolling-text' : ''}>
                  <p 
                    ref={artistRef}
                    className="text-gray-300 text-xl leading-tight whitespace-nowrap"
                  >
                    {currentSong.state || 'Unknown Artist'}
                  </p>
                </div>
              </div>
              
              {/* Conditionally Scrolling Album */}
              {currentSong.assets?.large_text && (
                <div className="h-6 overflow-hidden">
                  <div className={shouldScrollAlbum ? 'scrolling-text' : ''}>
                    <p 
                      ref={albumRef}
                      className="text-gray-400 text-lg leading-tight whitespace-nowrap"
                    >
                      {currentSong.assets.large_text}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <Progress value={progress} className="h-3 mb-3" />
              <div className="flex justify-between text-sm text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
