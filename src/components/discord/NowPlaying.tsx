import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { MusicArtwork } from './music/MusicArtwork';
import { MusicInfo } from './music/MusicInfo';
import { MusicProgressBar } from './music/MusicProgressBar';
import { useMusicProgressTracker } from './music/MusicProgressTracker';
import { PlayerNotification } from './PlayerNotification';

// New: player notification management/hook import
import { usePlayerNotification } from './music/usePlayerNotification';

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

  // Extracted notification logic to hook
  const {
    notificationOpen,
    notificationData,
    notificationRef,
    notifHeight,
    handleNotificationClose,
    showDemoNotification,
  } = usePlayerNotification();

  // Defensive error handling so notifications always show
  let renderError = null;
  let safeCurrentSong = currentSong;
  try {
    // Defensive: Don't let any Spotify/NowPlaying crash block notification UI
    if (!currentSong) {
      // Still want to render notification (just skip the rest)
      safeCurrentSong = null;
    }
    const playerSectionPaddingTop = notificationOpen ? notifHeight + 12 : 0;

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

    if (!currentSong) return null;

    const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  } catch (e) {
    renderError = e;
    safeCurrentSong = null;
    console.error("NowPlaying: Fatal error, fallback to notification only", e);
  }

  // Always render notifications at the top
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {/* PlayerNotification (always render even if no song) */}
      {notificationOpen && (
        <div ref={notificationRef}>
          <PlayerNotification
            avatarUrl={notificationData.avatarUrl}
            username={notificationData.username}
            message={notificationData.message}
            server={notificationData.server}
            channel={notificationData.channel}
            hasImage={notificationData.hasImage}
            hasGif={notificationData.hasGif}
            hasVoiceMessage={notificationData.hasVoiceMessage}
            open={notificationOpen}
            onClose={handleNotificationClose}
          />
        </div>
      )}

      {notificationOpen && notifHeight > 0 && (
        <div style={{ height: notifHeight + 12 }} aria-hidden="true" />
      )}

      {renderError ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-red-500 text-sm">
            Error displaying music: {String(renderError)}
          </div>
        </div>
      ) : safeCurrentSong ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-sm"
            style={{
              backgroundImage: `url(${safeCurrentSong.assets?.large_image || "/placeholder.svg"})`,
              filter: "blur(20px) brightness(0.6)",
            }}
          />
          <Card
            className="relative bg-black/30 backdrop-blur-sm border-gray-700/50 p-8 w-full h-full flex items-center"
            style={{
              paddingTop: notificationOpen ? notifHeight + 12 : 0,
              transition: "padding-top 0.33s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div className="flex items-center space-x-8 w-full">
              <MusicArtwork
                imageUrl={safeCurrentSong.assets?.large_image}
                altText={safeCurrentSong.assets?.large_text}
                isPlaying={isPlaying}
              />
              <div className="flex-1 min-w-0">
                <MusicInfo
                  title={safeCurrentSong.details}
                  artist={safeCurrentSong.state}
                  album={safeCurrentSong.assets?.large_text}
                  isPlaying={isPlaying}
                />
                <MusicProgressBar
                  currentTime={currentTime}
                  duration={
                    safeCurrentSong.timestamps?.end - safeCurrentSong.timestamps?.start || 0
                  }
                  progress={
                    (safeCurrentSong.timestamps?.end - safeCurrentSong.timestamps?.start) > 0
                      ? (currentTime /
                        (safeCurrentSong.timestamps?.end - safeCurrentSong.timestamps?.start)) *
                        100
                      : 0
                  }
                  isPlaying={isPlaying}
                />
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
};
