
import { useCallback } from 'react';

interface UseMusicProgressTrackerProps {
  currentSong: any;
  isSpotifyConnected: boolean;
  spotifyData: any;
  onProgressUpdate: (time: number, playing: boolean) => void;
}

export const useMusicProgressTracker = ({
  currentSong,
  isSpotifyConnected,
  spotifyData,
  onProgressUpdate
}: UseMusicProgressTrackerProps) => {
  // This hook will be a simple wrapper that doesn't do much for now
  // The actual progress tracking logic is handled by the MusicProgressTracker component
  
  const handleProgressUpdate = useCallback((progress: { time: number; playing: boolean }) => {
    onProgressUpdate(progress.time, progress.playing);
  }, [onProgressUpdate]);

  return {
    handleProgressUpdate
  };
};
