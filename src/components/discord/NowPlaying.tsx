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
  spotifyData?: any;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({
  currentSong,
  isSpotifyConnected = false,
  spotifyData
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [titleOverflows, setTitleOverflows] = useState(false);
  const [artistOverflows, setArtistOverflows] = useState(false);
  const [albumOverflows, setAlbumOverflows] = useState(false);
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const artistRef = useRef<HTMLParagraphElement>(null);
  const albumRef = useRef<HTMLParagraphElement>(null);

  console.log('NowPlaying: Props received:', {
    currentSong: currentSong ? 'present' : 'null',
    isSpotifyConnected,
    spotifyData: spotifyData ? 'present' : 'null'
  });

  useEffect(() => {
    if (!currentSong?.timestamps?.start || !currentSong?.timestamps?.end) {
      console.log('NowPlaying: No valid timestamps found');
      return;
    }

    const startTime = currentSong.timestamps.start;
    const endTime = currentSong.timestamps.end;
    const duration = endTime - startTime;
    
    console.log('NowPlaying: Setting up progress tracking:', { startTime, endTime, duration });

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      // For Spotify OAuth integration, use the actual playing state
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData) {
        console.log('NowPlaying: Using Spotify OAuth state:', spotifyData.isPlaying);
        setIsPlaying(spotifyData.isPlaying);
        if (spotifyData.isPlaying && spotifyData.track) {
          // Use Spotify's actual progress
          setCurrentTime(spotifyData.track.progress);
        }
      } else {
        // For Discord activities, calculate based on timestamps
        const currentPlayingState = elapsed >= 0 && elapsed <= duration;
        setCurrentTime(Math.max(0, Math.min(elapsed, duration)));
        setIsPlaying(currentPlayingState);
      }
    };

    updateProgress();
    
    // Only update progress if:
    // 1. For Spotify OAuth: when actually playing
    // 2. For Discord activities: always update (we don't have real-time state)
    const shouldUpdateProgress = 
      (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.isPlaying) ||
      (!isSpotifyConnected || currentSong.name !== "Spotify");
    
    console.log('NowPlaying: Should update progress:', shouldUpdateProgress);
    
    const interval = shouldUpdateProgress ? setInterval(updateProgress, 1000) : null;

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentSong, isSpotifyConnected, spotifyData]);

  // Check for text overflow and determine if we need multiple lines
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

    // Check after a short delay to ensure DOM has rendered
    const timeoutId = setTimeout(checkOverflow, 100);
    
    // Also check on window resize
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [currentSong?.details, currentSong?.state, currentSong?.assets?.large_text]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper function to clean artist name
  const cleanArtistName = (artistName: string) => {
    if (!artistName) return 'Unknown Artist';
    // Remove "by " prefix if it exists (case insensitive)
    return artistName.replace(/^by\s+/i, '');
  };

  if (!currentSong) {
    console.log('NowPlaying: No current song, not rendering');
    return null;
  }

  const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  console.log('NowPlaying: Rendering with progress:', progress, 'isPlaying:', isPlaying, 'isSpotifyConnected:', isSpotifyConnected);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
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

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              {/* Song Title - with overflow handling */}
              <h3 
                ref={titleRef}
                className={`text-white font-bold text-3xl mb-2 ${
                  titleOverflows ? 'whitespace-normal break-words' : 'truncate'
                }`}
              >
                {currentSong.details || 'Unknown Track'}
              </h3>
              
              {/* Artist - with overflow handling, cleaned of "by" prefix */}
              <p 
                ref={artistRef}
                className={`text-gray-300 text-xl mb-2 ${
                  artistOverflows ? 'whitespace-normal break-words' : 'truncate'
                }`}
              >
                {cleanArtistName(currentSong.state)}
              </p>
              
              {/* Album - with overflow handling */}
              {currentSong.assets?.large_text && (
                <p 
                  ref={albumRef}
                  className={`text-gray-400 text-lg ${
                    albumOverflows ? 'whitespace-normal break-words' : 'truncate'
                  }`}
                >
                  {currentSong.assets.large_text}
                </p>
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
