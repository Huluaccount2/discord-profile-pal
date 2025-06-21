
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDeskThing } from "@/contexts/DeskThingContext";

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
  const [isInitialized, setIsInitialized] = useState(false);
  const { isRunningOnDeskThing } = useDeskThing();

  // Check connection status on mount
  useEffect(() => {
    if (isRunningOnDeskThing || !userId) {
      console.log('useSpotifyData: Running on DeskThing or no userId, skipping connection check');
      setIsInitialized(true);
      return;
    }

    const checkConnection = async () => {
      try {
        console.log('useSpotifyData: Checking Spotify connection status');
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          console.log('useSpotifyData: No authenticated session');
          setIsConnected(false);
          setIsInitialized(true);
          return;
        }

        // Check if user has Spotify tokens in profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('spotify_access_token, spotify_refresh_token')
          .eq('id', userId)
          .single();

        if (error || !profile?.spotify_access_token) {
          console.log('useSpotifyData: No Spotify tokens found in profile');
          setIsConnected(false);
          setConnectionError(null);
        } else {
          console.log('useSpotifyData: Spotify tokens found, user is connected');
          setIsConnected(true);
          setConnectionError(null);
        }
      } catch (error) {
        console.error('useSpotifyData: Error checking connection:', error);
        setIsConnected(false);
        setConnectionError('Failed to check connection status');
      } finally {
        setIsInitialized(true);
      }
    };

    checkConnection();
  }, [userId, isRunningOnDeskThing]);

  const fetchCurrentTrack = useCallback(async () => {
    if (isRunningOnDeskThing) {
      console.log('useSpotifyData: Running on DeskThing, skipping Spotify OAuth');
      setConnectionError(null);
      setSpotifyData(null);
      return;
    }

    if (!userId || !isInitialized) {
      console.log('useSpotifyData: No userId or not initialized, skipping track fetch');
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

      // Try current-track first
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'current-track' },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      console.log('useSpotifyData: Spotify current track response:', { data, error });

      // Check if we got an error response from the function
      if (data && data.error) {
        console.log('useSpotifyData: Function returned error:', data.error);
        if (data.error.includes('No Spotify connection')) {
          setIsConnected(false);
          setConnectionError('No Spotify connection found');
          setSpotifyData(null);
          return;
        }
      }

      if (!error && data) {
        // Mark as connected since we got a valid response
        setIsConnected(true);
        setConnectionError(null);

        if (data.track && data.isPlaying) {
          // Currently playing
          console.log('useSpotifyData: Currently playing track:', data.track);
          setSpotifyData({
            isPlaying: true,
            track: data.track
          });
          return;
        } else if (data.track && !data.isPlaying) {
          // Track exists but not playing
          console.log('useSpotifyData: Track exists but not playing:', data.track);
          setSpotifyData({
            isPlaying: false,
            lastPlayed: data.track
          });
          return;
        }
      }

      // Try recently played as fallback
      console.log('useSpotifyData: Trying recently played as fallback...');
      const { data: rpData, error: rpError } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'recently-played' },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (!rpError && rpData && rpData.track && !rpData.error) {
        console.log('useSpotifyData: Got recently played track:', rpData.track);
        setSpotifyData({
          isPlaying: false,
          lastPlayed: rpData.track,
        });
        setIsConnected(true);
        setConnectionError(null);
        return;
      }

      // Handle connection errors
      if (error) {
        console.error('useSpotifyData: Error fetching current track:', error);
        setConnectionError('Failed to fetch track data');
        setSpotifyData(null);
        return;
      }
      
      console.log('useSpotifyData: No track information found');
      setConnectionError(null);
      setSpotifyData(null);
    } catch (error) {
      console.error('useSpotifyData: Error fetching current track:', error);
      setConnectionError('Failed to fetch track data');
      setSpotifyData(null);
    }
  }, [userId, isRunningOnDeskThing, isInitialized]);

  return {
    spotifyData,
    isConnected,
    connectionError,
    fetchCurrentTrack,
    isInitialized,
  };
};
