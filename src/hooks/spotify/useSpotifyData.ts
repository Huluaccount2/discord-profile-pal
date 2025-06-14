import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumCover?: string;
  duration: number;
  progress: number;
}

interface SpotifyState {
  isPlaying: boolean;
  track?: SpotifyTrack;
  lastPlayed?: SpotifyTrack;
}

export const useSpotifyData = (userId: string | undefined) => {
  const [spotifyData, setSpotifyData] = useState<SpotifyState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const fetchCurrentTrack = useCallback(async () => {
    if (!userId) {
      console.log('useSpotifyData: No userId provided for fetching track');
      return;
    }

    try {
      console.log('useSpotifyData: Fetching current track for userId:', userId);
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        console.log('useSpotifyData: No authenticated session, skipping track fetch');
        setConnectionError('No authenticated session');
        return;
      }

      // First: Try current-track as usual
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'current-track' },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (!error && data && data.track) {
        console.log('useSpotifyData: Received track data:', data);
        setIsConnected(true);
        setConnectionError(null);
        setSpotifyData(data);
        return;
      }

      // If not playing, try recently played endpoint (using the same Supabase function, extend backend to allow this or fall back to latest)
      // We'll attempt to fetch "recently played" as a fallback if NOT playing. 
      // We'll assume the backend supports this with action: 'recently-played'
      const { data: rpData, error: rpError } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'recently-played' },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (!rpError && rpData && rpData.track) {
        // Compose the fallback
        setSpotifyData({
          isPlaying: false,
          lastPlayed: rpData.track,
        });
        setIsConnected(true);
        setConnectionError(null);
        return;
      }

      // Otherwise, handle error as before
      if (error) {
        console.error('useSpotifyData: Error fetching current track:', error);
        if (error.message === 'No Spotify connection') {
          console.log('useSpotifyData: No Spotify connection found');
          setIsConnected(false);
          setConnectionError('No Spotify connection - please connect your Spotify account');
        } else {
          setConnectionError(error.message);
        }
        setSpotifyData(null);
        return;
      }
      setConnectionError('No track information found');
      setSpotifyData(null);
    } catch (error) {
      console.error('useSpotifyData: Error fetching current track:', error);
      setConnectionError('Failed to fetch track data');
      setSpotifyData(null);
    }
  }, [userId]);

  return {
    spotifyData,
    isConnected,
    connectionError,
    fetchCurrentTrack,
  };
};
