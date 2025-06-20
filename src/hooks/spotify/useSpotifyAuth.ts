
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDeskThing } from "@/contexts/DeskThingContext";
import { toast } from "sonner";

export const useSpotifyAuth = (userId: string | undefined) => {
  const [loading, setLoading] = useState(false);
  const { isRunningOnDeskThing } = useDeskThing();

  const connectSpotify = async () => {
    if (isRunningOnDeskThing) {
      console.log('useSpotifyAuth: Running on DeskThing, Spotify handled through Discord connection');
      toast.info('Spotify integration is handled through Discord on DeskThing');
      return;
    }

    if (!userId) {
      console.log('useSpotifyAuth: No userId provided for connection');
      toast.error('Please sign in to connect Spotify');
      return;
    }

    try {
      setLoading(true);
      console.log('useSpotifyAuth: Initiating Spotify connection for userId:', userId);
      
      const session = await supabase.auth.getSession();
      console.log('useSpotifyAuth: Current session status:', session.data.session ? 'authenticated' : 'not authenticated');
      
      if (!session.data.session) {
        console.error('useSpotifyAuth: No authenticated session found');
        toast.error('Authentication required to connect Spotify');
        return;
      }

      // Get the current origin, fallback to localhost for development
      const currentOrigin = window.location.origin || 'http://localhost:3000';
      console.log('useSpotifyAuth: Using origin:', currentOrigin);

      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { 
          frontendOrigin: currentOrigin
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        console.error('useSpotifyAuth: Error getting Spotify auth URL:', error);
        toast.error('Failed to connect to Spotify. Please try again.');
        return;
      }

      if (!data?.authUrl) {
        console.error('useSpotifyAuth: No auth URL returned');
        toast.error('Invalid Spotify configuration. Please check settings.');
        return;
      }

      console.log('useSpotifyAuth: Redirecting to Spotify auth URL:', data.authUrl);
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('useSpotifyAuth: Error connecting to Spotify:', error);
      toast.error('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    connectSpotify,
  };
};
