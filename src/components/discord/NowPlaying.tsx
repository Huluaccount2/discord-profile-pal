
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { MusicArtwork } from './music/MusicArtwork';
import { MusicInfo } from './music/MusicInfo';
import { MusicProgressBar } from './music/MusicProgressBar';
import { MusicProgressTracker } from './music/MusicProgressTracker';

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
  onPlay,
  onPause,
  onNext,
  onPrevious,
  isSpotifyConnected = false,
  spotifyData
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleProgressUpdate = useCallback((progress: { time: number; playing: boolean }) => {
    setCurrentTime(progress.time);
    setIsPlaying(progress.playing);
  }, []);

  if (!currentSong) {
    return null;
  }

  const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;

  // Determine the actual playing state - prioritize Spotify data if available
  let actuallyPlaying = false;
  if (isSpotifyConnected && spotifyData?.isPlaying !== undefined) {
    actuallyPlaying = spotifyData.isPlaying;
  } else {
    // For Discord data, check if song has playing state or use timestamp logic
    if (currentSong.isPlaying !== undefined) {
      actuallyPlaying = currentSong.isPlaying;
    } else {
      // Fallback: assume playing if we have recent timestamps (within last 10 seconds)
      const now = Date.now();
      const timeSinceStart = now - (currentSong.timestamps?.start || 0);
      actuallyPlaying = timeSinceStart < duration + 10000; // 10 second buffer
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const showControls = isSpotifyConnected && onPlay && onPause && onNext && onPrevious;

  const handlePlayPause = () => {
    if (actuallyPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  try {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <MusicProgressTracker
          currentSong={currentSong}
          isPlaying={actuallyPlaying}
          onProgressUpdate={handleProgressUpdate}
        />
        
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm"
          style={{ 
            backgroundImage: `url(${currentSong.assets?.large_image || '/placeholder.svg'})`,
            filter: 'blur(20px) brightness(0.6)'
          }}
        />
        
        <Card className="relative bg-black/30 backdrop-blur-sm border-gray-700/50 p-6 w-full h-full flex flex-col overflow-hidden">
          <div className="flex items-center space-x-8 w-full min-w-0 flex-1">
            <div className="flex-shrink-0">
              <MusicArtwork 
                imageUrl={currentSong.assets?.large_image}
                altText={currentSong.assets?.large_text}
                isPlaying={actuallyPlaying}
              />
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <MusicInfo 
                title={currentSong.details}
                artist={currentSong.state}
                album={currentSong.assets?.large_text}
                isPlaying={actuallyPlaying}
              />
            </div>
          </div>
          
          <div className="w-full mt-4">
            <MusicProgressBar 
              currentTime={currentTime}
              duration={duration}
              progress={progress}
              isPlaying={actuallyPlaying}
            />
          </div>

          {showControls && (
            <div className="flex items-center justify-center space-x-4 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPrevious?.()}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20"
              >
                {actuallyPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNext?.()}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  } catch (error) {
    console.error('NowPlaying: Render error:', error);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-500">Error rendering music component</div>
      </div>
    );
  }
};
