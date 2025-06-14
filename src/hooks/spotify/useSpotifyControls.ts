
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSpotifyControls = (userId: string | undefined, isConnected: boolean, refreshData: () => void) => {
  const controlPlayback = useCallback(async (action: 'play' | 'pause' | 'next' | 'previous') => {
    if (!userId || !isConnected) {
      console.log('useSpotifyControls: Cannot control playback - userId:', userId, 'isConnected:', isConnected);
      return;
    }

    try {
      console.log('useSpotifyControls: Controlling playback:', action);
      const session = await supabase.auth.getSession();
      
      if (!session.data.session) {
        console.error('useSpotifyControls: No authenticated session for playback control');
        return;
      }

      const { error } = await supabase.functions.invoke('spotify-auth', {
        body: { action },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        console.error(`useSpotifyControls: Error controlling playback (${action}):`, error);
        return;
      }

      console.log(`useSpotifyControls: Playback control (${action}) successful`);
      setTimeout(refreshData, 500);
    } catch (error) {
      console.error(`useSpotifyControls: Error controlling playback (${action}):`, error);
    }
  }, [userId, isConnected, refreshData]);

  const play = useCallback(() => {
    console.log('useSpotifyControls: Play button clicked');
    controlPlayback('play');
  }, [controlPlayback]);
  
  const pause = useCallback(() => {
    console.log('useSpotifyControls: Pause button clicked');
    controlPlayback('pause');
  }, [controlPlayback]);
  
  const nextTrack = useCallback(() => {
    console.log('useSpotifyControls: Next track button clicked');
    controlPlayback('next');
  }, [controlPlayback]);
  
  const previousTrack = useCallback(() => {
    console.log('useSpotifyControls: Previous track button clicked');
    controlPlayback('previous');
  }, [controlPlayback]);

  return {
    play,
    pause,
    nextTrack,
    previousTrack,
  };
};
