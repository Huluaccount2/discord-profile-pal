
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

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

          {/* Song Info with Scrollable Text */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              {/* Scrollable Song Title */}
              <ScrollArea className="h-12 mb-2">
                <h3 className="text-white font-bold text-3xl leading-tight">
                  {currentSong.details || 'Unknown Track'}
                </h3>
              </ScrollArea>
              
              {/* Scrollable Artist */}
              <ScrollArea className="h-8 mb-2">
                <p className="text-gray-300 text-xl leading-tight">
                  {currentSong.state || 'Unknown Artist'}
                </p>
              </ScrollArea>
              
              {/* Scrollable Album */}
              {currentSong.assets?.large_text && (
                <ScrollArea className="h-6">
                  <p className="text-gray-400 text-lg leading-tight">
                    {currentSong.assets.large_text}
                  </p>
                </ScrollArea>
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
