
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
    connectionError
  } = useSpotify(user?.id);
  const [lastKnownSong, setLastKnownSong] = useLastKnownSong();

  // Calculate current song data with improved priority logic
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
    // Priority 3: Discord activities (if Discord Spotify token works)
    else {
      const discordSong = discordData?.activities?.find(activity => activity.type === 2);
      if (discordSong) {
        currentSong = discordSong;
        console.log('useMusicData: Using Discord activity data');
      } else {
        console.log('useMusicData: No Discord music activity found');
      }
    }
  }

  // Store any current song in localStorage
  useEffect(() => {
    if (currentSong) {
      console.log('useMusicData: Storing current song in localStorage:', currentSong);
      setLastKnownSong(currentSong);
    }
  }, [currentSong, setLastKnownSong]);

  // Final song selection: current song or last known song
  const songToDisplay = currentSong || lastKnownSong;
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
    shouldShowConnectPrompt
  };
};
