
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { MusicArtwork } from './music/MusicArtwork';
import { MusicInfo } from './music/MusicInfo';
import { MusicProgressBar } from './music/MusicProgressBar';
import { useMusicProgressTracker } from './music/MusicProgressTracker';
import { PlayerNotification } from './PlayerNotification';

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

  // Notification state for mentions
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    avatarUrl: string;
    username: string;
    message: string;
    server: string;
    channel: string;
  }>({
    avatarUrl: "",
    username: "",
    message: "",
    server: "",
    channel: "",
  });

  // DEMO ONLY: Remove later. Demo notification for testing.
  const handleShowDemoNotification = () => {
    setNotificationData({
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      username: "Alex McLean",
      message: "Hey @you, let's finish the playlist collab!",
      server: "Chill Hub",
      channel: "music-chat",
    });
    setNotificationOpen(true);
  };

  const handleNotificationClose = () => setNotificationOpen(false);

  const handleProgressUpdate = useCallback((time: number, playing: boolean) => {
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
    return null;
  }

  const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  try {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        {/* --- Notification appears at the very TOP of the player --- */}
        <PlayerNotification
          avatarUrl={notificationData.avatarUrl}
          username={notificationData.username}
          message={notificationData.message}
          server={notificationData.server}
          channel={notificationData.channel}
          open={notificationOpen}
          onClose={handleNotificationClose}
        />
        {/* DEMO button - for testing the popup visually; remove when live */}
        <button
          onClick={handleShowDemoNotification}
          className="absolute top-2 right-2 z-30 px-2 py-1 text-xs rounded bg-white bg-opacity-30 text-black font-bold shadow hover:bg-opacity-40 select-none"
          style={{ pointerEvents: "auto" }}
        >
          Demo Notification
        </button>
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm"
          style={{ 
            backgroundImage: `url(${currentSong.assets?.large_image || '/placeholder.svg'})`,
            filter: 'blur(20px) brightness(0.6)'
          }}
        />
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
