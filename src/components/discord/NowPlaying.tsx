import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { MusicArtwork } from './music/MusicArtwork';
import { MusicInfo } from './music/MusicInfo';
import { MusicProgressBar } from './music/MusicProgressBar';
import { useMusicProgressTracker } from './music/MusicProgressTracker';
import { NotificationBanner } from '@/components/NotificationBanner';

interface NotificationData {
  avatarUrl: string | null;
  username: string;
  message: string;
  server: string;
  channel: string;
}

interface NowPlayingProps {
  currentSong: any;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isSpotifyConnected?: boolean;
  spotifyData?: any;
  // Notification props:
  notificationOpen?: boolean;
  onNotificationClose?: () => void;
  notificationData?: NotificationData;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({
  currentSong,
  isSpotifyConnected = false,
  spotifyData,
  notificationOpen = false,
  onNotificationClose,
  notificationData,
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
        {/* Notification banner INSIDE the Spotify player, floats from the top with new styling */}
        <div className="absolute top-0 left-0 w-full flex justify-center z-30 pointer-events-none">
          {notificationOpen && notificationData && (
            <NotificationBanner
              open={notificationOpen}
              onClose={onNotificationClose!}
              avatarUrl={notificationData.avatarUrl}
              username={notificationData.username}
              message={notificationData.message}
              server={notificationData.server}
              channel={notificationData.channel}
            />
          )}
        </div>
        
        <Card className="relative bg-black/30 backdrop-blur-sm border-gray-700/50 p-8 w-full h-full flex items-center">
          <div className="flex items-center space-x-8 w-full">
            <MusicArtwork 
              imageUrl={currentSong.assets?.large_image}
              altText={currentSong.assets?.large_text}
              isPlaying={isPlaying}
            />

            <div className="flex-1 min-w-0">
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
