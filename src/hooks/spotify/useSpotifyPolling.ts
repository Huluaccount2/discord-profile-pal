
import { useEffect } from "react";

export const useSpotifyPolling = (
  userId: string | undefined, 
  isConnected: boolean, 
  fetchCurrentTrack: () => void
) => {
  useEffect(() => {
    if (userId) {
      console.log('useSpotifyPolling: Initial setup for userId:', userId);
      fetchCurrentTrack();
    } else {
      console.log('useSpotifyPolling: No userId provided, skipping initial setup');
    }
  }, [userId, fetchCurrentTrack]);

  useEffect(() => {
    if (!userId || !isConnected) {
      console.log('useSpotifyPolling: Skipping polling - userId:', userId, 'isConnected:', isConnected);
      return;
    }

    console.log('useSpotifyPolling: Setting up polling interval (3s for better responsiveness)');
    const interval = setInterval(() => {
      console.log('useSpotifyPolling: Polling for track updates');
      fetchCurrentTrack();
    }, 3000);
    
    return () => {
      console.log('useSpotifyPolling: Cleaning up polling interval');
      clearInterval(interval);
    };
  }, [userId, isConnected, fetchCurrentTrack]);
};
