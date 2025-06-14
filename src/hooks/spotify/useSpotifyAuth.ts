
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSpotifyAuth = (userId: string | undefined) => {
  const [loading, setLoading] = useState(false);

  const connectSpotify = async () => {
    if (!userId) {
      console.log('useSpotifyAuth: No userId provided for connection');
      return;
    }

    try {
      setLoading(true);
      console.log('useSpotifyAuth: Initiating Spotify connection for userId:', userId);
      
      const session = await supabase.auth.getSession();
      console.log('useSpotifyAuth: Current session status:', session.data.session ? 'authenticated' : 'not authenticated');
      
      if (!session.data.session) {
        console.error('useSpotifyAuth: No authenticated session found');
        return;
      }

      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { 
          frontendOrigin: window.location.origin 
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        console.error('useSpotifyAuth: Error getting Spotify auth URL:', error);
        return;
      }

      console.log('useSpotifyAuth: Redirecting to Spotify auth URL:', data.authUrl);
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('useSpotifyAuth: Error connecting to Spotify:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    connectSpotify,
  };
};
