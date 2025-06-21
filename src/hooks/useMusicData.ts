
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
    previousTrack,
    isInitialized
  } = useSpotify(user?.id);
  const [lastKnownSong, setLastKnownSong] = useLastKnownSong();
  const [lastSongUpdate, setLastSongUpdate] = useState<number>(0);

  console.log('useMusicData: Processing data', { 
    profile: !!profile, 
    discordData: !!discordData, 
    activities: discordData?.activities?.length || 0,
    has_valid_spotify: discordData?.has_valid_spotify,
    isRunningOnDeskThing 
  });

  // Calculate current song data with improved priority logic
  let currentSong = null;
  
  if (isRunningOnDeskThing) {
    // DeskThing mode: Use Discord Spotify data
    if (discordData?.activities?.length > 0) {
      const discordSong = discordData.activities.find(activity => activity.type === 2);
      console.log('useMusicData: Found Discord music activity:', discordSong);
      
      if (discordSong) {
        // Check if this is fresh data (within last 5 minutes)
        const dataAge = discordData.last_updated ? Date.now() - discordData.last_updated : 0;
        const maxDataAge = 5 * 60 * 1000; // 5 minutes
        
        console.log('useMusicData: Discord data age:', dataAge, 'ms, max age:', maxDataAge, 'ms');
        
        if (dataAge < maxDataAge || !discordData.last_updated) {
          currentSong = {
            ...discordSong,
            isPlaying: true // Assume playing if we have recent activity data
          };
          console.log('useMusicData: Using Discord Spotify activity as current song');
        } else {
          console.log('useMusicData: Discord data too old, not using');
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
      console.log('useMusicData: Using Spotify OAuth current track');
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
      console.log('useMusicData: Using Spotify OAuth last played track');
    }
  }

  // Store current song with timestamp tracking (only if it's actually fresh)
  useEffect(() => {
    if (currentSong) {
      const now = Date.now();
      if (lastSongUpdate === 0 || (now - lastSongUpdate) > 30000) { // 30 seconds
        setLastKnownSong(currentSong);
        setLastSongUpdate(now);
        console.log('useMusicData: Updated last known song');
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
      console.log('useMusicData: Using last known song as fallback');
    }
  }
  
  // Determine if we should show connect prompt
  const shouldShowConnectPrompt = isRunningOnDeskThing 
    ? false // DeskThing doesn't need connect prompt
    : !isConnected && !songToDisplay && isInitialized; // Only show after we've checked connection

  console.log('useMusicData: Final result', {
    currentSong: !!currentSong,
    songToDisplay: !!songToDisplay,
    shouldShowConnectPrompt,
    songDetails: songToDisplay?.details || 'none'
  });

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
