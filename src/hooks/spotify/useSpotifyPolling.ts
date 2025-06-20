
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

    console.log('useSpotifyPolling: Setting up polling interval (5s for better balance)');
    const interval = setInterval(() => {
      console.log('useSpotifyPolling: Polling for track updates');
      fetchCurrentTrack();
    }, 5000); // Increased to 5 seconds to reduce API calls while still being responsive
    
    return () => {
      console.log('useSpotifyPolling: Cleaning up polling interval');
      clearInterval(interval);
    };
  }, [userId, isConnected, fetchCurrentTrack]);
};
