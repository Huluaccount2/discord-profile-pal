import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSpotify } from "@/hooks/useSpotify";
import { useLastKnownSong } from "@/hooks/useLastKnownSong";
import { useDeskThing } from "@/contexts/DeskThingContext";

export const useMusicData = (profile: any, discordData: any) => {
  const { user } = useAuth();
  const { isRunningOnDeskThing } = useDeskThing();
  const { 
    spotifyData, 
    isConnected, 
    connectSpotify,
    connectionError,
    loading,
    play,
    pause,
    nextTrack,
    previousTrack,
    isInitialized
  } = useSpotify(user?.id);
  const [lastKnownSong, setLastKnownSong] = useLastKnownSong();
  const [lastSongUpdate, setLastSongUpdate] = useState<number>(0);

  // Always use Discord activity if available
  let currentSong = null;

  if (profile && discordData?.activities?.length > 0) {
    const discordSong = discordData.activities.find(activity => activity.type === 2);
    if (discordSong) {
      const dataAge = discordData.last_updated ? Date.now() - discordData.last_updated : 0;
      const maxDataAge = 5 * 60 * 1000; // 5 minutes for web/DeskThing

      if (dataAge < maxDataAge) {
        currentSong = {
          ...discordSong,
          isPlaying: true,
        };
        console.log('Using Discord activity as music data');
      } else {
        console.log('Discord music data too old, ignoring');
      }
    }
  }

  // Store current song with timestamp tracking (only if it's actually fresh)
  useEffect(() => {
    if (currentSong) {
      const now = Date.now();
      if (lastSongUpdate === 0 || (now - lastSongUpdate) > 30000) { // 30 seconds
        setLastKnownSong(currentSong);
        setLastSongUpdate(now);
      }
    }
  }, [currentSong, setLastKnownSong, lastSongUpdate]);

  // Final song selection with better fallback logic
  let songToDisplay = currentSong;

  // Only use last known song if no current song and it's reasonably fresh
  if (!currentSong && lastKnownSong) {
    const songAge = lastKnownSong.timestamps?.start ? Date.now() - lastKnownSong.timestamps.start : Infinity;
    const maxLastKnownAge = 5 * 60 * 1000; // 5 minutes
    if (songAge < maxLastKnownAge) {
      songToDisplay = {
        ...lastKnownSong,
        isPlaying: false
      };
    }
  }
  
  // Determine if we should show connect prompt (never show it since we use Discord)
  const shouldShowConnectPrompt = false;

  return {
    spotifyData,
    isConnected: false,
    connectSpotify,
    connectionError: null,
    songToDisplay,
    shouldShowConnectPrompt,
    loading: false,
    play,
    pause,
    nextTrack,
    previousTrack
  };
};
