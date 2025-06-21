
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

  // Calculate current song data with improved priority logic and staleness detection
  let currentSong = null;
  if (profile && discordData) {
    // Priority 1: Spotify OAuth if connected and has current track
    if (isConnected && spotifyData?.track && spotifyData?.isPlaying) {
      const track = spotifyData.track;
      const startTime = Date.now() - track.progress;
      currentSong = {
        name: "Spotify",
        type: 2,
        details: track.name,
        state: track.artist,
        isPlaying: spotifyData.isPlaying,
        timestamps: {
          start: Math.floor(startTime),
          end: Math.floor(startTime + track.duration),
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
      const now = Date.now();
      currentSong = {
        name: "Spotify",
        type: 2,
        details: track.name,
        state: track.artist,
        isPlaying: false,
        timestamps: {
          start: now - track.duration,
          end: now,
        },
        assets: {
          large_image: track.albumCover,
          large_text: track.album,
        },
      };
    }
    // Priority 3: Discord activities (with staleness check)
    else {
      const discordSong = discordData?.activities?.find(activity => activity.type === 2);
      if (discordSong) {
        const now = Date.now();
        const songAge = discordSong.timestamps?.start ? now - discordSong.timestamps.start : 0;
        const maxAge = 5 * 60 * 1000; // 5 minutes
        if (songAge < maxAge) {
          currentSong = {
            ...discordSong,
            // Add playing state detection for Discord songs
            isPlaying: discordSong.isPlaying !== undefined ? discordSong.isPlaying : true
          };
        }
      }
    }
  }

  // Store current song with timestamp tracking
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

  if (!currentSong && lastKnownSong) {
    const songAge = lastKnownSong.timestamps?.start ? Date.now() - lastKnownSong.timestamps.start : Infinity;
    const maxLastKnownAge = 10 * 60 * 1000; // 10 minutes
    if (songAge < maxLastKnownAge) {
      songToDisplay = lastKnownSong;
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
