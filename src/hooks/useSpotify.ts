
import { useState, useEffect } from "react";
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

export const useSpotify = (userId: string | undefined) => {
  const [spotifyData, setSpotifyData] = useState<SpotifyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const connectSpotify = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {},
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error getting Spotify auth URL:', error);
        return;
      }

      // Redirect to Spotify authorization
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTrack = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'current-track' },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        if (error.message === 'No Spotify connection') {
          setIsConnected(false);
        }
        console.error('Error fetching current track:', error);
        return;
      }

      setIsConnected(true);
      setSpotifyData(data);
    } catch (error) {
      console.error('Error fetching current track:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCurrentTrack();
    }
  }, [userId]);

  // Poll for current track every 10 seconds
  useEffect(() => {
    if (!userId || !isConnected) return;

    const interval = setInterval(fetchCurrentTrack, 10000);
    return () => clearInterval(interval);
  }, [userId, isConnected]);

  return {
    spotifyData,
    loading,
    isConnected,
    connectSpotify,
    fetchCurrentTrack,
  };
};
