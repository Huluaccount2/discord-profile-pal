
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSpotify } from "@/hooks/useSpotify";
import { useLastKnownSong } from "@/hooks/useLastKnownSong";

export const useMusicData = (profile: any, discordData: any) => {
  const { user } = useAuth();
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

  // Calculate current song data with improved priority logic and freshness checks
  let currentSong = null;
  if (profile && discordData) {
    // Priority 1: Spotify OAuth if connected and has current track
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
    }
    // Priority 2: Spotify OAuth last played if connected but not currently playing
    else if (isConnected && spotifyData?.lastPlayed) {
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
    }
    // Priority 3: Discord Spotify activities (with freshness and validity check)
    else if (discordData?.has_valid_spotify && discordData?.activities?.length > 0) {
      const discordSong = discordData.activities.find(activity => activity.type === 2);
      if (discordSong) {
        // Check if the Discord data is fresh (less than 5 minutes old)
        const dataAge = discordData.last_updated ? Date.now() - discordData.last_updated : Infinity;
        const maxDataAge = 5 * 60 * 1000; // 5 minutes
        
        if (dataAge < maxDataAge) {
          currentSong = {
            ...discordSong,
            isPlaying: true // Discord songs with valid Spotify data are currently playing
          };
          console.log('Using fresh Discord Spotify data');
        } else {
          console.log('Discord Spotify data is too old, ignoring');
        }
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
    const maxLastKnownAge = 5 * 60 * 1000; // 5 minutes - shorter than before
    if (songAge < maxLastKnownAge) {
      songToDisplay = {
        ...lastKnownSong,
        isPlaying: false // Last known songs are not playing
      };
    }
  }
  
  const shouldShowConnectPrompt = !isConnected && !songToDisplay;

  return {
    spotifyData,
    isConnected,
    connectSpotify,
    connectionError,
    songToDisplay,
    shouldShowConnectPrompt,
    loading,
    play,
    pause,
    nextTrack,
    previousTrack
  };
};
