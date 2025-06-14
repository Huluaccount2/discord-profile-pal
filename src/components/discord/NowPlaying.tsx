
import React, { useState, useEffect } from 'react';
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

  console.log('NowPlaying: Props received:', {
    currentSong: currentSong ? 'present' : 'null',
    isSpotifyConnected
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
      setCurrentTime(Math.max(0, Math.min(elapsed, duration)));
      setIsPlaying(elapsed >= 0 && elapsed <= duration);
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
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  console.log('NowPlaying: Rendering with progress:', progress, 'isSpotifyConnected:', isSpotifyConnected);

  return (
    <Card className="bg-gray-800/50 border-gray-700/50 p-4 w-full">
      <div className="flex items-center space-x-4">
        {/* Album Art */}
        <div className="flex-shrink-0">
          <img
            src={currentSong.assets?.large_image || '/placeholder.svg'}
            alt={currentSong.assets?.large_text || 'Album Art'}
            className="w-16 h-16 rounded-lg object-cover"
          />
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="text-white font-semibold text-lg truncate">
              {currentSong.details || 'Unknown Track'}
            </h3>
            <p className="text-gray-400 text-sm truncate">
              {currentSong.state || 'Unknown Artist'}
            </p>
            {currentSong.assets?.large_text && (
              <p className="text-gray-500 text-xs truncate">
                {currentSong.assets.large_text}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
