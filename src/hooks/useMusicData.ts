
import { useState, useEffect, useRef } from "react";
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
    previousTrack
  } = useSpotify(user?.id);
  const [lastKnownSong, setLastKnownSong] = useLastKnownSong();
  const [lastSongUpdate, setLastSongUpdate] = useState<number>(0);

  // Calculate current song data with improved priority logic
  let currentSong = null;
  
  if (isRunningOnDeskThing) {
    // DeskThing mode: Only use fresh Discord Spotify data
    if (profile && discordData?.has_valid_spotify && discordData?.activities?.length > 0) {
      const discordSong = discordData.activities.find(activity => activity.type === 2);
      if (discordSong) {
        const dataAge = discordData.last_updated ? Date.now() - discordData.last_updated : Infinity;
        const maxDataAge = 2 * 60 * 1000; // 2 minutes for DeskThing
        
        if (dataAge < maxDataAge) {
          currentSong = {
            ...discordSong,
            isPlaying: true
          };
          console.log('DeskThing: Using fresh Discord Spotify data');
        } else {
          console.log('DeskThing: Discord Spotify data too old, no music detected');
        }
      }
    }
  } else {
    // Web mode: Use Spotify OAuth integration
    if (isConnected && spotifyData?.track && spotifyData?.isPlaying) {
      const track = spotifyData.track;
      currentSong = {
        name: "Spotify",
        type: 2,
        details: track.name,
        state: track.artist,
        isPlaying: true,
        progress: track.progress,
        timestamps: {
          start: Date.now() - track.progress,
          end: Date.now() - track.progress + track.duration,
        },
        assets: {
          large_image: track.albumCover,
          large_text: track.album,
        },
      };
      console.log('Web: Using Spotify OAuth current track');
    } else if (isConnected && spotifyData?.lastPlayed) {
      const track = spotifyData.lastPlayed;
      currentSong = {
        name: "Spotify",
        type: 2,
        details: track.name,
        state: track.artist,
        isPlaying: false,
        progress: track.duration,
        timestamps: {
          start: Date.now() - track.duration,
          end: Date.now(),
        },
        assets: {
          large_image: track.albumCover,
          large_text: track.album,
        },
      };
      console.log('Web: Using Spotify OAuth last played track');
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
  if (!currentSong && lastKnownSong && !isRunningOnDeskThing) {
    const songAge = lastKnownSong.timestamps?.start ? Date.now() - lastKnownSong.timestamps.start : Infinity;
    const maxLastKnownAge = 5 * 60 * 1000; // 5 minutes
    if (songAge < maxLastKnownAge) {
      songToDisplay = {
        ...lastKnownSong,
        isPlaying: false
      };
    }
  }
  
  // Determine if we should show connect prompt
  const shouldShowConnectPrompt = isRunningOnDeskThing 
    ? false // DeskThing doesn't need connect prompt
    : !isConnected && !songToDisplay;

  return {
    spotifyData,
    isConnected: isRunningOnDeskThing ? false : isConnected,
    connectSpotify,
    connectionError: isRunningOnDeskThing ? null : connectionError,
    songToDisplay,
    shouldShowConnectPrompt,
    loading: isRunningOnDeskThing ? false : loading,
    play,
    pause,
    nextTrack,
    previousTrack
  };
};
