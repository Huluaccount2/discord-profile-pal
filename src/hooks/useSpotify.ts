
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
    if (!userId) {
      console.log('useSpotify: No userId provided for connection');
      return;
    }

    try {
      setLoading(true);
      console.log('useSpotify: Initiating Spotify connection for userId:', userId);
      
      const session = await supabase.auth.getSession();
      console.log('useSpotify: Current session status:', session.data.session ? 'authenticated' : 'not authenticated');
      
      if (!session.data.session) {
        console.error('useSpotify: No authenticated session found');
        return;
      }

      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        console.error('useSpotify: Error getting Spotify auth URL:', error);
        return;
      }

      console.log('useSpotify: Redirecting to Spotify auth URL:', data.authUrl);
      // Redirect to Spotify authorization
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('useSpotify: Error connecting to Spotify:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTrack = async () => {
    if (!userId) {
      console.log('useSpotify: No userId provided for fetching track');
      return;
    }

    try {
      console.log('useSpotify: Fetching current track for userId:', userId);
      
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        console.log('useSpotify: No authenticated session, skipping track fetch');
        return;
      }

      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'current-track' },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        if (error.message === 'No Spotify connection') {
          console.log('useSpotify: No Spotify connection found');
          setIsConnected(false);
        } else {
          console.error('useSpotify: Error fetching current track:', error);
        }
        setSpotifyData(null);
        return;
      }

      console.log('useSpotify: Received track data:', data);
      setIsConnected(true);
      setSpotifyData(data);
    } catch (error) {
      console.error('useSpotify: Error fetching current track:', error);
      setSpotifyData(null);
    }
  };

  const controlPlayback = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    if (!userId || !isConnected) {
      console.log('useSpotify: Cannot control playback - userId:', userId, 'isConnected:', isConnected);
      return;
    }

    try {
      console.log('useSpotify: Controlling playback:', action);
      const session = await supabase.auth.getSession();
      
      if (!session.data.session) {
        console.error('useSpotify: No authenticated session for playback control');
        return;
      }

      const { error } = await supabase.functions.invoke('spotify-auth', {
        body: { action },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        console.error(`useSpotify: Error controlling playback (${action}):`, error);
        return;
      }

      console.log(`useSpotify: Playback control (${action}) successful`);
      // Refresh track data after control action
      setTimeout(fetchCurrentTrack, 500);
    } catch (error) {
      console.error(`useSpotify: Error controlling playback (${action}):`, error);
    }
  };

  const play = () => controlPlayback('play');
  const pause = () => controlPlayback('pause');
  const nextTrack = () => controlPlayback('next');
  const previousTrack = () => controlPlayback('previous');

  useEffect(() => {
    if (userId) {
      console.log('useSpotify: Initial setup for userId:', userId);
      fetchCurrentTrack();
    } else {
      console.log('useSpotify: No userId provided, skipping initial setup');
    }
  }, [userId]);

  // Poll for current track every 10 seconds when connected
  useEffect(() => {
    if (!userId || !isConnected) {
      console.log('useSpotify: Skipping polling - userId:', userId, 'isConnected:', isConnected);
      return;
    }

    console.log('useSpotify: Setting up polling interval');
    const interval = setInterval(() => {
      console.log('useSpotify: Polling for track updates');
      fetchCurrentTrack();
    }, 10000);
    
    return () => {
      console.log('useSpotify: Cleaning up polling interval');
      clearInterval(interval);
    };
  }, [userId, isConnected]);

  return {
    spotifyData,
    loading,
    isConnected,
    connectSpotify,
    fetchCurrentTrack,
    play,
    pause,
    nextTrack,
    previousTrack,
  };
};
