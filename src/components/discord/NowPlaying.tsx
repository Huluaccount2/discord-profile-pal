import React, { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { MusicArtwork } from './music/MusicArtwork';
import { MusicInfo } from './music/MusicInfo';
import { MusicProgressBar } from './music/MusicProgressBar';
import { useMusicProgressTracker } from './music/MusicProgressTracker';
import { PlayerNotification } from './PlayerNotification';
import { useNotifications } from "@/hooks/useNotifications";

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
    hasImage?: boolean;
    hasGif?: boolean;
    hasVoiceMessage?: boolean;
  }>({
    avatarUrl: "",
    username: "",
    message: "",
    server: "",
    channel: "",
  });

  // Add a ref for the notification so we can measure its height
  const notificationRef = React.useRef<HTMLDivElement | null>(null);
  const [notifHeight, setNotifHeight] = useState(0);

  // Watch for open/close, update height
  React.useEffect(() => {
    if (notificationOpen && notificationRef.current) {
      const rect = notificationRef.current.getBoundingClientRect();
      setNotifHeight(rect.height);
    } else {
      setNotifHeight(0);
    }
  }, [notificationOpen, notificationData]);

  // Bump the player content by notifHeight + 12px if open
  const playerSectionPaddingTop = notificationOpen ? notifHeight + 12 : 0;

  // ------------ Notifications integration ---------------
  const { notifications } = useNotifications();

  // If there's a new notification, display it as a PlayerNotification
  // We'll just show the latest notification if present, falling back to the demo buttons if not.
  React.useEffect(() => {
    if (notifications.length > 0) {
      const notif = notifications[0];
      setNotificationData({
        avatarUrl: notif.source_user_avatar || "",
        username: notif.source_username || "Unknown",
        message: notif.message || "",
        server: notif.server || "",
        channel: notif.channel || "",
        hasImage: notif.has_image,
        hasGif: notif.has_gif,
        hasVoiceMessage: notif.has_voice_message,
      });
      setNotificationOpen(true);
    }
    // eslint-disable-next-line
  }, [notifications.length > 0 ? notifications[0].id : null]);
  // ------------ end new logic ------------

  // DEMO ONLY: Simple test button to launch a sample notification. Remove for production.
  const handleShowDemoNotification = (
    variant: "text" | "image" | "gif" | "voice" = "text"
  ) => {
    setNotificationData({
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      username: "Alex McLean",
      message:
        variant === "text"
          ? "Hey @you! Let's finish the playlist collab soon. Did you check all 4 songs I posted in #music-collab? DM me 😁\nExtra: with\nNewlines\nto test."
          : "",
      server: "Chill Hub",
      channel: "music-chat",
      hasImage: variant === "image" ? true : undefined,
      hasGif: variant === "gif" ? true : undefined,
      hasVoiceMessage: variant === "voice" ? true : undefined,
    });
    setNotificationOpen(true);
  };

  // Listen ONLY for the notification's onClose – parent doesn't forcibly unset notificationOpen except here.
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

  if (!currentSong) return null;

  const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  try {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        {notificationOpen && (
          <PlayerNotification
            ref={notificationRef}
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
        )}
        {/* Demo Notification Buttons below - REMOVE in production */}
        <div className="absolute top-2 left-1/2 z-30 -translate-x-1/2 flex gap-1 pointer-events-auto">
          <button
            onClick={() => handleShowDemoNotification("text")}
            className="px-2 py-1 text-xs rounded bg-white bg-opacity-20 text-black font-bold shadow hover:bg-opacity-30 select-none"
            aria-label="Show mention popup (text)"
          >
            Demo Text
          </button>
          <button
            onClick={() => handleShowDemoNotification("image")}
            className="px-2 py-1 text-xs rounded bg-green-100/70 text-green-950 font-bold shadow hover:bg-green-100 select-none"
            aria-label="Show mention popup (image)"
          >
            Demo Image
          </button>
          <button
            onClick={() => handleShowDemoNotification("gif")}
            className="px-2 py-1 text-xs rounded bg-blue-100/80 text-blue-950 font-bold shadow hover:bg-blue-100 select-none"
            aria-label="Show mention popup (gif)"
          >
            Demo GIF
          </button>
          <button
            onClick={() => handleShowDemoNotification("voice")}
            className="px-2 py-1 text-xs rounded bg-violet-100/80 text-violet-950 font-bold shadow hover:bg-violet-100 select-none"
            aria-label="Show mention popup (voice)"
          >
            Demo Voice
          </button>
        </div>
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-sm"
          style={{
            backgroundImage: `url(${currentSong.assets?.large_image || "/placeholder.svg"})`,
            filter: "blur(20px) brightness(0.6)",
          }}
        />
        <Card
          className="relative bg-black/30 backdrop-blur-sm border-gray-700/50 p-8 w-full h-full flex items-center"
          style={{
            paddingTop: playerSectionPaddingTop,
            transition: "padding-top 0.33s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
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
    console.error("NowPlaying: Render error:", error);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-500">Error rendering music component</div>
      </div>
    );
  }
};
