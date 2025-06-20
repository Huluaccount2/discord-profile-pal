
import { useState, useEffect } from "react";
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
    console.log('useMusicData: Processing music data...');

    // Priority 1: Spotify OAuth if connected and has current track
    if (isConnected && spotifyData?.track && spotifyData?.isPlaying) {
      const track = spotifyData.track;
      const startTime = Date.now() - track.progress;
      
      currentSong = {
        name: "Spotify",
        type: 2,
        details: track.name,
        state: track.artist,
        timestamps: {
          start: Math.floor(startTime),
          end: Math.floor(startTime + track.duration),
        },
        assets: {
          large_image: track.albumCover,
          large_text: track.album,
        },
      };
      console.log('useMusicData: Using Spotify OAuth current track');
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
        timestamps: {
          start: now - track.duration,
          end: now,
        },
        assets: {
          large_image: track.albumCover,
          large_text: track.album,
        },
      };
      console.log('useMusicData: Using Spotify OAuth last played track');
    }
    // Priority 3: Discord activities (with staleness check)
    else {
      const discordSong = discordData?.activities?.find(activity => activity.type === 2);
      if (discordSong) {
        // Check if Discord data is stale (older than 5 minutes)
        const now = Date.now();
        const songAge = discordSong.timestamps?.start ? now - discordSong.timestamps.start : 0;
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (songAge < maxAge) {
          currentSong = discordSong;
          console.log('useMusicData: Using Discord activity data (age:', Math.round(songAge / 1000), 'seconds)');
        } else {
          console.log('useMusicData: Discord song data is stale (age:', Math.round(songAge / 1000), 'seconds), ignoring');
        }
      } else {
        console.log('useMusicData: No Discord music activity found');
      }
    }
  }

  // Store current song with timestamp tracking
  useEffect(() => {
    if (currentSong) {
      const songKey = `${currentSong.details}-${currentSong.state}`;
      const now = Date.now();
      
      // Only update if it's a different song or hasn't been updated in a while
      if (lastSongUpdate === 0 || (now - lastSongUpdate) > 30000) { // 30 seconds
        console.log('useMusicData: Storing current song in localStorage:', currentSong);
        setLastKnownSong(currentSong);
        setLastSongUpdate(now);
      }
    }
  }, [currentSong, setLastKnownSong, lastSongUpdate]);

  // Final song selection with better fallback logic
  let songToDisplay = currentSong;
  
  // If no current song, check if we should use last known song
  if (!currentSong && lastKnownSong) {
    // Only use last known song if it's relatively recent (within 10 minutes)
    const songAge = lastKnownSong.timestamps?.start ? Date.now() - lastKnownSong.timestamps.start : Infinity;
    const maxLastKnownAge = 10 * 60 * 1000; // 10 minutes
    
    if (songAge < maxLastKnownAge) {
      songToDisplay = lastKnownSong;
      console.log('useMusicData: Using last known song (age:', Math.round(songAge / 1000), 'seconds)');
    } else {
      console.log('useMusicData: Last known song is too old (age:', Math.round(songAge / 1000), 'seconds), not displaying');
    }
  }
  
  const shouldShowConnectPrompt = !isConnected && !songToDisplay;

  console.log('useMusicData: Final song selection:', { 
    currentSong: currentSong ? 'present' : 'null',
    lastKnownSong: lastKnownSong ? 'present' : 'null',
    songToDisplay: songToDisplay ? 'present' : 'null',
    shouldShowConnectPrompt 
  });

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
