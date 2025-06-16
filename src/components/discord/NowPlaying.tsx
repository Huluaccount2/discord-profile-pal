
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { MusicArtwork } from './music/MusicArtwork';
import { MusicInfo } from './music/MusicInfo';
import { MusicProgressBar } from './music/MusicProgressBar';
import { useMusicProgressTracker } from './music/MusicProgressTracker';

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

  console.log('NowPlaying: Rendering with props:', {
    currentSong: currentSong ? 'present' : 'null',
    isSpotifyConnected,
    spotifyData: spotifyData ? 'present' : 'null',
    spotifyIsPlaying: spotifyData?.isPlaying
  });

  const handleProgressUpdate = useCallback((time: number, playing: boolean) => {
    console.log('NowPlaying: Progress update:', { time, playing });
    setCurrentTime(time);
    setIsPlaying(playing);
  }, []);

  useMusicProgressTracker({
    currentSong,
    isSpotifyConnected,
    spotifyData,
    onProgressUpdate: handleProgressUpdate
  });

  if (!currentSong) {
    console.log('NowPlaying: No current song, not rendering');
    return null;
  }

  const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  console.log('NowPlaying: Final render state:', { 
    progress, 
    isPlaying, 
    isSpotifyConnected,
    currentTime,
    duration 
  });

  try {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm"
          style={{ 
            backgroundImage: `url(${currentSong.assets?.large_image || '/placeholder.svg'})`,
            filter: 'blur(20px) brightness(0.6)'
          }}
        />
        
        <Card className="relative bg-black/30 backdrop-blur-sm border-gray-700/50 p-2 w-full h-full flex items-center overflow-hidden">
          <div className="flex items-center space-x-2 w-full min-w-0">
            <div className="flex-shrink-0">
              <MusicArtwork 
                imageUrl={currentSong.assets?.large_image}
                altText={currentSong.assets?.large_text}
                isPlaying={isPlaying}
              />
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <MusicInfo 
                title={currentSong.details}
                artist={currentSong.state}
                album={currentSong.assets?.large_text}
                isPlaying={isPlaying}
              />

              <MusicProgressBar 
                currentTime={currentTime}
                duration={duration}
                progress={progress}
                isPlaying={isPlaying}
              />
            </div>
          </div>
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
