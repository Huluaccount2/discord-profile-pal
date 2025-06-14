
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
        setIsConnected(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'current-track' },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        console.error('useSpotifyData: Error fetching current track:', error);
        if (error.message?.includes('No Spotify connection')) {
          console.log('useSpotifyData: No Spotify connection found');
          setIsConnected(false);
          setConnectionError('Not connected to Spotify');
          setSpotifyData(null);
        } else {
          setConnectionError(error.message || 'Failed to fetch track data');
          setSpotifyData(null);
        }
        return;
      }

      console.log('useSpotifyData: Received track data:', data);
      setIsConnected(true);
      setConnectionError(null);
      setSpotifyData(data);
    } catch (error) {
      console.error('useSpotifyData: Error fetching current track:', error);
      setConnectionError('Failed to fetch track data');
      setSpotifyData(null);
      setIsConnected(false);
    }
  }, [userId]);

  return {
    spotifyData,
    isConnected,
    connectionError,
    fetchCurrentTrack,
  };
};
